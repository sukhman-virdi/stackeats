require('dotenv').config();
const express = require('express');
const router  = express.Router();
const https   = require('https');
const { authenticate } = require('../server/authMiddleware');

const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ─── Helper: fetch from Google Maps API
function googleGeocode(address) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${MAPS_API_KEY}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Failed to parse Google response')); }
      });
    }).on('error', reject);
  });
}

// ─── GET /api/maps/geocode?address=123+Main+St+Vancouver ─────────────────
// Protected (must be logged in). Called by orders.html to show map preview.
// Returns: { lat, lng, formattedAddress }
router.get('/geocode', authenticate, async (req, res) => {
  try {
    const { address } = req.query;

    if (!address || address.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a full address.' });
    }

    if (!MAPS_API_KEY) {
      return res.status(500).json({ error: 'Google Maps API key not configured on server.' });
    }

    const geoData = await googleGeocode(address);

    if (geoData.status === 'ZERO_RESULTS') {
      return res.status(404).json({ error: 'Address not found. Please try a more specific address.' });
    }

    if (geoData.status !== 'OK') {
      return res.status(502).json({ error: `Google Maps error: ${geoData.status}` });
    }

    const result   = geoData.results[0];
    const { lat, lng } = result.geometry.location;

    res.json({
      lat,
      lng,
      formattedAddress: result.formatted_address,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/maps/nearby?lat=49.2&lng=-123.1 ─────────────────────────────
// Protected. Returns nearby restaurants as context — demonstrates server-side
// external API call beyond just geocoding (satisfies Part III requirement).
router.get('/nearby', authenticate, async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required.' });
    }

    if (!MAPS_API_KEY) {
      return res.status(500).json({ error: 'Google Maps API key not configured.' });
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=1500&type=restaurant&key=${MAPS_API_KEY}`;

    const data = await new Promise((resolve, reject) => {
      https.get(url, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('Parse error')); }
        });
      }).on('error', reject);
    });

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return res.status(502).json({ error: `Places API error: ${data.status}` });
    }

    // Return a trimmed version — just name, vicinity, and rating
    const places = (data.results || []).slice(0, 5).map(p => ({
      name:     p.name,
      vicinity: p.vicinity,
      rating:   p.rating || null,
    }));

    res.json({ places });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;