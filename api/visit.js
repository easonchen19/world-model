// Vercel serverless function — visitor telemetry for the World Model landing page.
// - Derives coarse geo (country/city/lat/lng) from Vercel's edge headers (no external geo API).
// - Logs the visit + returns aggregate stats via Upstash Redis REST (zero npm deps; uses global fetch).
// - PRIVACY: raw IP is never stored or returned. It is used only transiently to derive geo and a
//   salted hash (for unique/online counting). Public data is city/country/time only.
// - Degrades gracefully: if no store is connected, still returns the current visitor's own geo.

const crypto = require('crypto');

const KV_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const KV_TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const HAS_KV = !!(KV_URL && KV_TOK);

async function pipe(cmds) {
  const r = await fetch(KV_URL + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KV_TOK, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error('kv http ' + r.status);
  return r.json(); // [{result}|{error}, ...]
}
const val = x => (x && x.result !== undefined ? x.result : x);
const num = x => { const n = parseInt(val(x), 10); return Number.isFinite(n) ? n : 0; };
const list = x => { const v = val(x); return Array.isArray(v) ? v : []; };
const dec = v => { if (!v) return null; try { return decodeURIComponent(String(v)); } catch (e) { return String(v); } };

module.exports = async (req, res) => {
  const h = req.headers || {};
  const cc = String(h['x-vercel-ip-country'] || '').toUpperCase() || null;
  const city = dec(h['x-vercel-ip-city']);
  const region = dec(h['x-vercel-ip-country-region']);
  let lat = parseFloat(h['x-vercel-ip-latitude']);
  let lng = parseFloat(h['x-vercel-ip-longitude']);
  lat = Number.isFinite(lat) ? Math.round(lat * 10) / 10 : null;   // ~11km granularity
  lng = Number.isFinite(lng) ? Math.round(lng * 10) / 10 : null;
  const ipRaw = String(h['x-forwarded-for'] || '').split(',')[0].trim();
  const now = Date.now();
  const you = { city, cc, region, lat, lng };

  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');

  const base = { ok: true, you, total: null, countries: null, online: null, recent: [] };

  if (!HAS_KV) {
    res.statusCode = 200;
    return res.end(JSON.stringify({ ...base, storage: false }));
  }

  try {
    const id = crypto.createHash('sha256')
      .update(ipRaw + '|' + (h['user-agent'] || '') + '|wm-v1').digest('hex').slice(0, 16);
    const rec = JSON.stringify({ city, cc, region, lat, lng, ts: now });
    const cutoff = now - 5 * 60 * 1000; // "online" = active within 5 min
    const firstToday = 'wm:seen:' + id; // dedup a visitor's rapid re-polls from inflating "total"

    // Only count a fresh signal if we haven't seen this id in the last 30 min.
    const seen = await pipe([['SET', firstToday, '1', 'NX', 'EX', '1800']]);
    const isNew = val(seen[0]) === 'OK';

    const w = [
      ['ZADD', 'wm:active', String(now), id],
      ['ZREMRANGEBYSCORE', 'wm:active', '0', String(cutoff)],
    ];
    if (isNew) {
      w.push(['INCR', 'wm:total']);
      w.push(['LPUSH', 'wm:recent', rec]);
      w.push(['LTRIM', 'wm:recent', '0', '59']);
      if (cc) w.push(['SADD', 'wm:countries', cc]);
    }
    await pipe(w);

    const rd = await pipe([
      ['GET', 'wm:total'],
      ['SCARD', 'wm:countries'],
      ['ZCARD', 'wm:active'],
      ['LRANGE', 'wm:recent', '0', '29'],
    ]);
    const recent = list(rd[3]).map(s => { try { return JSON.parse(s); } catch (e) { return null; } }).filter(Boolean);

    res.statusCode = 200;
    return res.end(JSON.stringify({
      ...base, storage: true,
      total: num(rd[0]), countries: num(rd[1]), online: Math.max(1, num(rd[2])), recent,
    }));
  } catch (e) {
    res.statusCode = 200;
    return res.end(JSON.stringify({ ...base, storage: false, err: String((e && e.message) || e) }));
  }
};
