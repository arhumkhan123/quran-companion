import { fetchVerse } from "@/lib/fetchVerse";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const verseKey = searchParams.get("verseKey");

  if (!verseKey) {
    return Response.json({ error: "No verse key provided." }, { status: 400 });
  }

  try {
    const result = await fetchVerse(verseKey);
    return Response.json(result, {
      headers: { "Cache-Control": "public, max-age=43200, stale-while-revalidate=86400" },
    });
  } catch (err) {
    console.error("fetchVerse error:", err);
    return Response.json({ error: "Failed to fetch verse." }, { status: 500 });
  }
}
