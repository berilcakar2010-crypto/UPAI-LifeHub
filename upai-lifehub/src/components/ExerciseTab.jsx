import React, { useState, useMemo } from "react";
import { localeOf } from "../i18n";
import { estimateExerciseCalories, estimateFoodCalories } from "../utils/aiClient";

/* MET values, indexed to match T.exercise.types order. */
const MET = [7.0, 3.5, 6.0, 7.0, 5.0, 8.5, 2.5, 11.0, 4.5, 3.0, 4.0];
const ICONS = ["🏃", "🚶", "🚴", "🏊", "🏋️", "⚡", "🧘", "🪢", "💃", "🤸", "💪"];

const toISO = (d) => d.toLocaleDateString("en-CA");

export default function ExerciseTab({
  t, T, language, exerciseLogs, setExerciseLogs,
  userWeight, provider, apiKey, model, onAddCalories,
}) {
  const E = T.exercise;
  const locale = localeOf(language);
  const today = toISO(new Date());

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ typeIdx: 0, custom: "", duration: "", sets: "", reps: "", notes: "" });
  const [aiResult, setAiResult] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const [food, setFood] = useState("");
  const [foodResult, setFoodResult] = useState("");
  const [foodBusy, setFoodBusy] = useState(false);
  const [error, setError] = useState("");

  const S = {
    surface: { background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "16px" },
    surface2: { background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "12px" },
    btn: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "12px" },
    btnAccent: { background: t.accent, border: `1px solid ${t.accentBright}`, color: "#fff", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
    input: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "8px 10px", outline: "none", width: "100%", fontSize: "14px", boxSizing: "border-box" },
    label: { fontSize: "11px", color: t.textMuted, marginBottom: "3px", display: "block", fontWeight: "bold" },
  };

  const isOther = draft.typeIdx === E.types.length - 1;
  const typeName = isOther ? draft.custom.trim() : E.types[draft.typeIdx];

  const metCalories = useMemo(() => {
    const mins = Number(draft.duration);
    if (!mins || mins <= 0) return 0;
    const met = MET[draft.typeIdx] ?? 4.0;
    return Math.round(met * (userWeight || 65) * (mins / 60));
  }, [draft.typeIdx, draft.duration, userWeight]);

  const add = () => {
    const mins = Number(draft.duration);
    if (!typeName || !mins || mins <= 0) return;
    setExerciseLogs((prev) => [...prev, {
      id: Date.now(),
      type: typeName,
      typeIdx: draft.typeIdx,
      duration: mins,
      sets: draft.sets ? Number(draft.sets) : null,
      reps: draft.reps ? Number(draft.reps) : null,
      notes: draft.notes.trim(),
      calories: metCalories,
      date: today,
      weight: userWeight,
    }]);
    setDraft({ typeIdx: 0, custom: "", duration: "", sets: "", reps: "", notes: "" });
    setAiResult("");
    setShowForm(false);
  };

  const runAiEstimate = async () => {
    if (!apiKey || !typeName || !draft.duration) return;
    setAiBusy(true); setAiResult(""); setError("");
    try {
      const r = await estimateExerciseCalories({
        provider, apiKey, model, language,
        exercise: typeName, duration: Number(draft.duration), weight: userWeight || 65,
      });
      setAiResult(r);
    } catch (e) { setError(e.message); }
    finally { setAiBusy(false); }
  };

  const checkFood = async () => {
    if (!apiKey || !food.trim()) return;
    setFoodBusy(true); setFoodResult(""); setError("");
    try {
      const r = await estimateFoodCalories({ provider, apiKey, model, language, food: food.trim() });
      setFoodResult(r);
    } catch (e) { setError(e.message); }
    finally { setFoodBusy(false); }
  };

  const todayLogs = exerciseLogs.filter((l) => l.date === today);
  const todayBurned = todayLogs.reduce((s, l) => s + (l.calories || 0), 0);
  const days = useMemo(
    () => [...new Set(exerciseLogs.map((l) => l.date))].sort().reverse().slice(0, 10),
    [exerciseLogs]
  );

  const iconFor = (log) => ICONS[log.typeIdx] || "💪";

  return (
    <div style={S.surface}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <h3 style={{ color: t.accentBright, margin: 0, fontSize: "15px" }}>💪 {E.title}</h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ background: t.accent + "33", color: t.accentBright, padding: "4px 11px", borderRadius: "11px", fontSize: "12px", fontWeight: "bold" }}>
            🔥 {todayBurned} kcal
          </span>
          <button onClick={() => setShowForm((v) => !v)} style={S.btnAccent}>{showForm ? "✕" : `+ ${E.log}`}</button>
        </div>
      </div>

      {error && (
        <div style={{ background: t.danger + "22", border: `1px solid ${t.danger}`, borderRadius: "8px", padding: "8px 10px", fontSize: "12px", marginBottom: "10px" }}>
          ⚠️ {error}
        </div>
      )}

      {showForm && (
        <div style={{ ...S.surface2, marginBottom: "14px", borderColor: t.accent }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={S.label}>{E.type}</label>
              <select value={draft.typeIdx} onChange={(e) => setDraft((d) => ({ ...d, typeIdx: Number(e.target.value) }))} style={S.input}>
                {E.types.map((name, i) => <option key={name} value={i}>{ICONS[i]} {name}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>{E.duration}</label>
              <input type="number" min="1" max="600" value={draft.duration}
                onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))} style={S.input} placeholder="30" />
            </div>
          </div>

          {isOther && (
            <div style={{ marginBottom: "10px" }}>
              <label style={S.label}>{E.type}</label>
              <input value={draft.custom} onChange={(e) => setDraft((d) => ({ ...d, custom: e.target.value }))} style={S.input} />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={S.label}>{E.sets}</label>
              <input type="number" min="1" value={draft.sets} onChange={(e) => setDraft((d) => ({ ...d, sets: e.target.value }))} style={S.input} placeholder="—" />
            </div>
            <div>
              <label style={S.label}>{E.reps}</label>
              <input type="number" min="1" value={draft.reps} onChange={(e) => setDraft((d) => ({ ...d, reps: e.target.value }))} style={S.input} placeholder="—" />
            </div>
            <div>
              <label style={S.label}>{E.notes}</label>
              <input value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} style={S.input} placeholder="..." />
            </div>
          </div>

          {metCalories > 0 && (
            <div style={{ background: t.bg, borderRadius: "8px", padding: "8px 11px", marginBottom: "10px", fontSize: "12px" }}>
              📐 {E.metEstimate}: <strong style={{ color: t.accentBright }}>~{metCalories} kcal</strong>
              <span style={{ color: t.textMuted, marginLeft: "6px" }}>({userWeight} kg)</span>
            </div>
          )}

          {aiResult && (
            <div style={{ background: t.accent + "22", border: `1px solid ${t.accent}`, borderRadius: "8px", padding: "10px", marginBottom: "10px", fontSize: "12px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
              🤖 {aiResult}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            {apiKey && (
              <button onClick={runAiEstimate} disabled={aiBusy || !draft.duration || !typeName} style={{ ...S.btn, flex: 1 }}>
                {aiBusy ? E.estimating : `🤖 ${E.aiEstimate}`}
              </button>
            )}
            <button onClick={add} disabled={!typeName || !draft.duration} style={{ ...S.btnAccent, flex: 1 }}>{T.add}</button>
          </div>
        </div>
      )}

      {/* Food calorie lookup — informational only, never auto-logged */}
      <div style={{ ...S.surface2, marginBottom: "14px", borderColor: t.accentBright + "55" }}>
        <h4 style={{ margin: "0 0 6px", color: t.accentBright, fontSize: "13px" }}>🍽️ {E.foodTitle}</h4>
        <p style={{ margin: "0 0 9px", fontSize: "11px", color: t.textMuted, lineHeight: 1.5 }}>ℹ️ {E.foodDisclaimer}</p>
        <div style={{ display: "flex", gap: "8px", marginBottom: foodResult ? "10px" : 0 }}>
          <input value={food} onChange={(e) => setFood(e.target.value)} onKeyDown={(e) => e.key === "Enter" && checkFood()}
            placeholder={E.foodPlaceholder} style={{ ...S.input, flex: 1 }} />
          <button onClick={checkFood} disabled={foodBusy || !apiKey || !food.trim()} style={S.btnAccent}>
            {foodBusy ? "…" : "🔍"}
          </button>
        </div>
        {!apiKey && <p style={{ fontSize: "11px", color: t.danger, margin: "6px 0 0" }}>⚠️ {T.tips.needKey}</p>}
        {foodResult && (
          <div style={{ background: t.bg, border: `1px solid ${t.accent}55`, borderRadius: "8px", padding: "11px", fontSize: "12px", lineHeight: "1.65", whiteSpace: "pre-wrap" }}>
            {foodResult}
            {onAddCalories && (
              <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <input type="number" min="0" placeholder="kcal" id="upai-manual-kcal"
                  style={{ ...S.input, width: "90px" }} />
                <button
                  onClick={() => {
                    const el = document.getElementById("upai-manual-kcal");
                    const v = Number(el?.value);
                    if (v > 0) { onAddCalories(v); if (el) el.value = ""; }
                  }}
                  style={S.btn}
                >
                  ➕ {E.addManually}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* history */}
      {exerciseLogs.length === 0 ? (
        <div style={{ textAlign: "center", color: t.textMuted, padding: "26px", fontSize: "13px" }}>{E.empty}</div>
      ) : (
        days.map((day) => {
          const logs = exerciseLogs.filter((l) => l.date === day);
          const total = logs.reduce((s, l) => s + (l.calories || 0), 0);
          const isToday = day === today;
          return (
            <div key={day} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: isToday ? t.accentBright : t.textMuted }}>
                  {isToday ? `📅 ${T.calendar.today}` : new Date(day + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "short", weekday: "short" })}
                </span>
                <span style={{ fontSize: "11px", color: t.accentBright }}>🔥 {total} kcal</span>
              </div>
              {logs.map((log) => (
                <div key={log.id} style={{ ...S.surface2, display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px", padding: "9px 12px" }}>
                  <span style={{ fontSize: "18px" }}>{iconFor(log)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: "bold" }}>{log.type}</div>
                    <div style={{ fontSize: "10px", color: t.textMuted }}>
                      ⏱ {log.duration} {E.duration.match(/\((.*?)\)/)?.[1] || "dk"}
                      {log.sets ? ` · ${log.sets}×${log.reps || "?"}` : ""}
                      {log.notes ? ` · ${log.notes}` : ""}
                    </div>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: t.accentBright }}>🔥 {log.calories}</span>
                  <button onClick={() => setExerciseLogs((prev) => prev.filter((l) => l.id !== log.id))}
                    style={{ background: t.danger, border: "none", color: "#fff", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "11px" }}>✕</button>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
