import type { NextApiRequest, NextApiResponse } from 'next';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Simple in-memory rate limiter: max 1 req/sec per IP
const lastRequest = new Map<string, number>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Rate limit (Nominatim requires max 1 req/sec) ---
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
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
    const url = new URL(`${NOMINATIM_BASE}/reverse`);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '18'); // street-level detail

    const upstream = await fetch(url.toString(), {
      headers: {
        // Nominatim requires a valid User-Agent
        'User-Agent': 'MotoSphere-App/1.0 (contact@motosphere.app)',
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Geocoding service error' });
    }

    const data = await upstream.json();

    // Extract only what we need — keeps the payload small
    const address = data.address || {};
    const result = {
      region:    address.state || address.region || '',
      city:      address.city || address.town || address.village || address.municipality || '',
      barangay:  address.neighbourhood || address.suburb || address.quarter || '',
      street:    address.road || '',
      postalCode: address['ISO3166-2:PH'] ? undefined : (address.postcode || ''),
      // Full display name as fallback
      displayName: data.display_name || '',
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return res.status(500).json({ error: 'Failed to geocode location' });
  }
}