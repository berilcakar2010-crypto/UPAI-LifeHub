import React, { useState, useMemo } from "react";
import { loadHistory } from "../utils/storage";
import { localeOf } from "../i18n";

export default function HistoryView({ t, T, language }) {
  const H = T.history;
  const locale = localeOf(language);
  const [view, setView] = useState("weekly");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const history = useMemo(() => loadHistory(), []);

  const s = {
    card: { background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "16px" },
    surface2: { background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "12px" },
    btn: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" },
    input: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "7px 10px", outline: "none", fontSize: "13px", fontFamily: "inherit" },
    dayCard: { background: t.bg, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "9px", fontSize: "12px", minWidth: 0 },
  };

  const months = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 0; i < 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString(locale, { year: "numeric", month: "long" }),
      });
    }
    return out;
  }, [locale]);

  const monthEntries = useMemo(
    () => Object.entries(history).filter(([d]) => d.startsWith(month)).sort(([a], [b]) => a.localeCompare(b)),
    [history, month]
  );

  const weekEntries = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-CA");
      out.push({
        date: key,
        label: d.toLocaleDateString(locale, { weekday: "short", day: "numeric" }),
        data: history[key] || null,
      });
    }
    return out;
  }, [history, locale]);

  const Bar = ({ value, target, label, emoji }) => {
    const pct = target ? Math.min(100, Math.round(((value || 0) / target) * 100)) : 0;
    const color = pct >= 100 ? t.accentBright : pct >= 50 ? t.accent : t.danger;
    return (
      <div style={{ marginBottom: "5px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: t.textMuted, marginBottom: "2px", gap: "4px" }}>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emoji} {label}</span>
          <span style={{ color, flexShrink: 0 }}>{value ?? "?"}/{target ?? "?"}</span>
        </div>
        <div style={{ background: t.border, borderRadius: "4px", height: "4px", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, background: color, height: "100%", transition: "width .4s" }} />
        </div>
      </div>
    );
  };

  const DayCard = ({ dateKey, label, data }) => (
    <div style={s.dayCard}>
      <div style={{ fontWeight: "bold", color: t.accentBright, marginBottom: "7px", fontSize: "12px" }}>{label || dateKey}</div>
      {data ? (
        <>
          <Bar value={data.steps} target={data.stepTarget} label={H.steps} emoji="🏃" />
          <Bar value={data.water} target={data.waterTarget} label={H.water} emoji="💧" />
          <Bar value={data.calories} target={data.calorieTarget} label={H.calories} emoji="🍕" />
          <Bar value={data.totalStudyHours} target={data.studyTarget} label={H.study} emoji="📚" />
          {data.sleep != null && <Bar value={data.sleep} target={data.sleepTarget || 8} label={H.sleep} emoji="😴" />}
          {data.exerciseCalories > 0 && (
            <div style={{ fontSize: "10px", color: t.accentBright, marginTop: "4px" }}>🔥 {data.exerciseCalories} kcal</div>
          )}
          {data.mood && <div style={{ fontSize: "10px", color: t.textMuted, marginTop: "3px" }}>{data.mood}</div>}
        </>
      ) : (
        <div style={{ color: t.textMuted, fontSize: "10px", fontStyle: "italic" }}>{H.noData}</div>
      )}
    </div>
  );

  return (
    <div style={s.card}>
      <h3 style={{ color: t.accentBright, margin: "0 0 14px", fontSize: "15px" }}>📊 {H.title}</h3>

      <div style={{ display: "flex", gap: "7px", marginBottom: "14px", alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setView("weekly")}
          style={{ ...s.btn, ...(view === "weekly" ? { background: t.accent, color: "#fff", fontWeight: "bold" } : {}) }}>
          📅 {H.weekly}
        </button>
        <button onClick={() => setView("monthly")}
          style={{ ...s.btn, ...(view === "monthly" ? { background: t.accent, color: "#fff", fontWeight: "bold" } : {}) }}>
          🗓 {H.monthly}
        </button>
        {view === "monthly" && (
          <select value={month} onChange={(e) => setMonth(e.target.value)} style={s.input}>
            {months.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        )}
      </div>

      {view === "weekly" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))", gap: "7px" }}>
          {weekEntries.map((e) => <DayCard key={e.date} dateKey={e.date} label={e.label} data={e.data} />)}
        </div>
      ) : (
        <>
          <div style={{ color: t.textMuted, fontSize: "11px", marginBottom: "11px" }}>
            {monthEntries.length} {H.found}
          </div>
          {monthEntries.length === 0 ? (
            <div style={{ ...s.surface2, color: t.textMuted, textAlign: "center", padding: "26px", fontSize: "12px" }}>
              {H.noMonthData}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "9px" }}>
              {monthEntries.map(([date, data]) => (
                <DayCard key={date} dateKey={date}
                  label={new Date(date + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" })}
                  data={data} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
