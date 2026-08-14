/* UPAI LifeHub v4 - Smart notifications
   Works on the web (Notification API + service worker) and inside the
   Capacitor Android build (@capacitor/local-notifications). */

import { getT } from "../i18n";

/** Minutes before the due time that a reminder fires, by priority. */
export const PRIORITY_LEAD = { critical: 60, high: 30, medium: 15, low: 5 };
export const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
export const PRIORITY_COLOR = { critical: "#ff4444", high: "#ff8800", medium: "#ffcc00", low: "#44cc44" };

let capNotifications = null;
let capChecked = false;

async function getCapacitor() {
  if (capChecked) return capNotifications;
  capChecked = true;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor?.isNativePlatform?.()) return null;
    const mod = await import("@capacitor/local-notifications");
    capNotifications = mod.LocalNotifications;
    return capNotifications;
  } catch {
    return null;
  }
}

export const isNative = async () => {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return !!Capacitor?.isNativePlatform?.();
  } catch { return false; }
};

/* ── Setup ───────────────────────────────────────────────────────────── */

export const registerSW = async () => {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(`${process.env.PUBLIC_URL || ""}/sw.js`);
  } catch (e) {
    console.warn("SW registration failed:", e);
    return null;
  }
};

export const requestNotificationPermission = async () => {
  const cap = await getCapacitor();
  if (cap) {
    try {
      const res = await cap.requestPermissions();
      return res.display === "granted" ? "granted" : "denied";
    } catch { return "denied"; }
  }
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  try { return await Notification.requestPermission(); }
  catch { return "denied"; }
};

export const currentPermission = async () => {
  const cap = await getCapacitor();
  if (cap) {
    try {
      const res = await cap.checkPermissions();
      return res.display === "granted" ? "granted" : res.display === "denied" ? "denied" : "default";
    } catch { return "default"; }
  }
  return "Notification" in window ? Notification.permission : "denied";
};

/* ── Scheduling ──────────────────────────────────────────────────────── */

let webTimers = [];
export const clearWebTimers = () => {
  webTimers.forEach((id) => clearTimeout(id));
  webTimers = [];
};

/** Deterministic small integer id, required by Android's notification manager. */
const stableId = (key) => {
  let h = 0;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 2000000;
};

/**
 * Schedules a batch of reminders. Replaces any previously scheduled batch.
 * @param {Array} reminders [{ key, at: Date, title, body }]
 */
export async function scheduleBatch(reminders, swReg) {
  const valid = reminders.filter((r) => r.at instanceof Date && r.at.getTime() > Date.now());

  const cap = await getCapacitor();
  if (cap) {
    try {
      const pending = await cap.getPending();
      if (pending?.notifications?.length) {
        await cap.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
      }
      if (!valid.length) return;
      await cap.schedule({
        notifications: valid.slice(0, 60).map((r) => ({
          id: stableId(r.key),
          title: r.title,
          body: r.body,
          schedule: { at: r.at, allowWhileIdle: true },
          smallIcon: "ic_stat_icon",
          iconColor: "#4ade80",
          extra: { key: r.key },
        })),
      });
    } catch (e) {
      console.warn("Native notification scheduling failed:", e);
    }
    return;
  }

  // Web fallback
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  clearWebTimers();
  valid.slice(0, 60).forEach((r) => {
    const delay = r.at.getTime() - Date.now();
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return; // setTimeout is unreliable beyond a day
    const id = setTimeout(() => {
      try {
        if (swReg?.showNotification) {
          swReg.showNotification(r.title, {
            body: r.body, icon: "./icon-192.png", badge: "./icon-192.png",
            tag: r.key, vibrate: [200, 100, 200],
          });
        } else {
          new Notification(r.title, { body: r.body, icon: "./icon-192.png", tag: r.key });
        }
      } catch {}
    }, delay);
    webTimers.push(id);
  });
}

/**
 * Builds the full reminder list from app state.
 * Priority determines how far ahead of the due time the reminder fires.
 */
