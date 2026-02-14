const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Simple in-memory rate limiter: max 1 req/sec per IP
const lastRequest = new Map();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Rate limit (Nominatim requires max 1 req/sec) ---
  const xForwardedFor = req.headers['x-forwarded-for'];
  const ip = (typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0] : xForwardedFor?.[0]) || 'unknown';
  const now = Date.now();
  const last = lastRequest.get(ip) || 0;

  if (now - last < 1000) {
    return res.status(429).json({ error: 'Too many requests. Please wait.' });
  }
  lastRequest.set(ip, now);

  // --- Validate params ---
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  try {
    // Validate lat/lng are numbers
    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lng));

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'lat and lng must be valid numbers' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid lat/lng coordinates' });
    }

    const url = new URL(`${NOMINATIM_BASE}/reverse`);
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '18');

    console.log('📍 Geocoding request:', { lat: latitude, lng: longitude });

    const upstream = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'MotoSphere-App/1.0 (contact@motosphere.app)',
      },
    });

    if (!upstream.ok) {
      console.error('❌ Upstream error:', upstream.status);
      return res.status(upstream.status).json({ error: 'Geocoding service error' });
    }

    const data = await upstream.json();

    if (!data || !data.address) {
      console.warn('⚠️ No address data returned');
      return res.status(200).json({
        region: '',
        city: '',
        barangay: '',
        street: '',
        postalCode: '',
        displayName: data?.display_name || 'Unknown location',
      });
    }

    // Extract only what we need
    const address = data.address || {};
    const result = {
      region: address.state || address.region || '',
      city: address.city || address.town || address.village || address.municipality || '',
      barangay: address.neighbourhood || address.suburb || address.quarter || '',
      street: address.road || '',
      postalCode: address.postcode || '',
      displayName: data.display_name || '',
      latitude: data.lat ? parseFloat(data.lat) : latitude,
      longitude: data.lon ? parseFloat(data.lon) : longitude,
    };

    console.log('✅ Geocoding result:', result);
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Reverse geocode error:', error);
    return res.status(500).json({ error: 'Failed to geocode location', details: error.message });
  }
}