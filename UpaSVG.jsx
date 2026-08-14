import React from "react";

const COLORS = {
  academia: { body: "#8B4513", earInner: "#D2691E", eye: "#1a0a00", accent: "#D2691E", glow: "#b91c1c" },
  cyber:    { body: "#003300", earInner: "#00aa00", eye: "#00ff00", accent: "#00cc00", glow: "#00ff00" },
  kawaii:   { body: "#78e0a3", earInner: "#ff4d6d", eye: "#1e2925", accent: "#ff6b8a", glow: "#4ade80" },
};

export default function UpaSVG({ theme, mood, onClick, isAnimating }) {
  const c = COLORS[theme] || COLORS.kawaii;
  return (
    <svg viewBox="0 0 120 120" width="110" height="110"
      style={{ cursor: "pointer", filter: isAnimating ? `drop-shadow(0 0 15px ${c.glow})` : "none", transition: "filter 0.3s" }}
      onClick={onClick}>
      <circle cx="32" cy="32" r="14" fill={c.body} stroke={c.accent} strokeWidth="2" />
      <circle cx="32" cy="32" r="8" fill={c.earInner} />
      <circle cx="88" cy="32" r="14" fill={c.body} stroke={c.accent} strokeWidth="2" />
      <circle cx="88" cy="32" r="8" fill={c.earInner} />
      <circle cx="60" cy="68" r="40" fill={c.body} stroke={c.accent} strokeWidth="2.5" />
      <circle cx="46" cy="62" r="4.5" fill={c.eye} />
      <circle cx="74" cy="62" r="4.5" fill={c.eye} />
      <circle cx="47.5" cy="60.5" r="1.5" fill="white" />
      <circle cx="75.5" cy="60.5" r="1.5" fill="white" />
      {theme === "kawaii" && (<>
        <circle cx="36" cy="70" r="5" fill="#ff4d6d" opacity="0.6" />
        <circle cx="84" cy="70" r="5" fill="#ff4d6d" opacity="0.6" />
      </>)}
      {mood === "happy"   && <path d="M 52 74 Q 60 82 68 74" stroke={c.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {mood === "angry"   && <path d="M 52 78 Q 60 70 68 78" stroke={c.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {mood === "neutral" && <line x1="53" y1="75" x2="67" y2="75" stroke={c.eye} strokeWidth="2.5" strokeLinecap="round" />}
      <circle cx="44" cy="106" r="8" fill={c.body} stroke={c.accent} strokeWidth="1.5" />
      <circle cx="76" cy="106" r="8" fill={c.body} stroke={c.accent} strokeWidth="1.5" />
    </svg>
  );
}
