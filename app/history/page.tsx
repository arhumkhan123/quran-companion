"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Reflection = {
  id: number;
  body: string;
  createdAt: string;
  references?: { chapterId: number; from: number }[];
};

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    fetch("/api/reflect/history")
      .then((res) => res.json())
      .then((data) => {
        setReflections(data.reflections ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-cream)" }}>
      <header
        className="border-b sticky top-0 z-10"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-cream)" }}
      >
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium"
            style={{ color: "var(--color-green-mid)" }}
          >
            ← Back
          </Link>
          <h1
            className="font-display text-lg font-bold"
            style={{ color: "var(--color-green-dark)", fontFamily: "var(--font-display)" }}
          >
            My Reflections
          </h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-4">
        {status === "unauthenticated" ? (
  <div className="rounded-2xl p-6" style={{ backgroundColor: "white", border: "1px solid var(--color-border)" }}>
    <p className="text-sm" style={{ color: "var(--color-muted)" }}>
      Sign in to see your reflection history.
    </p>
  </div>
) : loading ? (
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: "white", border: "1px solid var(--color-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              Loading your reflections...
            </p>
          </div>
        ) : reflections.length === 0 ? (
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: "white", border: "1px solid var(--color-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              No reflections yet. Start writing today!
            </p>
            <Link
              href="/"
              className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
              style={{ color: "var(--color-green-mid)" }}
            >
              Go to today&apos;s ayah →
            </Link>
          </div>
        ) : (
          reflections.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl p-5"
              style={{ backgroundColor: "white", border: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--color-green-dark)" }}
                >
                  {r.references?.[0]
                    ? `${r.references[0].chapterId}:${r.references[0].from}`
                    : "Reflection"}
                </span>
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {new Date(r.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-subtle)" }}>
                {r.body}
              </p>
            </div>
          ))
        )}
      </main>
    </div>
  );
}