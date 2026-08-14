/* UPAI LifeHub v4 - Unified AI client
   Supports: text, vision (images), document context, native PDF upload,
   multilingual replies (tr/en/ja) and the UPA action protocol. */

import { buildActionInstructions } from "./upaActions";
import { FILE_KINDS } from "./fileParser";

const LANG_RULE = {
  tr: "Kullanıcıyla her zaman Türkçe konuş.",
  en: "Always speak to the user in English.",
  ja: "ユーザーには常に日本語で話してください。",
};

const BASE_URLS = {
  openai: "https://api.openai.com/v1",
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1",
};

const todayISO = () => new Date().toLocaleDateString("en-CA");

/** Compose the system prompt from persona + language + optional action protocol */
function composeSystem({ systemPrompt, language, allowActions }) {
  const parts = [];
  if (systemPrompt) parts.push(systemPrompt);
  parts.push(LANG_RULE[language] || LANG_RULE.tr);
  if (allowActions) parts.push(buildActionInstructions(language, todayISO()));
  return parts.join("\n\n");
}

/** Turn text attachments into a document block appended to the user's message */
function attachmentsToText(attachments = []) {
  const docs = attachments.filter((a) => a.kind === FILE_KINDS.TEXT && a.text);
  if (!docs.length) return "";
  return (
    "\n\n--- YÜKLENEN BELGELER / ATTACHED DOCUMENTS ---\n" +
    docs.map((d) => `[${d.name}${d.meta ? ` · ${d.meta}` : ""}]\n${d.text}`).join("\n\n") +
    "\n--- BELGE SONU / END OF DOCUMENTS ---"
  );
}

async function readError(res, label) {
  const err = await res.json().catch(() => ({}));
  const msg = err?.error?.message || err?.message || `${label} HTTP ${res.status}`;
  if (res.status === 401 || res.status === 403) return new Error(`${msg} — API anahtarını kontrol et.`);
  if (res.status === 429) return new Error(`${msg} — Kota doldu, biraz bekle.`);
  return new Error(msg);
}

/**
 * callAI
 * @param {object}  p
 * @param {string}  p.provider      gemini | openai | anthropic | groq | openrouter
 * @param {string}  p.apiKey
 * @param {string}  p.model
 * @param {Array}   p.messages      [{role:"user"|"assistant"|"upa", content:string}]
 * @param {string}  [p.systemPrompt]
 * @param {string}  [p.language]    tr | en | ja
 * @param {Array}   [p.attachments] output of parseFile()
 * @param {boolean} [p.allowActions]
 * @param {boolean} [p.useSearch]   Gemini grounding
 * @param {number}  [p.maxTokens]
 * @param {AbortSignal} [p.signal]
 */
