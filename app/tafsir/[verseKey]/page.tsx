import Link from "next/link";

type PageProps = {
  params: Promise<{
    verseKey: string;
  }>;
};

async function getVerseByKey(verseKey: string) {
  const res = await fetch(
    `http://localhost:3000/api/quran/verse?verseKey=${encodeURIComponent(verseKey)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch verse");
  }

  return res.json();
}

export default async function TafsirPage({ params }: PageProps) {
  const { verseKey } = await params;
  const decodedVerseKey = decodeURIComponent(verseKey);

  const data = await getVerseByKey(decodedVerseKey);
  const verse = data.verse;

  const translation = verse?.translations?.[0]?.text ?? "";
  const tafsirHtml = String(verse?.tafsir ?? "");

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <Link
          href="/"
          className="mb-6 inline-block text-sm font-medium text-emerald-600 hover:underline"
        >
          ← Back
        </Link>

        <div className="mb-2 text-sm font-medium text-neutral-500">
          Full Tafsir — {verse?.verse_key}
        </div>

        <p className="mb-6 text-right text-3xl leading-loose text-neutral-900 font-arabic">
          {verse?.text_uthmani}
        </p>

        <p className="mb-6 text-base leading-relaxed text-neutral-700">
          {translation}
        </p>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
          <div className="mb-4 text-sm font-semibold text-emerald-700">
            Tafsir
          </div>

          <div
            className="text-sm leading-7 text-neutral-700
              [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-neutral-900
              [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-neutral-800
              [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-neutral-800
              [&_p]:mb-3
              [&_strong]:font-semibold [&_strong]:text-neutral-900
              [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6
              [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6
              [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: tafsirHtml }}
          />
        </div>
      </div>
    </main>
  );
}