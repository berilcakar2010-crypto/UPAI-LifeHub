/* Copies the pdf.js worker into public/ so it can be loaded at runtime
   both on Netlify and inside the Capacitor Android WebView. */
const fs = require("fs");
const path = require("path");

const candidates = [
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js",
  "node_modules/pdfjs-dist/build/pdf.worker.min.js",
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.js",
];

const dest = path.join(__dirname, "..", "public", "pdf.worker.min.js");

let copied = false;
for (const rel of candidates) {
  const src = path.join(__dirname, "..", rel);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ pdf worker copied from ${rel}`);
    copied = true;
    break;
  }
}

if (!copied) {
  // Write a stub so the build never breaks; PDF parsing will fall back to
  // sending the raw file to providers that accept PDFs natively.
  fs.writeFileSync(dest, "/* pdfjs worker not found at build time */\n");
  console.warn("⚠️  pdfjs worker not found - PDF text extraction will use fallback mode.");
}
