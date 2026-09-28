import { getStore } from "@netlify/blobs";

// Guarda una lista por "código de lista". Quien tenga el código puede leerla y editarla.
// El código nunca se guarda tal cual: se usa su hash SHA-256 como clave.

const MAX_BYTES = 1_000_000;

async function keyFor(code) {
  const data = new TextEncoder().encode("tcg-evento:" + code);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function mergeEntries(x = [], y = []) {
  const m = new Map();
  for (const e of [...x, ...y]) {
    if (!e || !e.id) continue;
    const o = m.get(e.id);
    if (!o) m.set(e.id, { ...e });
    else if (e.borrado) o.borrado = true;
  }
  return [...m.values()];
}

// Fusión por producto: gana la versión editada más recientemente,
// y las compras y precios vistos se suman de los dos lados.
export function merge(a = {}, b = {}) {
  const m = new Map();
  for (const it of [...(a.items || []), ...(b.items || [])]) {
    if (!it || !it.id) continue;
    const o = m.get(it.id);
    if (!o) { m.set(it.id, { ...it }); continue; }
    const newer = (it.actualizado || 0) > (o.actualizado || 0) ? it : o;
    m.set(it.id, { ...newer, compras: mergeEntries(o.compras, it.compras), vistos: mergeEntries(o.vistos, it.vistos) });
  }
  const s = (b.ajustesFecha || 0) > (a.ajustesFecha || 0) ? b : a;
  return {
    items: [...m.values()],
    budget: s.budget || 0,
    tol: s.tol ?? 5,
    stale: s.stale ?? 7,
    ajustesFecha: s.ajustesFecha || 0,
  };
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default async (req) => {
  const code = (req.headers.get("x-lista") || "").trim();
  if (code.length < 8) return json({ error: "El código de lista debe tener al menos 8 caracteres" }, 400);

  const store = getStore("listas-tcg");
  const key = await keyFor(code);

  if (req.method === "GET") {
    const current = await store.get(key, { type: "json" });
    return json(current || merge());
  }

  if (req.method === "POST") {
    const text = await req.text();
    if (text.length > MAX_BYTES) return json({ error: "La lista es demasiado grande" }, 413);
    let incoming;
    try { incoming = JSON.parse(text); } catch { return json({ error: "Datos no válidos" }, 400); }
    const current = (await store.get(key, { type: "json" })) || {};
    const merged = merge(current, incoming);
    await store.setJSON(key, merged);
    return json(merged);
  }

  return json({ error: "Método no permitido" }, 405);
};

export const config = { path: "/api/sync" };
