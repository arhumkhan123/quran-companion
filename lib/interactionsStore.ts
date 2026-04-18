// In-memory store — Vercel's ephemeral filesystem makes disk writes unreliable
// and writing to data/ in dev triggers Next.js HMR restarts.

export type Reply = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

type Store = {
  reactions: Record<string, Record<string, string[]>>; // postId -> emoji -> userIds
  replies: Record<string, Reply[]>; // postId -> replies
};

const _store: Store = { reactions: {}, replies: {} };

export function getInteractions(postIds: string[]) {
  const result: Record<string, { reactions: Record<string, string[]>; replies: Reply[] }> = {};
  for (const id of postIds) {
    result[id] = {
      reactions: _store.reactions[id] ?? {},
      replies: _store.replies[id] ?? [],
    };
  }
  return result;
}

export function toggleReaction(postId: string, emoji: string, userId: string) {
  if (!_store.reactions[postId]) _store.reactions[postId] = {};
  if (!_store.reactions[postId][emoji]) _store.reactions[postId][emoji] = [];
  const users = _store.reactions[postId][emoji];
  const idx = users.indexOf(userId);
  if (idx === -1) users.push(userId);
  else users.splice(idx, 1);
  return _store.reactions[postId];
}

export function addReply(postId: string, body: string, authorId: string, authorName: string): Reply {
  if (!_store.replies[postId]) _store.replies[postId] = [];
  const reply: Reply = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    body,
    authorId,
    authorName,
    createdAt: new Date().toISOString(),
  };
  _store.replies[postId].push(reply);
  return reply;
}
