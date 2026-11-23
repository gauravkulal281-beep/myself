import { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, Target } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { Stats } from "./dashboard";
import { Student, Update, dayKey } from "@/lib/learning";
export function Focus({ update }: { update: Update }) {
  const [mode, choose] = useState("Study"),
    [mins, duration] = useState(25),
    [remaining, time] = useState(1500),
    [end, start] = useState(0),
    [msg, say] = useState("");
  const counted = useRef(false);
  useEffect(() => {
    if (!end) return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      time(seconds);
      if (!seconds && !counted.current) {
        counted.current = true;
        start(0);
        say(
          mode === "Study"
            ? "Study session complete. Your progress has been saved."
            : "Break complete. Ready for another session?",
        );
        if (mode === "Study")
          update((s) => {
            const k = dayKey(),
              d = s.days[k] || { minutes: 0, sessions: 0, target: s.target };
            return {
              ...s,
              days: {
                ...s.days,
                [k]: {
                  minutes: d.minutes + mins,
                  sessions: d.sessions + 1,
                  target: s.target,
                },
              },
            };
          });
      }
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [end, mins, mode, update]);
  function reset(m: number) {
    start(0);
    duration(m);
    time(m * 60);
    say("");
    counted.current = false;
  }
  return (
    <div className="tool-panel timer">
      <div className="tabs">
        {["Study", "Break"].map((m) => (
          <button
            key={m}
            aria-pressed={mode === m}
            onClick={() => {
              choose(m);
              reset(m === "Study" ? 25 : 5);
            }}
          >
            {m} mode
          </button>
        ))}
      </div>
      <span className="eyebrow">
        <Timer size={15} /> FOCUS SPACE
      </span>
      <h2>{mode === "Study" ? "Time to focus" : "Take a breather"}</h2>
      <strong className="clock" role="timer">
        {Math.floor(remaining / 60)
          .toString()
          .padStart(2, "0")}
        :{(remaining % 60).toString().padStart(2, "0")}
      </strong>
      <div className="row">
        <button
          className="primary"
          onClick={() => {
            if (end) {
              time(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
              start(0);
            } else {
              counted.current = false;
              say("");
              start(Date.now() + (remaining || mins * 60) * 1000);
            }
          }}
        >
          {end ? <Pause size={16} /> : <Play size={16} />}{" "}
          {end
            ? "Pause"
            : remaining < mins * 60 && remaining > 0
              ? "Resume"
              : "Start session"}
        </button>
        <button className="secondary" onClick={() => reset(mins)}>
          <RotateCcw size={15} />
          Reset
        </button>
      </div>
      <label>
        Session length (minutes)
        <input
          type="number"
          min="1"
          max="180"
          value={mins || ""}
          disabled={!!end}
          onChange={(e) =>
            reset(Math.min(180, Math.max(0, Math.floor(+e.target.value))))
          }
          onBlur={() => {
            if (!mins) reset(1);
          }}
        />
      </label>
      <p role="status">
        {msg || "Your timer keeps running as you explore this workspace."}
      </p>
    </div>
  );
}
export function StreakView({ s, update }: { s: Student; update: Update }) {
  const [target, set] = useState(String(s.target)),
    [status, say] = useState("");
  const data = Array.from({ length: 7 }, (_, i) => {
    const d = dayKey(i - 6);
    return {
      day: new Date(d + "T12:00:00").toLocaleDateString("en", {
        weekday: "short",
      }),
      minutes: s.days[d]?.minutes || 0,
    };
  });
  return (
    <div className="dash-sections">
      <Stats s={s} />
      <div className="tool-panel">
        <h2>Weekly progress</h2>
        <p>Study minutes over the last seven days.</p>
        <ChartContainer
          className="h-48 w-full"
          config={{ minutes: { label: "Study minutes", color: "var(--blue)" } }}
        >
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} />
            <YAxis width={30} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="minutes"
              fill="var(--color-minutes)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(target);
            update((s) => ({
              ...s,
              target: n,
              days: s.days[dayKey()]
                ? { ...s.days, [dayKey()]: { ...s.days[dayKey()], target: n } }
                : s.days,
            }));
            say("Daily target saved.");
          }}
        >
          <label>
            Daily study target (minutes)
            <input
              type="number"
              min={1}
              max={720}
              required
              value={target}
              onChange={(e) => set(e.target.value)}
            />
          </label>
          <button className="primary">Save target</button>
        </form>
        <p role="status">{status}</p>
        <h3>Study history</h3>
        {Object.keys(s.days).length ? (
          Object.entries(s.days)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([k, d]) => (
              <p key={k}>
                {k} · {d.minutes} minutes · {d.sessions} focus sessions
              </p>
            ))
        ) : (
          <p>
            Complete a focus session to log your first study day. Reach your
            daily target to build a streak.
          </p>
        )}
      </div>
    </div>
  );
}
