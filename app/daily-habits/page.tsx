"use client";
import Link from "next/link";
import HabitsContent from "../components/HabitsContent";

export default function HabitsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-cream)" }}>
      <header
        className="border-b sticky top-0 z-10"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-cream)" }}
      >
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium" style={{ color: "var(--color-green-mid)" }}>
            ← Back
          </Link>
          <h1
            className="font-display text-lg font-bold"
            style={{ color: "var(--color-green-dark)", fontFamily: "var(--font-display)" }}
          >
            Daily Habits
          </h1>
          <div className="w-12" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <HabitsContent />
      </main>
    </div>
  );
}
