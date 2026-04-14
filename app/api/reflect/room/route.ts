import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getPostsByRoom } from "@/lib/postsStore";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const roomIdParam = searchParams.get("roomId");

  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (roomIdParam) {
    const posts = getPostsByRoom(Number(roomIdParam));
    return Response.json({ posts });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(
      `https://apis-prelive.quran.foundation/quran-reflect/v1/posts/my-posts?tab=my_reflections&limit=20`,
      {
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "x-auth-token": session.accessToken as string,
          "x-client-id": process.env.QURAN_CLIENT_ID!,
        },
      }
    );
    clearTimeout(timeout);
    const data = await res.json();
    return Response.json({ posts: data.data ?? [] });
  } catch {
    clearTimeout(timeout);
    return Response.json({ posts: [] });
  }
}
