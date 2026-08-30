// Kiln backend — talks to Etsy so your API key never sits in the extension.
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // fine for a personal project; lock this down later if you publish widely

const PORT = process.env.PORT || 3000;
const ETSY_KEYSTRING = process.env.ETSY_KEYSTRING;
const ETSY_SHARED_SECRET = process.env.ETSY_SHARED_SECRET;

if (!ETSY_KEYSTRING || !ETSY_SHARED_SECRET) {
  console.warn('⚠️  ETSY_KEYSTRING and/or ETSY_SHARED_SECRET are not set. Copy .env.example to .env and add both — Etsy requires both together as of Feb 2026.');
}

// Etsy now requires "keystring:secret" combined in the x-api-key header
const ETSY_API_KEY_HEADER = `${ETSY_KEYSTRING}:${ETSY_SHARED_SECRET}`;

// Simple in-memory cache so repeated searches during testing don't burn your rate limit
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

app.get('/search', async (req, res) => {
  const { q, minPrice = 0, maxPrice = 200, minPopularity = 0, sort = 'relevance' } = req.query;

  if (!q) return res.status(400).json({ error: 'Missing q (search term)' });

  const cacheKey = JSON.stringify(req.query);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    // NOTE: Etsy's Open API v3 evolves — double check field/param names against
    // https://developer.etsy.com/documentation/reference before relying on this in production.
    const url = new URL('https://openapi.etsy.com/v3/application/listings/active');
    url.searchParams.set('keywords', q);
    url.searchParams.set('min_price', minPrice);
    url.searchParams.set('max_price', maxPrice);
    url.searchParams.set('limit', '25');

    const etsyRes = await fetch(url, {
      headers: { 'x-api-key': ETSY_API_KEY_HEADER }
    });

    if (!etsyRes.ok) {
      const text = await etsyRes.text();
      console.error('Etsy API error:', etsyRes.status, text);
      return res.status(502).json({ error: 'Etsy API request failed', status: etsyRes.status });
    }

    const etsyData = await etsyRes.json();
    const listings = etsyData.results || [];

    // Etsy doesn't expose a single "popularity" number — we build our own score.
    let results = listings.map(listing => {
      const favorers = listing.num_favorers || 0;
      const views = listing.views || 0;
      const popularity = Math.min(100, Math.round(favorers * 1.5 + views * 0.002));
      const price = listing.price?.amount
        ? listing.price.amount / (listing.price.divisor || 100)
        : 0;

      return {
        listing_id: listing.listing_id,
        name: listing.title,
        price: Math.round(price * 100) / 100,
        popularity,
        url: listing.url || `https://www.etsy.com/listing/${listing.listing_id}`
      };
    });

    results = results.filter(item => item.popularity >= Number(minPopularity));

    if (sort === 'popular') results.sort((a, b) => b.popularity - a.popularity);
    if (sort === 'priceLow') results.sort((a, b) => a.price - b.price);
    if (sort === 'priceHigh') results.sort((a, b) => b.price - a.price);

    // Images live on a separate endpoint per listing — the search endpoint doesn't
    // return them (confirmed via Etsy's own API discussions). We only fetch images
    // for the top slice of results actually being shown, to stay within rate limits.
    const IMAGE_FETCH_LIMIT = 12;
    const toEnrich = results.slice(0, IMAGE_FETCH_LIMIT);

    for (const item of toEnrich) {
      try {
        const imgUrl = `https://openapi.etsy.com/v3/application/listings/${item.listing_id}/images`;
        const imgRes = await fetch(imgUrl, { headers: { 'x-api-key': ETSY_API_KEY_HEADER } });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          const firstImage = imgData.results?.[0];
          item.image = firstImage?.url_170x135 || firstImage?.url_fullxfull || null;
        } else {
          item.image = null;
        }
      } catch {
        item.image = null;
      }
    }
    // Anything beyond the enriched slice just gets no image rather than failing
    for (const item of results.slice(IMAGE_FETCH_LIMIT)) {
      item.image = null;
    }

    // Drop the internal listing_id before sending to the extension
    const payload = { results: results.map(({ listing_id, ...rest }) => rest) };
    cache.set(cacheKey, { data: payload, time: Date.now() });
    res.json(payload);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/', (req, res) => res.send('Findery backend is running.'));

app.listen(PORT, () => console.log(`Findery backend listening on port ${PORT}`));
