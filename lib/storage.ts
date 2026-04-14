export type DailyAction = {
    date: string; // "2026-03-25"
    verseKey: string;
    reflection: string;
    followedThrough?: boolean;
  };
  
  export function saveTodayReflection(verseKey: string, reflection: string) {
    const today = new Date().toISOString().split("T")[0];
    const action: DailyAction = { date: today, verseKey, reflection };
    const history: DailyAction[] = JSON.parse(localStorage.getItem("dailyActions") || "[]");
    const filtered = history.filter((a) => a.date !== today);
    localStorage.setItem("dailyActions", JSON.stringify([...filtered, action]));
  }
  
  export function getYesterdayAction(): DailyAction | null {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDate = yesterday.toISOString().split("T")[0];
    const history: DailyAction[] = JSON.parse(localStorage.getItem("dailyActions") || "[]");
    return history.find((a) => a.date === yDate && a.followedThrough === undefined) ?? null;
  }

  // for testing
// export function getYesterdayAction(): DailyAction | null {
//     const today = new Date().toISOString().split("T")[0]; // changed for testing
//     const history: DailyAction[] = JSON.parse(localStorage.getItem("dailyActions") || "[]");
//     return history.find((a) => a.date === today && a.followedThrough === undefined) ?? null;
//   }
  
  export function markFollowThrough(date: string, value: boolean) {
    const history: DailyAction[] = JSON.parse(localStorage.getItem("dailyActions") || "[]");
    const updated = history.map((a) => a.date === date ? { ...a, followedThrough: value } : a);
    localStorage.setItem("dailyActions", JSON.stringify(updated));
  }
  
  export function getFollowThroughRate(): number {
    const history: DailyAction[] = JSON.parse(localStorage.getItem("dailyActions") || "[]");
    const answered = history.filter((a) => a.followedThrough !== undefined);
    if (answered.length === 0) return 0;
    const completed = answered.filter((a) => a.followedThrough === true);
    return Math.round((completed.length / answered.length) * 100);
  }