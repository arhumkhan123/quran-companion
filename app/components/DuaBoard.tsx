"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const DUA_PREFIX = "🤲 Du'a Request: ";
const MAX_CHARS = 200;
const CACHE_TTL = 24 * 60 * 60 * 1000;

type DuaPost = {
  id: number;
  body: string;
  author: { firstName?: string; lastName?: string; username?: string };
  createdAt: string;
  duaText: string;
};

type Props = {
  roomId: number;
  accessToken?: string;
};


function cacheKey(roomId: number) {
  return `duaBoardCache_${roomId}`;
}

function readCache(roomId: number): DuaPost[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(roomId));
    if (!raw) return null;
    const { posts, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return posts as DuaPost[];
  } catch {
    return null;
  }
}

function writeCache(roomId: number, posts: DuaPost[]) {
  try {
    localStorage.setItem(
      cacheKey(roomId),
      JSON.stringify({ posts, timestamp: Date.now() })
    );
  } catch {}
}

function getLocalSupport(postId: number): boolean {
  try {
    return localStorage.getItem(`duaSupport_${postId}`) === "true";
  } catch {
    return false;
  }
}

function setLocalSupport(postId: number, value: boolean) {
  try {
    if (value) localStorage.setItem(`duaSupport_${postId}`, "true");
    else localStorage.removeItem(`duaSupport_${postId}`);
  } catch {}
}

function buildSupportMap(posts: DuaPost[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const p of posts) map[String(p.id)] = getLocalSupport(p.id);
  return map;
}


export default function DuaBoard({ roomId, accessToken }: Props) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<DuaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [supported, setSupported] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    const cached = readCache(roomId);
    if (cached && cached.length > 0) {
      setPosts(cached);
      setSupported(buildSupportMap(cached));
      setLoading(false);
    }

    fetch(`/api/reflect/room?roomId=${roomId}`)
      .then((r) => r.json())
      .then((data) => {
        const allPosts: Array<{
          id: number;
          body: string;
          author: { firstName?: string; lastName?: string; username?: string };
          createdAt: string;
        }> = data.posts ?? [];

        const fresh = allPosts
          .filter((p) => p.body.startsWith(DUA_PREFIX))
          .map((p) => ({ ...p, duaText: p.body.slice(DUA_PREFIX.length) }));

        const apiTexts = new Set(fresh.map((p) => p.duaText));
        const localOnly = (cached ?? []).filter(
          (p) => p.id > 1_700_000_000_000 && !apiTexts.has(p.duaText)
        );

        const merged = [...localOnly, ...fresh];
        setPosts(merged);
        setSupported(buildSupportMap(merged));
        writeCache(roomId, merged);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, roomId]);

  useEffect(() => {
    if (posts.length === 0) return;
    const postIds = posts.map((p) => String(p.id)).join(",");
    fetch(`/api/reflect/interactions?postIds=${postIds}`)
      .then((r) => r.json())
      .then((data) => {
        const newCounts: Record<string, number> = {};
        for (const p of posts) {
          const pid = String(p.id);
          newCounts[pid] = (data[pid]?.reactions?.["🤲"] ?? []).length;
        }
        setCounts(newCounts);
      })
      .catch(() => {});
  }, [posts]);

  async function handlePost() {
    if (!input.trim() || !accessToken) return;
    setSubmitting(true);

    const duaText = input.trim();
    const body = `${DUA_PREFIX}${duaText}`;

    const tempPost: DuaPost = {
      id: Date.now(),
      body,
      author: {
        firstName: session?.user?.name?.split(" ")[0] ?? "You",
        lastName: session?.user?.name?.split(" ").slice(1).join(" ") ?? "",
      },
      createdAt: new Date().toISOString(),
      duaText,
    };

    setPosts((prev) => {
      const updated = [tempPost, ...prev];
      writeCache(roomId, updated);
      return updated;
    });
    setInput("");
    setSubmitting(false);

    fetch("/api/reflect/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reflection: body, verseKey: "1:1", roomId }),
    }).catch(() => {});
  }

  async function handleSupport(postId: string) {
    const isSupported = supported[postId] ?? false;
    const newValue = !isSupported;

    setSupported((prev) => ({ ...prev, [postId]: newValue }));
    setLocalSupport(Number(postId), newValue);

    const res = await fetch("/api/reflect/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, emoji: "🤲" }),
    });
    const data = await res.json();
    if (data.reactions) {
      setCounts((prev) => ({
        ...prev,
        [postId]: (data.reactions["🤲"] ?? []).length,
      }));
    }
  }

  if (!session) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-semibold text-muted">Du&apos;a Board</div>

      {/* Input card */}
      <div className="card overflow-hidden shadow-sm">
        <div
          className="px-6 py-3 border-b"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-sand)",
          }}
        >
          <h2
            className="font-display text-base font-bold"
            style={{ color: "var(--color-green-dark)" }}
          >
            Request Du&apos;a from Your Circle
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            Share what you need du&apos;a for — your circle will lift you up.
          </p>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Ask for du'a..."
            rows={3}
            className="w-full rounded-xl p-4 text-sm resize-none focus:outline-none"
            style={{
              backgroundColor: "var(--color-cream)",
              border: "1px solid var(--color-border)",
              color: "var(--color-subtle)",
            }}
          />
          <div className="flex items-center justify-between">
            <span
              className="text-xs"
              style={{
                color: input.length >= MAX_CHARS
                  ? "var(--color-green-mid)"
                  : "var(--color-muted)",
              }}
            >
              {input.length}/{MAX_CHARS}
            </span>
            <button
              onClick={handlePost}
              disabled={submitting || !input.trim() || !accessToken}
              className="text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-40"
              style={{ backgroundColor: "var(--color-green-btn)" }}
            >
              {submitting ? "Posting..." : "Post Du'a Request 🤲"}
            </button>
          </div>
        </div>
      </div>

      {/* Post list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((n) => (
            <div key={n} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--color-border)" }}
                />
                <div
                  className="h-3 w-24 rounded animate-pulse"
                  style={{ backgroundColor: "var(--color-border)" }}
                />
              </div>
              <div
                className="h-3 w-full rounded animate-pulse mb-2"
                style={{ backgroundColor: "var(--color-border)" }}
              />
              <div
                className="h-3 w-2/3 rounded animate-pulse"
                style={{ backgroundColor: "var(--color-border)" }}
              />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            No du&apos;a requests yet. Be the first to ask.
          </p>
        </div>
      ) : (
        posts.map((post) => {
          const postId = String(post.id);
          const displayName = post.author?.firstName
            ? `${post.author.firstName} ${post.author.lastName ?? ""}`.trim()
            : post.author?.username ?? "Anonymous";
          const initial = displayName[0]?.toUpperCase() ?? "?";
          const isSupported = supported[postId] ?? false;
          const count = counts[postId] ?? 0;

          return (
            <div key={post.id} className="card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5"
                  style={{ backgroundColor: "var(--color-green-btn)" }}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-main">{displayName}</span>
                    <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-subtle)" }}>
                    {post.duaText}
                  </p>
                </div>

                <button
                  onClick={() => handleSupport(postId)}
                  className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all"
                  style={{
                    backgroundColor: isSupported ? "var(--color-sand)" : "transparent",
                    border: `1px solid ${isSupported ? "var(--color-green-mid)" : "var(--color-border)"}`,
                  }}
                >
                  <span className="text-base leading-none">🤲</span>
                  {count > 0 && (
                    <span
                      className="text-xs font-medium leading-none"
                      style={{
                        color: isSupported ? "var(--color-green-dark)" : "var(--color-muted)",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
