import React, { useState, useMemo } from "react";
import { localeOf } from "../i18n";
import { PRIORITY_COLOR, PRIORITY_ORDER } from "../utils/notifications";

const toISO = (d) => d.toLocaleDateString("en-CA");

export default function HomeworkTab({ t, T, language, homework, setHomework }) {
  const H = T.homework;
  const locale = localeOf(language);
  const today = toISO(new Date());
  const tomorrow = toISO(new Date(Date.now() + 86400000));

  const OTHER = H.subjects[H.subjects.length - 1];
  const [draft, setDraft] = useState({ subject: H.subjects[0], custom: "", description: "", dueDate: today, priority: "medium" });
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("pending");

  const S = {
    surface: { background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "16px" },
    surface2: { background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "12px" },
    btn: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "12px" },
    btnAccent: { background: t.accent, border: `1px solid ${t.accentBright}`, color: "#fff", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
    input: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "8px 10px", outline: "none", width: "100%", fontSize: "14px", boxSizing: "border-box" },
    label: { fontSize: "11px", color: t.textMuted, marginBottom: "3px", display: "block", fontWeight: "bold" },
  };

  const add = () => {
    const subject = draft.subject === OTHER ? draft.custom.trim() : draft.subject;
    if (!subject || !draft.dueDate) return;
    setHomework((prev) => [...prev, {
      id: Date.now(),
      subject,
      description: draft.description.trim(),
      dueDate: draft.dueDate,
      priority: draft.priority,
      done: false,
      createdAt: Date.now(),
    }]);
    setDraft({ subject: H.subjects[0], custom: "", description: "", dueDate: today, priority: "medium" });
    setShowForm(false);
  };

  const toggle = (id) => setHomework((prev) => prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h)));
  const remove = (id) => setHomework((prev) => prev.filter((h) => h.id !== id));

  const statusOf = (hw) => {
    if (hw.done) return "done";
    if (hw.dueDate < today) return "overdue";
    if (hw.dueDate === today) return "today";
    if (hw.dueDate === tomorrow) return "tomorrow";
    return "upcoming";
  };

  const filtered = useMemo(() => {
    const list = homework.filter((hw) => {
      if (filter === "pending") return !hw.done;
      if (filter === "done") return hw.done;
      if (filter === "overdue") return !hw.done && hw.dueDate < today;
      return true;
    });
    return list.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const byDate = (a.dueDate || "").localeCompare(b.dueDate || "");
      if (byDate !== 0) return byDate;
      return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
    });
  }, [homework, filter, today]);

  const pendingCount = homework.filter((h) => !h.done).length;
  const overdueCount = homework.filter((h) => !h.done && h.dueDate < today).length;

  return (
    <div style={S.surface}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <h3 style={{ color: t.accentBright, margin: 0, fontSize: "15px" }}>📝 {H.title}</h3>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          {overdueCount > 0 && (
            <span style={{ background: t.danger, color: "#fff", padding: "3px 9px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}>
              ⚠️ {overdueCount} {H.overdue.toLocaleLowerCase(locale)}
            </span>
          )}
          {pendingCount > 0 && (
            <span style={{ background: t.accent + "33", color: t.accentBright, padding: "3px 9px", borderRadius: "10px", fontSize: "11px" }}>
              {pendingCount} {T.tasks.pending}
            </span>
          )}
          <button onClick={() => setShowForm((v) => !v)} style={S.btnAccent}>{showForm ? "✕" : `+ ${H.add}`}</button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...S.surface2, marginBottom: "14px", borderColor: t.accent }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={S.label}>{H.selectSubject}</label>
              <select value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))} style={S.input}>
                {H.subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>{T.tasks.priority}</label>
              <select value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))} style={S.input}>
                {Object.entries(T.tasks.priorities).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          {draft.subject === OTHER && (
            <div style={{ marginBottom: "10px" }}>
              <label style={S.label}>{H.customSubject}</label>
              <input value={draft.custom} onChange={(e) => setDraft((d) => ({ ...d, custom: e.target.value }))} style={S.input} />
            </div>
          )}
          <div style={{ marginBottom: "10px" }}>
            <label style={S.label}>{H.description}</label>
            <input value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              style={S.input} onKeyDown={(e) => e.key === "Enter" && add()} />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={S.label}>{H.dueDate}</label>
            <input type="date" value={draft.dueDate} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} style={S.input} />
          </div>
          <button onClick={add} style={{ ...S.btnAccent, width: "100%" }}>{T.add}</button>
        </div>
      )}

      <div style={{ display: "flex", gap: "5px", marginBottom: "12px", flexWrap: "wrap" }}>
        {Object.entries(H.filters).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{ ...S.btn, ...(filter === k ? { background: t.accent, color: "#fff", fontWeight: "bold" } : {}) }}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: t.textMuted, padding: "34px 16px", fontSize: "13px" }}>{H.empty}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((hw) => {
            const status = statusOf(hw);
            const accent = status === "overdue" ? t.danger
              : status === "today" ? t.accentBright
              : PRIORITY_COLOR[hw.priority] || PRIORITY_COLOR.medium;
            return (
              <div key={hw.id} style={{ ...S.surface2, borderLeft: `4px solid ${accent}`, opacity: hw.done ? 0.6 : 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <input type="checkbox" checked={hw.done} onChange={() => toggle(hw.id)}
                    style={{ width: "17px", height: "17px", accentColor: t.accent, flexShrink: 0, marginTop: "2px", cursor: "pointer" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "bold", fontSize: "13px", color: t.accentBright, textDecoration: hw.done ? "line-through" : "none" }}>
                        {hw.subject}
                      </span>
                      <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "9px", background: (PRIORITY_COLOR[hw.priority] || "#888") + "33", color: PRIORITY_COLOR[hw.priority] || "#888", fontWeight: "bold" }}>
                        {T.tasks.priorities[hw.priority] || hw.priority}
                      </span>
                      {status === "overdue" && <span style={{ fontSize: "10px", color: t.danger, fontWeight: "bold" }}>⚠️ {H.overdue}</span>}
                      {status === "today" && <span style={{ fontSize: "10px", color: t.accentBright, fontWeight: "bold" }}>📌 {H.dueToday}</span>}
                      {status === "tomorrow" && <span style={{ fontSize: "10px", color: t.textMuted }}>{H.dueTomorrow}</span>}
                    </div>
                    {hw.description && <div style={{ fontSize: "12px", color: t.textMuted, marginTop: "3px" }}>{hw.description}</div>}
                    <div style={{ fontSize: "10px", color: t.textMuted, marginTop: "3px" }}>
                      📅 {new Date(hw.dueDate + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "long", weekday: "short" })}
                    </div>
                  </div>
                  <button onClick={() => remove(hw.id)}
                    style={{ background: t.danger, border: "none", color: "#fff", borderRadius: "6px", padding: "4px 9px", cursor: "pointer", fontSize: "11px" }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
