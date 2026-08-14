/* UPAI LifeHub - cross-device sync endpoint (Netlify Blobs backed).
   The key is a SHA-256 derived id, so raw API keys never reach the server. */

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

const MAX_BYTES = 900_000;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: HEADERS, body: "" };

  const raw =
    event.queryStringParameters?.key ||
    (() => { try { return JSON.parse(event.body || "{}").key; } catch { return ""; } })();

  const key = String(raw || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  if (key.length < 16) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "Geçersiz senkronizasyon anahtarı" }) };
  }

  let store;
  try {
    const { getStore } = await import("@netlify/blobs");
    store = getStore({ name: "upai-sync", consistency: "strong" });
  } catch (e) {
    return {
      statusCode: 503,
      headers: HEADERS,
      body: JSON.stringify({ error: "Blob deposu kullanılamıyor. Netlify Blobs etkin mi?" }),
    };
  }

  try {
    if (event.httpMethod === "GET") {
      const data = await store.get(key, { type: "text" });
      return { statusCode: 200, headers: HEADERS, body: data || "{}" };
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      if (!body.data) {
        return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "Veri eksik" }) };
      }
      const payload = typeof body.data === "string" ? body.data : JSON.stringify(body.data);
      if (payload.length > MAX_BYTES) {
        return { statusCode: 413, headers: HEADERS, body: JSON.stringify({ error: "Veri çok büyük" }) };
      }
      await store.set(key, payload);
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, ts: Date.now() }) };
    }

    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: "Desteklenmeyen yöntem" }) };
  } catch (e) {
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
