import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { question, arabicText, translation, tafsirText } = await req.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const systemPrompt = `You are an Islamic scholar assistant. Answer questions about Quranic verses concisely based on classical tafsir. Keep answers to 2–4 sentences unless more depth is truly needed.

The current verse is: ${arabicText} — ${translation}.${tafsirText ? `\n\nTafsir context: ${tafsirText}` : ""}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      max_tokens: 512,
      temperature: 0.5,
    });

    const answer = completion.choices[0]?.message?.content ?? "No response generated.";
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Groq ask error:", err);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
