export async function GET(request: Request) {
  const accessToken = request.headers.get("x-auth-token");

  if (!accessToken) {
    return Response.json({ reflections: [] });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(
      "https://apis-prelive.quran.foundation/quran-reflect/v1/posts/my-posts?tab=my_reflections&limit=20",
      {
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "x-auth-token": accessToken,
          "x-client-id": process.env.QURAN_CLIENT_ID!,
        },
      }
    );

    clearTimeout(timeout);

    if (res.status === 403 || res.status === 401) {
      return Response.json({ reflections: [], error: "token_expired" });
    }

    const data = await res.json();

    // QF API wraps results differently depending on endpoint version
    const reflections =
      data.data ??
      data.posts ??
      data.reflections ??
      data.items ??
      (Array.isArray(data) ? data : []);

    return Response.json({ reflections });
  } catch (err) {
    console.log("history error:", err);
    return Response.json({ reflections: [] });
  }
}
