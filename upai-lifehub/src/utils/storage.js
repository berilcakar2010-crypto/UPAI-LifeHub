/* UPAI LifeHub - Persistent Storage Utils */

export const getTodayString = () => new Date().toLocaleDateString("en-CA");

export const getWeekKey = () => {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
};

export const getMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/* Save today's snapshot into history */
export const saveDailySnapshot = (data) => {
  const today = getTodayString();
  const historyRaw = localStorage.getItem("upai_history") || "{}";
  const history = JSON.parse(historyRaw);
  history[today] = { ...data, savedAt: Date.now() };
  // Keep only last 400 days
  const keys = Object.keys(history).sort();
  if (keys.length > 400) keys.slice(0, keys.length - 400).forEach(k => delete history[k]);
  localStorage.setItem("upai_history", JSON.stringify(history));
};

export const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem("upai_history") || "{}"); }
  catch { return {}; }
};

export const ls = {
  get: (k, def = null) => {
    try {
      const v = localStorage.getItem(k);
      if (v === null) return def;
      return JSON.parse(v);
    } catch { return def; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
