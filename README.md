# Findery — Etsy Backend

The backend service behind **Findery**, a browser extension that searches Etsy listings and lets you filter results by a computed popularity score and price range — filters Etsy's own search doesn't offer.

This service sits between the extension and Etsy's API: it holds the API credentials, queries Etsy, scores each listing's popularity, and returns clean results to the extension. The extension itself never talks to Etsy directly.

## Features

- Full-text search against Etsy's live listings
- A popularity score computed from favorites and views
- Price range filtering
- Sort by relevance, popularity, or price
- Thumbnail images for the top results
- A short in-memory cache to avoid redundant API calls

## Tech stack

- Node.js + Express
- Etsy Open API v3

## How it works

```
Extension  →  this backend  →  Etsy's API
   ↑                              ↓
   └──────── clean JSON  ─────────┘
```

The extension sends a search term and filter values to this service. This service calls Etsy's API using server-side credentials, computes a popularity score per listing (since Etsy doesn't expose one directly), fetches thumbnail images for the top results, filters and sorts, and returns a simplified list.

## Running it yourself

```bash
npm install
cp .env.example .env
# add your own Etsy Keystring and Shared Secret to .env
npm start
```

Visit `http://localhost:3000` to confirm it's running, then try:
```
http://localhost:3000/search?q=mug
```

You'll need your own Etsy API credentials — register a free **personal app** at [etsy.com/developers](https://www.etsy.com/developers/).

**Never commit a real `.env` file to a fork of this repo.** Only `.env.example` (a template with placeholder values) belongs in version control.

## Deploying

Any Node-friendly host works (Render, Railway, Fly.io). Set `ETSY_KEYSTRING` and `ETSY_SHARED_SECRET` as environment variables in your host's dashboard — never in the codebase.

## Disclaimer

This is an independent personal project. It is not affiliated with, endorsed by, or sponsored by Etsy, Inc.
