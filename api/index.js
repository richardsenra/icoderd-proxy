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
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: req.method,
        headers: {
          ...req.headers,
          host: url.hostname
        },
        rejectUnauthorized: false // Accept self-signed certificates
      };
      
      delete options.headers['connection'];
      delete options.headers['content-length'];
      
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
      
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (typeof req.body === 'string') {
          proxyReq.write(req.body);
        } else if (req.body) {
          proxyReq.write(JSON.stringify(req.body));
        }
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
