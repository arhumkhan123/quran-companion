import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getInteractions } from "@/lib/interactionsStore";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({}, { status: 401 });

  const { searchParams } = new URL(request.url);
  const postIds = (searchParams.get("postIds") ?? "").split(",").filter(Boolean);
  if (postIds.length === 0) return Response.json({});

  return Response.json(getInteractions(postIds));
}
