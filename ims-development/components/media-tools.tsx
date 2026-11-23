import { useEffect, useRef, useState } from "react";
import { Camera, Upload, AudioLines, BookOpen, Headphones } from "lucide-react";
import {
  Lesson,
  lessons,
  Student,
  Update,
  fullText,
  requestTool,
} from "@/lib/learning";
import { Selector } from "./lesson-tools";
export function Player({ urls }: { urls: string[] }) {
  const ref = useRef<HTMLAudioElement>(null),
    [i, part] = useState(0),
    [rate, speed] = useState(1),
    [err, error] = useState("");
  const next = useRef(false);
  return (
    <div className="player">
      <audio
        ref={ref}
        controls
        preload="metadata"
        src={urls[i]}
        aria-label="Lesson audio"
        onError={() =>
          error(
            "Audio could not be loaded. Try again or choose another lesson.",
          )
        }
        onLoadedMetadata={() => {
          if (ref.current) {
            ref.current.playbackRate = rate;
            if (next.current) {
              next.current = false;
              ref.current.play().catch(() => error("Press play to continue."));
            }
          }
        }}
        onEnded={() => {
          if (i + 1 < urls.length) {
            next.current = true;
            part(i + 1);
          }
        }}
      />
      <div className="toolbar">
        <button
          onClick={() => {
            if (ref.current) {
              ref.current.pause();
              ref.current.currentTime = 0;
            }
            part(0);
          }}
        >
          Stop
        </button>
        <button
          onClick={() => {
            if (ref.current) {
              ref.current.currentTime = 0;
              if (i) {
                next.current = true;
                part(0);
              } else
                ref.current.play().catch(() => error("Unable to play audio."));
            }
          }}
        >
          Replay
        </button>
        {[-10, 10].map((n) => (
          <button
            key={n}
            onClick={() => {
              if (ref.current)
                ref.current.currentTime = Math.max(
                  0,
                  Math.min(
                    ref.current.duration || 0,
                    ref.current.currentTime + n,
                  ),
                );
            }}
          >
            {n > 0 ? "+" : ""}
            {n}s
          </button>
        ))}
        <label>
          Speed
          <select
            value={rate}
            onChange={(e) => {
              speed(+e.target.value);
              if (ref.current) ref.current.playbackRate = +e.target.value;
            }}
          >
            {[0.75, 1, 1.25, 1.5, 2].map((x) => (
              <option value={x} key={x}>
                {x}×
              </option>
            ))}
          </select>
        </label>
      </div>
      {urls.length > 1 && (
        <small>
          Section {i + 1} of {urls.length}
        </small>
      )}
      {err && <p role="alert">{err}</p>}
    </div>
  );
}
export function Speech({ selected }: { selected?: Lesson }) {
  const [mode, set] = useState(selected ? "lesson" : "text"),
    [l, pick] = useState(selected || lessons[0]),
    [text, write] = useState(""),
    [voice, choose] = useState("Rachel"),
    [urls, audio] = useState<string[]>([]),
    [progress, progressSet] = useState(""),
    [err, error] = useState("");
  useEffect(
    () => () =>
      urls.forEach((u) => {
        if (u.startsWith("blob:")) URL.revokeObjectURL(u);
      }),
    [urls],
  );
  async function convert() {
    error("");
    audio([]);
    const source = mode === "text" ? text : fullText(l);
    let chunks: string[] = [""];
    for (const w of source.trim().split(/\s+/)) {
      if (chunks.at(-1)!.length + w.length > 2000) chunks.push("");
      chunks[chunks.length - 1] += " " + w;
    }
    let out: string[] = [];
    try {
      for (const [i, c] of chunks.entries()) {
        progressSet(`Generating section ${i + 1} of ${chunks.length}…`);
        out.push((await requestTool("speech", { text: c, voice })).audioUrl);
      }
      audio(out);
    } catch (e) {
      out.forEach((u) => URL.revokeObjectURL(u));
      error((e as Error).message);
    } finally {
      progressSet("");
    }
  }
  return (
    <div className="tool-panel">
      <h2>Turn words into audio</h2>
      <p>Listen to your own text or a complete lesson.</p>
      <div className="tabs">
        {["text", "lesson"].map((x) => (
          <button
            disabled={!!progress}
            aria-pressed={mode === x}
            key={x}
            onClick={() => {
              set(x);
              audio([]);
              error("");
            }}
          >
            {x === "text" ? "Add text" : "Convert a lesson"}
          </button>
        ))}
      </div>
      {mode === "text" ? (
        <label>
          Your text
          <textarea
            maxLength={20000}
            rows={7}
            placeholder="Paste or type the text you want to hear…"
            value={text}
            onChange={(e) => write(e.target.value)}
          />
        </label>
      ) : (
        <>
          <Selector l={l} select={pick} />
          <div className="preview-text">{fullText(l)}</div>
        </>
      )}
      <label>
        Voice
        <select value={voice} onChange={(e) => choose(e.target.value)}>
          <option>Rachel</option>
          <option>Adam</option>
        </select>
      </label>
      <button
        className="primary"
        disabled={!!progress || (mode === "text" && !text.trim())}
        onClick={convert}
      >
        <AudioLines size={16} />
        {mode === "text" ? "Convert to speech" : "Convert lesson to speech"}
      </button>
      <p role="status">{progress}</p>
      {err && (
        <p className="notice" role="alert">
          {err}
        </p>
      )}
      {urls.length > 0 && <Player urls={urls} />}
    </div>
  );
}
export function Recordings() {
  const [l, pick] = useState(lessons[0]);
  return (
    <div className="tool-panel">
      <h2>Audio library</h2>
      <p>Browse prerecorded lesson narrations. No generation needed.</p>
      <Selector l={l} select={pick} />
      <div className="audio-tile">
        <span className={"thumb cover" + l.art} />
        <div>
          <small>{l.subject} · Prerecorded</small>
          <h3>{l.title}</h3>
        </div>
      </div>
      <Player key={l.id} urls={["/audio/" + l.id + ".wav"]} />
      <details>
        <summary>Read transcript</summary>
        <p className="preview-text">{fullText(l)}</p>
      </details>
    </div>
  );
}
export function PhotoNotes({ s, update }: { s: Student; update: Update }) {
  const [file, select] = useState<File | null>(null),
    [preview, show] = useState(""),
    [text, write] = useState(""),
    [title, name] = useState(""),
    [busy, wait] = useState(false),
    [err, error] = useState(""),
    [status, tell] = useState("");
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  function pick(f?: File) {
    if (!f) return;
    error("");
    tell("");
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
      f.size > 2 * 1024 * 1024
    ) {
      error("Choose a PNG, JPEG or WebP image under 2 MB.");
      return;
    }
    select(f);
    show(URL.createObjectURL(f));
    name(f.name.replace(/\.[^.]+$/, ""));
    write("");
  }
  async function process() {
    if (!file) return;
    error("");
    wait(true);
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const r = await requestTool("photo", { image, mimeType: file.type });
      write(
        [
          r.extractedText,
          "Simplified version",
          r.simplifiedText,
          "Summary",
          r.summary,
        ].join("\n\n"),
      );
      tell("Note extracted. Review and edit before saving.");
    } catch (e) {
      error((e as Error).message);
    } finally {
      wait(false);
    }
  }
  return (
    <div className="tool-panel">
      <h2>From page to notes</h2>
      <p>
        Upload a textbook page or handwritten note to extract, simplify and
        summarize it.
      </p>
      <div className="upload-box">
        <Camera size={32} />
        <h3>Add a page to your workspace</h3>
        <small>JPEG, PNG or WebP · Up to 2 MB</small>
        <div className="row">
          {["Upload image", "Use camera"].map((x, i) => (
            <label className="file-button" key={x}>
              {x}
              <input
                aria-label={x}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture={i ? "environment" : undefined}
                onChange={(e) => pick(e.target.files?.[0])}
              />
            </label>
          ))}
        </div>
      </div>
      {preview && (
        <>
          <img
            className="photo-preview"
            src={preview}
            alt="Selected page for text extraction"
          />
          <button className="primary" disabled={busy} onClick={process}>
            {busy ? "Reading your page…" : "Extract and simplify"}
          </button>
        </>
      )}
      {err && (
        <p className="notice" role="alert">
          {err}
        </p>
      )}
      <span role="status">{status}</span>
      {(text || (title && !file)) && (
        <>
          <label>
            Note title
            <input
              value={title}
              maxLength={100}
              onChange={(e) => name(e.target.value)}
            />
          </label>
          <label>
            Processed note
            <textarea
              rows={8}
              value={text}
              onChange={(e) => write(e.target.value)}
            />
          </label>
          <button
            className="primary"
            disabled={!text.trim() || !title.trim()}
            onClick={() => {
              update((s) => ({
                ...s,
                notes: [
                  { title, text },
                  ...s.notes.filter((n) => n.title !== title),
                ],
              }));
              tell("Note saved on this device.");
            }}
          >
            Save note
          </button>
        </>
      )}
      <h3>Saved notes</h3>
      {s.notes.length ? (
        s.notes.map((n, i) => (
          <button
            className="secondary"
            key={i}
            onClick={() => {
              name(n.title);
              write(n.text);
              show("");
              select(null);
              tell("");
            }}
          >
            {n.title}
          </button>
        ))
      ) : (
        <p>Your saved notes will appear here.</p>
      )}
    </div>
  );
}
