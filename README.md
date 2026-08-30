# Findery backend

This is the small server that holds your Etsy API key and answers search
requests from the Findery browser extension. The extension never talks to
Etsy directly — it only talks to this server.

## ⚠️ Before you clone or fork this

Never commit a `.env` file to this repo. It holds real API credentials.
Only `.env.example` (a template with no real values) should ever be here.
If you're setting this up fresh, copy `.env.example` to `.env` locally and
fill in your own keys — that file should stay on your machine only.

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
Visit http://localhost:3000 — you should see "Findery backend is running."

Test the search endpoint directly in your browser:
```
http://localhost:3000/search?q=mug&minPrice=0&maxPrice=50&minPopularity=0
```

## 3. Deploy it so the extension can reach it from anywhere
Pick one (all have free tiers):
- **Render** (render.com) — connect this repo as a "Web Service", set
  `ETSY_KEYSTRING` and `ETSY_SHARED_SECRET` as environment variables in
  their dashboard (never in the repo itself), deploy.
- **Railway** (railway.app) — similar flow, very quick from a GitHub repo.
- **Fly.io** — a bit more setup but generous free tier.

Whichever you pick, once deployed you'll get a public URL like
`https://findery-backend.onrender.com`. That's the value you paste into
`BACKEND_URL` in the extension's `popup.js`.

## Notes
- Images are fetched from a separate Etsy endpoint per listing (the search
  endpoint doesn't return them), so only the first ~12 results get a
  thumbnail to stay within Etsy's rate limits.
- The in-memory cache resets every time the server restarts — fine for a
  personal project, not meant to scale.
- Etsy's API fields may shift over time — check the live response shape
  against https://developer.etsy.com/documentation/reference if something
  breaks.
