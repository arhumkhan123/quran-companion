"use client";
import { useEffect, useState } from "react";

function computeStreak(): number {
  try {
    const history: { date: string }[] = JSON.parse(
      localStorage.getItem("dailyActions") || "[]"
    );
    if (history.length === 0) return 0;

    const dates = new Set(history.map((a) => a.date));

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Start counting from today; fall back to yesterday so the streak
    // doesn't break before the user has had a chance to reflect.
    let startDate: Date | null = null;
    if (dates.has(todayStr)) startDate = today;
    else if (dates.has(yesterdayStr)) startDate = yesterday;
    if (!startDate) return 0;

    let streak = 0;
    const cursor = new Date(startDate);
    while (true) {
      const dateStr = cursor.toISOString().split("T")[0];
      if (dates.has(dateStr)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  } catch {
    return 0;
  }
}

export default function StreakBadge() {
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    setStreak(computeStreak());

    const handler = () => setStreak(computeStreak());
    window.addEventListener("streak-updated", handler);
    return () => window.removeEventListener("streak-updated", handler);
  }, []);

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: "var(--color-sand)",
        border: "1px solid var(--color-border)",
        color: streak > 0 ? "var(--color-green-dark)" : "var(--color-muted)",
      }}
    >
      <span>🔥</span>
      <span>{streak > 0 ? `${streak} day streak` : "Start your streak"}</span>
    </div>
  );
}
