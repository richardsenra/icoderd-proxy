import https from 'https';
import { URL } from 'url';

export default async function handler(req, res) {
  const targetPath = req.url.split('?')[0];
  let queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
  
  console.log(`[PROXY] ${req.method} ${targetPath}`);
  console.log(`[PROXY] Original query:`, req.url.split('?')[1]);
  console.log(`[PROXY] Body:`, req.body);
  
  // If POST with form body (not JSON), add body params to query string
  const contentType = req.headers['content-type'] || '';
  const isJsonRequest = contentType.includes('application/json');

  if (req.method === 'POST' && req.body && typeof req.body === 'object' && !isJsonRequest) {
    const bodyParams = Object.entries(req.body)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    if (bodyParams) {
      queryString = queryString ? queryString + '&' + bodyParams : '?' + bodyParams;
      console.log(`[PROXY] Added body params to query: ${bodyParams.substring(0, 100)}...`);
    }
  }

  const targetUrl = `https://icoderd.integracao.academiacode.dev.br${targetPath}${queryString}`;
  console.log(`[PROXY] Target URL:`, targetUrl.substring(0, 150));
  console.log(`[PROXY] Content-Type:`, contentType);
  console.log(`[PROXY] Is JSON:`, isJsonRequest);

  return new Promise((resolve) => {
    try {
      const url = new URL(targetUrl);

      // Prepare body - keep JSON as-is, form data as URL-encoded
      let body = '';
      let contentLength = 0;

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (isJsonRequest && typeof req.body === 'object') {
          // Keep JSON as JSON
          body = JSON.stringify(req.body);
          contentLength = Buffer.byteLength(body);
        } else if (typeof req.body === 'object') {
          // Form data: convert to URL-encoded
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
      
      if (body) {
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
