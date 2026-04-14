"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function StreakBadge() {
  const { data: session } = useSession();
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    if (!session?.accessToken) return;

    fetch("/api/streak")
      .then((res) => res.json())
      .then((data) => setStreak(data.streak ?? 0))
      .catch(() => {});
  }, [session]);

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: "var(--color-sand)",
        border: "1px solid var(--color-border)",
        color: "var(--color-green-dark)",
      }}
    >
      <span>🔥</span>
      <span>{streak > 0 ? `${streak} day streak` : "Start your streak"}</span>
    </div>
  );
}