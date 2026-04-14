import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await request.json();

  const res = await fetch(
    `https://apis-prelive.quran.foundation/quran-reflect/v1/rooms/${roomId}/join`,
    {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "x-auth-token": session.accessToken as string,
        "x-client-id": process.env.QURAN_CLIENT_ID!,
      },
    }
  );

  const data = await res.json();
  console.log("join room:", JSON.stringify(data, null, 2));
  return Response.json(data);
}