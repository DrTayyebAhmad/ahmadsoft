// pages/api/upload.js
import { createUploadURL } from '@vercel/blob';

const ALLOWED_ORIGIN = '*'; // Allow any origin for now

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
      maximumSize: 500 * 1024 * 1024, // 500 MB
    });

    return res.status(200).json({ uploadUrl: url });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: err?.message || 'Failed to create upload URL' });
  }
}