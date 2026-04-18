import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const _cache = new Map<string, { streak: number; expiresAt: number }>();
const TTL = 5 * 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ streak: 0 });
  }

  const key = session.user?.email ?? "anon";

  const cached = _cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return Response.json({ streak: cached.streak }, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  }

  try {
    const res = await fetch(
      "https://apis-prelive.quran.foundation/auth/v1/streaks/current-streak-days?type=QURAN",
      {
        headers: {
          Authorization: `Bearer ${session.accessToken as string}`,
          "x-client-id": process.env.QURAN_CLIENT_ID!,
          "x-timezone": "America/New_York",
        },
      }
    );

    const data = await res.json();
    const raw = data?.data;
    const streak = typeof raw === "number"
      ? raw
      : Array.isArray(raw)
      ? raw.length
      : (raw?.currentStreakDays ?? raw?.streakDays ?? raw?.days ?? 0);

    _cache.set(key, { streak, expiresAt: Date.now() + TTL });

    return Response.json({ streak }, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return Response.json({ streak: cached?.streak ?? 0 });
  }
}
