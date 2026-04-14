"use client";
import { useEffect, useState, useRef } from "react";

const HABITS = [
  {
    id: "prayer",
    emoji: "🕌",
    label: "Prayed all 5 prayers",
    verse: "Indeed, prayer has been decreed upon the believers a decree of specified times.",
    verseRef: "4:103",
  },
  {
    id: "quran",
    emoji: "📖",
    label: "Read today's ayah & reflected",
    verse: "This is the Book about which there is no doubt, a guidance for those conscious of Allah.",
    verseRef: "2:2",
  },
  {
    id: "dhikr",
    emoji: "🤲",
    label: "Made dhikr today",
    verse: "Verily, in the remembrance of Allah do hearts find rest.",
    verseRef: "13:28",
  },
  {
    id: "sadaqah",
    emoji: "💰",
    label: "Gave sadaqah (even a smile)",
    verse: "Who is it that would loan Allah a goodly loan so He may multiply it for him many times over?",
    verseRef: "2:245",
  },
  {
    id: "family",
    emoji: "📞",
    label: "Checked in on family",
    verse: "And your Lord has decreed that you worship none but Him, and that you be kind to parents.",
    verseRef: "17:23",
  },
];

type DayRecord = {
  date: string;
  completed: string[];
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function loadHistory(): DayRecord[] {
  try {
    return JSON.parse(localStorage.getItem("habitHistory") || "[]");
  } catch {
    return [];
  }
}

function saveHistory(history: DayRecord[]) {
  localStorage.setItem("habitHistory", JSON.stringify(history));
}

function getTodayRecord(history: DayRecord[]): DayRecord {
  const today = getToday();
  return history.find((r) => r.date === today) ?? { date: today, completed: [] };
}

function getHeatmapColor(count: number): string {
  if (count === 0) return "var(--color-border)";
  if (count === 1) return "#c6e6c6";
  if (count === 2) return "#8fce8f";
  if (count === 3) return "#52a852";
  if (count === 4) return "#2d7a2d";
  return "#1B4332";
}

export default function HabitsContent() {
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<DayRecord>({ date: getToday(), completed: [] });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const heatmapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = loadHistory();
    setHistory(h);
    setTodayRecord(getTodayRecord(h));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && heatmapRef.current) {
      heatmapRef.current.scrollLeft = heatmapRef.current.scrollWidth;
    }
  }, [mounted]);

  function toggleHabit(habitId: string) {
    const today = getToday();
    const newHistory = [...history.filter((r) => r.date !== today)];
    const current = getTodayRecord(history);
    const alreadyDone = current.completed.includes(habitId);
    const newCompleted = alreadyDone
      ? current.completed.filter((id) => id !== habitId)
      : [...current.completed, habitId];
    const newRecord = { date: today, completed: newCompleted };
    newHistory.push(newRecord);
    setHistory(newHistory);
    setTodayRecord(newRecord);
    saveHistory(newHistory);
  }

  function getStreak(habitId: string): number {
    let streak = 0;
    for (let i = 1; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const record = history.find((r) => r.date === dateStr);
      if (record?.completed.includes(habitId)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  const completedToday = todayRecord.completed.length;
  const ringPercent = (completedToday / HABITS.length) * 100;
  const today = getToday();

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Completion Ring */}
      <div className="card p-6 shadow-sm flex items-center gap-6">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-border)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="var(--color-green-dark)"
              strokeWidth="3"
              strokeDasharray={`${ringPercent} ${100 - ringPercent}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold" style={{ color: "var(--color-green-dark)" }}>
              {completedToday}/{HABITS.length}
            </span>
          </div>
        </div>
        <div>
          <h2
            className="font-display text-base font-bold"
            style={{ color: "var(--color-green-dark)", fontFamily: "var(--font-display)" }}
          >
            {completedToday === HABITS.length
              ? "MashAllah! All habits complete 🌟"
              : completedToday === 0
              ? "Start your habits for today"
              : `${HABITS.length - completedToday} habit${HABITS.length - completedToday > 1 ? "s" : ""} remaining`}
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Habit Cards */}
      <div className="flex flex-col gap-3">
        {HABITS.map((habit) => {
          const done = todayRecord.completed.includes(habit.id);
          const streak = getStreak(habit.id);
          const isExpanded = expanded === habit.id;

          return (
            <div
              key={habit.id}
              className="card overflow-hidden shadow-sm"
              style={{ borderLeft: done ? "3px solid var(--color-green-dark)" : "3px solid var(--color-border)" }}
            >
              <div className="p-4 flex items-center gap-4">
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    borderColor: done ? "var(--color-green-dark)" : "var(--color-border)",
                    backgroundColor: done ? "var(--color-green-dark)" : "transparent",
                  }}
                >
                  {done && <span className="text-white text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{habit.emoji}</span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: done ? "var(--color-green-dark)" : "var(--color-text)",
                        textDecoration: done ? "line-through" : "none",
                        opacity: done ? 0.7 : 1,
                      }}
                    >
                      {habit.label}
                    </span>
                  </div>
                  {streak > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-gold)" }}>
                      🔥 {streak} day streak
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setExpanded(isExpanded ? null : habit.id)}
                  className="text-xs flex-shrink-0"
                  style={{ color: "var(--color-muted)" }}
                >
                  {isExpanded ? "▲" : "▼"}
                </button>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 pt-0" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <p className="text-xs italic leading-relaxed mt-3" style={{ color: "var(--color-subtle)" }}>
                    &ldquo;{habit.verse}&rdquo;
                  </p>
                  <p className="text-xs mt-1 font-medium" style={{ color: "var(--color-gold)" }}>
                    — {habit.verseRef}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Heatmap */}
      <div className="card p-6 shadow-sm">
        <h3
          className="font-display text-sm font-bold mb-4"
          style={{ color: "var(--color-green-dark)", fontFamily: "var(--font-display)" }}
        >
          Your Year of Consistency
        </h3>
        <div className="overflow-x-auto" ref={heatmapRef}>
          <div className="flex gap-1" style={{ minWidth: "fit-content" }}>
            {Array.from({ length: 53 }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const dayNumber = weekIndex * 7 + dayIndex;
                  const daysAgo = 364 - dayNumber;
                  if (daysAgo < 0) {
                    return <div key={dayIndex} style={{ width: "12px", height: "12px" }} />;
                  }
                  const d = new Date();
                  d.setDate(d.getDate() - daysAgo);
                  const dateStr = d.toISOString().split("T")[0];
                  const record =
                    dateStr === today
                      ? todayRecord
                      : history.find((r) => r.date === dateStr);
                  const count = record?.completed.length ?? 0;
                  return (
                    <div
                      key={dayIndex}
                      title={`${dateStr}: ${count}/5 habits`}
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "2px",
                        backgroundColor: getHeatmapColor(count),
                        flexShrink: 0,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs" style={{ color: "var(--color-muted)" }}>Less</span>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                backgroundColor: getHeatmapColor(n),
              }}
            />
          ))}
          <span className="text-xs" style={{ color: "var(--color-muted)" }}>More</span>
        </div>
      </div>
    </div>
  );
}
