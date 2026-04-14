import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { savePost } from "@/lib/postsStore";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const { reflection, verseKey, roomId } = await request.json();
  console.log("posting with roomId:", roomId);

  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [chapterId, verseNumber] = verseKey.split(":").map(Number);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  if (roomId) {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const rawName = session.user?.name ?? "";
    const displayName = UUID_RE.test(rawName)
      ? (session.user?.email?.split("@")[0] ?? rawName)
      : rawName;
    const nameParts = displayName.split(" ");
    savePost({
      id: Date.now(),
      roomId: Number(roomId),
      body: reflection,
      author: {
        firstName: nameParts[0] || undefined,
        lastName: nameParts.slice(1).join(" ") || undefined,
      },
      authorId: session.user?.email ?? "unknown",
      createdAt: new Date().toISOString(),
    });
  }

  try {
    const res = await fetch(
      "https://apis-prelive.quran.foundation/quran-reflect/v1/posts",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-auth-token": session.accessToken as string,
          "x-client-id": process.env.QURAN_CLIENT_ID!,
        },
        body: JSON.stringify({
          post: {
            body: reflection,
            draft: false,
            references: [{ chapterId, from: verseNumber, to: verseNumber }],
            ...(roomId ? { roomId, roomPostStatus: 2 } : {}),
          },
        }),
      }
    );
    clearTimeout(timeout);
    const data = await res.json();
    return Response.json(data);
  } catch {
    clearTimeout(timeout);
    return Response.json({ success: true, timedOut: true });
  }
}