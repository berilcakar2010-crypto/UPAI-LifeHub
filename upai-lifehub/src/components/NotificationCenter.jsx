import React from "react";
import { PRIORITY_COLOR } from "../utils/notifications";

/**
 * Floating in-app alerts with snooze controls.
 * Positioned below the header, above everything else.
 */
export default function NotificationCenter({ t, T, alerts, onSnooze, onDismiss, onComplete }) {
  if (!alerts.length) return null;
  const N = T.notif;

  return (
    <div style={{
      position: "fixed",
      top: "calc(62px + env(safe-area-inset-top, 0px))",
      right: "12px",
      left: "auto",
      zIndex: 400,
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      width: "min(320px, calc(100vw - 24px))",
      pointerEvents: "none",
    }}>
      {alerts.map((a) => (
        <div key={a.id} style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderLeft: `4px solid ${PRIORITY_COLOR[a.priority] || t.accent}`,
          borderRadius: "12px",
          padding: "11px 12px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
          pointerEvents: "auto",
        }}>
          <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "3px", color: t.text }}>{a.title}</div>
          <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "9px" }}>{a.body}</div>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            <button onClick={() => onSnooze(a.id, 5)} style={btnStyle(t)}>{N.snooze5}</button>
            <button onClick={() => onSnooze(a.id, 10)} style={btnStyle(t)}>{N.snooze10}</button>
            {onComplete && (
              <button onClick={() => onComplete(a)} style={{ ...btnStyle(t), background: t.accent, color: "#fff", borderColor: t.accentBright }}>✓</button>
            )}
            <button onClick={() => onDismiss(a.id)} style={{ ...btnStyle(t), color: t.textMuted }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const btnStyle = (t) => ({
  background: t.surface2,
  border: `1px solid ${t.border}`,
  color: t.text,
  borderRadius: "7px",
  padding: "5px 9px",
  cursor: "pointer",
  fontSize: "11px",
  flex: "1 1 auto",
  whiteSpace: "nowrap",
});
