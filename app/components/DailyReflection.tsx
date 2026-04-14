"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDailyAyah } from "@/lib/quranApi";
import AyahCard from "./AyahCard";
import ReflectionInput from "./ReflectionInput";
import { useSession } from "next-auth/react";
import RoomFeed from "./RoomFeed";
import DuaBoard from "./DuaBoard";
import FollowUpCheckIn from "./FollowUpCheckIn";
import WeeklySummary from "./WeeklySummary";

type Verse = {
  verse_key: string;
  text_uthmani: string;
  translations?: { text: string }[];
  tafsir?: string;
};

export default function DailyReflection() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  useEffect(() => {
    getDailyAyah().then((data) => {
      setVerse(data.verse);
    });

    // Priority: URL param > localStorage
    const urlRoom = searchParams.get("room");
    const saved = urlRoom ?? localStorage.getItem("myRoomId");
    if (saved) {
      const id = Number(saved);
      setRoomId(id);
      localStorage.setItem("myRoomId", String(id));
    }
  }, [searchParams]);

  // If no roomId in localStorage but user is signed in, fetch their rooms from the API
  useEffect(() => {
    if (roomId || !session?.accessToken) return;
    fetch("/api/reflect/rooms")
      .then((r) => r.json())
      .then((data) => {
        const rooms = data?.data ?? data?.rooms ?? [];
        if (Array.isArray(rooms) && rooms.length > 0) {
          const id = rooms[0].id;
          setRoomId(id);
          localStorage.setItem("myRoomId", String(id));
        }
      })
      .catch(() => {});
  }, [session, roomId]);

  async function createCircle() {
    setCreatingRoom(true);
    try {
      const res = await fetch("/api/reflect/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${session?.user?.name?.split(" ")[0]}'s Circle` }),
      });
      const data = await res.json();
      console.log("create circle response:", JSON.stringify(data));
      if (data.success && data.data?.id) {
        const id = data.data.id;
        setRoomId(id);
        localStorage.setItem("myRoomId", String(id));
        const link = `${window.location.origin}/join?room=${id}`;
        setInviteLink(link);
      }
    } finally {
      setCreatingRoom(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <FollowUpCheckIn />
      <WeeklySummary />
      <AyahCard verse={verse} />
      {verse && (
        <ReflectionInput
          verseKey={verse.verse_key}
          arabicText={verse.text_uthmani}
          translation={verse.translations?.[0]?.text ?? ""}
          accessToken={session?.accessToken}
          roomId={roomId ?? undefined}
          onPostSuccess={() => setFeedRefreshKey((k) => k + 1)}
        />
      )}

      {session && (
        <div className="flex flex-col gap-4">
          {!roomId ? (
            <div className="card p-5 flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-green-dark)" }}>
                  🌿 Start an Accountability Circle
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                  Invite friends to reflect together and hold each other accountable.
                </p>
              </div>
              <button
                onClick={createCircle}
                disabled={creatingRoom}
                className="self-start text-xs font-medium px-4 py-2 rounded-xl text-white disabled:opacity-40"
                style={{ backgroundColor: "var(--color-green-dark)" }}
              >
                {creatingRoom ? "Creating..." : "Create Circle"}
              </button>
            </div>
          ) : inviteLink ? (
            <div className="card p-5 flex flex-col gap-3">
              <p className="text-sm font-semibold" style={{ color: "var(--color-green-dark)" }}>
                🎉 Circle created! Share this link:
              </p>
              <div className="flex items-center gap-2">
                <code
                  className="text-xs flex-1 p-2 rounded-lg truncate"
                  style={{ backgroundColor: "var(--color-sand)", color: "var(--color-subtle)" }}
                >
                  {inviteLink}
                </code>
                <button
                  onClick={copyLink}
                  className="text-xs font-medium px-3 py-2 rounded-lg text-white flex-shrink-0"
                  style={{ backgroundColor: "var(--color-green-dark)" }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-4 flex items-center justify-between">
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                🌿 Your circle is active
              </p>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/join?room=${roomId}`;
                  setInviteLink(link);
                }}
                className="text-xs font-medium underline underline-offset-4"
                style={{ color: "var(--color-green-mid)" }}
              >
                Show invite link
              </button>
            </div>
          )}
          {roomId && <RoomFeed roomId={roomId} refreshKey={feedRefreshKey} />}
          {roomId && <DuaBoard roomId={roomId} accessToken={session?.accessToken as string | undefined} />}
        </div>
      )}
    </div>
  );
}