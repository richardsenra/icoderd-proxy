export default async function handler(req, res) {
  const path = req.query.path ? '/' + req.query.path.join('/') : '/';
  const queryString = Object.keys(req.query)
    .filter(k => k !== 'path')
    .map(k => `${k}=${encodeURIComponent(req.query[k])}`)
    .join('&');
  
  const fullUrl = `https://icoderd.integracao.academiacode.dev.br${path}${queryString ? '?' + queryString : ''}`;
  
  try {
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'icoderd.integracao.academiacode.dev.br'
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });
    
    const contentType = response.headers.get('content-type');
    const body = await response.text();
    
    // Copy headers
    response.headers.forEach((value, name) => {
      if (!name.startsWith('content-encoding')) {
        res.setHeader(name, value);
      }
    });
    
    res.status(response.status).send(body);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(502).json({ error: 'Proxy error', message: error.message });
  }
}
