// pages/api/upload.js
import { handleUpload } from '@vercel/blob/client';

const ALLOWED_ORIGIN = '*'; // Allow any origin for now

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN is missing.' });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // You can add auth checks here
        return {
          allowedContentTypes: [
            'image/jpeg', 'image/png', 'image/gif', 
            'application/vnd.android.package-archive', // .apk
            'application/octet-stream', // generic
            'application/x-msdownload', // .exe, .msi
            'application/x-appx', 
            'application/x-msix', 
            'application/x-msixbundle'
          ],
          tokenPayload: JSON.stringify({
             // optional payload
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.url);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}