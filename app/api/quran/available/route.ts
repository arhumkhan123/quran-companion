async function getAccessToken() {
    const credentials = Buffer.from(
      `${process.env.QURAN_CLIENT_ID}:${process.env.QURAN_CLIENT_SECRET}`
    ).toString("base64");
  
    const res = await fetch("https://prelive-oauth2.quran.foundation/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "content",
      }),
      cache: "no-store",
    });
  
    const data = await res.json();
    return data.access_token;
  }
  
  export async function GET() {
    const token = await getAccessToken();
    const headers = {
      "x-auth-token": token,
      "x-client-id": process.env.QURAN_CLIENT_ID!,
    };
  
    const BASE_URL = "https://apis-prelive.quran.foundation/content/api/v4";
  
    const results: Record<string, number> = {};
  
    // check chapters 1-10 and a few others
    const chaptersToCheck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 18, 36, 55, 67, 112, 113, 114];
  
    for (const chapter of chaptersToCheck) {
      const res = await fetch(`${BASE_URL}/verses/by_chapter/${chapter}?fields=text_uthmani`, { headers });
      const data = await res.json();
      results[chapter] = data.verses?.length ?? 0;
    }
  
    return Response.json(results);
  }