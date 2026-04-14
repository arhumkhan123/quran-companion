import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  console.log("session in rooms:", JSON.stringify(session, null, 2));


  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(
    "https://apis-prelive.quran.foundation/quran-reflect/v1/rooms",
    {
        headers: {
            "Authorization": `Bearer ${session.accessToken as string}`,
            "x-auth-token": session.accessToken as string,
            "x-client-id": process.env.QURAN_CLIENT_ID!,
          },
    }
  );

  const data = await res.json();
  console.log("rooms:", JSON.stringify(data, null, 2));
  return Response.json(data);
}