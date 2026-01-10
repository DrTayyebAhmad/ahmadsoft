import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  const ALLOWED_ORIGIN = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN is missing. Please create a Blob store in Vercel.' });
  }

  try {
    // Helper to find apps.json
    const getAppsData = async () => {
      const { blobs } = await list();
      const appsBlob = blobs.find(blob => blob.pathname === 'apps.json');
      if (!appsBlob) return [];
      
      // Prevent caching of the JSON file
      const response = await fetch(appsBlob.url, { cache: 'no-store' });
      if (!response.ok) return [];
      return await response.json();
    };

    if (req.method === 'GET') {
      const apps = await getAppsData();
      return res.status(200).json(apps);
    }

    if (req.method === 'POST') {
      // Add new app
      const newApp = req.body;
      const apps = await getAppsData();
      apps.push(newApp);
      
      await put('apps.json', JSON.stringify(apps), { 
        access: 'public', 
        addRandomSuffix: false,
        contentType: 'application/json'
      });
      
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PUT') {
        // Update existing app (edit)
        const updatedApp = req.body;
        let apps = await getAppsData();
        const index = apps.findIndex(a => a.id === updatedApp.id);
        
        if (index !== -1) {
            apps[index] = updatedApp;
        } else {
            apps.push(updatedApp);
        }

        await put('apps.json', JSON.stringify(apps), { 
            access: 'public', 
            addRandomSuffix: false,
            contentType: 'application/json'
        });

        return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
        // Delete app
        const { id } = req.body;
        let apps = await getAppsData();
        apps = apps.filter(app => app.id !== id);
        
        await put('apps.json', JSON.stringify(apps), { 
            access: 'public', 
            addRandomSuffix: false,
            contentType: 'application/json'
        });
        
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
