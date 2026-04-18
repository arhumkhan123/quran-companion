"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

type Reflection = {
  id: number | string;
  body: string;
  createdAt: string;
  verse?: { verse_key?: string };
};

function ReflectionsContent() {
  useSearchParams();
  const { data: session, status } = useSession();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenExpired, setTokenExpired] = useState(false);
  const accessToken = session?.accessToken as string | undefined;

  const fetchReflections = (token: string) =>
    fetch("/api/reflect/history", { headers: { "x-auth-token": token } })
      .then((r) => r.json())
      .then((data) => {
        if (data.error === "token_expired") {
          setTokenExpired(true);
          setReflections([]);
          return [];
        }
        const list: Reflection[] = data.reflections ?? [];
        setReflections(list);
        return list;
      })
      .catch(() => { setReflections([]); return []; });

  useEffect(() => {
    if (status === "loading") return;

    if (!accessToken) {
      // Not signed in — show localStorage fallback
      try {
        type Local = { date: string; verseKey: string; reflection: string };
        const raw: Local[] = JSON.parse(localStorage.getItem("dailyActions") || "[]");
        setReflections(
          [...raw].reverse().map((a, i) => ({
            id: i,
            body: a.reflection,
            createdAt: a.date,
            verse: { verse_key: a.verseKey },
          }))
        );
      } catch {
        setReflections([]);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchReflections(accessToken).then((list) => {
      setLoading(false);
      // QF API can have a short propagation delay after posting — retry once if empty
      if (list.length === 0) {
        setTimeout(() => fetchReflections(accessToken), 3000);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, status]);

  return (
    <>
      <Link
        href="/"
        style={{
          display: "inline-block",
          marginBottom: "1.5rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "#888888",
          textDecoration: "none",
        }}
      >
        ← Back
      </Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "#888888", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
          Reflection History
        </p>
        {accessToken && !loading && (
          <button
            onClick={() => { setLoading(true); fetchReflections(accessToken).then(() => setLoading(false)); }}
            style={{ fontSize: "0.7rem", color: "#4d8c68", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Refresh
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", padding: "1.5rem 2rem" }}>
          <p style={{ color: "#888888", fontSize: "0.875rem", margin: 0 }}>Loading your reflections...</p>
        </div>
      ) : tokenExpired ? (
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", padding: "1.5rem 2rem" }}>
          <p style={{ color: "#888888", fontSize: "0.875rem", margin: 0 }}>Your session has expired. Please sign out and sign back in to view your reflections.</p>
        </div>
      ) : reflections.length === 0 ? (
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", padding: "1.5rem 2rem" }}>
          <p style={{ color: "#888888", fontSize: "0.875rem", margin: 0 }}>No reflections yet. Start reflecting on today&apos;s ayah!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {reflections.map((r) => (
            <div key={r.id} style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", padding: "1.25rem 1.5rem" }}>
              {r.verse?.verse_key && (
                <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4d8c68", margin: "0 0 0.5rem 0" }}>
                  {r.verse.verse_key}
                </p>
              )}
              <p style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "#aaaaaa", margin: 0 }}>
                {r.body}
              </p>
              <p style={{ fontSize: "0.7rem", color: "#555555", marginTop: "0.75rem", marginBottom: 0 }}>
                {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function ReflectionsPage() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#111111", color: "#e8e8e8", padding: "2.5rem 1rem" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <Suspense fallback={<p style={{ color: "#888888", fontSize: "0.875rem" }}>Loading...</p>}>
          <ReflectionsContent />
        </Suspense>
      </div>
    </main>
  );
}
