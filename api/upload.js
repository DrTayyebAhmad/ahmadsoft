import { createUploadURL } from '@vercel/blob';

const ALLOWED_ORIGIN = 'https://drtayyebahmad.github.io'; // your GitHub Pages URL

export default async function handler(req, res) {
  // CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res
      .status(405)
      .setHeader('Allow', 'POST, OPTIONS')
      .json({ error: 'Method Not Allowed' });
  }

  try {
    const { url } = await createUploadURL({
      access: 'public',
      maximumSize: 500 * 1024 * 1024, // keep your new size limit
    });

    return res.status(200).json({ uploadUrl: url });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: err?.message || 'Failed to create upload URL' });
  }
}