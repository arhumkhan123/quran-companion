import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "interactions.json");

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

function readStore(): Store {
  try {
    if (!fs.existsSync(DATA_FILE)) return { reactions: {}, replies: {} };
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return { reactions: {}, replies: {} };
  }
}

function writeStore(store: Store): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store), "utf-8");
}

export function getInteractions(postIds: string[]) {
  const store = readStore();
  const result: Record<string, { reactions: Record<string, string[]>; replies: Reply[] }> = {};
  for (const id of postIds) {
    result[id] = {
      reactions: store.reactions[id] ?? {},
      replies: store.replies[id] ?? [],
    };
  }
  return result;
}

export function toggleReaction(postId: string, emoji: string, userId: string) {
  const store = readStore();
  if (!store.reactions[postId]) store.reactions[postId] = {};
  if (!store.reactions[postId][emoji]) store.reactions[postId][emoji] = [];
  const users = store.reactions[postId][emoji];
  const idx = users.indexOf(userId);
  if (idx === -1) users.push(userId);
  else users.splice(idx, 1);
  writeStore(store);
  return store.reactions[postId];
}

export function addReply(postId: string, body: string, authorId: string, authorName: string): Reply {
  const store = readStore();
  if (!store.replies[postId]) store.replies[postId] = [];
  const reply: Reply = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    body,
    authorId,
    authorName,
    createdAt: new Date().toISOString(),
  };
  store.replies[postId].push(reply);
  writeStore(store);
  return reply;
}
