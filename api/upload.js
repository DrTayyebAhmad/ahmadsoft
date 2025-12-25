import { createUploadURL } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'POST' },
    });
  }

  try {
    const { url } = await createUploadURL({
      access: 'public',
    });
    return new Response(JSON.stringify({ uploadUrl: url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to create upload URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
