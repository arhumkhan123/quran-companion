import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(request: Request) {
  const { habits, reflections } = await request.json();

  const habitSummary = habits
    .map((h: { date: string; count: number }) => `${h.date}: ${h.count}/5 habits`)
    .join("\n");

  const reflectionSummary = reflections
    .map((r: { body: string; date: string }) => `${r.date}: "${r.body}"`)
    .join("\n");

  const prompt = `You are a warm Islamic spiritual coach. A Muslim has shared their week of Quran reflection and daily habits with you. Write a short, personal, encouraging weekly summary (3-4 sentences max) that:
1. Acknowledges what they did this week
2. Highlights a pattern or strength you notice
3. Gives one gentle suggestion for next week tied to a Quranic concept

Their habits this week:
${habitSummary || "No habit data recorded"}

Their reflections this week:
${reflectionSummary || "No reflections recorded"}

Write directly to them, warmly. Start with "This week," or "Alhamdulillah," — keep it personal and brief.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const summary = data.choices?.[0]?.message?.content ?? "";
  return Response.json({ summary });
}