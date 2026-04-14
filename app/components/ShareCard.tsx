"use client";
import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";

type Props = {
  verseKey: string;
  arabicText: string;
  translation: string;
  reflection: string;
};

export default function ShareCard({ verseKey, arabicText, translation, reflection }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  async function downloadCard() {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `quran-companion-${verseKey}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image:", err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* The card that gets captured */}
      <div
        ref={cardRef}
        style={{
          width: "600px",
          background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)",
          padding: "48px",
          borderRadius: "24px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#B7E4C7", fontSize: "13px", letterSpacing: "3px", textTransform: "uppercase" }}>
            Quran Companion
          </div>
          <div style={{ color: "#C9A84C", fontSize: "13px", fontWeight: "600" }}>
            {verseKey}
          </div>
        </div>

        {/* Arabic */}
        <div style={{
          color: "white",
          fontSize: "32px",
          textAlign: "right",
          lineHeight: "2",
          marginBottom: "24px",
          fontFamily: "Amiri, Georgia, serif",
        }}>
          {arabicText}
        </div>

        {/* Divider */}
        <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.2)", marginBottom: "24px" }} />

        {/* Translation */}
        <div style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: "15px",
          lineHeight: "1.7",
          marginBottom: "32px",
          fontStyle: "italic",
        }}>
          {translation}
        </div>

        {/* Reflection */}
        <div style={{
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: "16px",
          padding: "24px",
          borderLeft: "3px solid #C9A84C",
        }}>
          <div style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
            My Reflection
          </div>
          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", lineHeight: "1.8" }}>
            {reflection}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "32px", color: "rgba(255,255,255,0.4)", fontSize: "11px", textAlign: "center" }}>
          qurancompanion.app
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={downloadCard}
        disabled={generating}
        className="self-start flex items-center gap-2 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-40 bg-green-dark"
      >
        <span>{generating ? "⏳" : "📤"}</span>
        <span>{generating ? "Generating..." : "Download Share Card"}</span>
      </button>
    </div>
  );
}