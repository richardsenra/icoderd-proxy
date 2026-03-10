import https from 'https';
import { URL } from 'url';

export default async function handler(req, res) {
  const targetPath = req.url.split('?')[0];
  const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
  const targetUrl = `https://icoderd.integracao.academiacode.dev.br${targetPath}${queryString}`;
  
  console.log(`[PROXY] ${req.method} ${targetPath}`);
  
  return new Promise((resolve) => {
    try {
      const url = new URL(targetUrl);
      
      // Prepare body from form data or JSON
      let body = '';
      let contentLength = 0;
      
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        // Convert form body to string
        if (typeof req.body === 'object') {
          // If it's an object (parsed by Vercel), convert to URL encoded
          body = Object.entries(req.body)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
          contentLength = Buffer.byteLength(body);
        } else if (typeof req.body === 'string') {
          body = req.body;
          contentLength = Buffer.byteLength(body);
        }
      }
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: req.method,
        headers: {
          ...req.headers,
          host: url.hostname
        },
        rejectUnauthorized: false
      };
      
      // Set correct content-length if there's a body
      if (contentLength > 0) {
        options.headers['content-length'] = contentLength;
      }
      
      delete options.headers['connection'];
      
      const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        
        proxyRes.pipe(res);
        proxyRes.on('end', () => resolve());
      });
      
      proxyReq.on('error', (error) => {
        console.error('[ERROR]', error.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
        resolve();
      });
      
      // Write body if present
      if (body) {
        console.log(`[PROXY] Sending body: ${body.substring(0, 100)}...`);
        proxyReq.write(body);
      }
      
      proxyReq.end();
      
    } catch (error) {
      console.error('[ERROR]', error.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
      resolve();
    }
  });
}
