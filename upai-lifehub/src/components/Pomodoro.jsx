import React, { useState, useEffect, useRef, useMemo } from "react";

export default function Pomodoro({ t, T }) {
  const P = T.pomodoro;
  const [mode, setMode] = useState("pomodoro");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60);
  const [sessions, setSessions] = useState(0);
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [blockDuration, setBlockDuration] = useState(90);
  const intervalRef = useRef(null);

  const PRESETS = useMemo(() => ({
    pomodoro: Math.max(1, customWork) * 60,
    short: Math.max(1, customBreak) * 60,
    long: 15 * 60,
    block: Math.max(1, blockDuration) * 60,
  }), [customWork, customBreak, blockDuration]);

  const LABELS = useMemo(() => ({
    pomodoro: `${P.modes.pomodoro} (${customWork})`,
    short: `${P.modes.short} (${customBreak})`,
    long: `${P.modes.long} (15)`,
    block: `${P.modes.block} (${blockDuration})`,
  }), [P, customWork, customBreak, blockDuration]);

  useEffect(() => {
    setSeconds(PRESETS[mode]);
    setRunning(false);
  }, [mode, PRESETS]);

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          if (mode === "pomodoro" || mode === "block") setSessions((n) => n + 1);
          try {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`⏱ UPAI — ${P.finished}`, {
                body: `${LABELS[mode]} ${P.finishedBody}`,
                icon: "./icon-192.png",
              });
            }
          } catch {}
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, mode, LABELS, P]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const total = PRESETS[mode] || 1;
  const pct = ((total - seconds) / total) * 100;
  const R = 70, CIRC = 2 * Math.PI * R;

  const s = {
    card: { background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "16px" },
    surface2: { background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "12px" },
    btn: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" },
    btnAccent: { background: t.accent, border: `1px solid ${t.accentBright}`, color: "#fff", borderRadius: "8px", padding: "9px 24px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "inherit" },
    input: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "8px 10px", outline: "none", width: "100%", fontSize: "14px", boxSizing: "border-box" },
    label: { fontSize: "11px", color: t.textMuted, marginBottom: "3px", display: "block", fontWeight: "bold" },
  };

  return (
    <div style={s.card}>
      <h3 style={{ color: t.accentBright, margin: "0 0 14px", fontSize: "15px" }}>⏱ {P.title}</h3>

      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "16px" }}>
        {Object.keys(PRESETS).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            style={{ ...s.btn, ...(mode === m ? { background: t.accent, color: "#fff", fontWeight: "bold" } : {}) }}>
            {LABELS[m]}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "18px" }}>
        <div style={{ position: "relative", width: "160px", height: "160px", marginBottom: "14px" }}>
          <svg viewBox="0 0 160 160" width="160" height="160" style={{ position: "absolute", inset: 0 }}>
            <circle cx="80" cy="80" r={R} fill="none" stroke={t.border} strokeWidth="8" />
            <circle cx="80" cy="80" r={R} fill="none" stroke={t.accentBright} strokeWidth="8"
              strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct / 100)}
              strokeLinecap="round" transform="rotate(-90 80 80)"
              style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "31px", fontWeight: "bold", color: t.text, fontFamily: t.fontMono }}>{fmt(seconds)}</div>
            <div style={{ fontSize: "10px", color: t.textMuted, textAlign: "center", padding: "0 12px" }}>{LABELS[mode]}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setRunning((v) => !v)} style={s.btnAccent}>
            {running ? `⏸ ${P.pause}` : `▶ ${P.start}`}
          </button>
          <button onClick={() => { setRunning(false); setSeconds(PRESETS[mode]); }} style={s.btn}>↺ {P.reset}</button>
        </div>

        <div style={{ marginTop: "11px", color: t.textMuted, fontSize: "12px" }}>
          {P.completed}: <strong style={{ color: t.accentBright }}>{sessions}</strong>
        </div>
      </div>

      <div style={s.surface2}>
        <div style={{ fontSize: "12px", color: t.accentBright, fontWeight: "bold", marginBottom: "9px" }}>{P.customTitle}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "9px" }}>
          <div>
            <label style={s.label}>{P.work}</label>
            <input type="number" min="1" max="120" value={customWork}
              onChange={(e) => setCustomWork(Math.max(1, Number(e.target.value) || 1))} style={s.input} />
          </div>
          <div>
            <label style={s.label}>{P.brk}</label>
            <input type="number" min="1" max="60" value={customBreak}
              onChange={(e) => setCustomBreak(Math.max(1, Number(e.target.value) || 1))} style={s.input} />
          </div>
          <div>
            <label style={s.label}>{P.block}</label>
            <input type="number" min="10" max="240" value={blockDuration}
              onChange={(e) => setBlockDuration(Math.max(10, Number(e.target.value) || 10))} style={s.input} />
          </div>
        </div>
      </div>
    </div>
  );
}
