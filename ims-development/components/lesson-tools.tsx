import { useState } from "react";
import {
  BookOpen,
  Copy,
  AudioLines,
  ChevronLeft,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import {
  Lesson,
  lessons,
  fullText,
  Question,
  quizzes,
  requestTool,
  Student,
  Update,
  dayKey,
} from "@/lib/learning";
import { LessonRow } from "./dashboard";
export function Selector({
  l,
  select,
  all = true,
  locked = false,
}: {
  l: Lesson;
  select: (l: Lesson) => void;
  all?: boolean;
  locked?: boolean;
}) {
  return (
    <div className="selects">
      <label>
        Subject
        <select
          disabled={locked}
          value={l.subject}
          onChange={(e) =>
            select(lessons.find((v) => v.subject === e.target.value)!)
          }
        >
          {[...new Set(lessons.map((v) => v.subject))].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label>
        Chapter
        <select
          disabled={locked}
          value={l.chapter}
          onChange={(e) =>
            select(lessons.find((v) => v.chapter === e.target.value)!)
          }
        >
          {[
            ...new Set(
              lessons
                .filter((v) => v.subject === l.subject)
                .map((v) => v.chapter),
            ),
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      {all && (
        <label>
          Lesson
          <select
            disabled={locked}
            value={l.id}
            onChange={(e) =>
              select(lessons.find((v) => v.id === e.target.value)!)
            }
          >
            {lessons
              .filter((v) => v.chapter === l.chapter)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
          </select>
        </label>
      )}
    </div>
  );
}
export function Library({
  reading,
  open,
  close,
  s,
  update,
  speak,
}: {
  reading: Lesson | null;
  open: (l: Lesson) => void;
  close: () => void;
  s: Student;
  update: Update;
  speak: () => void;
}) {
  const [l, pick] = useState(lessons[0]),
    [copied, copy] = useState("");
  if (!reading)
    return (
      <div className="tool-panel">
        <h2>Lesson library</h2>
        <p>Choose a subject and chapter to find your next lesson.</p>
        <Selector l={l} select={pick} all={false} />
        {lessons
          .filter((x) => x.chapter === l.chapter)
          .map((v) => (
            <LessonRow key={v.id} l={v} onClick={() => open(v)} />
          ))}
      </div>
    );
  const i = lessons.indexOf(reading);
  return (
    <article className="tool-panel">
      <button className="text-btn" onClick={close}>
        <ChevronLeft size={15} /> Lesson library
      </button>
      <span className={"subject sub" + reading.art}>{reading.subject}</span>
      <h2>{reading.title}</h2>
      <p>{reading.chapter}</p>
      <div className="toolbar">
        <button className="secondary" onClick={speak}>
          <AudioLines size={15} /> Listen
        </button>
        <button
          className="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(fullText(reading));
              copy("Copied");
            } catch {
              copy("Select the lesson text to copy it manually.");
            }
          }}
        >
          <Copy size={15} />
          {copied || "Copy text"}
        </button>
        <label>
          Text size
          <select
            value={s.font}
            onChange={(e) => update((s) => ({ ...s, font: +e.target.value }))}
          >
            {[100, 110, 125, 150].map((x) => (
              <option key={x} value={x}>
                {x}%
              </option>
            ))}
          </select>
        </label>
        <label>
          Spacing
          <select
            value={s.spacing}
            onChange={(e) =>
              update((s) => ({ ...s, spacing: +e.target.value }))
            }
          >
            <option value={1.7}>Normal</option>
            <option value={2.2}>Wide</option>
          </select>
        </label>
      </div>
      <div className="reader" style={{ lineHeight: s.spacing }}>
        {reading.sections.map(([h, p]) => (
          <section key={h}>
            <h3>{h}</h3>
            <p>{p}</p>
          </section>
        ))}
      </div>
      <div className="row between">
        <button
          className="secondary"
          disabled={!i}
          onClick={() => open(lessons[i - 1])}
        >
          Previous
        </button>
        <button
          className="primary"
          disabled={i === lessons.length - 1}
          onClick={() => open(lessons[i + 1])}
        >
          Next lesson <ChevronRight size={14} />
        </button>
      </div>
    </article>
  );
}
export function Quiz({ update, s }: { update: Update; s: Student }) {
  const [l, pick] = useState(lessons[0]),
    [qs, set] = useState<Question[]>([]),
    [answers, answer] = useState<Record<number, number>>({}),
    [done, finish] = useState(false),
    [busy, wait] = useState(false),
    [err, error] = useState("");
  async function start(ai: boolean) {
    wait(true);
    error("");
    try {
      set(
        ai
          ? (
              await requestTool("quiz", {
                subject: l.subject,
                chapter: l.chapter,
                lesson: lessons
                  .filter((x) => x.chapter === l.chapter)
                  .map(fullText)
                  .join("\n"),
              })
            ).questions
          : quizzes[l.chapter],
      );
      answer({});
      finish(false);
    } catch (e) {
      error((e as Error).message);
    } finally {
      wait(false);
    }
  }
  const score = qs.filter((q, i) => answers[i] === q.correct).length;
  return (
    <div className="tool-panel">
      <h2>Chapter practice</h2>
      <p>Check your understanding with a short multiple-choice quiz.</p>
      <Selector
        l={l}
        select={(x) => {
          pick(x);
          set([]);
          finish(false);
          error("");
        }}
        all={false}
        locked={busy}
      />
      {!qs.length ? (
        <div className="row">
          <button
            className="primary"
            disabled={busy}
            onClick={() => start(false)}
          >
            Start sample quiz
          </button>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => start(true)}
          >
            {busy ? "Generating…" : "Generate AI quiz"}
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            finish(true);
            update((s) => ({
              ...s,
              results: [
                { chapter: l.chapter, score, total: qs.length, date: dayKey() },
                ...s.results,
              ],
            }));
          }}
        >
          {done && (
            <div className="success" role="status">
              Your score:{" "}
              <b>
                {score} / {qs.length}
              </b>
            </div>
          )}
          {qs.map((q, i) => (
            <fieldset key={i} disabled={done}>
              <legend>
                {i + 1}. {q.question}
              </legend>
              {q.options.map((v, j) => (
                <label className="choice" key={j}>
                  <input
                    type="radio"
                    required
                    checked={answers[i] === j}
                    name={"q" + i}
                    onChange={() => answer({ ...answers, [i]: j })}
                  />
                  {v}
                </label>
              ))}
              {done && (
                <p>
                  <b>Answer: {q.options[q.correct]}.</b> {q.explanation}
                </p>
              )}
            </fieldset>
          ))}
          {done ? (
            <button
              type="button"
              className="primary"
              onClick={() => {
                finish(false);
                answer({});
              }}
            >
              Restart quiz
            </button>
          ) : (
            <button className="primary">Submit answers</button>
          )}
        </form>
      )}
      {err && (
        <p className="notice" role="alert">
          {err}
        </p>
      )}
      {!!s.results.length && (
        <div>
          <h3>Quiz history</h3>
          {s.results.slice(0, 5).map((r, i) => (
            <p key={i}>
              {r.chapter} · {r.score}/{r.total} · {r.date}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
