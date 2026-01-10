// api/upload.js
import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-vercel-signature');
    return res.status(200).end();
  }

  // Set CORS headers for all responses
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-vercel-signature');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is missing');
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN is missing. Please configure it in Vercel project settings.' });
  }

  try {
    // Parse the request body - Vercel auto-parses JSON, but handle edge cases
    let body = req.body;
    
    // If body is undefined or null, it might not have been parsed
    if (body === undefined || body === null) {
      console.error('Request body is undefined/null. Content-Type:', req.headers['content-type']);
      return res.status(400).json({ error: 'Request body is missing' });
    }

    // If body is a string, try to parse it as JSON
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Failed to parse body as JSON:', e);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    // Ensure body is an object
    if (typeof body !== 'object' || Array.isArray(body)) {
      console.error('Body is not an object:', typeof body, body);
      return res.status(400).json({ error: 'Invalid request body format. Expected JSON object.' });
    }

    // Log for debugging (remove in production if needed)
    console.log('Received request body type:', body.type, 'payload keys:', Object.keys(body.payload || {}));

    // Create a request-like object compatible with handleUpload
    // handleUpload checks if request has 'credentials' property to detect Web API Request
    // If not, it treats it as Node.js style request with headers as object
    const requestLike = {
      headers: req.headers || {},
      method: req.method,
      url: req.url || req.path
    };

    const jsonResponse = await handleUpload({
      body: body,
      request: requestLike,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        console.log('Generating token for:', pathname, 'multipart:', multipart);
        return {
          allowedContentTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/vnd.android.package-archive', // .apk
            'application/octet-stream', // generic
            'application/x-msdownload', // .exe, .msi
            'application/x-appx', 
            'application/x-msix', 
            'application/x-msixbundle',
            'application/zip', // .ipa (iOS apps are zip files)
            'application/x-iphone-app'
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB for large files
          tokenPayload: clientPayload || null,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.url);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    return res.status(400).json({ 
      error: error.message || 'Upload failed',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}