import { put } from '@vercel/blob';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data' });
    }

    const busboy = await import('busboy').then(m => m.default || m);
    const bb = busboy({ headers: req.headers, limits: { fileSize: 500 * 1024 * 1024 } });

    let fileUploadPromise = null;

    bb.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      if (!filename) {
        file.resume();
        return;
      }
      file.on('limit', () => {
        fileUploadPromise = Promise.reject(new Error('File too large'));
        file.resume();
      });
      if (!fileUploadPromise) {
        const stream = Readable.toWeb(file);
        fileUploadPromise = put(`uploads/${Date.now()}-${filename}`, stream, {
          access: 'public',
          contentType: mimeType || 'application/octet-stream',
        });
      }
    });

    bb.on('error', (err) => {
      if (!fileUploadPromise) {
        fileUploadPromise = Promise.reject(err);
      }
    });

    req.pipe(bb);

    bb.on('finish', async () => {
      try {
        if (!fileUploadPromise) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        const blob = await fileUploadPromise;
        return res.status(200).json({ fileUrl: blob.url });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || 'Upload failed' });
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