export function buildReminders({ tasks = [], homework = [], events = [], metrics = {}, language = "tr" }) {
  const T = getT(language);
  const N = T.notif;
  const now = new Date();
  const today = now.toLocaleDateString("en-CA");
  const out = [];

  const atTime = (dateStr, timeStr) => {
    const [h, m] = (timeStr || "00:00").split(":").map(Number);
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  };

  /* Tasks — lead time varies with priority */
  tasks.filter((t) => !t.done && t.time).forEach((task) => {
    const due = atTime(task.date || today, task.time);
    if (!due) return;
    const lead = PRIORITY_LEAD[task.priority] ?? PRIORITY_LEAD.medium;
    out.push({
      key: `task-${task.id}`,
      at: new Date(due.getTime() - lead * 60000),
      title: `📋 ${N.taskDue}: ${task.text}`,
      body: N.inMinutes(lead),
    });
  });

  /* Homework — reminder the evening before, plus a lead-time nudge on the day */
  homework.filter((h) => !h.done && h.dueDate).forEach((hw) => {
    const due = atTime(hw.dueDate, "23:59");
    if (!due) return;
    const lead = PRIORITY_LEAD[hw.priority] ?? PRIORITY_LEAD.high;
    out.push({
      key: `hw-eve-${hw.id}`,
      at: new Date(new Date(`${hw.dueDate}T00:00:00`).getTime() - 6 * 3600000), // 18:00 previous day
      title: `📝 ${N.hwDue}: ${hw.subject}`,
      body: hw.description || hw.dueDate,
    });
    out.push({
      key: `hw-${hw.id}`,
      at: new Date(due.getTime() - lead * 60000),
      title: `📝 ${N.hwDue}: ${hw.subject}`,
      body: N.inMinutes(lead),
    });
  });

  /* Calendar events — 15 min ahead, exams get an hour */
  events.filter((e) => e.date && e.time).forEach((ev) => {
    const start = atTime(ev.date, ev.time);
    if (!start) return;
    const lead = ev.eventType === "exam" ? 60 : 15;
    out.push({
      key: `ev-${ev.id}`,
      at: new Date(start.getTime() - lead * 60000),
      title: `📅 ${N.eventDue}: ${ev.title}`,
      body: N.inMinutes(lead),
    });
  });

  /* Habit nudges */
  for (let h = 10; h <= 22; h += 3) {
    const d = new Date(now);
    d.setHours(h, 0, 0, 0);
    out.push({ key: `water-${h}`, at: d, title: `💧 ${N.water}`, body: N.waterBody(metrics.waterTarget || 8) });
  }
  const stepD = new Date(now); stepD.setHours(18, 0, 0, 0);
  out.push({ key: "steps", at: stepD, title: `🏃 ${N.stepReminder}`, body: N.stepBody(metrics.stepTarget || 10000) });

  const studyD = new Date(now); studyD.setHours(14, 0, 0, 0);
  out.push({ key: "study", at: studyD, title: `📚 ${N.studyReminder}`, body: N.studyBody(metrics.studyTarget || 6) });

  return out.filter((r) => r.at instanceof Date && !Number.isNaN(r.at.getTime()));
}

/**
 * Items that should be surfaced *right now* as in-app alerts.
 * Returns [{ id, kind, title, body, refId }]
 */
export function collectDueAlerts({ tasks = [], homework = [], events = [], language = "tr", snoozedUntil = {} }) {
  const T = getT(language);
  const N = T.notif;
  const now = Date.now();
  const today = new Date().toLocaleDateString("en-CA");
  const alerts = [];

  const notSnoozed = (key) => !snoozedUntil[key] || snoozedUntil[key] < now;

  const atTime = (dateStr, timeStr) => {
    const [h, m] = (timeStr || "00:00").split(":").map(Number);
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  };

  tasks.filter((t) => !t.done && t.time).forEach((task) => {
    const due = atTime(task.date || today, task.time);
    if (!due) return;
    const lead = PRIORITY_LEAD[task.priority] ?? PRIORITY_LEAD.medium;
    const windowStart = due.getTime() - lead * 60000;
    const key = `task-${task.id}`;
    if (now >= windowStart && now <= due.getTime() + 30 * 60000 && notSnoozed(key)) {
      const mins = Math.max(0, Math.round((due.getTime() - now) / 60000));
      alerts.push({
        id: key, kind: "task", refId: task.id, priority: task.priority,
        title: `📋 ${task.text}`,
        body: mins > 0 ? N.inMinutes(mins) : N.taskDue,
      });
    }
  });

  homework.filter((h) => !h.done && h.dueDate).forEach((hw) => {
    const key = `hw-${hw.id}`;
    if (hw.dueDate <= today && notSnoozed(key)) {
      alerts.push({
        id: key, kind: "homework", refId: hw.id, priority: hw.priority,
        title: `📝 ${hw.subject}`,
        body: hw.dueDate < today ? T.homework.overdue : T.homework.dueToday,
      });
    }
  });

  events.filter((e) => e.date === today && e.time).forEach((ev) => {
    const start = atTime(ev.date, ev.time);
    if (!start) return;
    const lead = ev.eventType === "exam" ? 60 : 15;
    const key = `ev-${ev.id}`;
    if (now >= start.getTime() - lead * 60000 && now <= start.getTime() + 15 * 60000 && notSnoozed(key)) {
      const mins = Math.max(0, Math.round((start.getTime() - now) / 60000));
      alerts.push({
        id: key, kind: "event", refId: ev.id, priority: ev.eventType === "exam" ? "critical" : "medium",
        title: `📅 ${ev.title}`,
        body: mins > 0 ? N.inMinutes(mins) : N.eventDue,
      });
    }
  });

  return alerts
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))
    .slice(0, 4);
}

/** Drives the blinking red light: anything overdue or imminent. */
export function hasPendingAlerts({ tasks = [], homework = [], events = [] }) {
  const today = new Date().toLocaleDateString("en-CA");
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const taskAlert = tasks.some((t) => {
    if (t.done || !t.time) return false;
    if (t.date && t.date < today) return true;
    if (t.date && t.date > today) return false;
    const [h, m] = t.time.split(":").map(Number);
    const lead = PRIORITY_LEAD[t.priority] ?? PRIORITY_LEAD.medium;
    return h * 60 + m - nowMin <= lead;
  });
  if (taskAlert) return true;

  if (homework.some((h) => !h.done && h.dueDate && h.dueDate <= today)) return true;

  return events.some((e) => {
    if (e.date !== today || !e.time) return false;
    const [h, m] = e.time.split(":").map(Number);
    const lead = e.eventType === "exam" ? 60 : 15;
    const diff = h * 60 + m - nowMin;
    return diff <= lead && diff >= -15;
  });
}
