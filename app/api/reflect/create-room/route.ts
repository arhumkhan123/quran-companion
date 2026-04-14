import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  const slug = `quran-circle-${Date.now().toString().slice(-6)}`;

  const res = await fetch(
    "https://apis-prelive.quran.foundation/quran-reflect/v1/rooms/groups",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-auth-token": session.accessToken as string,
        "x-client-id": process.env.QURAN_CLIENT_ID!,
      },
      body: JSON.stringify({
        name: "Quran Circle",
        description: "A Quran reflection accountability circle",
        url: slug,
        public: true,
      }),
    }
  );

  const data = await res.json();
  console.log("create room:", JSON.stringify(data, null, 2));
  return Response.json(data);
}