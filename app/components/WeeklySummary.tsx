"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type DayRecord = {
  date: string;
  completed: string[];
};

function getThisWeekDates() {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// function isFriday() {
//   return new Date().getDay() === 5;
// }

// for testing
function isFriday() {
  // return true;
  return new Date().getDay() === 5;
}

function getWeekKey() {
  const d = new Date();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return monday.toISOString().split("T")[0];
}

export default function WeeklySummary() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isFriday()) return;
    const weekKey = `weeklySummary_${getWeekKey()}`;
    const cached = localStorage.getItem(weekKey);
    if (cached) {
      setSummary(cached);
      return;
    }
    generateSummary(weekKey);
  }, [session]);

  async function generateSummary(weekKey: string) {
    setLoading(true);
    try {
      // Get habit data for the week
      const habitHistory: DayRecord[] = JSON.parse(localStorage.getItem("habitHistory") || "[]");
      const weekDates = getThisWeekDates();
      const habits = weekDates.map((date) => {
        const record = habitHistory.find((r) => r.date === date);
        return { date, count: record?.completed.length ?? 0 };
      });

      // Get reflections for the week
      let reflections: { body: string; date: string }[] = [];
      if (session?.accessToken) {
        try {
          const res = await fetch("/api/reflect/room");
          const data = await res.json();
          reflections = (data.posts ?? [])
            .filter((p: { createdAt: string }) => weekDates.includes(p.createdAt.split("T")[0]))
            .map((p: { body: string; createdAt: string }) => ({
              body: p.body,
              date: p.createdAt.split("T")[0],
            }));
        } catch {
          // reflections optional
        }
      }

      const res = await fetch("/api/weekly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habits, reflections }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
        localStorage.setItem(weekKey, data.summary);
      } else {
        // fallback
        const fallback = "Jumu'ah Mubarak! Reflect on your week — every good deed you did, no matter how small, counts with Allah. Keep going! 🌿";
        setSummary(fallback);
        localStorage.setItem(weekKey, fallback);
      }
    } catch {
        const fallback = "Jumu'ah Mubarak! Reflect on your week — every good deed you did, no matter how small, counts with Allah. Keep going! 🌿";
        setSummary(fallback);
      } finally {
      setLoading(false);
    }
  }

  if (!isFriday() || dismissed) return null;
  if (!loading && !summary) return null;

  return (
    <div
      className="card overflow-hidden shadow-sm"
      style={{ borderLeft: "3px solid var(--color-gold)" }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>📜</span>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-gold)" }}>
              Weekly Summary — Jumu&apos;ah Mubarak
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs"
            style={{ color: "var(--color-muted)" }}
          >
            ✕
          </button>
        </div>
        {loading ? (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Generating your weekly summary...
          </p>
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-subtle)" }}>
            {summary}
          </p>
        )}
      </div>
    </div>
  );
}