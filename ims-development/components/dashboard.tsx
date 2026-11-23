import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Clock3,
  Flame,
  Target,
  Camera,
  ClipboardList,
  AudioLines,
  Timer,
  CalendarDays,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import {
  lessons,
  Student,
  Lesson,
  dayKey,
  streak,
  timeLabel,
} from "@/lib/learning";
export function Hero({
  s,
  profile,
  go,
}: {
  s: Student;
  profile: () => void;
  go: (p: string) => void;
}) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow hero-tag">
          <span />
          STUDENT WORKSPACE
        </div>
        <h1>
          {s.name
            ? `Welcome back, ${s.name.split(" ")[0]}.`
            : "Welcome to your study space."}
        </h1>
        <p>A little focus today, a little further tomorrow.</p>
        <button
          className="primary"
          onClick={() => (s.name ? go("My Lessons") : profile())}
        >
          <BookOpen size={16} />
          {s.name ? "Explore lessons" : "Get started"}
          <ArrowRight size={15} />
        </button>
      </div>
      <img className="hero-art" src="/study.webp" alt="" />
    </section>
  );
}
export function Stats({ s }: { s: Student }) {
  const m = s.days[dayKey()]?.minutes || 0;
  const stats = [
    {
      name: "Total study time",
      value: timeLabel(
        Object.values(s.days).reduce((n, d) => n + d.minutes, 0),
      ),
      foot: "Across all sessions",
      I: Clock3,
      color: "blue",
    },
    {
      name: "Daily progress",
      value: `${m} / ${s.target}`,
      foot: "minutes today",
      I: Target,
      color: "green",
    },
    {
      name: "Study streak",
      value: `${streak(s)} ${streak(s) === 1 ? 'day' : 'days'}`,
      foot: "Consecutive study days",
      I: Flame,
      color: "orange",
    },
  ];
  return (
    <div className="stats">
      {stats.map(({ name, value, foot, I, color }) => (
        <article className="stat" key={name}>
          <div className="stat-label">
            <span className={"mini " + color}>
              <I size={17} />
            </span>
            {name}
          </div>
          <strong>{value}</strong>
          <small>{foot}</small>
        </article>
      ))}
    </div>
  );
}
export function LessonRow({ l, onClick }: { l: Lesson; onClick: () => void }) {
  return (
    <button className="lesson-row" onClick={onClick}>
      <span className={"thumb cover" + l.art} />
      <span className="lesson-meta">
        <span className={"subject sub" + l.art}>{l.subject}</span>
        <b>{l.title}</b>
        <small>
          {l.chapter} <span>·</span> Lesson{" "}
          {lessons.filter((x) => x.chapter === l.chapter).indexOf(l) + 1}
        </small>
      </span>
      <ChevronRight size={17} />
    </button>
  );
}
export default function Dashboard({
  s,
  go,
  open,
}: {
  s: Student;
  go: (p: string) => void;
  open: (l: Lesson) => void;
}) {
  const recent = s.recent
    .map((id) => lessons.find((l) => l.id === id))
    .filter((l): l is Lesson => !!l);
  return (
    <div className="dash-sections">
      <section>
        <div className="section-title">
          <h2>Study overview</h2>
          <span className="subtle">
            <CalendarDays size={13} /> Today
          </span>
        </div>
        <Stats s={s} />
      </section>
      <section className="panel lesson-box">
        <div className="section-title">
          <h2>{recent.length ? "Recent lessons" : "Explore lessons"}</h2>
          <button className="text-btn" onClick={() => go("My Lessons")}>
            View all <ArrowRight size={14} />
          </button>
        </div>
        {(recent.length ? recent : lessons).slice(0, 3).map((l) => (
          <LessonRow key={l.id} l={l} onClick={() => open(l)} />
        ))}
      </section>
      <section>
        <div className="section-title">
          <h2>Quick tools</h2>
        </div>
        <div className="quick-grid">
          {[
            [Camera, "Photo Notes", "Capture & simplify", "green"],
            [ClipboardList, "Quizzes", "Test yourself", "purple"],
            [AudioLines, "Text-to-Speech", "Listen to text", "blue"],
            [Timer, "Focus Timer", "Stay on track", "orange"],
          ].map(([Icon, name, desc, color]) => {
            const I = Icon as typeof Camera;
            return (
              <button
                className="quick"
                key={String(name)}
                onClick={() => go(String(name))}
              >
                <span className={"mini " + color}>
                  <I size={19} />
                </span>
                <b>{String(name)}</b>
                <small>{String(desc)}</small>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
