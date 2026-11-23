"use client";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  SquarePen,
  BookOpen,
  Lightbulb,
  TextQuote,
  ArrowUpRight,
  Send,
  Volume2,
  ChevronDown,
  TextCursorInput,
} from "lucide-react";
import { Lesson, fullText, requestTool } from "@/lib/learning";
import { Player } from "./media-tools";
export default function Assistant({ lesson }: { lesson?: Lesson }) {
  const [messages, set] = useState<{ role: string; text: string }[]>([]),
    [q, write] = useState(""),
    [busy, wait] = useState(false),
    [err, error] = useState(""),
    [expanded, expand] = useState(false),
    [audio, sound] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (end.current) end.current.scrollTop = end.current.scrollHeight;
  }, [messages, busy, err]);
  async function send(text: string) {
    if (!text.trim() || busy) return;
    set((m) => [...m, { role: "You", text }]);
    write("");
    wait(true);
    error("");
    try {
      const r = await requestTool("chat", {
        question: text,
        subject: lesson?.subject,
        chapter: lesson?.chapter,
        lesson: lesson && fullText(lesson),
        history: messages.slice(-6),
      });
      set((m) => [...m, { role: "Assistant", text: r.answer }]);
    } catch (e) {
      error((e as Error).message);
    } finally {
      wait(false);
    }
  }
  async function listen(text: string) {
    wait(true);
    error("");
    try {
      const r = await requestTool("speech", { text, voice: "Rachel" });
      sound(r.audioUrl);
    } catch (e) {
      error((e as Error).message);
    } finally {
      wait(false);
    }
  }
  return (
    <aside
      className={"assistant panel " + (expanded ? "expanded" : "")}
      aria-label="AI Study Assistant"
    >
      <header>
        <span className="ai-icon">
          <Sparkles size={20} />
        </span>
        <div>
          <h2>AI Study Assistant</h2>
          <small>Your learning companion</small>
        </div>
        <button
          className="icon newchat"
          aria-label="New chat"
          title="New chat"
          disabled={busy}
          onClick={() => {
            set([]);
            write("");
            error("");
            sound("");
          }}
        >
          <SquarePen size={16} />
        </button>
        <button
          className="icon mobile-chat"
          aria-expanded={expanded}
          aria-label="Toggle assistant"
          onClick={() => expand(!expanded)}
        >
          <ChevronDown size={16} />
        </button>
      </header>
      <div className="assistant-body">
        <div className="chat-scroll" ref={end} role="log" aria-live="polite">
          <span className="speaker">
            <Sparkles size={13} /> IMS ASSISTANT
          </span>
          <p className="welcome-bubble">
            Hi there! I&apos;m your study assistant. Ask me a question or choose
            a prompt below to get started.
          </p>
          {messages.map((m, i) => (
            <div
              className={"bubble " + (m.role === "You" ? "mine" : "")}
              key={i}
            >
              <b>{m.role}</b>
              <p>{m.text}</p>
              {m.role !== "You" && (
                <button
                  className="text-btn"
                  onClick={() => listen(m.text)}
                  disabled={busy}
                >
                  <Volume2 size={14} /> Listen
                </button>
              )}
            </div>
          ))}
          {busy && <p role="status">Working on it…</p>}
          {err && (
            <p className="notice" role="alert">
              {err}
            </p>
          )}
        </div>
        {audio && <Player urls={[audio]} />}
        <div className="prompts">
          <div className="eyebrow">SUGGESTED PROMPTS</div>
          {[
            [BookOpen, "Explain this topic simply"],
            [TextCursorInput, "What does this word mean?"],
            [Lightbulb, "Give me an example"],
            [TextQuote, "Summarize this paragraph"],
          ].map(([Icon, t]) => {
            const I = Icon as typeof BookOpen;
            return (
              <button
                key={String(t)}
                onClick={() => {
                  write(String(t) + (lesson ? " about " + lesson.title : ": "));
                  document.getElementById("ask")?.focus();
                }}
              >
                <I size={15} />
                {String(t)}
                <ArrowUpRight size={13} />
              </button>
            );
          })}
        </div>
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(q);
          }}
        >
          <input
            id="ask"
            aria-label="Your study question"
            placeholder="Ask a question…"
            maxLength={3000}
            value={q}
            onChange={(e) => write(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                (e.nativeEvent.isComposing || e.keyCode === 229)
              )
                e.preventDefault();
            }}
          />
          <button aria-label="Send question" disabled={busy || !q.trim()}>
            <Send size={16} />
          </button>
        </form>
        <div className="ai-note">
          <Sparkles size={11} /> AI can make mistakes. Check key facts.
        </div>
      </div>
    </aside>
  );
}
