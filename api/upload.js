import { createUploadURL } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '500mb',
  },
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url } = await createUploadURL({
      access: 'public',
    });
    return res.status(200).json({ uploadUrl: url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to create upload URL' });
  }
}
