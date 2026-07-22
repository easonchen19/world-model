# Eason Chen — World Model

An interactive personal "world model": a living galaxy where each planet is a dimension of who I am — career, products, content, values, life, and contact. Built as a single self-contained HTML file (Canvas + Web Audio, no build step, no dependencies).

- Trilingual (EN / 中文 / 日本語)
- Animated spiral galaxy with orbiting planets + clickable satellite moons
- Interstellar "warp" transition into each section
- Ambient sound (synthesized, **on by default** — starts on the visitor's first click/tap per browser autoplay policy; mute button top-right)

Each section opens into its **own bespoke interactive instrument** (all vanilla canvas/SVG — still no dependencies):

| Planet | Experience |
|---|---|
| **Life** | An interactive rotating **globe** of every place travelled — drag to spin, tap a pin to fly it front-and-center and open a photo card (ready for your images). |
| **Career** | *Starline* — a comet descends a constellation, igniting each career-star in turn. |
| **Products** | *Reactor Core* — satellites orbit a power core; touch one and a beam fires to it. |
| **Content** | *Broadcast Deck* — an "ON AIR" channel rack with live equalizers + sonar pings. |
| **Values** | *Belief Compass* — a needle you can aim; it settles on each belief and reads it aloud in the center. |
| **Contact** | *The Threshold* — a wormhole that cranes toward whichever door you choose. |

All editable content lives in **one block** at the top of `index.html` — the `CONTENT` object. Add a job, a product, a value, a travel pin, or a footprint by editing that block only; the render engine below it rarely changes.

---

## Run locally

It's a static file — any of these work:

```bash
# simplest: just open it
open index.html

# or serve it (recommended, matches production)
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## Push to GitHub

```bash
git init
git add .
git commit -m "Eason world model — galaxy site"
git branch -M main
git remote add origin https://github.com/easonchen19/world-model.git
git push -u origin main
```

Create the empty repo first at https://github.com/new (name it `world-model`), or do it in one shot with the GitHub CLI:

```bash
gh repo create world-model --public --source=. --remote=origin --push
```

---

## Deploy on Vercel

Zero config — it's a static site, Vercel serves `index.html` at `/` automatically.

**Option A — Dashboard (easiest):**
1. Go to https://vercel.com/new
2. Import the `world-model` GitHub repo
3. Framework preset: **Other** · leave build & output settings empty
4. Deploy

**Option B — CLI:**
```bash
npm i -g vercel
vercel          # links the project, preview deploy
vercel --prod   # production deploy
```

Every future `git push` to `main` auto-deploys.

**Custom domain:** bound to `easonchen95.com` — `www.easonchen95.com` is the primary domain, the apex 308-redirects to it. DNS lives at Hostinger (`dns-parking.com` nameservers): apex `A → 216.150.1.1` (Vercel) + `www CNAME → vercel-dns`.

---

## Live visitor telemetry (the corner "LIVE" HUD)

The bottom-left HUD (a radar + `SIGNALS` / `COUNTRIES` counts + a live arrivals ticker) is powered by a tiny serverless function at [`api/visit.js`](api/visit.js). On each load it:

- derives **coarse geo** (country / city / lat-lng) from Vercel's edge headers — no third-party geo API;
- logs the visit and reads back aggregate stats from **Upstash Redis**.

**Privacy:** the raw IP is *never* stored or shown. It's used only transiently to derive the city and a salted hash (for unique / "online now" counting). The public feed is city + country + time only, at ~11 km granularity. Rapid re-polls from one visitor don't inflate the count (30-min dedup).

### Enable the real counters (~2 min, one-time)

Until a store is connected the HUD still works — it shows each visitor **their own** detected city and a live pulse — but there are no cross-visitor totals. To turn on real accumulating stats:

1. Vercel dashboard → the **outputs** project → **Storage** → **Create Database** → **Upstash → Redis** (free tier) → connect it to the project.
2. That auto-injects `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL/TOKEN`) as env vars — the function reads either naming.
3. **Redeploy** (`vercel --prod`, or push to `main`). Counters start accumulating from that moment.

Preview the HUD's full look locally without a store: open `index.html?livedemo=1` (uses sample data only when the API is unreachable).

## Editing content later

Open `index.html`, find the `CONTENT = { ... }` block at the top (clearly marked), and edit it. Examples:

- **Add a product** → add an entry to the `products` planet's `satellites` and `moons`.
- **Add a value** → add a line to the `values` planet's `items`.
- **Add a travel pin** → add to the `life` planet's `places` array (see below).

Commit and push — Vercel redeploys automatically.

### Travel pins & photos (the globe)

Every dot on the globe is one entry in the `life` planet's **`places`** array. To add a place, add one line:

```js
{ name:{en:"Lisbon · Portugal", zh:"里斯本 · 葡萄牙", ja:"リスボン · ポルトガル"},
  note:{en:"Europe.", zh:"欧洲。", ja:"ヨーロッパ。"},
  lat:38.72, lng:-9.14, emoji:"🚋", img:"" },
```

- `lat` / `lng` — decimal degrees (north +, east +). Grab them from Google Maps → right-click → the two numbers.
- `emoji` — shown on the placeholder card and the companion list.
- `img` — **leave `""` for now**; the card shows a "photo coming" placeholder. When you have a picture, drop it in the repo (e.g. `img/lisbon.jpg`) and set `img:"img/lisbon.jpg"` (or any URL) — it swaps in automatically.

The "25 / 100 countries" gauge is the `progress:{ visited, goal }` line just above `places` — bump `visited` as the list grows.
