import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { addReply } from "@/lib/interactionsStore";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, body } = await request.json();
  if (!body?.trim() || body.trim().length < 2) {
    return Response.json({ error: "Reply too short" }, { status: 400 });
  }

  const authorName = session.user.name ?? session.user.email;
  const reply = addReply(String(postId), body.trim(), session.user.email, authorName);
  return Response.json({ reply });
}
