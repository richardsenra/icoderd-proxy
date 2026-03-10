export default async function handler(req, res) {
  const targetPath = req.url.split('?')[0];
  const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
  const targetUrl = `https://icoderd.integracao.academiacode.dev.br${targetPath}${queryString}`;
  
  console.log(`[PROXY] ${req.method} ${targetPath}`);
  
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
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    }
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      redirect: 'follow'
    });
    
    const responseBody = await response.text();
    res.status(response.status);
    
    response.headers.forEach((value, name) => {
      const lowerName = name.toLowerCase();
      if (!['transfer-encoding', 'connection'].includes(lowerName)) {
        res.setHeader(name, value);
      }
    });
    
    res.send(responseBody);
    
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(502).json({ error: error.message });
  }
}
