import React, { useState, useRef, useEffect, useCallback } from "react";
import { callAI } from "../utils/aiClient";
import { parseFile, humanSize, FILE_KINDS } from "../utils/fileParser";
import { parseActions, describeLog } from "../utils/upaActions";
import { startListening, speak, stopSpeaking, speechAvailable } from "../utils/voice";

export default function ChatTab({
  t, T, language,
  provider, apiKey, model,
  messages, setMessages,
  contextSummary,
  onActions,
  onThinkingChange,
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [error, setError] = useState("");

  const endRef = useRef(null);
  const fileRef = useRef(null);
  const imageRef = useRef(null);
  const stopListenRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { speechAvailable().then(setVoiceSupported); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => { onThinkingChange?.(busy); }, [busy, onThinkingChange]);
  useEffect(() => () => { stopListenRef.current?.(); stopSpeaking(); abortRef.current?.abort(); }, []);

  const S = {
    surface: { background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "16px" },
    surface2: { background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "12px" },
    btn: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "9px 12px", cursor: "pointer", fontSize: "13px" },
    btnAccent: { background: t.accent, border: `1px solid ${t.accentBright}`, color: "#fff", borderRadius: "8px", padding: "9px 16px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
    input: { background: t.surface2, border: `1px solid ${t.border}`, color: t.text, borderRadius: "8px", padding: "10px 12px", outline: "none", width: "100%", fontSize: "14px", boxSizing: "border-box", fontFamily: "inherit" },
  };

  /* ── attachments ─────────────────────────────────────────────────── */
  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setParsing(true);
    setError("");
    for (const file of files.slice(0, 4)) {
      try {
        const parsed = await parseFile(file, provider);
        setAttachments((prev) => [...prev, parsed]);
      } catch (e) {
        setError(e.message);
      }
    }
    setParsing(false);
  };

  const removeAttachment = (idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  /* ── voice ───────────────────────────────────────────────────────── */
  const toggleListen = async () => {
    if (listening) {
      stopListenRef.current?.();
      setListening(false);
      return;
    }
    setError("");
    setListening(true);
    stopListenRef.current = await startListening({
      language,
      onResult: (text) => setInput(text),
      onEnd: () => setListening(false),
      onError: (msg) => { setError(msg); setListening(false); },
    });
  };

  const toggleSpeak = () => {
    const next = !speakReplies;
    setSpeakReplies(next);
    if (!next) stopSpeaking();
  };

  /* ── send ────────────────────────────────────────────────────────── */
  const send = useCallback(async () => {
    const text = input.trim();
    if ((!text && !attachments.length) || busy) return;
    if (!apiKey) { setError(T.chat.noApiKey); return; }

    setError("");
    const attachNames = attachments.map((a) => a.name).join(", ");
    const displayText = text || (attachments.length ? `📎 ${attachNames}` : "");

    const userMsg = {
      role: "user",
      content: displayText,
      attachments: attachments.map((a) => ({
        name: a.name, kind: a.kind, size: a.size,
        preview: a.kind === FILE_KINDS.IMAGE ? a.preview : null,
      })),
    };

    const outgoing = [...messages, { role: "user", content: text || `Ekteki dosyayı incele: ${attachNames}` }];
    const sentAttachments = attachments;

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setBusy(true);

    abortRef.current = new AbortController();

    try {
      const raw = await callAI({
        provider, apiKey, model, language,
        messages: outgoing.slice(-14).map((m) => ({ role: m.role, content: m.content })),
        systemPrompt: contextSummary,
        attachments: sentAttachments,
        allowActions: true,
        signal: abortRef.current.signal,
      });

      const { text: visible, actions } = parseActions(raw);
      let actionSummary = [];
      if (actions.length) {
        const log = onActions?.(actions) || [];
        actionSummary = describeLog(log, T);
      }

      const reply = visible || (actionSummary.length ? T.chat.actionsApplied : "…");
      setMessages((prev) => [...prev, { role: "upa", content: reply, actionSummary }]);
      if (speakReplies) speak(reply, language);
    } catch (e) {
      if (e.name !== "AbortError") {
        setMessages((prev) => [...prev, { role: "upa", content: `⚠️ ${e.message}`, isError: true }]);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [input, attachments, busy, apiKey, messages, provider, model, language, contextSummary, onActions, speakReplies, setMessages, T]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={S.surface}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px" }}>
        <h3 style={{ color: t.accentBright, margin: 0, fontSize: "15px" }}>🤖 {T.chat.title}</h3>
        <button
          onClick={() => { setMessages([{ role: "upa", content: T.chat.greeting }]); stopSpeaking(); }}
          style={{ ...S.btn, fontSize: "11px", padding: "5px 10px" }}
        >
          🗑 {T.chat.clearChat}
        </button>
      </div>

      {/* message list */}
      <div
        style={{ display: "flex", flexDirection: "column", gap: "10px", height: "clamp(280px, 42vh, 460px)", overflowY: "auto", marginBottom: "12px", paddingRight: "4px" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              ...S.surface2,
              maxWidth: "85%",
              background: msg.role === "user" ? t.accent + "22" : t.surface2,
              border: `1px solid ${msg.isError ? t.danger : msg.role === "user" ? t.accent : t.border}`,
            }}>
              <span style={{ fontSize: "10px", color: t.textMuted, display: "block", marginBottom: "4px" }}>
                {msg.role === "user" ? T.chat.you : T.chat.upa}
              </span>

              {msg.attachments?.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
                  {msg.attachments.map((a, j) => a.preview ? (
                    <img key={j} src={a.preview} alt={a.name}
                      style={{ height: "56px", borderRadius: "6px", border: `1px solid ${t.border}` }} />
                  ) : (
                    <span key={j} style={{ fontSize: "11px", background: t.bg, borderRadius: "6px", padding: "3px 8px", color: t.textMuted }}>
                      📎 {a.name}
                    </span>
                  ))}
                </div>
              )}

              <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.6", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {msg.content}
              </p>

              {msg.actionSummary?.length > 0 && (
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: `1px dashed ${t.accent}` }}>
                  <div style={{ fontSize: "10px", color: t.accentBright, fontWeight: "bold", marginBottom: "4px" }}>
                    ⚙️ {T.chat.actionsApplied}
                  </div>
                  {msg.actionSummary.map((line, k) => (
                    <div key={k} style={{ fontSize: "11px", color: t.textMuted, lineHeight: "1.6" }}>• {line}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <div style={{ color: t.textMuted, fontSize: "12px" }}>⚡ {T.chat.thinking}</div>}
        <div ref={endRef} />
      </div>

      {/* attachment tray */}
      {(attachments.length > 0 || parsing) && (
        <div style={{ ...S.surface2, marginBottom: "10px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {parsing && <span style={{ fontSize: "12px", color: t.textMuted }}>⏳ {T.chat.parsingFile}</span>}
          {attachments.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", background: t.bg, borderRadius: "8px", padding: "5px 8px", border: `1px solid ${t.accent}55` }}>
              {a.kind === FILE_KINDS.IMAGE
                ? <img src={a.preview} alt="" style={{ height: "28px", width: "28px", objectFit: "cover", borderRadius: "4px" }} />
                : <span style={{ fontSize: "15px" }}>{a.mime === "application/pdf" ? "📕" : "📄"}</span>}
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontSize: "11px", maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                <div style={{ fontSize: "9px", color: t.textMuted }}>{humanSize(a.size)}{a.meta ? ` · ${a.meta}` : ""}</div>
              </div>
              <button onClick={() => removeAttachment(i)}
                style={{ background: "transparent", border: "none", color: t.danger, cursor: "pointer", fontSize: "14px", padding: "0 2px" }}>×</button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: t.danger + "22", border: `1px solid ${t.danger}`, borderRadius: "8px", padding: "8px 10px", fontSize: "12px", marginBottom: "10px", color: t.text }}>
          ⚠️ {error}
          <button onClick={() => setError("")} style={{ float: "right", background: "transparent", border: "none", color: t.text, cursor: "pointer" }}>×</button>
        </div>
      )}

      {/* composer */}
      <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", flexWrap: "wrap" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={T.chat.placeholder}
          rows={1}
          style={{ ...S.input, flex: "1 1 160px", minWidth: 0, resize: "none", maxHeight: "110px", minHeight: "42px" }}
          disabled={busy}
        />

        <input ref={imageRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
        <input ref={fileRef} type="file" multiple style={{ display: "none" }}
          accept=".pdf,.docx,.txt,.md,.csv,.json,.xml,.html,.ics,.py,.js,.ts,.yml,.yaml,text/*,application/pdf"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />

        <button onClick={() => imageRef.current?.click()} style={S.btn} title={T.chat.attachImage} disabled={busy}>📷</button>
        <button onClick={() => fileRef.current?.click()} style={S.btn} title={T.chat.attachFile} disabled={busy}>📎</button>

        {voiceSupported && (
          <button onClick={toggleListen} disabled={busy}
            style={{ ...S.btn, ...(listening ? { background: t.danger, color: "#fff", borderColor: t.danger } : {}) }}
            title={T.chat.voiceInput}>
            {listening ? "⏹" : "🎤"}
          </button>
        )}

        <button onClick={toggleSpeak}
          style={{ ...S.btn, ...(speakReplies ? { background: t.accent, color: "#fff" } : {}) }}
          title={speakReplies ? T.chat.speakOn : T.chat.speakOff}>
          {speakReplies ? "🔊" : "🔇"}
        </button>

        <button onClick={send} style={S.btnAccent} disabled={busy || parsing}>
          {busy ? "…" : T.chat.send}
        </button>
      </div>

      {listening && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: t.accent, display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="blink-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.danger, display: "inline-block" }} />
          {T.chat.listening}
        </div>
      )}
    </div>
  );
}
