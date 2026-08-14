import React, { useState } from "react";
import { callAI } from "../utils/aiClient";
import { parseActions, describeLog } from "../utils/upaActions";

export default function SchedulePlanner({
  t, T, language, provider, apiKey, model,
  studySessions, tasks, homework, studyTarget, mood, onActions,
}) {
  const [daily, setDaily] = useState("");
  const [weekly, setWeekly] = useState("");
  const [busy, setBusy] = useState(null);
  const [applied, setApplied] = useState([]);

  const s = {
    card: { background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "16px" },
    surface2: { background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "12px" },
    btnAccent: { background: t.accent, border: `1px solid ${t.accentBright}`, color: "#fff", borderRadius: "8px", padding: "7px 13px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" },
    btn: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontSize: "12px" },
    pre: { background: t.bg, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "12px", fontSize: "12px", lineHeight: "1.7", color: t.text, whiteSpace: "pre-wrap", fontFamily: t.fontMono, marginTop: "9px", maxHeight: "340px", overflowY: "auto" },
  };

  const context = [
    `Dersler: ${studySessions.map((x) => `${x.label} (${x.hours}sa ${x.minutes}dk)`).join(", ") || "—"}`,
    `Günlük çalışma hedefi: ${studyTarget} saat`,
    `Açık görevler: ${tasks.filter((x) => !x.done).map((x) => `${x.text} (${x.time})`).join(", ") || "—"}`,
    `Açık ödevler: ${homework.filter((x) => !x.done).map((x) => `${x.subject} → ${x.dueDate}`).join(", ") || "—"}`,
    `Ruh hali: ${mood}`,
  ].join("\n");

  const run = async (kind, writeToCalendar) => {
    if (!apiKey) { const msg = T.chat.noApiKey; kind === "daily" ? setDaily(msg) : setWeekly(msg); return; }
    setBusy(kind + (writeToCalendar ? "-cal" : ""));
    setApplied([]);
    try {
      const ask = kind === "daily"
        ? "Bugün için 07:00–23:00 arası saat bazlı bir günlük program çıkar. Her bloğu 1-2 satırda açıkla."
        : "Bu hafta Pazartesi–Pazar için bir çalışma ve yaşam programı çıkar. Her gün ana blokları kısaca yaz.";
      const extra = writeToCalendar
        ? " Ayrıca bu programı takvimime de işle: önce ilgili günlerin mevcut etkinliklerini temizle, sonra her blok için bir etkinlik ekle."
        : "";

      const raw = await callAI({
        provider, apiKey, model, language,
        systemPrompt: "Sen UPA adında bir çalışma asistanısın. Kısa, pratik, gerçekçi programlar yaparsın. Abartılı ifade kullanma.",
        messages: [{ role: "user", content: `${context}\n\n${ask}${extra}` }],
        allowActions: writeToCalendar,
        maxTokens: 2500,
      });

      const { text, actions } = parseActions(raw);
      if (actions.length && onActions) {
        const log = onActions(actions);
        setApplied(describeLog(log, T));
      }
      kind === "daily" ? setDaily(text) : setWeekly(text);
    } catch (e) {
      const msg = `⚠️ ${e.message}`;
      kind === "daily" ? setDaily(msg) : setWeekly(msg);
    } finally { setBusy(null); }
  };

  const Panel = ({ kind, title, value }) => (
    <div style={s.surface2}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "6px", flexWrap: "wrap" }}>
        <h4 style={{ margin: 0, color: t.accent, fontSize: "13px" }}>{title}</h4>
        <div style={{ display: "flex", gap: "5px" }}>
          <button onClick={() => run(kind, false)} style={s.btn} disabled={!!busy}>
            {busy === kind ? "…" : "⚡"}
          </button>
          <button onClick={() => run(kind, true)} style={s.btnAccent} disabled={!!busy} title={T.calendar.title}>
            {busy === `${kind}-cal` ? "…" : `📅 ${T.calendar.title}`}
          </button>
        </div>
      </div>
      {value
        ? <pre style={s.pre}>{value}</pre>
        : <div style={{ color: t.textMuted, fontSize: "11px", fontStyle: "italic" }}>⚡ = sadece göster · 📅 = takvime işle</div>}
    </div>
  );

  return (
    <div style={s.card}>
      <h3 style={{ color: t.accentBright, margin: "0 0 14px", fontSize: "15px" }}>📅 UPA {T.tabs.schedule}</h3>

      {applied.length > 0 && (
        <div style={{ ...s.surface2, marginBottom: "12px", borderColor: t.accent }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", color: t.accentBright, marginBottom: "5px" }}>⚙️ {T.chat.actionsApplied}</div>
          {applied.slice(0, 12).map((line, i) => (
            <div key={i} style={{ fontSize: "11px", color: t.textMuted, lineHeight: 1.6 }}>• {line}</div>
          ))}
          {applied.length > 12 && <div style={{ fontSize: "11px", color: t.textMuted }}>… +{applied.length - 12}</div>}
        </div>
      )}

      <div className="planner-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <Panel kind="daily" title={`☀️ ${T.tabs.schedule}`} value={daily} />
        <Panel kind="weekly" title="📆 7d" value={weekly} />
      </div>
    </div>
  );
}
