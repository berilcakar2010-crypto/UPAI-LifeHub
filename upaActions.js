/* UPAI LifeHub v4 - UPA Action Engine
   Lets UPA modify the app's data (tasks, homework, calendar, metrics)
   by emitting a structured block alongside its normal reply. */

export const ACTION_OPEN = "<<<UPA_ACTIONS";
export const ACTION_CLOSE = "UPA_ACTIONS>>>";

export const ACTION_TYPES = [
  "add_task", "complete_task", "delete_task",
  "add_homework", "complete_homework", "delete_homework",
  "add_event", "delete_event", "clear_events",
  "add_study_session", "add_exercise",
  "set_metric", "set_goal",
];

/* ── The instruction block appended to every system prompt ───────────── */
export function buildActionInstructions(lang = "tr", todayISO) {
  const common = `
You can modify the user's app data. When (and ONLY when) the user asks you to
change something, or uploads a schedule/timetable/assignment document that
should be entered into the app, append a block at the very END of your reply:

${ACTION_OPEN}
[ { "type": "...", ... }, { "type": "...", ... } ]
${ACTION_CLOSE}

Rules:
- The block must contain a valid JSON array. Nothing after the closing marker.
- Never mention the block, its markers, or JSON in your visible reply. Instead
  describe what you did in plain language, in the user's language.
- Omit the block entirely for normal conversation. Do not invent changes the
  user did not ask for.
- Today's date is ${todayISO}. All "date"/"dueDate" fields use YYYY-MM-DD.
  All "time" fields use 24-hour HH:MM.
- When a document lists a weekly timetable, create events for the CURRENT week
  using real dates, and say so.
- "clear_events" with a "date" or "from"+"to" range replaces a schedule; use it
  before re-adding events for the same day so nothing is duplicated.

Available actions:
  {"type":"add_task","text":str,"time":"HH:MM","priority":"critical|high|medium|low","date":"YYYY-MM-DD"(optional)}
  {"type":"complete_task","match":str}          // match = part of the task text
  {"type":"delete_task","match":str}
  {"type":"add_homework","subject":str,"description":str,"dueDate":"YYYY-MM-DD","priority":"critical|high|medium|low"}
  {"type":"complete_homework","match":str}
  {"type":"delete_homework","match":str}
  {"type":"add_event","title":str,"date":"YYYY-MM-DD","time":"HH:MM","endTime":"HH:MM"(optional),"eventType":"study|exam|task|personal|other","notes":str(optional)}
  {"type":"delete_event","match":str,"date":"YYYY-MM-DD"(optional)}
  {"type":"clear_events","date":"YYYY-MM-DD"} or {"type":"clear_events","from":"YYYY-MM-DD","to":"YYYY-MM-DD"}
  {"type":"add_study_session","label":str,"hours":num,"minutes":num}
  {"type":"add_exercise","exerciseType":str,"duration":num,"calories":num(optional),"notes":str(optional)}
  {"type":"set_metric","metric":"steps|water|calories|sleep","value":num}
  {"type":"set_goal","metric":"stepTarget|waterTarget|calorieTarget|sleepTarget|studyTarget","value":num}
`.trim();

  return common;
}

