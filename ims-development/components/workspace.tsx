"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Camera,
  ClipboardList,
  AudioLines,
  Headphones,
  Timer,
  Flame,
  PanelLeftClose,
  PanelLeftOpen,
  Accessibility,
  ChevronsUpDown,
  ChevronRight,
  CalendarDays,
  Target,
  Lightbulb,
  X,
  Menu,
  UserRound,
  BookMarked,
  GraduationCap,
} from "lucide-react";
import {
  Student,
  initial,
  Update,
  Lesson,
  lessons,
  dayKey,
} from "@/lib/learning";
import Dashboard, { Hero } from "./dashboard";
import Assistant from "./assistant";
import { Library, Quiz } from "./lesson-tools";
import { Speech, Recordings, PhotoNotes } from "./media-tools";
import { Focus, StreakView } from "./progress";
const nav = [
  { n: "Dashboard", I: LayoutDashboard },
  { n: "My Lessons", I: BookOpen },
  { n: "Photo Notes", I: Camera },
  { n: "Quizzes", I: ClipboardList },
  { n: "Text-to-Speech", I: AudioLines },
  { n: "Audio Lessons", I: Headphones },
  { n: "Focus Timer", I: Timer },
  { n: "Study Streak", I: Flame },
];
export default function Workspace() {
  const [s, set] = useState<Student>(initial),
    [ready, hydrated] = useState(false),
    [err, error] = useState(""),
    [page, navigate] = useState("Dashboard"),
    [collapsed, collapse] = useState(false),
    [mobile, menu] = useState(false),
    [modal, dialog] = useState(""),
    [reading, read] = useState<Lesson | null>(null),
    [speechLesson, selectSpeech] = useState<Lesson>(),
    [date, showDate] = useState("");
  const ref = useRef<HTMLDialogElement>(null),
    main = useRef<HTMLElement>(null);
  const update = useCallback<Update>((fn) => set(fn), []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ims.student.v1");
      if (raw) set({ ...initial, ...JSON.parse(raw) });
    } catch {
      error("Saved details could not be read in this browser.");
    }
    hydrated(true);
    showDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem("ims.student.v1", JSON.stringify(s));
      } catch {
        error("Browser storage is unavailable. Changes will not persist.");
      }
    document.documentElement.style.fontSize = s.font + "%";
  }, [ready, s]);
  useEffect(() => {
    if (modal) ref.current?.showModal();
    else ref.current?.close();
  }, [modal]);
  useEffect(() => {
    if (!mobile || modal) return;
    document.querySelector<HTMLButtonElement>('nav [aria-current="page"]')?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { menu(false); requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.mobile-toggle')?.focus()); }
    };
    const resize = () => { if (window.innerWidth > 800) menu(false); };
    window.addEventListener('keydown', close);
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('keydown', close); window.removeEventListener('resize', resize); };
  }, [mobile, modal]);
  function go(p: string) {
    navigate(p);
    menu(false);
    if (p === "My Lessons") read(null);
    selectSpeech(undefined);
    requestAnimationFrame(() => main.current?.focus());
    window.scrollTo(0, 0);
  }
  function open(l: Lesson) {
    navigate("My Lessons");
    read(l);
    update((s) => ({
      ...s,
      recent: [l.id, ...s.recent.filter((x) => x !== l.id)].slice(0, 12),
    }));
    window.scrollTo(0, 0);
  }
  const minutes = s.days[dayKey()]?.minutes || 0;
  return (
    <div
      data-ready={ready}
      className={
        "shell " +
        (collapsed ? "compact " : "") +
        (mobile ? "nav-open " : "") +
        (s.contrast ? "contrast" : "")
      }
    >
      <a href="#main" className="skip">
        Skip to learning content
      </a>
      {mobile && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => menu(false)}
        />
      )}
      <aside className="sidebar">
        <div className="brand">
          <img src="/book.svg" alt="" />
          <div>
            <b>IMS</b>
            <small>Learning workspace</small>
          </div>
          <button
            className="icon collapse-rail"
            aria-label="Collapse navigation"
            onClick={() =>
              window.innerWidth < 801 ? menu(false) : collapse(true)
            }
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
        <nav aria-label="Main navigation">
          {nav.map(({ n, I }, i) => (
            <div key={n}>
              {(i === 0 || i === 4) && (
                <div className="nav-caption">
                  {i === 0 ? "WORKSPACE" : "STUDY TOOLS"}
                </div>
              )}
              <button
                title={n}
                aria-label={n}
                aria-current={page === n ? "page" : undefined}
                className={page === n ? "active" : ""}
                onClick={() => go(n)}
              >
                <I size={18} />
                <span>{n}</span>
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="goal-card" onClick={() => go("Study Streak")}>
            <span>
              <Target size={15} />
              Daily goal
            </span>
            <small>
              {minutes} of {s.target} min
            </small>
            <progress aria-label="Daily study target" max={s.target} value={minutes} />
          </button>
          <button
            className="access"
            title="Accessibility"
            onClick={() => dialog("Accessibility")}
          >
            <Accessibility size={17} />
            <span>Accessibility</span>
          </button>
          <button className="profile" onClick={() => dialog("Student profile")}>
            <span className="avatar">
              {s.name ? (
                s.name.slice(0, 1).toUpperCase()
              ) : (
                <GraduationCap size={20} />
              )}
            </span>
            <span>
              <b>{s.name || "Student profile"}</b>
              <small>
                {s.grade ? "Grade " + s.grade : "Personalize workspace"}
              </small>
            </span>
            <ChevronsUpDown size={14} />
          </button>
        </div>
      </aside>
      <div className="workspace" inert={mobile}>
        <header className="topbar">
          <button
            className="icon mobile-toggle"
            aria-label="Open navigation"
            onClick={() => menu(true)}
          >
            <Menu />
          </button>
          {collapsed && (
            <button
              className="icon expand-nav"
              aria-label="Expand navigation"
              onClick={() => collapse(false)}
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
          <span className="breadcrumb">
            Workspace <ChevronRight size={13} /> <b>{page}</b>
          </span>
          <span className="date">
            <CalendarDays size={15} />
            {date}
          </span>
          <button
            className="top-avatar"
            aria-label="Edit student profile"
            onClick={() => dialog("Student profile")}
          >
            {s.name ? s.name[0].toUpperCase() : <UserRound size={16} />}
          </button>
        </header>
        <main id="main" tabIndex={-1} ref={main}>
          {err && (
            <p className="notice" role="alert">
              {err}
            </p>
          )}
          {page === "Dashboard" ? (
            <Hero s={s} profile={() => dialog("Welcome to IMS")} go={go} />
          ) : (
            <div className="page-title">
              <div className="eyebrow">LEARNING WORKSPACE</div>
              <h1>{page}</h1>
            </div>
          )}
          <div className="content-grid">
            <div className="main-col">
              {page === "Dashboard" && <Dashboard s={s} go={go} open={open} />}{" "}
              {page === "My Lessons" && (
                <Library
                  reading={reading}
                  open={open}
                  close={() => read(null)}
                  s={s}
                  update={update}
                  speak={() => {
                    selectSpeech(reading || undefined);
                    navigate("Text-to-Speech");
                  }}
                />
              )}
              {page === "Quizzes" && <Quiz s={s} update={update} />}{" "}
              {page === "Audio Lessons" && <Recordings />}
              {page === "Text-to-Speech" && (
                <Speech selected={speechLesson} />
              )}{" "}
              {page === "Photo Notes" && <PhotoNotes s={s} update={update} />}
              <div hidden={page !== "Focus Timer"}>
                <Focus update={update} />
              </div>
              {page === "Study Streak" && <StreakView s={s} update={update} />}
            </div>
            <div className="right-col">
              <Assistant
                lesson={
                  page === "My Lessons" ? reading || undefined : undefined
                }
              />
              <aside className="tip">
                <span>
                  <Lightbulb size={17} />
                  Study tip
                </span>
                <p>
                  Break your study time into short, focused sessions. Small
                  steps add up!
                </p>
                <button className="text-btn" onClick={() => go("Focus Timer")}>
                  Open focus timer <ChevronRight size={13} />
                </button>
              </aside>
            </div>
          </div>
        </main>
      </div>
      <dialog
        ref={ref}
        onCancel={() => dialog("")}
        onClick={(e) => {
          if (e.target === ref.current) dialog("");
        }}
        aria-labelledby="modal-title"
      >
        <div className="modal-content">
          <div className="section-title">
            <h2 id="modal-title">{modal}</h2>
            <button
              className="icon"
              aria-label="Close dialog"
              onClick={() => dialog("")}
            >
              <X size={18} />
            </button>
          </div>
          {modal === "Accessibility" ? (
            <>
              <label>
                Workspace text size
                <select
                  value={s.font}
                  onChange={(e) =>
                    update((s) => ({ ...s, font: +e.target.value }))
                  }
                >
                  {[100, 110, 125, 150].map((x) => (
                    <option key={x} value={x}>
                      {x}%
                    </option>
                  ))}
                </select>
              </label>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={s.contrast}
                  onChange={(e) =>
                    update((s) => ({ ...s, contrast: e.target.checked }))
                  }
                />
                High-contrast mode
              </label>
              <button className="primary" onClick={() => dialog("")}>
                Done
              </button>
            </>
          ) : (
            modal && (
              <form
                key={modal}
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget),
                    name = String(d.get("name")).trim();
                  if (!name) return;
                  update((s) => ({
                    ...s,
                    name,
                    grade: String(d.get("grade")),
                  }));
                  dialog("");
                }}
              >
                <p>Make this learning workspace yours. No account needed.</p>
                <label>
                  Student name
                  <input
                    name="name"
                    autoComplete="given-name"
                    required
                    pattern=".*\S.*"
                    maxLength={50}
                    defaultValue={s.name}
                    placeholder="Your name"
                  />
                </label>
                <label>
                  Class / Grade
                  <select name="grade" defaultValue={s.grade} required>
                    <option value="" disabled>
                      Select your grade
                    </option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        Grade {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <small>
                  Your profile, preferences, and progress are saved only in this
                  browser on this device.
                </small>
                <button className="primary">
                  {s.name ? "Save changes" : "Start learning"}
                </button>
              </form>
            )
          )}
        </div>
      </dialog>
    </div>
  );
}
