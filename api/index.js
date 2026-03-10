export default async function handler(req, res) {
  const targetPath = req.url.split('?')[0];
  const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
  const targetUrl = `https://icoderd.integracao.academiacode.dev.br${targetPath}${queryString}`;
  
  console.log(`[PROXY] ${req.method} ${targetPath} -> ${targetUrl}`);
  
  try {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (!['host', 'connection'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    headers.set('host', 'icoderd.integracao.academiacode.dev.br');
    
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (req.body) {
        body = JSON.stringify(req.body);
      }
    }
    
    // Disable SSL verification globally
    const https = await import('https');
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      redirect: 'follow',
      agent: agent
    });
    
    const responseBody = await response.text();
    res.status(response.status);
    
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    response.headers.forEach((value, name) => {
      const lowerName = name.toLowerCase();
      if (!['transfer-encoding', 'connection', 'content-encoding'].includes(lowerName)) {
        res.setHeader(name, value);
      }
    });
    
    res.send(responseBody);
    
  } catch (error) {
    console.error('[ERROR]', error.message, error.stack);
    res.status(502);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ error: error.message, stack: error.stack });
  }
}