/* ── Parse a raw AI reply into {text, actions} ───────────────────────── */
export function parseActions(raw) {
  if (!raw || typeof raw !== "string") return { text: raw || "", actions: [] };

  const start = raw.indexOf(ACTION_OPEN);
  if (start === -1) return { text: raw.trim(), actions: [] };

  const endIdx = raw.indexOf(ACTION_CLOSE, start);
  const jsonStart = start + ACTION_OPEN.length;
  const jsonRaw = endIdx === -1 ? raw.slice(jsonStart) : raw.slice(jsonStart, endIdx);

  const visible = (raw.slice(0, start) + (endIdx === -1 ? "" : raw.slice(endIdx + ACTION_CLOSE.length)))
    .replace(/```(json)?/g, "")
    .trim();

  let actions = [];
  try {
    const cleaned = jsonRaw.replace(/```(json)?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) actions = parsed;
    else if (parsed && typeof parsed === "object") actions = [parsed];
  } catch {
    // Salvage attempt: grab the outermost array
    const m = jsonRaw.match(/\[[\s\S]*\]/);
    if (m) {
      try { actions = JSON.parse(m[0]); } catch { actions = []; }
    }
  }

  actions = (Array.isArray(actions) ? actions : [])
    .filter((a) => a && typeof a === "object" && ACTION_TYPES.includes(a.type))
    .slice(0, 60); // hard cap so a runaway response can't flood the app

  return { text: visible, actions };
}

/* ── Validation helpers ──────────────────────────────────────────────── */
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = (s) => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const PRIORITIES = ["critical", "high", "medium", "low"];
const clampPriority = (p) => (PRIORITIES.includes(p) ? p : "medium");
const EVENT_TYPES = ["study", "exam", "task", "personal", "other"];
const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const norm = (s) => (typeof s === "string" ? s.toLocaleLowerCase("tr").trim() : "");

/**
 * applyActions - executes actions against the app state.
 * Pure with respect to the incoming arrays: returns new arrays.
 *
 * @param {Array} actions
 * @param {object} state  { tasks, homework, events, studySessions, exerciseLogs, metrics, goals }
 * @returns {object} { next, log }  next = updated slices, log = human-readable summary
 */
