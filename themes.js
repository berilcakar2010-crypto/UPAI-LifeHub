/* UPAI LifeHub v4 - Themes, sounds, providers */

export const THEMES = {
  kawaii: {
    name: "🌸 Retro",
    bg: "#0f1814", surface: "#182a22", surface2: "#223c31",
    text: "#ffe4e8", textMuted: "#a2e8c4", accent: "#ff4d6d", accentBright: "#4ade80",
    border: "#2d5241", danger: "#ff1744",
    font: "'Space Mono', 'Noto Sans JP', 'Courier New', monospace",
    fontMono: "'Space Mono', monospace",
    sounds: [
      { label: "🌿", type: "pink", freq: 0.6 },
      { label: "🎮", type: "chip", freq: 1 },
      { label: "🌸", type: "brown", freq: 0.4 },
      { label: "⚡", type: "white", freq: 0.35 },
    ],
  },
  academia: {
    name: "📚 Akademi",
    bg: "#1a1412", surface: "#2c221e", surface2: "#3d2e28",
    text: "#f4ebd0", textMuted: "#c9a96e", accent: "#8B4513", accentBright: "#D2691E",
    border: "#5c3d2e", danger: "#b91c1c",
    font: "Georgia, 'Noto Serif JP', 'Times New Roman', serif",
    fontMono: "Georgia, serif",
    sounds: [
      { label: "📚", type: "brown", freq: 0.5 },
      { label: "🕯️", type: "pink", freq: 0.4 },
      { label: "🌧️", type: "storm", freq: 0.7 },
      { label: "🔥", type: "firecrackle", freq: 0.6 },
    ],
  },
  cyber: {
    name: "💾 Siber",
    bg: "#000000", surface: "#0a0a0a", surface2: "#111111",
    text: "#00ff00", textMuted: "#009900", accent: "#00cc00", accentBright: "#00ff00",
    border: "#004400", danger: "#ff0000",
    font: "'Space Mono', 'Noto Sans JP', monospace",
    fontMono: "'Space Mono', monospace",
    sounds: [
      { label: "⚡", type: "white", freq: 0.3 },
      { label: "🔮", type: "sine_mod", freq: 0.8 },
      { label: "💾", type: "chip", freq: 0.5 },
      { label: "🌐", type: "pink", freq: 0.45 },
    ],
  },
  sakura: {
    name: "🌷 Sakura",
    bg: "#1a1220", surface: "#26182f", surface2: "#35233f",
    text: "#fce7f3", textMuted: "#d8b4fe", accent: "#e879a6", accentBright: "#c084fc",
    border: "#4a3057", danger: "#f43f5e",
    font: "'Space Mono', 'Noto Sans JP', monospace",
    fontMono: "'Space Mono', monospace",
    sounds: [
      { label: "🌸", type: "pink", freq: 0.5 },
      { label: "🌙", type: "brown", freq: 0.45 },
      { label: "✨", type: "sine_mod", freq: 0.6 },
      { label: "🌧️", type: "storm", freq: 0.55 },
    ],
  },
};

export const API_PROVIDERS = [
  {
    id: "gemini", name: "Google Gemini",
    defaultModel: "gemini-2.0-flash",
    hint: "Ücretsiz kotası var · görsel + PDF destekler · aistudio.google.com/apikey",
  },
  {
    id: "openai", name: "OpenAI GPT",
    defaultModel: "gpt-4o-mini",
    hint: "Görsel destekler · PDF için metin çıkarımı kullanılır · platform.openai.com",
  },
  {
    id: "anthropic", name: "Anthropic Claude",
    defaultModel: "claude-3-5-haiku-20241022",
    hint: "Görsel + PDF destekler · console.anthropic.com",
  },
  {
    id: "groq", name: "Groq (hızlı & ücretsiz)",
    defaultModel: "llama-3.3-70b-versatile",
    hint: "Çok hızlı · görsel için llama-3.2-11b-vision-preview · console.groq.com",
  },
  {
    id: "openrouter", name: "OpenRouter",
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    hint: "Tek anahtarla çok model · openrouter.ai/keys",
  },
];
