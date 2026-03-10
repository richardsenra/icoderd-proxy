export default async function handler(req, res) {
  const path = req.query.path ? '/' + req.query.path.join('/') : '/';
  const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
  const targetUrl = `https://icoderd.integracao.academiacode.dev.br${path}${queryString}`;
  
  console.log(`[PROXY] ${req.method} ${path}`);
  
  try {
    // Preparar headers
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    headers.set('host', 'icoderd.integracao.academiacode.dev.br');
    
    // Preparar body
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (req.body) {
        body = JSON.stringify(req.body);
      }
    }
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      redirect: 'follow'
    });
    
    const responseBody = await response.text();
    
    // Set status
    res.status(response.status);
    
    // Forward relevant headers
    response.headers.forEach((value, name) => {
      const lowerName = name.toLowerCase();
      if (!['transfer-encoding', 'connection', 'content-encoding'].includes(lowerName)) {
        res.setHeader(name, value);
      }
    });
    
    // Ensure content-type is set
    if (!res.hasHeader('content-type')) {
      res.setHeader('content-type', 'text/html; charset=utf-8');
    }
    
    res.send(responseBody);
    
  } catch (error) {
    console.error('[PROXY ERROR]', error);
    res.status(502).json({ 
      error: 'Bad Gateway', 
      message: error.message,
      path: path
    });
  }
}