export function applyActions(actions, state) {
  const today = new Date().toLocaleDateString("en-CA");

  let tasks = [...(state.tasks || [])];
  let homework = [...(state.homework || [])];
  let events = [...(state.events || [])];
  let studySessions = [...(state.studySessions || [])];
  let exerciseLogs = [...(state.exerciseLogs || [])];
  const metrics = { ...(state.metrics || {}) };
  const goals = { ...(state.goals || {}) };

  const log = [];
  let seq = 0;
  const nextId = () => Date.now() + (seq++);

  for (const a of actions) {
    try {
      switch (a.type) {
        case "add_task": {
          if (!a.text) break;
          const task = {
            id: nextId(),
            text: String(a.text).slice(0, 200),
            time: isTime(a.time) ? a.time : "12:00",
            date: isDate(a.date) ? a.date : today,
            priority: clampPriority(a.priority),
            done: false,
          };
          tasks.push(task);
          log.push({ type: a.type, label: `${task.text} (${task.time})` });
          break;
        }
        case "complete_task": {
          const key = norm(a.match);
          const hit = tasks.find((t) => !t.done && norm(t.text).includes(key));
          if (hit) {
            tasks = tasks.map((t) => (t.id === hit.id ? { ...t, done: true } : t));
            log.push({ type: a.type, label: hit.text });
          }
          break;
        }
        case "delete_task": {
          const key = norm(a.match);
          const hit = tasks.find((t) => norm(t.text).includes(key));
          if (hit) {
            tasks = tasks.filter((t) => t.id !== hit.id);
            log.push({ type: a.type, label: hit.text });
          }
          break;
        }

        case "add_homework": {
          if (!a.subject) break;
          const hw = {
            id: nextId(),
            subject: String(a.subject).slice(0, 80),
            description: String(a.description || "").slice(0, 300),
            dueDate: isDate(a.dueDate) ? a.dueDate : today,
            priority: clampPriority(a.priority),
            done: false,
            createdAt: Date.now(),
          };
          homework.push(hw);
          log.push({ type: a.type, label: `${hw.subject} — ${hw.dueDate}` });
          break;
        }
        case "complete_homework": {
          const key = norm(a.match);
          const hit = homework.find((h) => !h.done && (norm(h.subject).includes(key) || norm(h.description).includes(key)));
          if (hit) {
            homework = homework.map((h) => (h.id === hit.id ? { ...h, done: true } : h));
            log.push({ type: a.type, label: hit.subject });
          }
          break;
        }
        case "delete_homework": {
          const key = norm(a.match);
          const hit = homework.find((h) => norm(h.subject).includes(key) || norm(h.description).includes(key));
          if (hit) {
            homework = homework.filter((h) => h.id !== hit.id);
            log.push({ type: a.type, label: hit.subject });
          }
          break;
        }

        case "add_event": {
          if (!a.title) break;
          const ev = {
            id: nextId(),
            title: String(a.title).slice(0, 160),
            date: isDate(a.date) ? a.date : today,
            time: isTime(a.time) ? a.time : "09:00",
            endTime: isTime(a.endTime) ? a.endTime : "",
            eventType: EVENT_TYPES.includes(a.eventType) ? a.eventType : "other",
            notes: String(a.notes || "").slice(0, 300),
            source: "upa",
          };
          events.push(ev);
          log.push({ type: a.type, label: `${ev.date} ${ev.time} — ${ev.title}` });
          break;
        }
        case "delete_event": {
          const key = norm(a.match);
          const hit = events.find((e) => norm(e.title).includes(key) && (!isDate(a.date) || e.date === a.date));
          if (hit) {
            events = events.filter((e) => e.id !== hit.id);
            log.push({ type: a.type, label: hit.title });
          }
          break;
        }
        case "clear_events": {
          const before = events.length;
          if (isDate(a.date)) {
            events = events.filter((e) => e.date !== a.date);
          } else if (isDate(a.from) && isDate(a.to)) {
            events = events.filter((e) => e.date < a.from || e.date > a.to);
          } else break;
          const removed = before - events.length;
          if (removed > 0) log.push({ type: a.type, label: `${removed} etkinlik` });
          break;
        }

        case "add_study_session": {
          if (!a.label) break;
          const s = {
            id: nextId(),
            label: String(a.label).slice(0, 120),
            hours: Math.max(0, Math.min(24, num(a.hours))),
            minutes: Math.max(0, Math.min(59, num(a.minutes))),
          };
          studySessions.push(s);
          log.push({ type: a.type, label: `${s.label} ${s.hours}sa ${s.minutes}dk` });
          break;
        }

        case "add_exercise": {
          if (!a.exerciseType) break;
          const ex = {
            id: nextId(),
            type: String(a.exerciseType).slice(0, 80),
            duration: Math.max(1, num(a.duration, 30)),
            calories: Math.max(0, num(a.calories, 0)),
            sets: null,
            reps: null,
            notes: String(a.notes || "").slice(0, 200),
            date: today,
          };
          exerciseLogs.push(ex);
          log.push({ type: a.type, label: `${ex.type} ${ex.duration}dk` });
          break;
        }

        case "set_metric": {
          const allowed = ["steps", "water", "calories", "sleep"];
          if (!allowed.includes(a.metric)) break;
          const v = Math.max(0, num(a.value));
          metrics[a.metric] = v;
          log.push({ type: a.type, label: `${a.metric} = ${v}` });
          break;
        }
        case "set_goal": {
          const allowed = ["stepTarget", "waterTarget", "calorieTarget", "sleepTarget", "studyTarget"];
          if (!allowed.includes(a.metric)) break;
          const v = Math.max(1, num(a.value, 1));
          goals[a.metric] = v;
          log.push({ type: a.type, label: `${a.metric} = ${v}` });
          break;
        }

        default:
          break;
      }
    } catch {
      // A single malformed action must never break the rest.
    }
  }

  return {
    next: { tasks, homework, events, studySessions, exerciseLogs, metrics, goals },
    log,
  };
}

/** Human-readable summary of an action log, localised. */
export function describeLog(log, T) {
  return log.map((entry) => {
    const verb = T.actions[entry.type] || entry.type;
    return `${entry.label} — ${verb}`;
  });
}
