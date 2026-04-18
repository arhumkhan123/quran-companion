"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

function JoinPageInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get("room");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    if (!session) {
      signIn("quran-foundation");
      return;
    }
    setJoining(true);
    try {
      const res = await fetch("/api/reflect/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      const data = await res.json();
      const alreadyMember =
        data.success === false &&
        (data.message ?? data.type ?? "").toLowerCase().includes("member");
      if (data.success === false && !alreadyMember) {
        setError(data.message ?? "Failed to join");
      } else {
        localStorage.setItem("myRoomId", String(roomId));
        setJoined(true);
        setTimeout(() => router.push(`/?room=${roomId}`), 2000);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setJoining(false);
    }
  }

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="card p-8 max-w-sm w-full text-center">
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>Invalid invite link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-cream)" }}>
      <div className="card p-8 max-w-sm w-full text-center flex flex-col gap-4">
        <div className="text-3xl">🌿</div>
        <h1 className="font-display text-xl font-bold" style={{ color: "var(--color-green-dark)", fontFamily: "var(--font-display)" }}>
          Join the Circle
        </h1>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          You&apos;ve been invited to reflect on the Quran daily and hold each other accountable.
        </p>
        {joined ? (
          <p className="text-sm font-medium" style={{ color: "var(--color-green-dark)" }}>
            ✅ Joined! Redirecting...
          </p>
        ) : (
          <>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="text-white text-sm font-medium px-5 py-3 rounded-xl transition disabled:opacity-40"
              style={{ backgroundColor: "var(--color-green-btn)" }}
            >
              {joining ? "Joining..." : status === "unauthenticated" ? "Sign in to Join" : "Join Circle"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-cream)" }}>Loading...</div>}>
      <JoinPageInner />
    </Suspense>
  );
}