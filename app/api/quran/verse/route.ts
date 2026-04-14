let _tokenCache: { token: string; expiresAt: number } | null = null;
const _verseCache = new Map<string, { data: unknown; expiresAt: number }>();

function todayDateStr() {
  return new Date().toISOString().split("T")[0];
}

function endOfTodayMs() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (_tokenCache && now < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }

  const credentials = Buffer.from(
    `${process.env.QURAN_CLIENT_ID}:${process.env.QURAN_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(
    "https://prelive-oauth2.quran.foundation/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "content",
      }),
      cache: "no-store",
    }
  );

  const data = await res.json();
  _tokenCache = {
    token: data.access_token,
    expiresAt: now + 55 * 60 * 1000, // 55 minutes
  };
  return data.access_token;
}

async function generateTafsirSummary(
  tafsirHtml: string,
  verseTranslation: string
): Promise<string> {
  const plainText = tafsirHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `The Quran verse says: "${verseTranslation}"

Here is the tafsir:
${plainText}

Write 2 sentences for a Muslim to act on today. First sentence: what this verse is calling them to do or feel. Second sentence: ONE very specific, concrete action starting with "Today," — not vague like "reflect on your faith" but specific like "Today, give something to someone who needs it without telling anyone" or "Today, before you respond to someone who upset you, pause and make du'a first." Make it feel personal and achievable in the next 24 hours.`,
        },
      ],
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const AUDIO_FALLBACK: Record<string, number> = {
  "1:1": 1, "1:2": 2, "1:3": 3, "1:4": 4, "1:5": 5, "1:6": 6, "1:7": 7,
  "2:1": 8, "2:2": 9, "2:3": 10, "2:4": 11, "2:5": 12, "2:6": 13,
  "2:7": 14, "2:8": 15, "2:9": 16, "2:10": 17,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const verseKey = searchParams.get("verseKey");

  if (!verseKey) {
    return Response.json({ error: "No verse key provided." }, { status: 400 });
  }

  const cacheKey = `${verseKey}|${todayDateStr()}`;
  const cached = _verseCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return Response.json(cached.data, {
      headers: { "Cache-Control": "public, max-age=43200, stale-while-revalidate=86400" },
    });
  }

  const token = await getAccessToken();
  const headers = {
    "x-auth-token": token,
    "x-client-id": process.env.QURAN_CLIENT_ID!,
  };

  const BASE = "https://apis-prelive.quran.foundation/content/api/v4";

  const [verseRes, translationRes, tafsirRes, audioRes] = await Promise.all([
    fetch(`${BASE}/verses/by_key/${verseKey}?fields=text_uthmani`, { headers }),
    fetch(`${BASE}/translations/85/by_ayah/${verseKey}`, { headers }),
    fetch(`${BASE}/tafsirs/169/by_ayah/${verseKey}`, { headers }),
    fetch(`${BASE}/recitations/1/by_ayah/${verseKey}`, { headers }),
  ]);

  const verseData = await verseRes.json();
  const translationData = await translationRes.json();

  let tafsirText = "";
  let aiSummary = "";
  let audioUrl: string | null = null;

  if (tafsirRes.ok) {
    const tafsirData = await tafsirRes.json();
    tafsirText = tafsirData.tafsir?.text ?? "";
    if (tafsirText) {
      const translation = translationData.translations?.[0]?.text ?? "";
      aiSummary = await generateTafsirSummary(tafsirText, translation);
    }
  }

  if (audioRes.ok) {
    const audioData = await audioRes.json();
    audioUrl = audioData.audio_files?.[0]?.url
      ? `https://verses.quran.com/${audioData.audio_files[0].url}`
      : null;
  }
  if (!audioUrl) {
    const n = AUDIO_FALLBACK[verseKey];
    if (n) audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${n}.mp3`;
  }

  const result = {
    verse: {
      ...verseData.verse,
      translations: translationData.translations ?? [],
      tafsir: tafsirText,
      tafsirSummary: aiSummary,
      audioUrl,
    },
  };

  _verseCache.set(cacheKey, { data: result, expiresAt: endOfTodayMs() });

  return Response.json(result, {
    headers: { "Cache-Control": "public, max-age=43200, stale-while-revalidate=86400" },
  });
}
