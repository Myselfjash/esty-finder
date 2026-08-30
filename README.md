# Kiln backend

This is the small server that holds your Etsy API key and answers search
requests from the browser extension. The extension never talks to Etsy
directly — it only talks to this server.

## 1. Get an Etsy API key
1. Go to https://www.etsy.com/developers/ and sign in / sign up.
2. Choose **"Create a personal app"** (not "Seller app" — that requires an
   active Etsy shop, which you don't need for a search tool like this).
3. Fill in the app details and submit. Personal apps go through Etsy's
   review, so approval isn't instant.
4. Once created, open your app under "Your Apps" and expand
   "See API Key details" — copy both the **Keystring** and the
   **Shared Secret**. As of Feb 2026, Etsy requires both together
   (formatted as `keystring:secret`) — the keystring alone no longer works.

## 2. Run it locally first
```bash
npm install
cp .env.example .env
# open .env and paste your key in
npm start
```
Visit http://localhost:3000 — you should see "Kiln backend is running."

Test the search endpoint directly in your browser:
```
http://localhost:3000/search?q=mug&minPrice=0&maxPrice=50&minPopularity=0
```

## 3. Deploy it so the extension can reach it from anywhere
Pick one (all have free tiers):
- **Render** (render.com) — connect this folder as a "Web Service", set the
  ETSY_API_KEY environment variable in their dashboard, deploy.
- **Railway** (railway.app) — similar flow, very quick from a zip or GitHub repo.
- **Fly.io** — a bit more setup but generous free tier.

Whichever you pick, once deployed you'll get a public URL like
`https://kiln-backend.onrender.com`. That's the value you paste into
`BACKEND_URL` in the extension's `popup.js`.

## Notes
- Etsy's API fields (like `num_favorers`, `views`) may not exactly match
  what's in server.js — check the live response shape once you have a key
  and adjust the popularity formula in `server.js` accordingly. Etsy's docs
  are at https://developer.etsy.com/documentation/reference
- The in-memory cache resets every time the server restarts — fine for a
  personal project, not meant to scale.
