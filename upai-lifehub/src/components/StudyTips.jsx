import React, { useState, useEffect, useCallback } from "react";
import { fetchStudyTips } from "../utils/aiClient";
import { ls } from "../utils/storage";

export default function StudyTips({ t, T, provider, apiKey, model, language }) {
  const [tips, setTips] = useState(() => ls.get("upai_study_tips", null));
  const [tipsDate, setTipsDate] = useState(() => ls.get("upai_tips_date", null));
  const [tipsLang, setTipsLang] = useState(() => ls.get("upai_tips_lang", "tr"));
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);

  const today = new Date().toLocaleDateString("en-CA");

  const load = useCallback(async () => {
    if (!apiKey || loading) return;
    setLoading(true);
    const result = await fetchStudyTips({ provider, apiKey, model, language });
    if (result) {
      setTips(result); setTipsDate(today); setTipsLang(language);
      ls.set("upai_study_tips", result);
      ls.set("upai_tips_date", today);
      ls.set("upai_tips_lang", language);
    }
    setLoading(false);
  }, [apiKey, provider, model, language, today, loading]);

  useEffect(() => {
    if (apiKey && (tipsDate !== today || tipsLang !== language)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, language]);

  const s = {
    card: { background: t.surface2, border: `1px solid ${t.accentBright}30`, borderRadius: "12px", padding: "12px" },
    btn: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "5px 10px", cursor: "pointer", fontSize: "11px" },
    body: { background: t.bg, borderRadius: "8px", padding: "11px", fontSize: "12px", lineHeight: "1.7", color: t.text, whiteSpace: "pre-wrap", marginTop: "8px", fontFamily: "inherit" },
  };

  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        <button onClick={() => setOpen((v) => !v)}
          style={{ background: "transparent", border: "none", color: t.accentBright, fontSize: "12px", fontWeight: "bold", cursor: "pointer", padding: 0, textAlign: "left", fontFamily: "inherit" }}>
          {open ? "▾" : "▸"} 💡 {T.tips.title} {tipsDate === today && tipsLang === language ? "✓" : ""}
        </button>
        <button onClick={load} style={s.btn} disabled={loading || !apiKey}>
          {loading ? T.loading : `↻ ${T.tips.refresh}`}
        </button>
      </div>
      {open && (
        <>
          {!apiKey && <div style={{ color: t.textMuted, fontSize: "11px", fontStyle: "italic", marginTop: "6px" }}>{T.tips.needKey}</div>}
          {tips && <div style={s.body}>{tips}</div>}
        </>
      )}
    </div>
  );
}
