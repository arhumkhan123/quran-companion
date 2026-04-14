"use client";
import { useEffect, useState } from "react";
import { getYesterdayAction, markFollowThrough, DailyAction } from "@/lib/storage";

export default function FollowUpCheckIn() {
  const [action, setAction] = useState<DailyAction | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    setAction(getYesterdayAction());
  }, []);

  if (!action || answered) return null;

  function respond(value: boolean) {
    if (!action) return;
    markFollowThrough(action.date, value);
    setAnswered(true);
  }

  return (
    <div
      className="card overflow-hidden shadow-sm"
      style={{ borderLeft: "3px solid var(--color-gold)" }}
    >
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span>🌅</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-gold">
            Yesterday&apos;s Check-In
          </span>
        </div>
        <p className="text-sm text-subtle leading-relaxed mb-1">
          You reflected on <span className="font-semibold text-green-dark">{action.verseKey}</span> and said:
        </p>
        <p className="text-sm text-muted italic mb-4 leading-relaxed">
          &ldquo;{action.reflection}&rdquo;
        </p>
        <p className="text-sm font-medium text-main mb-4">
          Did you follow through on your intention?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => respond(true)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-green-dark transition"
          >
            ✅ Yes, alhamdulillah!
          </button>
          <button
            onClick={() => respond(false)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-sand border-theme text-subtle transition"
          >
            Not today
          </button>
        </div>
      </div>
    </div>
  );
}