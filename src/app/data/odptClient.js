const API_BASE = "https://api.odpt.org/api/v4/";
const KEY = import.meta.env.VITE_ODPT_CONSUMER_KEY;

export const ALLOWED_TYPES = new Set([
  "odpt:Station",
  "odpt:Railway",
  "odpt:RailDirection",
  "odpt:Operator",
  "odpt:Train",
  "odpt:TrainTimetable",
  "odpt:TrainInformation",
]);

function requireKey() {
  if (!KEY) {
    throw new Error("Missing VITE_ODPT_CONSUMER_KEY. Add it to .env.local");
  }
}

export function buildOdptUrl(type, params = {}) {
  requireKey();

  if (!ALLOWED_TYPES.has(type)) {
    throw new Error(`Blocked ODPT type: ${type}. This app only allows the 7 specified datasets.`);
  }

  /* 
   * "odpt:" is treated as a protocol by the URL constructor, 
   * so we must append it manually to the string base.
   */
  const u = new URL(API_BASE + type);
  u.searchParams.set("acl:consumerKey", KEY);

  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;

    // ODPT supports repeated query params for filters
    if (Array.isArray(v)) {
      v.forEach((vv) => u.searchParams.append(k, String(vv)));
    } else {
      u.searchParams.set(k, String(v));
    }
  }

  return u.toString();
}

export async function fetchOdpt(type, params = {}) {
  const url = buildOdptUrl(type, params);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`ODPT request failed: ${type} (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function uniqBySameAs(list) {
  const seen = new Set();
  const out = [];
  for (const x of list) {
    const id = x?.["owl:sameAs"] ?? x?.["@id"];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(x);
  }
  return out;
}
