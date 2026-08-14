/* UPAI LifeHub v4 - Cross-device sync
   Devices sharing an API key share a data bucket. The raw key never leaves
   the device: only a SHA-256 derived id is sent. */

import { ls } from "./storage";

export const SYNC_KEYS = [
  "upai_tasks", "upai_homework", "upai_events", "upai_exercise_logs",
  "upai_study_sessions", "upai_study_target",
  "upai_steps", "upai_step_target",
  "upai_water", "upai_water_target",
  "upai_calories", "upai_calorie_target",
  "upai_sleep", "upai_sleep_target",
  "upai_user_weight", "upai_period_date", "upai_period_cycle",
  "upai_theme", "upai_mood", "upai_language",
  "upai_brain_dump", "upai_media_url", "upai_media_type",
  "upai_history",
];

/** SHA-256 of the API key + salt, truncated. Falls back to a weak hash if
    crypto.subtle is unavailable (e.g. insecure origin). */
export async function deriveSyncId(apiKey) {
  if (!apiKey || apiKey.length < 8) return null;
  const salted = `${apiKey}::upai-lifehub-v4`;
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salted));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 48);
  } catch {
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < salted.length; i++) {
      h1 = ((h1 ^ salted.charCodeAt(i)) * 16777619) >>> 0;
      h2 = ((h2 + salted.charCodeAt(i) * (i + 7)) * 2654435761) >>> 0;
    }
    return (h1.toString(36) + h2.toString(36)).padStart(24, "0").slice(0, 32);
  }
}

/** Base URL for the sync function. The Android build must be told where the
    Netlify site lives; on the web the current origin is correct. */
export function syncBase() {
  const custom = ls.get("upai_sync_url", "");
  if (custom) return String(custom).replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    const { protocol, origin } = window.location;
    // Capacitor serves from capacitor://  or  https://localhost — not our API.
    if (protocol.startsWith("http") && !/localhost|127\.0\.0\.1/.test(origin)) return origin;
  }
  return "";
}

const endpoint = () => `${syncBase()}/.netlify/functions/sync`;

export const syncConfigured = () => Boolean(syncBase());

export async function syncPull(syncId) {
  if (!syncId || !syncConfigured()) return null;
  const res = await fetch(`${endpoint()}?key=${encodeURIComponent(syncId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Sync HTTP ${res.status}`);
  const text = await res.text();
  if (!text || text === "{}") return null;
  return JSON.parse(text);
}

export async function syncPush(syncId, payload) {
  if (!syncId || !syncConfigured()) return false;
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: syncId, data: payload }),
  });
  if (!res.ok) throw new Error(`Sync HTTP ${res.status}`);
  return true;
}

/** Snapshot every synced key out of localStorage. */
export function collectSyncData() {
  const data = { _v: 4, _syncedAt: Date.now() };
  SYNC_KEYS.forEach((k) => {
    const v = ls.get(k, undefined);
    if (v !== undefined && v !== null) data[k] = v;
  });
  return data;
}

/** Merge strategy: newest snapshot wins for scalars; id-keyed lists are
    unioned so two devices editing different items don't clobber each other. */
const LIST_KEYS = ["upai_tasks", "upai_homework", "upai_events", "upai_exercise_logs", "upai_study_sessions"];

function mergeLists(localArr, remoteArr) {
  if (!Array.isArray(localArr)) return remoteArr;
  if (!Array.isArray(remoteArr)) return localArr;
  const byId = new Map();
  localArr.forEach((it) => it && it.id != null && byId.set(String(it.id), it));
  remoteArr.forEach((it) => {
    if (!it || it.id == null) return;
    const k = String(it.id);
    const existing = byId.get(k);
    if (!existing) byId.set(k, it);
    else byId.set(k, { ...existing, ...it, done: it.done ?? existing.done });
  });
  return Array.from(byId.values());
}

/**
 * Applies a remote snapshot. Returns true only when the local data actually
 * differs afterwards — merging always produces new array objects, so without
 * this comparison every sync would look like a change and the app would
 * re-render and re-sync forever.
 */
export function applySyncData(remote) {
  if (!remote || typeof remote !== "object") return false;
  const localTs = ls.get("upai_last_sync", 0);
  const remoteTs = remote._syncedAt || 0;
  let changed = false;

  SYNC_KEYS.forEach((k) => {
    if (!(k in remote)) return;

    if (LIST_KEYS.includes(k)) {
      const current = ls.get(k, []);
      const merged = mergeLists(current, remote[k]);
      if (JSON.stringify(merged) !== JSON.stringify(current)) {
        ls.set(k, merged);
        changed = true;
      }
    } else if (remoteTs > localTs) {
      const current = ls.get(k, null);
      if (JSON.stringify(remote[k]) !== JSON.stringify(current)) {
        ls.set(k, remote[k]);
        changed = true;
      }
    }
  });

  return changed;
}

/** Full round trip: push local, pull remote, merge. */
export async function fullSync(syncId) {
  if (!syncId) throw new Error("Senkronizasyon kimliği yok (API anahtarı gerekli).");
  if (!syncConfigured()) throw new Error("Sunucu adresi ayarlanmamış. Ayarlar'dan Netlify adresini gir.");

  let remote = null;
  try { remote = await syncPull(syncId); } catch { /* first run: nothing there yet */ }

  const changed = remote ? applySyncData(remote) : false;
  await syncPush(syncId, collectSyncData());
  ls.set("upai_last_sync", Date.now());
  return changed;
}
