import { NextResponse } from "next/server";

export const maxDuration = 90;

const settings: Record<string, string> = {
  chat: "N8N_CHAT_WEBHOOK_URL",
  speech: "N8N_SPEECH_WEBHOOK_URL",
  photo: "N8N_PHOTO_WEBHOOK_URL",
  quiz: "N8N_QUIZ_WEBHOOK_URL",
};

const str = (x: unknown, n: number) =>
  typeof x === "string" && x.trim().length > 0 && x.length <= n;

const fail = (message: string, status: number, code: string = "ERROR") =>
  NextResponse.json(
    {
      success: false,
      error: message,
      errorDetail: { code, message },
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tool: string }> },
) {
  const { tool } = await params;
  if (!Object.hasOwn(settings, tool)) return fail("Unknown study tool.", 404, "TOOL_NOT_FOUND");

  if (req.headers.get("sec-fetch-site") === "cross-site")
    return fail("Open this tool from your IMS workspace.", 403, "CROSS_SITE_FORBIDDEN");

  if (!req.headers.get("content-type")?.includes("application/json"))
    return fail("Expected JSON request content.", 415, "UNSUPPORTED_MEDIA_TYPE");

  // Allow larger payload for photo uploads (up to 8MB) and ample headroom for other tools
  const max = tool === "photo" ? 8000000 : 150000;
  const contentLength = Number(req.headers.get("content-length"));
  if (contentLength > max)
    return fail("Request exceeds allowed size limits.", 413, "PAYLOAD_TOO_LARGE");

  let body: any;
  try {
    const raw = await req.text();
    if (raw.length > max) return fail("Content exceeds allowed size limits.", 413, "PAYLOAD_TOO_LARGE");
    body = JSON.parse(raw);
  } catch {
    return fail("Invalid JSON payload.", 400, "INVALID_JSON");
  }

  if (!body || typeof body !== "object" || Array.isArray(body))
    return fail("Missing study request content.", 400, "MISSING_CONTENT");

  // Validate tool-specific incoming request
  const valid =
    tool === "chat"
      ? str(body.question, 5000)
      : tool === "speech"
        ? str(body.text, 6000) && (!body.voice || ["Rachel", "Adam"].includes(body.voice))
        : tool === "photo"
          ? typeof body.image === "string" &&
            body.image.length > 20 &&
            body.image.length < 6000000 &&
            ["image/png", "image/jpeg", "image/webp"].includes(body.mimeType)
          : str(body.lesson, 35000) &&
            str(body.chapter, 200) &&
            str(body.subject, 200);

  if (!valid) return fail("Please check the content and try again.", 400, "INVALID_REQUEST_BODY");

  const url = process.env[settings[tool]];
  if (!url)
    return fail(
      "This tool is not connected yet. Your workspace administrator needs to configure its n8n webhook.",
      503,
      "WEBHOOK_NOT_CONFIGURED",
    );

  let n8nResponse: Response;
  try {
    const parsedUrl = new URL(url.trim());
    if (parsedUrl.protocol !== "https:")
      return fail("The webhook requires a secure HTTPS address.", 503, "INSECURE_WEBHOOK_URL");

    n8nResponse = await fetch(parsedUrl.toString(), {
      method: "POST",
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "X-IMS-Secret": process.env.N8N_WEBHOOK_SECRET.trim() }
          : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(80000),
    });
  } catch (err: any) {
    const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    return fail(
      isTimeout
        ? "The learning service timed out while processing your request. Please try again."
        : "The learning service is temporarily unavailable. Please verify the n8n webhook connection.",
      504,
      isTimeout ? "GATEWAY_TIMEOUT" : "UPSTREAM_UNREACHABLE",
    );
  }

  // 1. Check for audio responses (Tool: speech)
  const contentType = n8nResponse.headers.get("content-type") || "";
  const isAudioHeader = contentType.startsWith("audio/") || contentType.includes("mpeg") || contentType.includes("mp3");

  if (tool === "speech" && (isAudioHeader || n8nResponse.status < 500)) {
    try {
      const arrayBuffer = await n8nResponse.arrayBuffer();
      if (arrayBuffer.byteLength > 100) {
        const uint8 = new Uint8Array(arrayBuffer);
        const hasAudioSignature =
          (uint8[0] === 0x49 && uint8[1] === 0x44 && uint8[2] === 0x33) || // 'ID3'
          (uint8[0] === 0xff && (uint8[1] & 0xe0) === 0xe0) || // MP3 frame sync
          isAudioHeader;

        if (hasAudioSignature) {
          return new Response(arrayBuffer, {
            status: 200,
            headers: {
              "Content-Type": contentType.startsWith("audio/") ? contentType : "audio/mpeg",
              "Content-Length": String(arrayBuffer.byteLength),
              "Cache-Control": "no-store",
            },
          });
        }
      }
    } catch {
      // If buffer reading fails, fallback to normal error handling
    }
  }

  // 2. Parse text or JSON response from n8n
  let rawText = "";
  try {
    rawText = await n8nResponse.text();
  } catch {
    return fail("Unable to read response from the learning service.", 502, "UPSTREAM_EMPTY_RESPONSE");
  }

  let d: any = null;
  if (rawText.trim().length > 0) {
    try {
      d = JSON.parse(rawText);
    } catch {
      // Plain text response from n8n
      d = { output: rawText.trim() };
    }
  }

  // 3. Handle upstream HTTP error codes when no valid payload was returned
  if (!n8nResponse.ok) {
    let upstreamError = "The learning service could not complete this request. Please try again.";
    if (d?.message) {
      upstreamError = d.message;
    } else if (d?.error) {
      upstreamError = typeof d.error === "string" ? d.error : (d.error.message || JSON.stringify(d.error));
    } else if (d?.hint) {
      upstreamError = `${d.message || "Error"}: ${d.hint}`;
    }

    const statusCode = n8nResponse.status >= 400 && n8nResponse.status < 600 ? n8nResponse.status : 502;
    return fail(upstreamError, statusCode, "UPSTREAM_ERROR");
  }

  if (!d) {
    return fail("The learning service returned an empty response. Please try again.", 502, "UPSTREAM_NO_DATA");
  }

  // 4. Tool-specific response normalization
  if (tool === "chat") {
    const answer =
      (typeof d === "string" && d.trim()) ||
      d.answer ||
      d.output ||
      d.response ||
      d.text ||
      d.message ||
      d.result ||
      d.data?.answer ||
      d.data?.output ||
      d.data?.response ||
      d.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    if (!answer || typeof answer !== "string") {
      return fail("The learning assistant could not generate a response. Please try again.", 502, "INCOMPLETE_CHAT_RESPONSE");
    }

    return NextResponse.json(
      {
        success: true,
        answer,
        output: answer,
        text: answer,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (tool === "quiz") {
    let rawQuestions: any[] = [];
    if (Array.isArray(d?.questions)) {
      rawQuestions = d.questions;
    } else if (Array.isArray(d?.data?.questions)) {
      rawQuestions = d.data.questions;
    } else if (Array.isArray(d)) {
      rawQuestions = d;
    } else if (typeof d?.output === "string" || typeof d?.text === "string") {
      const textContent = d.output || d.text;
      const jsonMatch = textContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed?.questions)) rawQuestions = parsed.questions;
          else if (Array.isArray(parsed)) rawQuestions = parsed;
        } catch {}
      }
    }

    const normalizedQuestions = rawQuestions
      .map((q: any) => {
        const question = String(q.question || q.prompt || q.title || "").trim();
        if (!question) return null;

        // Normalize options: must be string[]
        let options: string[] = [];
        if (Array.isArray(q.options)) {
          options = q.options.map((opt: any) => {
            if (typeof opt === "string") return opt.trim();
            if (opt && typeof opt === "object") {
              return String(opt.text || opt.label || opt.value || opt.option || Object.values(opt)[0] || "").trim();
            }
            return String(opt).trim();
          });
        } else if (q.options && typeof q.options === "object") {
          options = Object.values(q.options).map((v) => String(v).trim());
        }

        while (options.length < 4) {
          options.push(`Option ${options.length + 1}`);
        }
        if (options.length > 4) {
          options = options.slice(0, 4);
        }

        // Normalize correct answer index: 0-based integer (0..3)
        let correct = 0;
        if (typeof q.correct === "number" && q.correct >= 0 && q.correct < 4) {
          correct = Math.floor(q.correct);
        } else if (typeof q.correctIndex === "number") {
          correct = Math.min(3, Math.max(0, Math.floor(q.correctIndex)));
        } else if (typeof q.correctAnswer === "string") {
          const letter = q.correctAnswer.trim().toUpperCase();
          if (letter === "A" || letter === "1") correct = 0;
          else if (letter === "B" || letter === "2") correct = 1;
          else if (letter === "C" || letter === "3") correct = 2;
          else if (letter === "D" || letter === "4") correct = 3;
          else {
            const idx = options.findIndex((o) => o.toLowerCase() === q.correctAnswer.trim().toLowerCase());
            if (idx !== -1) correct = idx;
          }
        } else if (typeof q.answer === "string") {
          const letter = q.answer.trim().toUpperCase();
          if (letter === "A" || letter === "1") correct = 0;
          else if (letter === "B" || letter === "2") correct = 1;
          else if (letter === "C" || letter === "3") correct = 2;
          else if (letter === "D" || letter === "4") correct = 3;
          else {
            const idx = options.findIndex((o) => o.toLowerCase() === q.answer.trim().toLowerCase());
            if (idx !== -1) correct = idx;
          }
        }

        const explanation = String(q.explanation || q.reason || q.solution || "Correct answer.").trim();

        return { question, options, correct, explanation };
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);

    if (normalizedQuestions.length === 0) {
      return fail("The learning service returned an incomplete quiz format. Please try again.", 502, "INCOMPLETE_QUIZ_RESPONSE");
    }

    return NextResponse.json(
      {
        success: true,
        questions: normalizedQuestions,
        totalQuestions: normalizedQuestions.length,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (tool === "photo") {
    let extractedText = d.extractedText || d.extracted_text || d.transcription || d.text || "";
    let simplifiedText = d.simplifiedText || d.simplified_text || d.simplified || "";
    let summary = d.summary || d.notes || "";

    const combined = d.output || (typeof d === "string" ? d : "");
    if (combined && (!extractedText || !simplifiedText || !summary)) {
      try {
        const parsed = JSON.parse(combined);
        if (parsed && typeof parsed === "object") {
          extractedText = extractedText || parsed.extractedText || parsed.extracted_text || parsed.text || "";
          simplifiedText = simplifiedText || parsed.simplifiedText || parsed.simplified_text || parsed.simplified || "";
          summary = summary || parsed.summary || parsed.notes || "";
        }
      } catch {
        if (!extractedText) extractedText = combined;
        if (!simplifiedText) simplifiedText = extractedText;
        if (!summary) summary = extractedText.slice(0, 500);
      }
    }

    if (!extractedText) {
      extractedText = "No text could be extracted from this image. Please ensure the study material is legible and try again.";
    }
    if (!simplifiedText) simplifiedText = extractedText;
    if (!summary) summary = simplifiedText;

    return NextResponse.json(
      {
        success: true,
        extractedText: String(extractedText).trim(),
        simplifiedText: String(simplifiedText).trim(),
        summary: String(summary).trim(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (tool === "speech") {
    if (d?.audioUrl && typeof d.audioUrl === "string") {
      return NextResponse.json({ success: true, audioUrl: d.audioUrl }, { headers: { "Cache-Control": "no-store" } });
    }

    if (d?.audio && typeof d.audio === "string") {
      const buffer = Buffer.from(d.audio, "base64");
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": String(buffer.length),
          "Cache-Control": "no-store",
        },
      });
    }

    return fail("Audio generation could not be completed. Please try again.", 502, "INCOMPLETE_SPEECH_RESPONSE");
  }

  return NextResponse.json(d, { headers: { "Cache-Control": "no-store" } });
}
