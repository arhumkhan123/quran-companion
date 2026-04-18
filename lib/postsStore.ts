// In-memory store for optimistic/same-session posts.
// We do NOT write to disk — Vercel's filesystem is ephemeral and
// shared nothing between serverless function invocations.
// The Quran Foundation API is the durable source of truth for posts.

export type StoredPost = {
  id: number;
  roomId: number;
  body: string;
  author: {
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  authorId: string;
  createdAt: string;
};

const _posts: StoredPost[] = [];

export function savePost(post: StoredPost): void {
  const thirtySecondsAgo = Date.now() - 30_000;
  const isDuplicate = _posts.some(
    (p) =>
      p.authorId === post.authorId &&
      p.roomId === post.roomId &&
      p.body === post.body &&
      new Date(p.createdAt).getTime() > thirtySecondsAgo
  );
  if (!isDuplicate) {
    _posts.push(post);
  }
}

export function getPostsByRoom(roomId: number, limit = 50): StoredPost[] {
  return _posts
    .filter((p) => p.roomId === roomId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
