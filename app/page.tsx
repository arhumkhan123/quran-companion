"use client";
import { useEffect, useState, Suspense } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { getDailyAyah } from "@/lib/quranApi";
import AyahCard from "./components/AyahCard";
import ReflectionInput from "./components/ReflectionInput";
import RoomFeed from "./components/RoomFeed";
import DuaBoard from "./components/DuaBoard";
import HabitsContent from "./components/HabitsContent";
import WeeklySummary from "./components/WeeklySummary";
import FollowUpCheckIn from "./components/FollowUpCheckIn";
import StreakBadge from "./components/StreakBadge";
import Link from "next/link";

type Tab = "today" | "circle" | "habits" | "me";

type Verse = {
  verse_key: string;
  text_uthmani: string;
  translations?: { text: string }[];
  tafsir?: string;
};

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "today",   icon: "☀️",  label: "Today"  },
  { id: "circle",  icon: "🌿",  label: "Circle" },
  { id: "habits",  icon: "✅",  label: "Habits" },
  { id: "me",      icon: "👤",  label: "Me"     },
];

function SideNavItem({
  tab, active, onClick,
}: { tab: (typeof TABS)[number]; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all group"
      style={{
        backgroundColor: active ? "rgba(255,255,255,0.06)" : "transparent",
        color: active ? "var(--color-text)" : "var(--color-muted)",
      }}
    >
      <span className="text-base leading-none w-5 text-center">{tab.icon}</span>
      <span
        className="text-sm tracking-wide"
        style={{ fontWeight: active ? 600 : 500 }}
      >
        {tab.label}
      </span>
    </button>
  );
}

function CirclePanel({
  session, roomId, inviteLink, copied,
  feedRefreshKey, createCircle, creatingRoom,
  showInviteLink, copyLink, switchCircle,
}: {
  session: ReturnType<typeof useSession>["data"];
  roomId: number | null;
  inviteLink: string;
  copied: boolean;
  feedRefreshKey: number;
  createCircle: () => void;
  creatingRoom: boolean;
  showInviteLink: () => void;
  copyLink: () => void;
  switchCircle: (input: string) => boolean;
}) {
  const [showSwitch, setShowSwitch] = useState(false);
  const [switchInput, setSwitchInput] = useState("");
  const [switchError, setSwitchError] = useState("");

  function handleSwitch() {
    const ok = switchCircle(switchInput.trim());
    if (!ok) {
      setSwitchError("Couldn't find a room ID in that link. Try pasting the full invite URL.");
    } else {
      setShowSwitch(false);
      setSwitchInput("");
      setSwitchError("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {session && (
        <div className="card p-4 shadow-sm">
          {!roomId ? (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-green-dark)" }}>
                  🌿 Start an Accountability Circle
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                  Invite friends to reflect together daily.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={createCircle}
                  disabled={creatingRoom}
                  className="self-start text-xs font-medium px-4 py-2 rounded-xl text-white disabled:opacity-40 transition-opacity"
                  style={{ backgroundColor: "var(--color-green-btn)" }}
                >
                  {creatingRoom ? "Creating..." : "Create Circle"}
                </button>
                <button
                  onClick={() => setShowSwitch((v) => !v)}
                  className="text-xs underline underline-offset-4 transition-opacity hover:opacity-70"
                  style={{ color: "var(--color-green-mid)" }}
                >
                  Have an invite link?
                </button>
              </div>
              {showSwitch && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={switchInput}
                    onChange={(e) => { setSwitchInput(e.target.value); setSwitchError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSwitch(); }}
                    placeholder="Paste invite link or room ID..."
                    className="text-xs rounded-lg px-3 py-2 focus:outline-none w-full"
                    style={{
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-cream)",
                      color: "var(--color-subtle)",
                    }}
                  />
                  {switchError && <p className="text-xs" style={{ color: "#ef4444" }}>{switchError}</p>}
                  <button
                    onClick={handleSwitch}
                    disabled={!switchInput.trim()}
                    className="self-start text-xs font-medium px-4 py-2 rounded-xl text-white disabled:opacity-40 transition-opacity"
                    style={{ backgroundColor: "var(--color-green-btn)" }}
                  >
                    Join Circle
                  </button>
                </div>
              )}
            </div>
          ) : inviteLink ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold" style={{ color: "var(--color-green-dark)" }}>
                🎉 Circle created!
              </p>
              <div className="flex items-center gap-2">
                <code
                  className="text-xs flex-1 p-2 rounded-lg truncate"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-subtle)" }}
                >
                  {inviteLink}
                </code>
                <button
                  onClick={copyLink}
                  className="text-xs font-medium px-3 py-2 rounded-lg text-white flex-shrink-0 transition-opacity"
                  style={{ backgroundColor: "var(--color-green-btn)" }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "var(--color-green-dark)" }}
                  />
                  <p className="text-sm font-medium" style={{ color: "var(--color-green-dark)" }}>
                    Your circle is active
                  </p>
                </div>
                <button
                  onClick={showInviteLink}
                  className="text-xs font-medium underline underline-offset-4 transition-opacity hover:opacity-70"
                  style={{ color: "var(--color-green-mid)" }}
                >
                  Invite members
                </button>
              </div>
                {!showSwitch ? (
                <button
                  onClick={() => setShowSwitch(true)}
                  className="self-start text-xs underline underline-offset-4 transition-opacity hover:opacity-70"
                  style={{ color: "var(--color-muted)" }}
                >
                  Wrong circle? Switch here
                </button>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  <input
                    type="text"
                    value={switchInput}
                    onChange={(e) => { setSwitchInput(e.target.value); setSwitchError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSwitch(); }}
                    placeholder="Paste invite link or room ID..."
                    className="text-xs rounded-lg px-3 py-2 focus:outline-none w-full"
                    style={{
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-cream)",
                      color: "var(--color-subtle)",
                    }}
                  />
                  {switchError && <p className="text-xs" style={{ color: "#ef4444" }}>{switchError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSwitch}
                      disabled={!switchInput.trim()}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-40 transition-opacity"
                      style={{ backgroundColor: "var(--color-green-btn)" }}
                    >
                      Switch
                    </button>
                    <button
                      onClick={() => { setShowSwitch(false); setSwitchInput(""); setSwitchError(""); }}
                      className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                      style={{ color: "var(--color-muted)", border: "1px solid var(--color-border)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!session && (
        <div className="card p-5">
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Sign in to join or create a circle.
          </p>
        </div>
      )}

      {roomId && (
        <>
          <RoomFeed roomId={roomId} refreshKey={feedRefreshKey} />
          <DuaBoard roomId={roomId} accessToken={session?.accessToken as string | undefined} />
        </>
      )}
    </div>
  );
}

function MainContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [mountedTabs, setMountedTabs] = useState<Set<Tab>>(new Set<Tab>(["today"]));
  const [verse, setVerse] = useState<Verse | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  useEffect(() => {
    getDailyAyah().then((data) => setVerse(data.verse));
  }, []);

  useEffect(() => {
    const urlRoom = searchParams.get("room");
    const saved = urlRoom ?? localStorage.getItem("myRoomId");
    if (saved) {
      const id = Number(saved);
      setRoomId(id);
      localStorage.setItem("myRoomId", String(id));
    }
  }, [searchParams]);

  useEffect(() => {
    const localRoom = localStorage.getItem("myRoomId");
    if (roomId || localRoom || !session?.accessToken) return;
    fetch("/api/reflect/rooms")
      .then((r) => r.json())
      .then((data) => {
        if (localStorage.getItem("myRoomId")) return;
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
      if (data.success && data.data?.id) {
        const id = data.data.id;
        setRoomId(id);
        localStorage.setItem("myRoomId", String(id));
        setInviteLink(`${window.location.origin}/join?room=${id}`);
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

  function switchCircle(input: string): boolean {
    let id: number | null = null;
    try {
      const url = new URL(input);
      const roomParam = url.searchParams.get("room");
      if (roomParam) id = Number(roomParam);
    } catch {
      const num = Number(input);
      if (!isNaN(num) && num > 0) id = num;
    }
    if (!id) return false;
    setRoomId(id);
    localStorage.setItem("myRoomId", String(id));
    try { localStorage.removeItem(`roomFeedCache_${roomId}`); } catch {}
    try { localStorage.removeItem(`duaBoardCache_${roomId}`); } catch {}
    setFeedRefreshKey((k) => k + 1);
    return true;
  }

  const translation = verse?.translations?.[0]?.text ?? "";

  const circleProps = {
    session,
    roomId,
    inviteLink,
    copied,
    feedRefreshKey,
    createCircle,
    creatingRoom,
    showInviteLink: () => setInviteLink(`${window.location.origin}/join?room=${roomId}`),
    copyLink,
    switchCircle,
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 border-b"
        style={{
          backgroundColor: "var(--color-cream-dark)",
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.05), 0 2px 16px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 lg:px-8"
          style={{ height: "56px", maxWidth: "1400px", margin: "0 auto", width: "100%" }}
        >
          <span
            className="font-display text-lg font-bold lg:hidden"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
          >
            Quran Companion
          </span>
          <div className="hidden lg:block" style={{ width: "220px" }} />

          <div className="flex items-center gap-3">
            <StreakBadge />
            {session ? (
              <button
                onClick={() => signOut()}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-opacity hover:opacity-70"
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--color-subtle)",
                }}
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={() => signIn("quran-foundation")}
                className="flex items-center gap-1.5 text-white text-xs font-semibold px-4 py-2 rounded-full transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--color-green-btn)" }}
              >
                <span>🌿</span>
                <span>Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="flex flex-1">

        {/* Desktop sidebar */}
        <aside
          className="hidden lg:flex flex-col fixed top-[56px] left-0 z-10 w-[220px] border-r"
          style={{
            height: "calc(100vh - 56px)",
            backgroundColor: "var(--color-cream-dark)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          {/* Sidebar header */}
          <div
            className="px-6 py-6 border-b"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <p
              className="font-display text-base font-bold"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
            >
              Quran Companion
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
              Daily reflection
            </p>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-1 p-3 mt-2 flex-1">
            {TABS.map((tab) => (
              <SideNavItem
                key={tab.id}
                tab={tab}
                active={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMountedTabs((prev) => new Set([...prev, tab.id]));
                }}
              />
            ))}
          </nav>

          {/* Sidebar footer */}
          <div
            className="px-4 py-4 border-t"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>
              Built with Quran Foundation APIs
            </p>
          </div>
        </aside>

        {/* ── Main content area ─────────────────────────────── */}
        <main className="flex-1 lg:ml-[220px] min-h-[calc(100vh-56px)]">
          <div
            className="px-5 lg:px-8 py-6 pb-28 lg:pb-10 mx-auto"
            style={{ maxWidth: "1180px" }}
          >

                <div className={activeTab === "today" ? "block" : "hidden"}>
              <div className="lg:grid gap-6" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }}>
                <div className="flex flex-col gap-5">
                  <FollowUpCheckIn />
                  <AyahCard verse={verse} />
                  {verse && session && (
                    <ReflectionInput
                      verseKey={verse.verse_key}
                      arabicText={verse.text_uthmani}
                      translation={translation}
                      accessToken={session?.accessToken as string | undefined}
                      roomId={roomId ?? undefined}
                      onPostSuccess={() => setFeedRefreshKey((k) => k + 1)}
                    />
                  )}
                  {!session && (
                    <div className="card p-5">
                      <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                        Sign in to share your reflection with your circle.
                      </p>
                    </div>
                  )}
                </div>

                <div className="hidden lg:block">
                  <CirclePanel {...circleProps} />
                </div>
              </div>
            </div>

            {mountedTabs.has("circle") && (
              <div className={activeTab === "circle" ? "block" : "hidden"}>
                <CirclePanel {...circleProps} />
              </div>
            )}

            {mountedTabs.has("habits") && (
              <div className={activeTab === "habits" ? "block" : "hidden"}>
                <HabitsContent />
              </div>
            )}

            {mountedTabs.has("me") && (
              <div className={activeTab === "me" ? "block" : "hidden"}>
              <div className="lg:max-w-xl flex flex-col gap-5">
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: "var(--color-green-btn)" }}
                    >
                      {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {session?.user?.name ?? session?.user?.email ?? "Guest"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                        {session ? "Member" : "Not signed in"}
                      </p>
                    </div>
                  </div>
                  <StreakBadge />
                </div>

                <WeeklySummary />

                <Link href="/history" className="block group">
                  <div className="card p-5 flex items-center justify-between transition-all group-hover:border-green-500/20">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: "rgba(82,183,136,0.1)" }}
                      >
                        📜
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-green-dark)" }}>
                          Reflection History
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                          All your past reflections
                        </p>
                      </div>
                    </div>
                    <span style={{ color: "var(--color-green-mid)" }}>→</span>
                  </div>
                </Link>

                <Link href="/habits" className="block group">
                  <div className="card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: "rgba(82,183,136,0.1)" }}
                      >
                        ✅
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-green-dark)" }}>
                          Daily Habits
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                          Track your daily ibadah
                        </p>
                      </div>
                    </div>
                    <span style={{ color: "var(--color-green-mid)" }}>→</span>
                  </div>
                </Link>
              </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 border-t"
        style={{
          backgroundColor: "var(--color-cream-dark)",
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow: "0 -1px 0 rgba(255,255,255,0.05), 0 -4px 16px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMountedTabs((prev) => new Set([...prev, tab.id]));
                }}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-all"
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span
                  className="text-xs font-medium leading-none"
                  style={{ color: isActive ? "var(--color-text)" : "var(--color-muted)" }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <div
                    className="w-4 h-0.5 rounded-full mt-0.5"
                    style={{ backgroundColor: "var(--color-text)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <MainContent />
    </Suspense>
  );
}
