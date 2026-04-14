import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { toggleReaction } from "@/lib/interactionsStore";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, emoji } = await request.json();
  const reactions = toggleReaction(String(postId), emoji, session.user.email);
  return Response.json({ reactions });
}
