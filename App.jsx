import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

import UpaSVG from "./components/UpaSVG";
import Pomodoro from "./components/Pomodoro";
import HistoryView from "./components/HistoryView";
import SchedulePlanner from "./components/SchedulePlanner";
import StudyTips from "./components/StudyTips";
import ChatTab from "./components/ChatTab";
import HomeworkTab from "./components/HomeworkTab";
import ExerciseTab from "./components/ExerciseTab";
import CalendarTab from "./components/CalendarTab";
import NotificationCenter from "./components/NotificationCenter";

import { THEMES, API_PROVIDERS } from "./utils/themes";
import { ls, getTodayString, saveDailySnapshot } from "./utils/storage";
import { playSound, stopSound, setVolume } from "./utils/audio";
import { callAI } from "./utils/aiClient";
import { applyActions } from "./utils/upaActions";
import {
  registerSW, requestNotificationPermission, currentPermission,
  scheduleBatch, buildReminders, collectDueAlerts, hasPendingAlerts,
  PRIORITY_COLOR, PRIORITY_ORDER,
} from "./utils/notifications";
import { deriveSyncId, fullSync, syncConfigured, syncBase } from "./utils/sync";
import { getT, LANGS, MOODS_I18N, localeOf } from "./i18n";

export default function App() {
  const today = getTodayString();
  const lastDate = ls.get("upai_last_date", today);
  const isNewDay = lastDate !== today;

  /* ── language & theme ───────────────────────────────────────────── */
  const [language, setLanguage] = useState(() => ls.get("upai_language", "tr"));
  const T = useMemo(() => getT(language), [language]);
  const locale = localeOf(language);

  const [theme, setTheme] = useState(() => ls.get("upai_theme", "kawaii"));
  const t = THEMES[theme] || THEMES.kawaii;

  const moods = MOODS_I18N[language] || MOODS_I18N.tr;
  const [moodIdx, setMoodIdx] = useState(() => ls.get("upai_mood_idx", 4));
  const mood = moods[moodIdx] || moods[0];

  /* ── API config ─────────────────────────────────────────────────── */
  const [provider, setProvider] = useState(() => ls.get("upai_provider", "gemini"));
  const [apiKey, setApiKey] = useState(() => ls.get("upai_api_key", ""));
  const [model, setModel] = useState(() => ls.get("upai_model", "gemini-2.0-flash"));
  const [syncUrl, setSyncUrl] = useState(() => ls.get("upai_sync_url", ""));
  const [showSettings, setShowSettings] = useState(false);

  /* ── navigation ─────────────────────────────────────────────────── */
  const [tab, setTab] = useState("chat");

  /* ── daily metrics ──────────────────────────────────────────────── */
  const [steps, setSteps] = useState(() => (isNewDay ? 0 : ls.get("upai_steps", 0)));
  const [stepTarget, setStepTarget] = useState(() => ls.get("upai_step_target", 10000));
  const [water, setWater] = useState(() => (isNewDay ? 0 : ls.get("upai_water", 0)));
  const [waterTarget, setWaterTarget] = useState(() => ls.get("upai_water_target", 8));
  const [calories, setCalories] = useState(() => (isNewDay ? 0 : ls.get("upai_calories", 0)));
  const [calorieTarget, setCalorieTarget] = useState(() => ls.get("upai_calorie_target", 2000));
  const [sleep, setSleep] = useState(() => (isNewDay ? 0 : ls.get("upai_sleep", 0)));
  const [sleepTarget, setSleepTarget] = useState(() => ls.get("upai_sleep_target", 8));
  const [userWeight, setUserWeight] = useState(() => ls.get("upai_user_weight", 55));

  /* ── data collections ───────────────────────────────────────────── */
  const [studySessions, setStudySessions] = useState(() => ls.get("upai_study_sessions", []));
  const [studyTarget, setStudyTarget] = useState(() => ls.get("upai_study_target", 6));
  const [tasks, setTasks] = useState(() => ls.get("upai_tasks", []));
  const [homework, setHomework] = useState(() => ls.get("upai_homework", []));
  const [events, setEvents] = useState(() => ls.get("upai_events", []));
  const [exerciseLogs, setExerciseLogs] = useState(() => ls.get("upai_exercise_logs", []));

  const totalStudyHours = useMemo(
    () => parseFloat(studySessions.reduce((a, s) => a + (s.hours || 0) + (s.minutes || 0) / 60, 0).toFixed(2)),
    [studySessions]
  );

  /* ── chat ───────────────────────────────────────────────────────── */
  const [chat, setChat] = useState(() => ls.get("upai_chat", null) || [{ role: "upa", content: getT(ls.get("upai_language", "tr")).chat.greeting }]);
  const [upaThinking, setUpaThinking] = useState(false);
  const [upaMood, setUpaMood] = useState("happy");
  const [upaComment, setUpaComment] = useState("");

  /* ── lifestyle ──────────────────────────────────────────────────── */
  const [outfit, setOutfit] = useState(() => ls.get("upai_outfit", ""));
  const [recipe, setRecipe] = useState(() => ls.get("upai_recipe", ""));
  const [genBusy, setGenBusy] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(() => ls.get("upai_media_url", ""));
  const [mediaType, setMediaType] = useState(() => ls.get("upai_media_type", "spotify"));

  /* ── period ─────────────────────────────────────────────────────── */
  const [periodDate, setPeriodDate] = useState(() => ls.get("upai_period_date", ""));
  const [periodCycle, setPeriodCycle] = useState(() => ls.get("upai_period_cycle", 28));

  /* ── brain fog ──────────────────────────────────────────────────── */
  const [fogOpen, setFogOpen] = useState(false);
  const [brainDump, setBrainDump] = useState(() => ls.get("upai_brain_dump", ""));
  const [breath, setBreath] = useState({ phase: "", size: 55 });

  /* ── audio ──────────────────────────────────────────────────────── */
  const [audioOn, setAudioOn] = useState(false);
  const [track, setTrack] = useState(0);
  const [volume, setVol] = useState(() => ls.get("upai_volume", 40));

  /* ── clock ──────────────────────────────────────────────────────── */
  const [now, setNow] = useState(new Date());

  /* ── notifications ──────────────────────────────────────────────── */
  const [swReg, setSwReg] = useState(null);
  const [notifPerm, setNotifPerm] = useState("default");
  const [alerts, setAlerts] = useState([]);
  const [snoozed, setSnoozed] = useState(() => ls.get("upai_snoozed", {}));
  const [dismissed, setDismissed] = useState({});
  const [blink, setBlink] = useState(false);

  /* ── sync ───────────────────────────────────────────────────────── */
  const [syncState, setSyncState] = useState("idle"); // idle | busy | ok | fail
  const [lastSync, setLastSync] = useState(() => ls.get("upai_last_sync", 0));
  const [syncMsg, setSyncMsg] = useState("");
  const syncIdRef = useRef(null);
  const pushTimer = useRef(null);
  const bootstrapped = useRef(false);

  /* ═══ effects ═══════════════════════════════════════════════════ */

  useEffect(() => {
    registerSW().then(setSwReg);
    currentPermission().then(setNotifPerm);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  /* breathing cycle */
  useEffect(() => {
    if (!fogOpen) return;
    const B = T.brainFog;
    const cycle = [
      { phase: `🫁 ${B.inhale}`, size: 100 },
      { phase: `🛑 ${B.hold}`, size: 100 },
      { phase: `😮‍💨 ${B.exhale}`, size: 40 },
      { phase: `🛑 ${B.wait}`, size: 40 },
    ];
    let i = 0;
    const run = () => { setBreath(cycle[i]); i = (i + 1) % 4; };
    run();
    const iv = setInterval(run, 4000);
    return () => clearInterval(iv);
  }, [fogOpen, T]);

  /* persistence — one effect, everything */
  useEffect(() => {
    const store = {
      upai_language: language, upai_theme: theme, upai_mood_idx: moodIdx,
      upai_provider: provider, upai_api_key: apiKey, upai_model: model, upai_sync_url: syncUrl,
      upai_steps: steps, upai_step_target: stepTarget,
      upai_water: water, upai_water_target: waterTarget,
      upai_calories: calories, upai_calorie_target: calorieTarget,
      upai_sleep: sleep, upai_sleep_target: sleepTarget,
      upai_user_weight: userWeight,
      upai_study_sessions: studySessions, upai_study_target: studyTarget,
      upai_tasks: tasks, upai_homework: homework, upai_events: events,
      upai_exercise_logs: exerciseLogs, upai_chat: chat.slice(-60),
      upai_outfit: outfit, upai_recipe: recipe,
      upai_media_url: mediaUrl, upai_media_type: mediaType,
      upai_period_date: periodDate, upai_period_cycle: periodCycle,
      upai_brain_dump: brainDump, upai_volume: volume,
      upai_snoozed: snoozed, upai_last_date: today,
    };
    Object.entries(store).forEach(([k, v]) => ls.set(k, v));

    if (syncIdRef.current && bootstrapped.current) {
      clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => { runSync(true); }, 12000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, theme, moodIdx, provider, apiKey, model, syncUrl, steps, stepTarget, water, waterTarget,
      calories, calorieTarget, sleep, sleepTarget, userWeight, studySessions, studyTarget,
      tasks, homework, events, exerciseLogs, chat, outfit, recipe, mediaUrl, mediaType,
      periodDate, periodCycle, brainDump, volume, snoozed]);

  /* daily history snapshot */
  useEffect(() => {
    saveDailySnapshot({
      steps, stepTarget, water, waterTarget, calories, calorieTarget,
      sleep, sleepTarget, totalStudyHours, studyTarget, mood,
      exerciseCalories: exerciseLogs.filter((l) => l.date === today).reduce((s, l) => s + (l.calories || 0), 0),
      tasksDone: tasks.filter((x) => x.done).length,
      homeworkDone: homework.filter((x) => x.done).length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, water, calories, sleep, totalStudyHours, mood, exerciseLogs, tasks, homework]);

  /* audio */
  useEffect(() => {
    if (audioOn && t.sounds?.[track]) playSound(t.sounds[track], volume);
    else stopSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioOn, track, theme]);

  useEffect(() => { setVolume(volume); }, [volume]);

  /* sync bootstrap */
  useEffect(() => {
    let cancelled = false;
    if (!apiKey) { syncIdRef.current = null; return; }
    deriveSyncId(apiKey).then((id) => {
      if (cancelled) return;
      syncIdRef.current = id;
      if (!bootstrapped.current && syncConfigured()) {
        bootstrapped.current = true;
        setTimeout(() => runSync(true), 1500);
      } else {
        bootstrapped.current = true;
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, syncUrl]);

  /* schedule OS-level reminders whenever the data changes */
  useEffect(() => {
    if (notifPerm !== "granted") return;
    const reminders = buildReminders({
      tasks, homework, events,
      metrics: { waterTarget, stepTarget, studyTarget },
      language,
    });
    scheduleBatch(reminders, swReg);
  }, [notifPerm, tasks, homework, events, waterTarget, stepTarget, studyTarget, language, swReg]);

  /* in-app alerts + blinking indicator */
  useEffect(() => {
    const tick = () => {
      setBlink(hasPendingAlerts({ tasks, homework, events }));
      const due = collectDueAlerts({ tasks, homework, events, language, snoozedUntil: snoozed });
      setAlerts(due.filter((a) => !dismissed[a.id]));
    };
    tick();
    const iv = setInterval(tick, 20000);
    return () => clearInterval(iv);
  }, [tasks, homework, events, language, snoozed, dismissed]);

  /* UPA's live commentary */
  useEffect(() => {
    const lines = [];
    if (steps < stepTarget / 2) lines.push(`🏃 ${steps}/${stepTarget}`);
    if (water < waterTarget) lines.push(`💧 ${water}/${waterTarget}`);
    if (totalStudyHours < studyTarget) lines.push(`📚 ${totalStudyHours}/${studyTarget}h`);
    const pt = tasks.filter((x) => !x.done).length;
    const ph = homework.filter((x) => !x.done).length;
    if (pt) lines.push(`📋 ${pt}`);
    if (ph) lines.push(`📝 ${ph}`);

    if (!lines.length) { setUpaComment("✨"); setUpaMood("happy"); }
    else { setUpaComment(lines.join("  ·  ")); setUpaMood(lines.length > 3 ? "angry" : "neutral"); }
  }, [steps, stepTarget, water, waterTarget, totalStudyHours, studyTarget, tasks, homework]);

  /* ═══ handlers ══════════════════════════════════════════════════ */

  const runSync = useCallback(async (silent = false) => {
    if (!syncIdRef.current) {
      if (!silent) { setSyncState("fail"); setSyncMsg(T.chat.noApiKey); setTimeout(() => setSyncState("idle"), 4000); }
      return;
    }
    if (!silent) { setSyncState("busy"); setSyncMsg(""); }
    try {
      const changed = await fullSync(syncIdRef.current);
      if (changed) {
        setTasks(ls.get("upai_tasks", []));
        setHomework(ls.get("upai_homework", []));
        setEvents(ls.get("upai_events", []));
        setExerciseLogs(ls.get("upai_exercise_logs", []));
        setStudySessions(ls.get("upai_study_sessions", []));
        setSteps(ls.get("upai_steps", 0));
        setWater(ls.get("upai_water", 0));
        setCalories(ls.get("upai_calories", 0));
        setSleep(ls.get("upai_sleep", 0));
      }
      const ts = Date.now();
      setLastSync(ts);
      if (!silent) { setSyncState("ok"); setTimeout(() => setSyncState("idle"), 3000); }
    } catch (e) {
      if (!silent) { setSyncState("fail"); setSyncMsg(e.message); setTimeout(() => setSyncState("idle"), 5000); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [T]);

  const enableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPerm(perm);
  };

  /* UPA writes into the app */
  const handleActions = useCallback((actions) => {
    const { next, log } = applyActions(actions, {
      tasks, homework, events, studySessions, exerciseLogs,
      metrics: { steps, water, calories, sleep },
      goals: { stepTarget, waterTarget, calorieTarget, sleepTarget, studyTarget },
    });

    setTasks(next.tasks);
    setHomework(next.homework);
    setEvents(next.events);
    setStudySessions(next.studySessions);
    setExerciseLogs(next.exerciseLogs);

    if (next.metrics.steps !== steps) setSteps(next.metrics.steps);
    if (next.metrics.water !== water) setWater(next.metrics.water);
    if (next.metrics.calories !== calories) setCalories(next.metrics.calories);
    if (next.metrics.sleep !== sleep) setSleep(next.metrics.sleep);

    if (next.goals.stepTarget !== stepTarget) setStepTarget(next.goals.stepTarget);
    if (next.goals.waterTarget !== waterTarget) setWaterTarget(next.goals.waterTarget);
    if (next.goals.calorieTarget !== calorieTarget) setCalorieTarget(next.goals.calorieTarget);
    if (next.goals.sleepTarget !== sleepTarget) setSleepTarget(next.goals.sleepTarget);
    if (next.goals.studyTarget !== studyTarget) setStudyTarget(next.goals.studyTarget);

    return log;
  }, [tasks, homework, events, studySessions, exerciseLogs, steps, water, calories, sleep,
      stepTarget, waterTarget, calorieTarget, sleepTarget, studyTarget]);

  /* context handed to UPA on every message.
     Keyed to the minute, not the second, so the ticking clock does not
     rebuild this string (and every callback depending on it) 60x a minute. */
  const clockLabel = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  const contextSummary = useMemo(() => {
    const openTasks = tasks.filter((x) => !x.done).slice(0, 12)
      .map((x) => `${x.text} @${x.time} [${x.priority}]`).join("; ") || "—";
    const openHw = homework.filter((x) => !x.done).slice(0, 12)
      .map((x) => `${x.subject} → ${x.dueDate} [${x.priority}]`).join("; ") || "—";
    const todayEvents = events.filter((e) => e.date === today).slice(0, 12)
      .map((e) => `${e.time} ${e.title}`).join("; ") || "—";

    return [
      "Sen UPA'sın: Beril'in laboratuvar asistanı. Kısa, net, sıcak ama abartısız konuş.",
      `Bugün: ${today}. Saat: ${clockLabel}.`,
      `Adım ${steps}/${stepTarget} · Su ${water}/${waterTarget} · Uyku ${sleep}/${sleepTarget}sa · Kalori ${calories}/${calorieTarget} · Çalışma ${totalStudyHours}/${studyTarget}sa`,
      `Açık görevler: ${openTasks}`,
      `Açık ödevler: ${openHw}`,
      `Bugünkü takvim: ${todayEvents}`,
      `Ruh hali: ${mood}`,
    ].join("\n");
  }, [tasks, homework, events, today, clockLabel, steps, stepTarget, water, waterTarget,
      sleep, sleepTarget, calories, calorieTarget, totalStudyHours, studyTarget, mood]);

  const snoozeAlert = (id, minutes) => {
    setSnoozed((prev) => ({ ...prev, [id]: Date.now() + minutes * 60000 }));
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };
  const dismissAlert = (id) => {
    setDismissed((prev) => ({ ...prev, [id]: true }));
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };
  const completeAlert = (a) => {
    if (a.kind === "task") setTasks((prev) => prev.map((x) => (x.id === a.refId ? { ...x, done: true } : x)));
    if (a.kind === "homework") setHomework((prev) => prev.map((x) => (x.id === a.refId ? { ...x, done: true } : x)));
    dismissAlert(a.id);
  };

  const reportToUpa = async () => {
    if (!apiKey) { setTab("chat"); return; }
    const q = {
      tr: `Bugünkü verilerim: Adım ${steps}/${stepTarget}, Su ${water}/${waterTarget}, Çalışma ${totalStudyHours}/${studyTarget}sa, Uyku ${sleep}/${sleepTarget}sa, Kalori ${calories}/${calorieTarget}. Kısa bir analiz yap ve tek bir somut öneri ver.`,
      en: `Today: steps ${steps}/${stepTarget}, water ${water}/${waterTarget}, study ${totalStudyHours}/${studyTarget}h, sleep ${sleep}/${sleepTarget}h, calories ${calories}/${calorieTarget}. Give a short analysis and one concrete suggestion.`,
      ja: `今日のデータ: 歩数 ${steps}/${stepTarget}、水分 ${water}/${waterTarget}、勉強 ${totalStudyHours}/${studyTarget}時間、睡眠 ${sleep}/${sleepTarget}時間、カロリー ${calories}/${calorieTarget}。短く分析して、具体的な提案を1つください。`,
    }[language];

    setTab("chat");
    setChat((prev) => [...prev, { role: "user", content: q }]);
    setUpaThinking(true);
    try {
      const r = await callAI({ provider, apiKey, model, language, messages: [{ role: "user", content: q }], systemPrompt: contextSummary, maxTokens: 600 });
      setChat((prev) => [...prev, { role: "upa", content: r }]);
    } catch (e) {
      setChat((prev) => [...prev, { role: "upa", content: `⚠️ ${e.message}`, isError: true }]);
    } finally { setUpaThinking(false); }
  };

  const generate = async (kind) => {
    if (!apiKey) return;
    setGenBusy(kind);
    const prompts = {
      outfit: { tr: `Ruh halim: ${mood}. Bugün için pratik bir kombin öner. 2 cümle.`, en: `My mood: ${mood}. Suggest a practical outfit for today. 2 sentences.`, ja: `気分: ${mood}。今日の実用的なコーデを2文で提案してください。` },
      recipe: { tr: `Kalorim ${calories}/${calorieTarget}. Hızlı ve besleyici bir atıştırmalık öner. 2 cümle.`, en: `Calories ${calories}/${calorieTarget}. Suggest a quick nourishing snack. 2 sentences.`, ja: `カロリー ${calories}/${calorieTarget}。手軽で栄養のある軽食を2文で提案してください。` },
    };
    try {
      const r = await callAI({ provider, apiKey, model, language, messages: [{ role: "user", content: prompts[kind][language] }], maxTokens: 300 });
      kind === "outfit" ? setOutfit(r) : setRecipe(r);
    } catch (e) {
      kind === "outfit" ? setOutfit(`⚠️ ${e.message}`) : setRecipe(`⚠️ ${e.message}`);
    } finally { setGenBusy(null); }
  };

  const embedUrl = (url, type) => {
    if (!url) return "";
    if (type === "youtube") {
      const v = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
      if (v) return `https://www.youtube.com/embed/${v[1]}`;
      const l = url.match(/list=([A-Za-z0-9_-]+)/);
      if (l) return `https://www.youtube.com/embed/videoseries?list=${l[1]}`;
      return "";
    }
    if (!url.includes("open.spotify.com")) return "";
    return url.replace(/\/(track|playlist|album|episode|show)\//, "/embed/$1/").split("?")[0];
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ tasks, homework, events, exerciseLogs, studySessions, history: ls.get("upai_history", {}) }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `upai-backup-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  /* ═══ styles ════════════════════════════════════════════════════ */
  const S = {
    app: { background: t.bg, color: t.text, fontFamily: t.font, minHeight: "100vh", transition: "background .3s, color .3s" },
    surface: { background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "16px" },
    surface2: { background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "12px" },
    btn: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "7px 11px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" },
    btnAccent: { background: t.accent, border: `1px solid ${t.accentBright}`, color: "#fff", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontWeight: "bold", fontSize: "13px", fontFamily: "inherit" },
    btnDanger: { background: t.danger, border: "none", color: "#fff", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "11px" },
    input: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "8px 10px", outline: "none", width: "100%", fontSize: "14px", boxSizing: "border-box", fontFamily: "inherit" },
    label: { fontSize: "11px", color: t.textMuted, marginBottom: "3px", display: "block", fontWeight: "bold" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", padding: "16px" },
  };

  const TABS = [
    { id: "chat", icon: "🤖", label: T.tabs.chat },
    { id: "calendar", icon: "📅", label: T.tabs.calendar },
    { id: "tasks", icon: "📋", label: T.tabs.tasks, badge: tasks.filter((x) => !x.done).length },
    { id: "homework", icon: "📝", label: T.tabs.homework, badge: homework.filter((x) => !x.done).length },
    { id: "exercise", icon: "💪", label: T.tabs.exercise },
    { id: "goals", icon: "🎯", label: T.tabs.goals },
    { id: "pomodoro", icon: "⏱", label: T.tabs.pomodoro },
    { id: "schedule", icon: "🗓", label: T.tabs.schedule },
    { id: "lifestyle", icon: "✨", label: T.tabs.lifestyle },
    { id: "history", icon: "📊", label: T.tabs.history },
    { id: "period", icon: "🌸", label: T.tabs.period },
  ];

  const [newTask, setNewTask] = useState({ text: "", time: "", priority: "medium" });
  const [newSession, setNewSession] = useState({ label: "", hours: "", minutes: "" });

  const addTask = () => {
    if (!newTask.text.trim()) return;
    setTasks((prev) => [...prev, { id: Date.now(), text: newTask.text.trim(), time: newTask.time || "12:00", date: today, priority: newTask.priority, done: false }]);
    setNewTask({ text: "", time: "", priority: "medium" });
  };

  const providerInfo = API_PROVIDERS.find((p) => p.id === provider) || API_PROVIDERS[0];
  const syncLabel = { idle: T.settings.syncNow, busy: T.settings.syncing, ok: T.settings.syncOk, fail: T.settings.syncFail }[syncState];

  return (
    <div style={S.app}>
      <style>{`
        @keyframes upaBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes redBlink{0%,100%{opacity:1;box-shadow:0 0 10px #ff2222,0 0 4px #ff2222}50%{opacity:.25;box-shadow:none}}
        .upa-float{animation:upaBounce 3.5s ease-in-out infinite}
        .upa-talking{animation:upaBounce .45s ease-in-out infinite}
        .blink-dot{animation:redBlink 1s ease-in-out infinite}
        input[type=range]{accent-color:${t.accent}}
        input,select,textarea,button{font-family:inherit}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:${t.bg}}
        ::-webkit-scrollbar-thumb{background:${t.border};border-radius:3px}
        .tabbar::-webkit-scrollbar{display:none}
        .tabbar{scrollbar-width:none;-ms-overflow-style:none}
        @media(max-width:900px){
          .main-grid{grid-template-columns:1fr!important}
          .right-panel{position:static!important;order:-1}
          .right-panel>div{position:static!important}
          .planner-grid{grid-template-columns:1fr!important}
          .metric-grid{grid-template-columns:1fr 1fr!important}
          .life-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:480px){
          .header-controls select{max-width:74px}
          .metric-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      <NotificationCenter
        t={t} T={T} alerts={alerts}
        onSnooze={snoozeAlert} onDismiss={dismissAlert} onComplete={completeAlert}
      />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{
        ...S.surface, margin: 0, borderRadius: "0 0 18px 18px",
        padding: "10px 14px", paddingTop: "calc(10px + env(safe-area-inset-top, 0px))",
        display: "flex", flexWrap: "wrap", gap: "8px",
        alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 300,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <span style={{ fontSize: "15px", fontWeight: "bold", color: t.accentBright }}>🧪 UPAI</span>
          {blink && <span className="blink-dot" title={T.notif.overdueTitle}
            style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff2222", display: "inline-block", flexShrink: 0 }} />}
          <span style={{ fontFamily: t.fontMono, fontSize: "13px", color: t.accentBright }}>
            {now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div className="header-controls" style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            style={{ ...S.input, width: "auto", fontSize: "11px", padding: "5px 6px" }}>
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.flag} {l.id.toUpperCase()}</option>)}
          </select>
          <select value={moodIdx} onChange={(e) => setMoodIdx(Number(e.target.value))}
            style={{ ...S.input, width: "auto", fontSize: "11px", padding: "5px 6px" }}>
            {moods.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}
            style={{ ...S.input, width: "auto", fontSize: "11px", padding: "5px 6px" }}>
            {Object.entries(THEMES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
          <button onClick={() => setFogOpen(true)} style={{ ...S.btn, background: t.accent, color: "#fff" }}>🧘</button>
          <button onClick={() => setShowSettings((v) => !v)} style={S.btn}>⚙️</button>
        </div>
      </div>

      {/* ── SETTINGS ───────────────────────────────────────────── */}
      {showSettings && (
        <div style={{ padding: "14px 14px 0" }}>
          <div style={{ ...S.surface, borderColor: t.accentBright }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ color: t.accentBright, margin: 0, fontSize: "15px" }}>⚙️ {T.settings.title}</h3>
              <button onClick={() => setShowSettings(false)} style={S.btn}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
              <div>
                <label style={S.label}>{T.settings.provider}</label>
                <select value={provider} onChange={(e) => {
                  const p = e.target.value;
                  setProvider(p);
                  setModel(API_PROVIDERS.find((x) => x.id === p)?.defaultModel || "");
                }} style={S.input}>
                  {API_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>{T.settings.apiKey}</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value.trim())}
                  style={S.input} placeholder="sk-... / AIza..." autoComplete="off" />
              </div>
              <div>
                <label style={S.label}>{T.settings.model}</label>
                <input value={model} onChange={(e) => setModel(e.target.value.trim())}
                  style={S.input} placeholder={providerInfo.defaultModel} />
              </div>
              <div>
                <label style={S.label}>{T.settings.weight}</label>
                <input type="number" min="25" max="250" value={userWeight}
                  onChange={(e) => setUserWeight(Number(e.target.value) || 55)} style={S.input} />
              </div>
            </div>

            <div style={{ fontSize: "10px", color: t.textMuted, marginTop: "8px", lineHeight: 1.6 }}>
              {providerInfo.hint}
            </div>

            {/* Sync */}
            <div style={{ ...S.surface2, marginTop: "14px", borderColor: t.accentBright + "55" }}>
              <h4 style={{ margin: "0 0 5px", color: t.accentBright, fontSize: "13px" }}>☁️ {T.settings.syncTitle}</h4>
              <p style={{ margin: "0 0 10px", fontSize: "11px", color: t.textMuted, lineHeight: 1.55 }}>{T.settings.syncInfo}</p>
              <label style={S.label}>{T.settings.syncUrl}</label>
              <input value={syncUrl} onChange={(e) => setSyncUrl(e.target.value.trim())}
                style={{ ...S.input, marginBottom: "5px" }} placeholder="https://upai-lifehub.netlify.app" />
              <div style={{ fontSize: "10px", color: t.textMuted, marginBottom: "10px" }}>{T.settings.syncUrlHint}</div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={() => runSync(false)} disabled={syncState === "busy" || !apiKey} style={S.btnAccent}>
                  ☁️ {syncLabel}
                </button>
                {lastSync > 0 && (
                  <span style={{ fontSize: "10px", color: t.textMuted }}>
                    {T.settings.lastSync}: {new Date(lastSync).toLocaleString(locale, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
              {syncMsg && <div style={{ fontSize: "11px", color: t.danger, marginTop: "7px" }}>{syncMsg}</div>}
              {!syncConfigured() && (
                <div style={{ fontSize: "10px", color: t.textMuted, marginTop: "7px" }}>
                  ℹ️ {syncBase() ? "" : T.settings.syncUrlHint}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div style={{ ...S.surface2, marginTop: "12px" }}>
              <h4 style={{ margin: "0 0 8px", color: t.accentBright, fontSize: "13px" }}>🔔 {T.settings.notifTitle}</h4>
              {notifPerm === "granted"
                ? <span style={{ fontSize: "12px", color: t.accentBright }}>✅ {T.settings.notifActive}</span>
                : notifPerm === "denied"
                  ? <span style={{ fontSize: "12px", color: t.danger }}>⚠️ {T.settings.notifDenied}</span>
                  : <button onClick={enableNotifications} style={S.btnAccent}>🔔 {T.settings.enableNotif}</button>}
              <div style={{ fontSize: "10px", color: t.textMuted, marginTop: "8px", lineHeight: 1.6 }}>{T.tasks.leadHint}</div>
            </div>

            {/* Data */}
            <div style={{ ...S.surface2, marginTop: "12px" }}>
              <h4 style={{ margin: "0 0 8px", color: t.accentBright, fontSize: "13px" }}>💾 {T.settings.dangerZone}</h4>
              <button onClick={exportData} style={S.btn}>⬇️ {T.settings.exportData}</button>
            </div>

            <div style={{ marginTop: "14px", textAlign: "right" }}>
              <button onClick={() => setShowSettings(false)} style={S.btnAccent}>✓ {T.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── BRAIN FOG ──────────────────────────────────────────── */}
      {fogOpen && (
        <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && setFogOpen(false)}>
          <div style={{ position: "relative", width: "min(420px, 100%)", ...S.surface, borderRadius: "20px", padding: "22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
            <button onClick={() => setFogOpen(false)} style={{ position: "absolute", top: "10px", right: "10px", ...S.btnDanger, borderRadius: "50%", padding: "4px 9px" }}>✕</button>
            <h2 style={{ color: t.accentBright, margin: 0, fontSize: "17px" }}>🧠 {T.brainFog.title}</h2>
            <div style={{ position: "relative", width: "150px", height: "150px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", width: `${breath.size}%`, height: `${breath.size}%`, borderRadius: "50%", border: `4px solid ${t.accentBright}`, transition: "all 4s ease-in-out", boxShadow: `0 0 25px ${t.accent}` }} />
              <span style={{ fontSize: "12px", fontWeight: "bold", zIndex: 2, textAlign: "center" }}>{breath.phase}</span>
            </div>
            <textarea value={brainDump} onChange={(e) => setBrainDump(e.target.value)}
              placeholder={T.brainFog.dumpPlaceholder} style={{ ...S.input, height: "92px", resize: "none" }} />
            <button onClick={() => setFogOpen(false)} style={{ ...S.btnAccent, width: "100%" }}>{T.brainFog.back} ✨</button>
          </div>
        </div>
      )}

      {/* ── MAIN ───────────────────────────────────────────────── */}
      <div className="main-grid" style={{
        display: "grid", gridTemplateColumns: "minmax(0,1fr) 290px", gap: "14px",
        padding: "14px", paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
        maxWidth: "1400px", margin: "0 auto",
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: "12px" }}>
            <StudyTips t={t} T={T} provider={provider} apiKey={apiKey} model={model} language={language} />
          </div>

          {/* tab bar */}
          <div className="tabbar" style={{ display: "flex", gap: "5px", overflowX: "auto", marginBottom: "14px", paddingBottom: "4px", WebkitOverflowScrolling: "touch" }}>
            {TABS.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{
                ...S.btn, whiteSpace: "nowrap", flexShrink: 0,
                display: "flex", alignItems: "center", gap: "5px",
                ...(tab === tb.id ? { background: t.accent, color: "#fff", fontWeight: "bold", borderColor: t.accentBright } : {}),
              }}>
                <span>{tb.icon}</span><span>{tb.label}</span>
                {tb.badge > 0 && (
                  <span style={{ background: tab === tb.id ? "rgba(255,255,255,.3)" : t.danger, color: "#fff", borderRadius: "9px", padding: "0 5px", fontSize: "10px", minWidth: "16px", textAlign: "center" }}>
                    {tb.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "chat" && (
            <ChatTab
              t={t} T={T} language={language}
              provider={provider} apiKey={apiKey} model={model}
              messages={chat} setMessages={setChat}
              contextSummary={contextSummary}
              onActions={handleActions}
              onThinkingChange={setUpaThinking}
            />
          )}

          {tab === "calendar" && (
            <CalendarTab t={t} T={T} language={language} events={events} setEvents={setEvents} />
          )}

          {tab === "homework" && (
            <HomeworkTab t={t} T={T} language={language} homework={homework} setHomework={setHomework} />
          )}

          {tab === "exercise" && (
            <ExerciseTab
              t={t} T={T} language={language}
              exerciseLogs={exerciseLogs} setExerciseLogs={setExerciseLogs}
              userWeight={userWeight} provider={provider} apiKey={apiKey} model={model}
              onAddCalories={(v) => setCalories((c) => c + v)}
            />
          )}

          {tab === "pomodoro" && <Pomodoro t={t} T={T} />}

          {tab === "schedule" && (
            <SchedulePlanner
              t={t} T={T} language={language}
              provider={provider} apiKey={apiKey} model={model}
              studySessions={studySessions} tasks={tasks} homework={homework}
              studyTarget={studyTarget} mood={mood} onActions={handleActions}
            />
          )}

          {tab === "history" && <HistoryView t={t} T={T} language={language} />}

          {/* ── TASKS ── */}
          {tab === "tasks" && (
            <div style={S.surface}>
              <h3 style={{ color: t.accentBright, margin: "0 0 14px", fontSize: "15px" }}>📋 {T.tasks.title}</h3>
              <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
                <input value={newTask.text} onChange={(e) => setNewTask((p) => ({ ...p, text: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder={T.tasks.newTask} style={{ ...S.input, flex: "1 1 140px", minWidth: 0 }} />
                <input type="time" value={newTask.time} onChange={(e) => setNewTask((p) => ({ ...p, time: e.target.value }))}
                  style={{ ...S.input, width: "108px" }} />
                <select value={newTask.priority} onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value }))}
                  style={{ ...S.input, width: "auto" }}>
                  {Object.entries(T.tasks.priorities).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button onClick={addTask} style={S.btnAccent}>{T.add}</button>
              </div>

              {tasks.length === 0 ? (
                <div style={{ textAlign: "center", color: t.textMuted, padding: "30px", fontSize: "13px" }}>{T.tasks.empty}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  {[...tasks].sort((a, b) => (a.done !== b.done ? (a.done ? 1 : -1) : (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2) || (a.time || "").localeCompare(b.time || ""))).map((task) => (
                    <div key={task.id} style={{ ...S.surface2, display: "flex", alignItems: "center", gap: "8px", borderLeft: `3px solid ${PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium}`, opacity: task.done ? 0.6 : 1 }}>
                      <input type="checkbox" checked={!!task.done}
                        onChange={() => setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)))}
                        style={{ width: "16px", height: "16px", accentColor: t.accent, flexShrink: 0, cursor: "pointer" }} />
                      <input value={task.text}
                        onChange={(e) => { const v = e.target.value; setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, text: v } : x))); }}
                        style={{ ...S.input, border: "none", background: "transparent", padding: 0, flex: 1, minWidth: 0, fontSize: "13px", textDecoration: task.done ? "line-through" : "none" }} />
                      <select value={task.priority || "medium"}
                        onChange={(e) => { const v = e.target.value; setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, priority: v } : x))); }}
                        style={{ ...S.input, width: "auto", fontSize: "10px", padding: "3px 4px", border: "none", background: "transparent", color: PRIORITY_COLOR[task.priority] }}>
                        {Object.entries(T.tasks.priorities).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <input type="time" value={task.time || "12:00"}
                        onChange={(e) => { const v = e.target.value; setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, time: v } : x))); }}
                        style={{ ...S.input, border: "none", background: "transparent", width: "64px", padding: 0, fontSize: "11px" }} />
                      <button onClick={() => setTasks((prev) => prev.filter((x) => x.id !== task.id))} style={S.btnDanger}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: "12px", fontSize: "10px", color: t.textMuted, lineHeight: 1.6 }}>💡 {T.tasks.leadHint}</div>
            </div>
          )}

          {/* ── GOALS ── */}
          {tab === "goals" && (
            <div style={S.surface}>
              <h3 style={{ color: t.accentBright, margin: "0 0 14px", fontSize: "15px" }}>🎯 {T.goals.title}</h3>

              <div style={{ ...S.surface2, marginBottom: "16px", borderColor: t.accent }}>
                <h4 style={{ margin: "0 0 9px", color: t.accentBright, fontSize: "13px" }}>📚 {T.goals.sessionTitle}</h4>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "8px", marginBottom: "9px" }}>
                  <div><label style={S.label}>{T.goals.name}</label>
                    <input value={newSession.label} onChange={(e) => setNewSession((p) => ({ ...p, label: e.target.value }))} style={S.input} /></div>
                  <div><label style={S.label}>{T.goals.hours}</label>
                    <input type="number" min="0" max="24" value={newSession.hours} onChange={(e) => setNewSession((p) => ({ ...p, hours: e.target.value }))} style={S.input} /></div>
                  <div><label style={S.label}>{T.goals.minutes}</label>
                    <input type="number" min="0" max="59" value={newSession.minutes} onChange={(e) => setNewSession((p) => ({ ...p, minutes: e.target.value }))} style={S.input} /></div>
                </div>
                <button onClick={() => {
                  if (!newSession.label.trim()) return;
                  setStudySessions((prev) => [...prev, { id: Date.now(), label: newSession.label.trim(), hours: Number(newSession.hours) || 0, minutes: Number(newSession.minutes) || 0 }]);
                  setNewSession({ label: "", hours: "", minutes: "" });
                }} style={{ ...S.btnAccent, width: "100%" }}>{T.goals.saveSession} ⏱</button>

                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "5px" }}>
                  {studySessions.map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: t.bg, padding: "7px 11px", borderRadius: "8px", gap: "8px" }}>
                      <span style={{ fontSize: "12px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                        📖 <strong>{s.label}</strong> · {s.hours}h {s.minutes}m
                      </span>
                      <button onClick={() => setStudySessions((prev) => prev.filter((x) => x.id !== s.id))} style={S.btnDanger}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="metric-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                {[
                  { key: "steps", label: `🏃 ${T.goals.steps}`, value: steps, set: setSteps, target: stepTarget, setT: setStepTarget, tl: T.goals.target },
                  { key: "study", label: `📚 ${T.goals.study}`, value: totalStudyHours, readOnly: true, target: studyTarget, setT: setStudyTarget, tl: T.goals.target },
                  { key: "water", label: `💧 ${T.goals.water}`, value: water, set: setWater, target: waterTarget, setT: setWaterTarget, tl: T.goals.target },
                  { key: "cal", label: `🍕 ${T.goals.calories}`, value: calories, set: setCalories, target: calorieTarget, setT: setCalorieTarget, tl: T.goals.limit },
                  { key: "sleep", label: `😴 ${T.goals.sleep}`, value: sleep, set: setSleep, target: sleepTarget, setT: setSleepTarget, tl: T.goals.target },
                ].map((m) => (
                  <div key={m.key} style={S.surface2}>
                    <h4 style={{ margin: "0 0 7px", color: t.accent, fontSize: "12px" }}>{m.label}</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      <div>
                        <label style={S.label}>{T.goals.current}</label>
                        {m.readOnly
                          ? <div style={{ ...S.input, background: t.bg }}>{m.value}</div>
                          : <input type="number" min="0" value={m.value} onChange={(e) => m.set(Math.max(0, Number(e.target.value) || 0))} style={S.input} />}
                      </div>
                      <div>
                        <label style={S.label}>{m.tl}</label>
                        <input type="number" min="1" value={m.target} onChange={(e) => m.setT(Math.max(1, Number(e.target.value) || 1))} style={S.input} />
                      </div>
                    </div>
                    <div style={{ marginTop: "6px", background: t.border, borderRadius: "4px", height: "5px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, (m.value / (m.target || 1)) * 100)}%`, background: t.accentBright, height: "100%", transition: "width .4s" }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "13px", textAlign: "right" }}>
                <button onClick={reportToUpa} style={S.btnAccent} disabled={!apiKey}>📊 {T.goals.report}</button>
              </div>
            </div>
          )}

          {/* ── LIFESTYLE ── */}
          {tab === "lifestyle" && (
            <div style={S.surface}>
              <h3 style={{ color: t.accentBright, margin: "0 0 14px", fontSize: "15px" }}>🎵 {T.lifestyle.title}</h3>
              <div style={{ ...S.surface2, marginBottom: "14px" }}>
                <h4 style={{ margin: "0 0 9px", fontSize: "13px" }}>🎵 {T.lifestyle.player}</h4>
                <div style={{ display: "flex", gap: "7px", marginBottom: "9px", flexWrap: "wrap" }}>
                  <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} style={{ ...S.input, width: "auto" }}>
                    <option value="spotify">Spotify</option>
                    <option value="youtube">YouTube</option>
                  </select>
                  <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder={T.lifestyle.link} style={{ ...S.input, flex: "1 1 160px", minWidth: 0 }} />
                </div>
                {embedUrl(mediaUrl, mediaType) && (
                  <div style={{ borderRadius: "10px", overflow: "hidden" }}>
                    <iframe src={embedUrl(mediaUrl, mediaType)} width="100%"
                      height={mediaType === "youtube" ? 200 : 152} frameBorder="0" allowFullScreen
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy" title="media" style={{ display: "block", border: "none" }} />
                  </div>
                )}
              </div>

              <div className="life-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {[
                  { key: "outfit", icon: "👗", title: T.lifestyle.outfit, value: outfit },
                  { key: "recipe", icon: "🍳", title: T.lifestyle.recipe, value: recipe },
                ].map((c) => (
                  <div key={c.key} style={S.surface2}>
                    <h4 style={{ margin: "0 0 7px", color: t.accentBright, fontSize: "13px" }}>{c.icon} {c.title}</h4>
                    {c.value
                      ? <p style={{ padding: "9px", background: t.bg, borderRadius: "8px", fontSize: "12px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{c.value}</p>
                      : <p style={{ color: t.textMuted, fontStyle: "italic", fontSize: "12px", margin: 0 }}>{T.lifestyle.none}</p>}
                    <button onClick={() => generate(c.key)} disabled={genBusy === c.key || !apiKey}
                      style={{ ...S.btnAccent, width: "100%", marginTop: "9px" }}>
                      {genBusy === c.key ? "…" : `${T.lifestyle.suggest} ✨`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PERIOD ── */}
          {tab === "period" && (
            <div style={S.surface}>
              <h3 style={{ color: t.accentBright, margin: "0 0 14px", fontSize: "15px" }}>🌸 {T.period.title}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                <div><label style={S.label}>{T.period.lastStart}</label>
                  <input type="date" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} style={S.input} /></div>
                <div><label style={S.label}>{T.period.cycleLength}</label>
                  <input type="number" min="15" max="60" value={periodCycle} onChange={(e) => setPeriodCycle(Number(e.target.value) || 28)} style={S.input} /></div>
              </div>
              {periodDate && (() => {
                const d = new Date(periodDate + "T12:00:00");
                if (Number.isNaN(d.getTime())) return null;
                d.setDate(d.getDate() + periodCycle);
                const days = Math.ceil((d - new Date()) / 86400000);
                return (
                  <div style={{ ...S.surface2, marginTop: "13px", borderLeft: `4px solid ${t.accent}` }}>
                    {T.period.nextEstimate}: <strong style={{ color: t.accent }}>{d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}</strong>
                    {days >= 0 && <span style={{ color: t.textMuted, fontSize: "12px" }}> · {days}d</span>}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────── */}
        <div className="right-panel" style={{ minWidth: 0 }}>
          <div style={{ ...S.surface, textAlign: "center", position: "sticky", top: "72px" }}>
            <div className={upaThinking ? "upa-talking" : "upa-float"} style={{ display: "inline-block" }}>
              <UpaSVG theme={theme} mood={upaMood} onClick={reportToUpa} isAnimating={upaThinking} />
            </div>
            <h4 style={{ margin: "6px 0 2px", color: t.accentBright, fontSize: "14px" }}>UPA</h4>
            <div style={{ fontSize: "10px", color: t.textMuted, marginBottom: "10px" }}>{T.stats.member}</div>

            <div style={{ ...S.surface2, textAlign: "left", marginBottom: "10px" }}>
              {[
                { e: "🏃", l: T.stats.steps, v: steps, g: stepTarget },
                { e: "💧", l: T.stats.glasses, v: water, g: waterTarget },
                { e: "📚", l: T.stats.study, v: `${totalStudyHours}h`, g: `${studyTarget}h` },
                { e: "😴", l: T.stats.sleep, v: `${sleep}h`, g: `${sleepTarget}h` },
                { e: "🍕", l: T.stats.kcal, v: calories, g: calorieTarget },
              ].map((r) => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "5px" }}>
                  <span>{r.e} {r.l}</span>
                  <span style={{ color: t.accentBright }}>{r.v} / {r.g}</span>
                </div>
              ))}
            </div>

            <div style={{ background: t.surface2, padding: "9px", borderRadius: "10px", fontSize: "11px", textAlign: "left", border: `1px dashed ${t.accent}`, marginBottom: "10px", wordBreak: "break-word" }}>
              <strong style={{ color: t.accent }}>💬 </strong>{upaComment}
            </div>

            {syncState !== "idle" && (
              <div style={{ fontSize: "10px", marginBottom: "8px", color: syncState === "ok" ? t.accentBright : syncState === "fail" ? t.danger : t.textMuted }}>
                ☁️ {syncLabel}
              </div>
            )}

            <button onClick={reportToUpa} disabled={!apiKey}
              style={{ ...S.btn, width: "100%", borderColor: t.accentBright, opacity: apiKey ? 1 : 0.5 }}>
              ⚡ {T.stats.analyze}
            </button>
          </div>
        </div>
      </div>

      {/* ── AUDIO BAR (fixed, safe-area aware) ──────────────────── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: t.surface, borderTop: `1px solid ${t.border}`,
        borderRadius: "14px 14px 0 0",
        padding: "9px 12px",
        paddingBottom: "calc(9px + env(safe-area-inset-bottom, 0px))",
        display: "flex", alignItems: "center", gap: "8px",
        zIndex: 250, boxShadow: "0 -4px 20px rgba(0,0,0,.5)",
        flexWrap: "nowrap", overflowX: "auto",
      }} className="tabbar">
        <button onClick={() => setAudioOn((v) => !v)} style={{ ...S.btnAccent, flexShrink: 0, padding: "7px 13px" }}>
          {audioOn ? "⏸" : "▶"}
        </button>
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {(t.sounds || []).map((sound, i) => (
            <button key={i} onClick={() => { setTrack(i); setAudioOn(true); }}
              style={{ ...S.btn, fontSize: "10px", padding: "5px 8px", whiteSpace: "nowrap", flexShrink: 0, ...(track === i && audioOn ? { background: t.accent, color: "#fff" } : {}) }}>
              {sound.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginLeft: "auto", flexShrink: 0 }}>
          <span style={{ fontSize: "12px" }}>🔊</span>
          <input type="range" min="0" max="100" value={volume}
            onChange={(e) => setVol(Number(e.target.value))} style={{ width: "68px" }} />
        </div>
      </div>
    </div>
  );
}
