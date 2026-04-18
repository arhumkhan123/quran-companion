"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type VerseData = {
  verse_key: string;
  text_uthmani: string;
  translations: { text: string }[];
  tafsir: string;
};

function TafsirContent() {
  const searchParams = useSearchParams();
  const verseKey = searchParams.get("verse") ?? "";

  const [verse, setVerse] = useState<VerseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!verseKey) { setLoading(false); return; }
    fetch(`/api/quran/verse?verseKey=${encodeURIComponent(verseKey)}`)
      .then((r) => r.json())
      .then((d) => setVerse(d.verse ?? null))
      .finally(() => setLoading(false));
  }, [verseKey]);

  const translation = verse?.translations?.[0]?.text ?? "";
  const tafsirHtml = verse?.tafsir ?? "";

  return (
    <>
      {loading && (
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", padding: "2rem" }}>
          <p style={{ color: "#888888", fontSize: "0.875rem", margin: 0 }}>Loading tafsir...</p>
        </div>
      )}

      {!loading && verse && (
        <>
          <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "#888888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            Tafsir — {verse.verse_key}
          </p>
          <div style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
            <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontFamily: "serif", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 2.4, textAlign: "right", color: "#e8e8e8", margin: 0 }}>
                {verse.text_uthmani}
              </p>
            </div>
            <div style={{ padding: "1.25rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: "1rem", lineHeight: 1.75, color: "#aaaaaa", margin: 0 }}>
                {translation}
              </p>
            </div>
            <div style={{ padding: "1.5rem 2rem" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888888", marginBottom: "1rem" }}>
                Tafsir
              </p>
              {tafsirHtml ? (
                <div
                  style={{ fontSize: "0.9rem", lineHeight: 1.9, color: "#aaaaaa" }}
                  className="tafsir-body"
                  dangerouslySetInnerHTML={{ __html: tafsirHtml }}
                />
              ) : (
                <p style={{ fontSize: "0.875rem", color: "#888888", margin: 0 }}>Tafsir not available for this verse.</p>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && !verse && (
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", padding: "2rem" }}>
          <p style={{ color: "#888888", fontSize: "0.875rem", margin: 0 }}>Could not load tafsir. <Link href="/" style={{ color: "#4d8c68" }}>Go back</Link></p>
        </div>
      )}
    </>
  );
}

export default function TafsirPage() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#111111", color: "#e8e8e8", padding: "2.5rem 1rem" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{ display: "inline-block", marginBottom: "1.5rem", fontSize: "0.875rem", fontWeight: 500, color: "#888888", textDecoration: "none" }}
        >
          ← Back
        </Link>
        <Suspense fallback={
          <div style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", padding: "2rem" }}>
            <p style={{ color: "#888888", fontSize: "0.875rem", margin: 0 }}>Loading...</p>
          </div>
        }>
          <TafsirContent />
        </Suspense>
      </div>

      <style>{`
        .tafsir-body p { margin-bottom: 0.75rem; }
        .tafsir-body h1, .tafsir-body h2, .tafsir-body h3 { color: #e8e8e8; font-weight: 600; margin: 1.25rem 0 0.5rem; }
        .tafsir-body h1 { font-size: 1.2rem; }
        .tafsir-body h2 { font-size: 1.05rem; }
        .tafsir-body h3 { font-size: 0.95rem; }
        .tafsir-body strong { color: #e8e8e8; font-weight: 600; }
        .tafsir-body ul, .tafsir-body ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .tafsir-body li { margin-bottom: 0.25rem; }
        .tafsir-body a { color: #4d8c68; text-underline-offset: 3px; }
      `}</style>
    </main>
  );
}
