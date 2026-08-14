/* UPAI LifeHub v4 - File parsing (PDF / DOCX / images / text)
   Everything is defensive: if a parser fails we degrade gracefully rather
   than throwing, so the chat never breaks because of a bad upload. */

export const MAX_FILE_BYTES = 12 * 1024 * 1024; // 12 MB
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_TEXT_CHARS = 24000; // keep prompts within token budgets

export const FILE_KINDS = { IMAGE: "image", TEXT: "text", PDF_NATIVE: "pdf_native", UNSUPPORTED: "unsupported" };

const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Dosya okunamadı"));
    r.readAsDataURL(file);
  });

const readAsText = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Dosya okunamadı"));
    r.readAsText(file);
  });

const readAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Dosya okunamadı"));
    r.readAsArrayBuffer(file);
  });

const truncate = (text) => {
  if (!text) return "";
  if (text.length <= MAX_TEXT_CHARS) return text;
  return text.slice(0, MAX_TEXT_CHARS) + "\n\n[... belge kısaltıldı / document truncated ...]";
};

/* ── PDF ─────────────────────────────────────────────────────────────── */
async function extractPdfText(file) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
  const base = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.js`;

  const buffer = await readAsArrayBuffer(file);
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pages = [];
  const pageCount = Math.min(doc.numPages, 40);
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items.map((it) => it.str).join(" ").replace(/\s+/g, " ").trim();
    if (line) pages.push(`--- Sayfa ${i} ---\n${line}`);
  }
  try { await doc.destroy(); } catch {}

  const text = pages.join("\n\n").trim();
  return { text, pageCount: doc.numPages };
}

/* ── DOCX ────────────────────────────────────────────────────────────── */
async function extractDocxText(file) {
  const mammoth = await import("mammoth");
  const buffer = await readAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value || "";
}

/**
 * parseFile - turn a File into something an AI provider can consume.
 * @param {File} file
 * @param {string} provider - used to decide whether native PDF upload is possible
 * @returns {Promise<object>} attachment descriptor
 */
export async function parseFile(file, provider = "gemini") {
  if (!file) throw new Error("Dosya yok");
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`Dosya çok büyük (max ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB)`);
  }

  const name = file.name || "dosya";
  const mime = file.type || "";
  const ext = name.split(".").pop().toLowerCase();

  /* Images → vision */
  if (mime.startsWith("image/")) {
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Görsel 5MB'dan küçük olmalı");
    const dataUrl = await readAsDataURL(file);
    return {
      kind: FILE_KINDS.IMAGE,
      name,
      mime: mime === "image/jpg" ? "image/jpeg" : mime,
      base64: dataUrl.split(",")[1],
      preview: dataUrl,
      size: file.size,
    };
  }

  /* PDF → text extraction, native upload as fallback */
  if (mime === "application/pdf" || ext === "pdf") {
    try {
      const { text, pageCount } = await extractPdfText(file);
      if (text && text.length > 40) {
        return {
          kind: FILE_KINDS.TEXT,
          name,
          mime: "application/pdf",
          text: truncate(text),
          size: file.size,
          meta: `${pageCount} sayfa`,
        };
      }
      throw new Error("PDF metni boş (taranmış olabilir)");
    } catch (e) {
      // Scanned / image-only PDF, or worker unavailable.
      const supportsNativePdf = provider === "gemini" || provider === "anthropic";
      if (supportsNativePdf) {
        const dataUrl = await readAsDataURL(file);
        return {
          kind: FILE_KINDS.PDF_NATIVE,
          name,
          mime: "application/pdf",
          base64: dataUrl.split(",")[1],
          size: file.size,
          meta: "doğrudan gönderiliyor",
        };
      }
      throw new Error(
        "Bu PDF'ten metin çıkarılamadı (taranmış olabilir). Gemini veya Claude sağlayıcısını seçersen dosyayı doğrudan gönderebilirim."
      );
    }
  }

  /* DOCX */
  if (ext === "docx" || mime.includes("wordprocessingml")) {
    const text = await extractDocxText(file);
    if (!text.trim()) throw new Error("Word belgesi boş görünüyor");
    return { kind: FILE_KINDS.TEXT, name, mime, text: truncate(text), size: file.size };
  }

  /* Plain-text family */
  const textExts = ["txt", "md", "markdown", "csv", "tsv", "json", "xml", "html", "htm", "ics", "log", "py", "js", "jsx", "ts", "tsx", "css", "yml", "yaml"];
  if (mime.startsWith("text/") || textExts.includes(ext) || mime === "application/json") {
    const text = await readAsText(file);
    if (!text.trim()) throw new Error("Dosya boş");
    return { kind: FILE_KINDS.TEXT, name, mime: mime || "text/plain", text: truncate(text), size: file.size };
  }

  throw new Error(
    `Desteklenmeyen dosya türü: ${ext || mime || "bilinmiyor"}. PDF, DOCX, TXT, MD, CSV, JSON ve görseller destekleniyor.`
  );
}

export const humanSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
