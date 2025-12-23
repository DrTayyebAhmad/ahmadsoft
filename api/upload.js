const { put } = require('@vercel/blob');
const Busboy = require('busboy');

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data' });
    }

    const bb = new Busboy({ headers: req.headers });

    let fileUploadPromise = null;

    bb.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      if (!filename) {
        file.resume();
        return;
      }

      const chunks = [];
      file.on('data', (d) => chunks.push(d));
      file.on('limit', () => {
        fileUploadPromise = Promise.reject(new Error('File too large'));
        file.resume();
      });
      file.on('end', () => {
        if (fileUploadPromise) return;
        const buffer = Buffer.concat(chunks);
        fileUploadPromise = put(`uploads/${Date.now()}-${filename}`, buffer, {
          access: 'public',
          contentType: mimeType || 'application/octet-stream',
        });
      });
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
