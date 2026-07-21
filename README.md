# Eason Chen — World Model

An interactive personal "world model": a living galaxy where each planet is a dimension of who I am — career, products, content, values, life, and contact. Built as a single self-contained HTML file (Canvas + Web Audio, no build step, no dependencies).

- Trilingual (EN / 中文 / 日本語)
- Animated spiral galaxy with orbiting planets + clickable satellite moons
- Interstellar "warp" transition into each section
- Optional ambient sound (synthesized, off by default)

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

Every future `git push` to `main` auto-deploys. Add a custom domain (e.g. `easonchen95.com`) in Vercel → Project → Settings → Domains.

---

## Editing content later

Open `index.html`, find the `CONTENT = { ... }` block at the top (clearly marked), and edit it. Examples:

- **Add a product** → add an entry to the `products` planet's `satellites` and `moons`.
- **Add a travel pin** → add to the `life` planet's `items` / `moons`, or to `footprints`.
- **Add a value** → add a line to the `values` planet's `items`.

Commit and push — Vercel redeploys automatically.
