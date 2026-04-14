"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getDailyAyah } from "@/lib/quranApi";

type Verse = {
  verse_key: string;
  text_uthmani: string;
  translations?: { text: string }[];
  tafsir?: string;
  tafsirSummary?: string;
  audioUrl?: string;
};

type Props = {
  verse?: Verse | null;
};

function extractTafsirSummary(html?: string, maxLength = 320) {
  if (!html) return "";
  const plainText = html
    .replace(/<\/(p|h1|h2|h3|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
  if (plainText.length <= maxLength) return plainText;
  const trimmed = plainText.slice(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(" ");
  return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed).trim() + "...";
}

export default function AyahCard({ verse: verseProp }: Props) {
  const [mounted, setMounted] = useState(false);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    setMounted(true);
    if (verseProp) {
      setVerse(verseProp);
      setLoading(false);
      return;
    }
    getDailyAyah()
      .then((data) => setVerse(data.verse))
      .catch((err) => console.error("Failed to load daily ayah:", err))
      .finally(() => setLoading(false));
  }, [verseProp]);

  const translation = verse?.translations?.[0]?.text ?? "";
  const extractedSummary = useMemo(() => extractTafsirSummary(verse?.tafsir, 320), [verse?.tafsir]);
  const tafsirSummary = verse?.tafsirSummary || extractedSummary;

  async function handleAsk() {
    if (!question.trim() || asking) return;
    setAsking(true);
    setAnswer("");
    try {
      const res = await fetch("/api/quran/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          arabicText: verse?.text_uthmani ?? "",
          translation,
          tafsirText: tafsirSummary,
        }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? data.error ?? "No response.");
    } catch {
      setAnswer("Something went wrong. Please try again.");
    } finally {
      setAsking(false);
    }
  }

  function toggleAudio() {
    if (!verse?.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(verse.audioUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="card p-6 shadow-sm">
        <p className="text-sm text-muted">Loading today&apos;s ayah...</p>
      </div>
    );
  }

  if (!verse) {
    return (
      <div className="card p-6 shadow-sm">
        <p className="text-sm text-red-500">Could not load today&apos;s ayah.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden shadow-sm">
      {/* Green top bar */}
      <div className="bg-green-dark px-6 py-3 flex items-center justify-between">
        <span className="text-xs font-medium tracking-widest uppercase text-green-light">
          Today&apos;s Ayah
        </span>
        <span className="text-xs font-medium text-gold">{verse.verse_key}</span>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Arabic */}
        <p
          className="font-arabic text-right leading-[2.4]"
          style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", color: "var(--color-text)" }}
        >
          {verse.text_uthmani}
        </p>

        {/* Audio button */}
        {verse.audioUrl && (
          <button
            onClick={toggleAudio}
            className={`self-end flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border-theme transition ${
              playing ? "bg-green-dark text-white" : "bg-sand text-green-dark"
            }`}
          >
            <span>{playing ? "⏸" : "▶"}</span>
            <span>{playing ? "Playing..." : "Listen"}</span>
          </button>
        )}

        {/* Divider */}
        <div className="h-px" style={{ backgroundColor: "var(--color-border)" }} />

        {/* Translation */}
        <p className="text-sm font-medium leading-relaxed text-subtle">{translation}</p>

        {/* Reflection prompt */}
        {tafsirSummary ? (
          <div
            className="card-sand p-4"
            style={{ borderLeft: "3px solid var(--color-green-dark)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-green-dark)" }}>
                Today&apos;s Reflection Prompt
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-subtle)" }}>{tafsirSummary}</p>
          </div>
        ) : (
          <div className="card-sand p-4" style={{ borderLeft: "3px solid rgba(255,255,255,0.1)" }}>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>Tafsir not available for this ayah.</p>
          </div>
        )}

        {/* Full tafsir link */}
        {verse.tafsir && (
          <Link
            href={`/tafsir/${encodeURIComponent(verse.verse_key)}`}
            className="self-start text-xs font-medium underline underline-offset-4 text-green-mid transition"
          >
            Read full tafsir →
          </Link>
        )}

        {/* Ask about this ayah */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAsk(); }}
              placeholder="Ask a question about this ayah..."
              className="flex-1 text-xs rounded-xl px-4 py-2.5 focus:outline-none"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-cream)",
                color: "var(--color-subtle)",
              }}
            />
            <button
              onClick={handleAsk}
              disabled={asking || !question.trim()}
              className="flex-shrink-0 text-xs font-medium px-4 py-2.5 rounded-xl text-white transition disabled:opacity-40"
              style={{ backgroundColor: "var(--color-green-dark)" }}
            >
              {asking ? "..." : "Ask"}
            </button>
          </div>

          {asking && (
            <div className="flex items-center gap-2 px-1">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--color-green-mid)" }}
              />
              <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                Consulting tafsir...
              </span>
            </div>
          )}

          {answer && (
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: "var(--color-sand)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full" style={{ backgroundColor: "var(--color-green-dark)" }} />
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--color-green-dark)" }}
                >
                  Scholar&apos;s Response
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-subtle)" }}>
                {answer}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}