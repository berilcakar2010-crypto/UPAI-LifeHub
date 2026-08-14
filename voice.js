/* UPAI LifeHub v4 - Speech input & output.
   Uses Capacitor community plugins on Android (the WebView has no Web Speech
   API) and falls back to the browser APIs everywhere else. */

import { localeOf } from "../i18n";

let nativeSR = null;
let nativeTTS = null;
let probed = false;

async function probeNative() {
  if (probed) return;
  probed = true;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor?.isNativePlatform?.()) return;
    try {
      const m = await import("@capacitor-community/speech-recognition");
      nativeSR = m.SpeechRecognition;
    } catch {}
    try {
      const m = await import("@capacitor-community/text-to-speech");
      nativeTTS = m.TextToSpeech;
    } catch {}
  } catch {}
}

export async function speechAvailable() {
  await probeNative();
  if (nativeSR) return true;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * startListening
 * @param {object} opts { language, onResult(text), onEnd(), onError(msg) }
 * @returns {Promise<function>} stop function
 */
export async function startListening({ language = "tr", onResult, onEnd, onError }) {
  await probeNative();
  const locale = localeOf(language);

  if (nativeSR) {
    try {
      const perm = await nativeSR.requestPermissions();
      if (perm?.speechRecognition !== "granted") {
        onError?.("Mikrofon izni verilmedi.");
        onEnd?.();
        return () => {};
      }
      let listener;
      listener = await nativeSR.addListener("partialResults", (data) => {
        if (data?.matches?.length) onResult?.(data.matches[0]);
      });
      await nativeSR.start({
        language: locale,
        maxResults: 1,
        partialResults: true,
        popup: false,
      });
      return async () => {
        try { await nativeSR.stop(); } catch {}
        try { await listener?.remove(); } catch {}
        onEnd?.();
      };
    } catch (e) {
      onError?.(String(e?.message || e));
      onEnd?.();
      return () => {};
    }
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    onError?.("Bu cihaz ses tanımayı desteklemiyor.");
    onEnd?.();
    return () => {};
  }

  const rec = new SR();
  rec.lang = locale;
  rec.continuous = false;
  rec.interimResults = true;

  let finalText = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const chunk = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += chunk;
      else interim += chunk;
    }
    onResult?.((finalText + interim).trim());
  };
  rec.onerror = (e) => {
    const map = {
      "not-allowed": "Mikrofon izni verilmedi.",
      "no-speech": "Ses algılanmadı.",
      "audio-capture": "Mikrofon bulunamadı.",
      network: "Ağ hatası.",
    };
    onError?.(map[e.error] || `Ses hatası: ${e.error}`);
  };
  rec.onend = () => onEnd?.();

  try { rec.start(); }
  catch { onError?.("Ses tanıma başlatılamadı."); onEnd?.(); }

  return () => { try { rec.stop(); } catch {} };
}

export async function speak(text, language = "tr") {
  if (!text) return;
  const clean = String(text).replace(/[*_#`>]/g, "").slice(0, 1200);
  await probeNative();
  const locale = localeOf(language);

  if (nativeTTS) {
    try {
      await nativeTTS.stop().catch(() => {});
      await nativeTTS.speak({ text: clean, lang: locale, rate: 1.0, pitch: 1.0, category: "playback" });
      return;
    } catch { /* fall through to web */ }
  }

  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = locale;
    u.rate = 0.98;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang === locale) || voices.find((v) => v.lang?.startsWith(locale.split("-")[0]));
    if (match) u.voice = match;
    window.speechSynthesis.speak(u);
  } catch {}
}

export async function stopSpeaking() {
  await probeNative();
  if (nativeTTS) { try { await nativeTTS.stop(); } catch {} }
  if ("speechSynthesis" in window) { try { window.speechSynthesis.cancel(); } catch {} }
}
