"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { Reply } from "@/lib/interactionsStore";

const EMOJI_OPTIONS = ["❤️", "🤲", "✨", "🫂"];

type Post = {
  id: number;
  body: string;
  author: {
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  createdAt: string;
};

type PostInteractions = {
  reactions: Record<string, string[]>;
  replies: Reply[];
};

type Props = {
  roomId: number;
  refreshKey?: number;
};

const CACHE_TTL = 60 * 1000;

function cacheKey(roomId: number) {
  return `roomFeedCache_${roomId}`;
}

function getCached(roomId: number): Post[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(roomId));
    if (!raw) return null;
    const { posts, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return posts;
  } catch {
    return null;
  }
}

function setCache(roomId: number, posts: Post[]) {
  try {
    localStorage.setItem(cacheKey(roomId), JSON.stringify({ posts, timestamp: Date.now() }));
  } catch {}
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // roll back to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isThisWeek(dateStr: string): boolean {
  return new Date(dateStr) >= getWeekStart();
}

export default function RoomFeed({ roomId, refreshKey = 0 }: Props) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [interactions, setInteractions] = useState<Record<string, PostInteractions>>({});
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!session?.accessToken) {
      setLoading(false);
      setFetching(false);
      return;
    }

    const cached = getCached(roomId);
    if (cached && cached.length > 0) {
      setPosts(cached);
      setLoading(false);
    }

    fetch(`/api/reflect/room?roomId=${roomId}`)
      .then((res) => res.json())
      .then((data) => {
        const newPosts: Post[] = data.posts ?? [];
        const apiBodies = new Set(newPosts.map((p) => p.body));
        const localOptimistic = (cached ?? []).filter(
          (p) => p.id > 1_700_000_000_000 && !apiBodies.has(p.body)
        );
        const merged = [...localOptimistic, ...newPosts];

        if (merged.length > 0) {
          setPosts(merged);
          setCache(roomId, merged);
        } else if (!cached || cached.length === 0) {
          setPosts([]);
        }
        setLoading(false);
        setFetching(false);
      })
      .catch(() => {
        setLoading(false);
        setFetching(false);
      });
  }, [session, roomId, refreshKey]);

  useEffect(() => {
    if (posts.length === 0) return;
    const postIds = posts.map((p) => String(p.id)).join(",");
    fetch(`/api/reflect/interactions?postIds=${postIds}`)
      .then((r) => r.json())
      .then((data) => setInteractions(data))
      .catch(() => {});
  }, [posts]);

  const weekPosts = posts
    .filter((p) => !p.body.startsWith("🤲 Du'a Request: "))
    .filter((p) => isThisWeek(p.createdAt));
  const userId = session?.user?.email ?? "";

  function toggleExpanded(postId: string) {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  async function handleReaction(postId: string, emoji: string) {
    if (!userId) return;
    setInteractions((prev) => {
      const current = prev[postId] ?? { reactions: {}, replies: [] };
      const users = current.reactions[emoji] ?? [];
      const newUsers = users.includes(userId)
        ? users.filter((u) => u !== userId)
        : [...users, userId];
      return {
        ...prev,
        [postId]: { ...current, reactions: { ...current.reactions, [emoji]: newUsers } },
      };
    });

    const res = await fetch("/api/reflect/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, emoji }),
    });
    const data = await res.json();
    if (data.reactions) {
      setInteractions((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] ?? { reactions: {}, replies: [] }), reactions: data.reactions },
      }));
    }
  }

  async function handleReply(postId: string) {
    const body = replyInputs[postId]?.trim();
    if (!body || body.length < 2) return;
    setSubmittingReply((prev) => ({ ...prev, [postId]: true }));

    const res = await fetch("/api/reflect/replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, body }),
    });
    const data = await res.json();
    if (data.reply) {
      setInteractions((prev) => {
        const current = prev[postId] ?? { reactions: {}, replies: [] };
        return { ...prev, [postId]: { ...current, replies: [...current.replies, data.reply] } };
      });
      setReplyInputs((prev) => ({ ...prev, [postId]: "" }));
    }
    setSubmittingReply((prev) => ({ ...prev, [postId]: false }));
  }

  if (!session) {
    return (
      <div className="card p-6">
        <p className="text-sm text-muted">Sign in to see your circle&apos;s reflections.</p>
      </div>
    );
  }

  const skeletons = (
    <div className="flex flex-col gap-3">
      {[1, 2].map((n) => (
        <div key={n} className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-border)" }} />
            <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: "var(--color-border)" }} />
          </div>
          <div className="h-3 w-full rounded animate-pulse mb-2" style={{ backgroundColor: "var(--color-border)" }} />
          <div className="h-3 w-2/3 rounded animate-pulse" style={{ backgroundColor: "var(--color-border)" }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-muted">This Week&apos;s Reflections</div>
        {!fetching && posts.length > weekPosts.length && (
          <span className="text-xs text-muted">{posts.length - weekPosts.length} older hidden</span>
        )}
      </div>

      {loading && posts.length === 0 ? (
        skeletons
      ) : weekPosts.length === 0 && fetching ? (
        skeletons
      ) : weekPosts.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm text-muted">No reflections this week yet. Be the first to share.</p>
        </div>
      ) : (
        weekPosts.map((post) => {
          const postId = String(post.id);
          const displayName = post.author?.firstName
            ? `${post.author.firstName} ${post.author.lastName ?? ""}`.trim()
            : post.author?.username ?? "Anonymous";
          const initial = displayName[0]?.toUpperCase() ?? "?";
          const pi = interactions[postId] ?? { reactions: {}, replies: [] };
          const isExpanded = expandedPosts.has(postId);
          const replyCount = pi.replies.length;

          return (
            <div key={post.id} className="card shadow-sm overflow-hidden">
              {/* Header + body */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#2a2a2a", border: "1px solid rgba(255,255,255,0.12)" }}>
                      {initial}
                    </div>
                    <span className="text-sm font-medium text-main">{displayName}</span>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-subtle">{post.body}</p>
              </div>

              {/* Emoji reactions */}
              <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
                {EMOJI_OPTIONS.map((emoji) => {
                  const users = pi.reactions[emoji] ?? [];
                  const reacted = users.includes(userId);
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(postId, emoji)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all"
                      style={{
                        backgroundColor: reacted ? "var(--color-sand)" : "transparent",
                        border: `1px solid ${reacted ? "var(--color-green-mid)" : "var(--color-border)"}`,
                        color: reacted ? "var(--color-green-dark)" : "var(--color-muted)",
                      }}
                    >
                      <span>{emoji}</span>
                      {users.length > 0 && <span className="font-medium">{users.length}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Reply section */}
              <div className="px-5 pb-4 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                <button
                  onClick={() => toggleExpanded(postId)}
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: "var(--color-green-mid)" }}
                >
                  <span>💬</span>
                  <span>
                    {replyCount > 0
                      ? `${replyCount} repl${replyCount === 1 ? "y" : "ies"}`
                      : "Reply"}
                  </span>
                  <span style={{ fontSize: "0.55rem", opacity: 0.7 }}>{isExpanded ? "▲" : "▼"}</span>
                </button>

                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-3">
                    {pi.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold mt-0.5"
                          style={{ backgroundColor: "#2a2a2a", border: "1px solid rgba(255,255,255,0.12)", fontSize: "0.6rem" }}
                        >
                          {reply.authorName[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-main">{reply.authorName}</span>
                            <span className="text-xs text-muted">
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-subtle mt-0.5">{reply.body}</p>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={replyInputs[postId] ?? ""}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({ ...prev, [postId]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleReply(postId);
                        }}
                        placeholder="Write a reply..."
                        className="flex-1 text-xs rounded-lg px-3 py-2 focus:outline-none"
                        style={{
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-cream)",
                          color: "var(--color-subtle)",
                        }}
                      />
                      <button
                        onClick={() => handleReply(postId)}
                        disabled={submittingReply[postId] || !replyInputs[postId]?.trim()}
                        className="text-xs font-medium px-3 py-2 rounded-lg text-white disabled:opacity-40 transition-opacity"
                        style={{ backgroundColor: "var(--color-green-btn)" }}
                      >
                        {submittingReply[postId] ? "..." : "Send"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
