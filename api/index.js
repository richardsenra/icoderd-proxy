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
    
    console.log(`[FETCH] Connecting to ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      redirect: 'follow',
      // Ignore SSL errors for self-signed certificates
      agent: process.env.NODE_ENV === 'production' ? undefined : null
    });
    
    console.log(`[RESPONSE] ${response.status}`);
    
    const responseBody = await response.text();
    res.status(response.status);
    
    response.headers.forEach((value, name) => {
      const lowerName = name.toLowerCase();
      if (!['transfer-encoding', 'connection', 'content-encoding'].includes(lowerName)) {
        res.setHeader(name, value);
      }
    });
    
    res.send(responseBody);
    
  } catch (error) {
    console.error('[ERROR]', error.message, error.stack);
    res.status(502).json({ 
      error: error.message,
      url: targetUrl,
      details: error.toString()
    });
  }
}
