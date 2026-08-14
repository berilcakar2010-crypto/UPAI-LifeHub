import React, { useState, useMemo } from "react";
import { localeOf } from "../i18n";

const TYPE_COLORS = {
  study: "#4ade80", exam: "#ff4444", task: "#ffcc00",
  personal: "#a78bfa", other: "#94a3b8",
};
const TYPE_ICONS = { study: "📚", exam: "📝", task: "✅", personal: "🌸", other: "•" };

const toISO = (d) => d.toLocaleDateString("en-CA");

export default function CalendarTab({ t, T, language, events, setEvents }) {
  const today = toISO(new Date());
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ title: "", time: "09:00", endTime: "", eventType: "study", notes: "" });

  const C = T.calendar;
  const locale = localeOf(language);

  const S = {
    surface: { background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "16px" },
    surface2: { background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "12px" },
    btn: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontSize: "13px" },
    btnAccent: { background: t.accent, border: `1px solid ${t.accentBright}`, color: "#fff", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
    input: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "8px 10px", outline: "none", width: "100%", fontSize: "14px", boxSizing: "border-box" },
    label: { fontSize: "11px", color: t.textMuted, marginBottom: "3px", display: "block", fontWeight: "bold" },
  };

  /* Build the month grid, Monday-first. */
  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Mon = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(toISO(new Date(year, month, d)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const byDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (!e?.date) return;
      (map[e.date] = map[e.date] || []).push(e);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => (a.time || "").localeCompare(b.time || "")));
    return map;
  }, [events]);

  const dayEvents = byDate[selected] || [];

  const addEvent = () => {
    if (!draft.title.trim()) return;
    setEvents((prev) => [...prev, {
      id: Date.now(),
      title: draft.title.trim(),
      date: selected,
      time: draft.time || "09:00",
      endTime: draft.endTime || "",
      eventType: draft.eventType,
      notes: draft.notes.trim(),
      source: "manual",
    }]);
    setDraft({ title: "", time: "09:00", endTime: "", eventType: "study", notes: "" });
    setShowForm(false);
  };

  const shiftMonth = (delta) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  const monthLabel = `${C.months[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const upcoming = useMemo(
    () => events.filter((e) => e.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5),
    [events, today]
  );

  return (
    <div style={S.surface}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <h3 style={{ color: t.accentBright, margin: 0, fontSize: "15px" }}>📅 {C.title}</h3>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button onClick={() => shiftMonth(-1)} style={S.btn}>‹</button>
          <span style={{ fontSize: "13px", fontWeight: "bold", minWidth: "120px", textAlign: "center" }}>{monthLabel}</span>
          <button onClick={() => shiftMonth(1)} style={S.btn}>›</button>
          <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(today); }} style={S.btn}>
            {C.today}
          </button>
        </div>
      </div>

      {/* weekday header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "3px" }}>
        {C.days.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "10px", color: t.textMuted, fontWeight: "bold", padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      {/* month grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "14px" }}>
        {grid.map((iso, i) => {
          if (!iso) return <div key={i} />;
          const evs = byDate[iso] || [];
          const isToday = iso === today;
          const isSelected = iso === selected;
          const dayNum = Number(iso.split("-")[2]);
          return (
            <button
              key={i}
              onClick={() => setSelected(iso)}
              style={{
                aspectRatio: "1 / 1",
                background: isSelected ? t.accent : isToday ? t.accent + "33" : t.surface2,
                border: `1px solid ${isToday ? t.accentBright : t.border}`,
                borderRadius: "8px",
                color: isSelected ? "#fff" : t.text,
                cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: "2px", padding: "2px",
                fontSize: "12px",
                fontWeight: isToday || isSelected ? "bold" : "normal",
                minHeight: "36px",
              }}
            >
              <span>{dayNum}</span>
              {evs.length > 0 && (
                <span style={{ display: "flex", gap: "2px" }}>
                  {evs.slice(0, 3).map((e, k) => (
                    <span key={k} style={{ width: "4px", height: "4px", borderRadius: "50%", background: TYPE_COLORS[e.eventType] || TYPE_COLORS.other, display: "inline-block" }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* selected day */}
      <div style={{ ...S.surface2, marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <strong style={{ fontSize: "13px", color: t.accentBright }}>
            {new Date(selected + "T12:00:00").toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
          </strong>
          <button onClick={() => setShowForm((v) => !v)} style={S.btnAccent}>
            {showForm ? "✕" : `+ ${C.addEvent}`}
          </button>
        </div>

        {showForm && (
          <div style={{ background: t.bg, borderRadius: "10px", padding: "12px", marginBottom: "12px", border: `1px solid ${t.accent}` }}>
            <div style={{ marginBottom: "8px" }}>
              <label style={S.label}>{C.eventTitle}</label>
              <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                style={S.input} placeholder={C.eventTitle} onKeyDown={(e) => e.key === "Enter" && addEvent()} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
              <div>
                <label style={S.label}>{C.startTime}</label>
                <input type="time" value={draft.time} onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))} style={S.input} />
              </div>
              <div>
                <label style={S.label}>{C.endTime}</label>
                <input type="time" value={draft.endTime} onChange={(e) => setDraft((d) => ({ ...d, endTime: e.target.value }))} style={S.input} />
              </div>
              <div>
                <label style={S.label}>{C.type}</label>
                <select value={draft.eventType} onChange={(e) => setDraft((d) => ({ ...d, eventType: e.target.value }))} style={S.input}>
                  {Object.entries(C.types).map(([k, v]) => <option key={k} value={k}>{TYPE_ICONS[k]} {v}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={S.label}>{C.notes}</label>
              <input value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} style={S.input} placeholder="..." />
            </div>
            <button onClick={addEvent} style={{ ...S.btnAccent, width: "100%" }}>{T.add}</button>
          </div>
        )}

        {dayEvents.length === 0 ? (
          <div style={{ color: t.textMuted, fontSize: "12px", fontStyle: "italic", padding: "10px 0" }}>{C.noEvents}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {dayEvents.map((ev) => (
              <div key={ev.id} style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: t.bg, borderRadius: "8px", padding: "9px 12px",
                borderLeft: `3px solid ${TYPE_COLORS[ev.eventType] || TYPE_COLORS.other}`,
              }}>
                <span style={{ fontSize: "12px", fontFamily: t.fontMono, color: t.accentBright, minWidth: "44px" }}>{ev.time}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: "bold" }}>
                    {TYPE_ICONS[ev.eventType]} {ev.title}
                    {ev.source === "upa" && <span style={{ fontSize: "9px", color: t.textMuted, marginLeft: "6px" }}>· UPA</span>}
                  </div>
                  {(ev.endTime || ev.notes) && (
                    <div style={{ fontSize: "11px", color: t.textMuted }}>
                      {ev.endTime ? `${ev.time}–${ev.endTime}` : ""}{ev.endTime && ev.notes ? " · " : ""}{ev.notes}
                    </div>
                  )}
                </div>
                <button onClick={() => setEvents((prev) => prev.filter((e) => e.id !== ev.id))}
                  style={{ background: t.danger, border: "none", color: "#fff", borderRadius: "6px", padding: "4px 9px", cursor: "pointer", fontSize: "11px" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* upcoming */}
      {upcoming.length > 0 && (
        <div style={S.surface2}>
          <div style={{ fontSize: "12px", fontWeight: "bold", color: t.accentBright, marginBottom: "8px" }}>⏭ {T.tabs.calendar}</div>
          {upcoming.map((ev) => (
            <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "3px 0", color: t.textMuted }}>
              <span>{TYPE_ICONS[ev.eventType]} {ev.title}</span>
              <span>{new Date(ev.date + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" })} {ev.time}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "10px", fontSize: "11px", color: t.textMuted, fontStyle: "italic" }}>💡 {C.upaHint}</div>
    </div>
  );
}
