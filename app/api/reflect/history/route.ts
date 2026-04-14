import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ reflections: [] });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 70000);

    const res = await fetch(
      "https://apis-prelive.quran.foundation/quran-reflect/v1/posts/my-posts?tab=my_reflections",
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
    console.log("history status:", res.status, JSON.stringify(data).slice(0, 200));
    return Response.json({ reflections: data.data ?? [] });
  } catch (err) {
    console.log("history error:", err);
    return Response.json({ reflections: [] });
  }
}