import { createUploadURL } from '@vercel/blob';

// Use the default Node/Serverless runtime on Vercel instead of Edge.
// This avoids Edge runtime limitations (no node:stream, net, http, etc.).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .setHeader('Allow', 'POST')
      .json({ error: 'Method Not Allowed' });
  }

  try {
    const { url } = await createUploadURL({
      access: 'public',
    });

    return res.status(200).json({ uploadUrl: url });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: err?.message || 'Failed to create upload URL' });
  }
}
