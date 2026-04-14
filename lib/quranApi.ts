const WORKING_VERSES = [
    "1:1", "1:2", "1:3", "1:4", "1:5", "1:6", "1:7",
    "2:1", "2:2", "2:3", "2:4", "2:5", "2:6", "2:7", "2:8", "2:9", "2:10",
  ];
  
  export async function getDailyAyah() {
    const daySeed = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const verseKey = WORKING_VERSES[daySeed % WORKING_VERSES.length];
  
    const res = await fetch(
      `/api/quran/verse?verseKey=${encodeURIComponent(verseKey)}`
    );
  
    if (!res.ok) {
      throw new Error("Failed to fetch ayah");
    }
  
    return res.json();
  }