export async function callAI({
  provider = "gemini",
  apiKey,
  model,
  messages = [],
  systemPrompt,
  language = "tr",
  attachments = [],
  allowActions = false,
  useSearch = false,
  maxTokens = 2048,
  signal,
}) {
  if (!apiKey) throw new Error("API anahtarı girilmedi.");
  if (!messages.length) throw new Error("Mesaj yok.");

  const system = composeSystem({ systemPrompt, language, allowActions });
  const docText = attachmentsToText(attachments);
  const media = attachments.filter((a) => a.kind === FILE_KINDS.IMAGE || a.kind === FILE_KINDS.PDF_NATIVE);

  const history = messages.map((m) => ({
    role: m.role === "upa" || m.role === "assistant" ? "assistant" : "user",
    content: String(m.content ?? ""),
  }));
  const lastIdx = history.length - 1;

  /* ─── GEMINI ──────────────────────────────────────────────────────── */
  if (provider === "gemini") {
    const contents = history.map((m, i) => {
      const parts = [];
      if (i === lastIdx) {
        media.forEach((a) => parts.push({ inline_data: { mime_type: a.mime, data: a.base64 } }));
      }
      parts.push({ text: i === lastIdx ? m.content + docText : m.content });
      return { role: m.role === "assistant" ? "model" : "user", parts };
    });

    const body = {
      contents,
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    };
    if (useSearch && !media.length) body.tools = [{ google_search: {} }];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal }
    );
    if (!res.ok) throw await readError(res, "Gemini");
    const d = await res.json();
    const blocked = d?.promptFeedback?.blockReason;
    if (blocked) throw new Error(`İstek engellendi: ${blocked}`);
    return d.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "Yanıt alınamadı.";
  }

  /* ─── ANTHROPIC ───────────────────────────────────────────────────── */
  if (provider === "anthropic") {
    const anthMessages = history.map((m, i) => {
      if (i !== lastIdx || (!media.length && !docText)) return { role: m.role, content: m.content };
      const content = [];
      media.forEach((a) => {
        if (a.kind === FILE_KINDS.IMAGE) {
          content.push({ type: "image", source: { type: "base64", media_type: a.mime, data: a.base64 } });
        } else {
          content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: a.base64 } });
        }
      });
      content.push({ type: "text", text: m.content + docText });
      return { role: m.role, content };
    });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: anthMessages }),
      signal,
    });
    if (!res.ok) throw await readError(res, "Anthropic");
    const d = await res.json();
    return d.content?.filter((c) => c.type === "text").map((c) => c.text).join("") || "Yanıt alınamadı.";
  }

  /* ─── OPENAI-COMPATIBLE (openai / groq / openrouter) ──────────────── */
  if (media.some((a) => a.kind === FILE_KINDS.PDF_NATIVE)) {
    throw new Error("Bu sağlayıcı PDF'i doğrudan kabul etmiyor. Gemini veya Claude seç.");
  }

  const baseUrl = BASE_URLS[provider] || BASE_URLS.openai;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    ...(provider === "openrouter"
      ? { "HTTP-Referer": "https://upai-lifehub.netlify.app", "X-Title": "UPAI LifeHub" }
      : {}),
  };

  const msgs = [{ role: "system", content: system }];
  history.forEach((m, i) => {
    if (i === lastIdx && media.length) {
      const content = media.map((a) => ({
        type: "image_url",
        image_url: { url: `data:${a.mime};base64,${a.base64}` },
      }));
      content.push({ type: "text", text: m.content + docText });
      msgs.push({ role: m.role, content });
    } else {
      msgs.push({ role: m.role, content: i === lastIdx ? m.content + docText : m.content });
    }
  });

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages: msgs, max_tokens: maxTokens, temperature: 0.7 }),
    signal,
  });
  if (!res.ok) throw await readError(res, provider);
  const d = await res.json();
  return d.choices?.[0]?.message?.content || "Yanıt alınamadı.";
}

/* ── Convenience wrappers ────────────────────────────────────────────── */

export async function fetchStudyTips({ provider, apiKey, model, language = "tr" }) {
  if (!apiKey) return null;
  const prompts = {
    tr: "Bilimsel araştırmalara dayanan, pratik 3 çalışma tavsiyesi ver. Her biri 1-2 cümle, numaralı liste. Süslü dil kullanma.",
    en: "Give 3 practical, evidence-based study tips. Each 1-2 sentences, numbered. No flowery language.",
    ja: "科学的根拠に基づいた実践的な勉強のヒントを3つ、各1〜2文で番号付きリストにしてください。",
  };
  try {
    return await callAI({
      provider, apiKey, model, language,
      messages: [{ role: "user", content: prompts[language] || prompts.tr }],
      useSearch: provider === "gemini",
      maxTokens: 500,
    });
  } catch { return null; }
}

export async function estimateExerciseCalories({ provider, apiKey, model, exercise, duration, weight, language = "tr" }) {
  const prompts = {
    tr: `${weight} kg bir kişi ${duration} dakika "${exercise}" yaptı. Yaklaşık kaç kalori yakmıştır? Net bir sayı ver ve 1-2 cümle açıkla.`,
    en: `A ${weight} kg person did "${exercise}" for ${duration} minutes. Roughly how many calories were burned? Give a clear number and 1-2 sentences of context.`,
    ja: `体重${weight}kgの人が「${exercise}」を${duration}分行いました。おおよその消費カロリーは？明確な数字と1〜2文の説明をください。`,
  };
  return callAI({
    provider, apiKey, model, language,
    messages: [{ role: "user", content: prompts[language] || prompts.tr }],
    maxTokens: 300,
  });
}

export async function estimateFoodCalories({ provider, apiKey, model, food, language = "tr" }) {
  const prompts = {
    tr: `"${food}" yaklaşık kaç kalori? Toplam bir sayı ver, sonra kalemleri kısaca dök. Bu sadece bilgi amaçlı — kullanıcı kendi kaydedecek, sen bir şey ekleme.`,
    en: `Roughly how many calories is "${food}"? Give a total number, then briefly break it down. This is informational only — the user logs it themselves, don't add anything.`,
    ja: `「${food}」はおおよそ何カロリーですか？合計の数字を出し、内訳を簡潔に示してください。これは参考情報のみで、記録はユーザー自身が行います。`,
  };
  return callAI({
    provider, apiKey, model, language,
    messages: [{ role: "user", content: prompts[language] || prompts.tr }],
    maxTokens: 400,
  });
}
