import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "posts.json");

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

type Store = {
  posts: StoredPost[];
};

function readStore(): Store {
  try {
    if (!fs.existsSync(DATA_FILE)) return { posts: [] };
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return { posts: [] };
  }
}

function writeStore(store: Store): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function savePost(post: StoredPost): void {
  const store = readStore();
  const thirtySecondsAgo = Date.now() - 30_000;
  const isDuplicate = store.posts.some(
    (p) =>
      p.authorId === post.authorId &&
      p.roomId === post.roomId &&
      p.body === post.body &&
      new Date(p.createdAt).getTime() > thirtySecondsAgo
  );
  if (!isDuplicate) {
    store.posts.push(post);
    writeStore(store);
  }
}

export function getPostsByRoom(roomId: number, limit = 50): StoredPost[] {
  const store = readStore();
  return store.posts
    .filter((p) => p.roomId === roomId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
