"use client";
import { useState, useEffect } from "react";
import ShareCard from "./ShareCard";
import { saveTodayReflection } from "@/lib/storage";

type Props = {
  verseKey: string;
  roomId?: number;
  accessToken?: string;
  arabicText?: string;
  translation?: string;
  onPostSuccess?: () => void;
};

export default function ReflectionInput({ verseKey, roomId, accessToken, arabicText, translation, onPostSuccess }: Props) {
  const [reflection, setReflection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedReflection, setSubmittedReflection] = useState("");
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!syncing) return;
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [syncing]);

  async function handleSubmit() {
    if (!reflection.trim() || reflection.length < 6) {
      setError("Reflection must be at least 6 characters.");
      return;
    }
    if (!accessToken) {
      setError("You must be logged in to submit a reflection.");
      return;
    }

    const reflectionToPost = reflection;

    setSubmitting(true);
    setError("");
    setSubmitted(true);
    setSubmittedReflection(reflectionToPost);
    saveTodayReflection(verseKey, reflectionToPost);
    setReflection("");
    setSubmitting(false);
    setSyncing(true);
    setElapsed(0);

    const feedCacheKey = roomId ? `roomFeedCache_${roomId}` : null;
    if (feedCacheKey) {
      try {
        const raw = localStorage.getItem(feedCacheKey);
        const parsed = raw ? JSON.parse(raw) : { posts: [], timestamp: Date.now() };
        const newPost = {
          id: Date.now(),
          body: reflectionToPost,
          author: { firstName: "You", lastName: "" },
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(feedCacheKey, JSON.stringify({
          posts: [newPost, ...parsed.posts],
          timestamp: Date.now(),
        }));
      } catch {}
    }

    onPostSuccess?.();

    fetch("/api/reflect/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reflection: reflectionToPost, verseKey, roomId }),
    })
      .then(() => {
        setSyncing(false);
        setSyncDone(true);
        setTimeout(() => setSyncDone(false), 3000);
      })
      .catch(() => {
        setSyncing(false);
      });
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-4">
        {syncing && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{
              backgroundColor: "var(--color-sand)",
              border: "1px solid var(--color-border)",
              color: "var(--color-muted)",
            }}
          >
            <svg className="animate-spin w-4 h-4 flex-shrink-0" style={{ color: "var(--color-green-dark)" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>
              {"Syncing to your circle... (" + elapsed + "s)"}
            </span>
          </div>
        )}

        {syncDone && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{
              backgroundColor: "var(--color-sand)",
              border: "1px solid var(--color-border)",
              color: "var(--color-green-dark)",
            }}
          >
            ✅ Synced to your circle!
          </div>
        )}

        <div className="card p-6">
          <p className="font-medium text-green-dark">
            JazakAllah khair! Your reflection was shared. 🌿
          </p>
          <button
            onClick={() => { setSubmitted(false); setSyncing(false); setSyncDone(false); }}
            className="mt-3 text-sm underline underline-offset-4 text-green-mid"
          >
            Write another reflection
          </button>
        </div>
        <ShareCard
          verseKey={verseKey}
          arabicText={arabicText ?? ""}
          translation={translation ?? ""}
          reflection={submittedReflection}
        />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden shadow-sm">
      <div className="px-6 py-3 border-b border-theme bg-sand">
        <h2 className="font-display text-base font-bold text-green-dark">
          Your Reflection
        </h2>
        <p className="text-xs mt-0.5 text-muted">
          How did this ayah move you to act today?
        </p>
      </div>

      <div className="p-6 flex flex-col gap-4">
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Today this ayah reminded me to..."
          rows={4}
          className="w-full rounded-xl p-4 text-sm resize-none transition focus:outline-none bg-cream border-theme text-main"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--color-placeholder)" }}>
            {reflection.length} chars
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reflection.trim()}
            className="bg-green-dark text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-40"
          >
            {submitting ? "Sharing..." : "Share with circle →"}
          </button>
        </div>
      </div>
    </div>
  );
}