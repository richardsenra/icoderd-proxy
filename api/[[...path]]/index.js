export default async function handler(req, res) {
  const path = req.query.path ? '/' + req.query.path.join('/') : '/';
  const targetUrl = `https://icoderd.integracao.academiacode.dev.br${path}${req.url.split('?')[1] ? '?' + req.url.split('?')[1] : ''}`;
  
  console.log(`Proxying: ${req.method} ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'icoderd.integracao.academiacode.dev.br'
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined
    });
    
    const body = await response.text();
    res.status(response.status);
    
    response.headers.forEach((value, name) => {
      if (!name.includes('transfer-encoding')) {
        res.setHeader(name, value);
      }
    });
    
    res.send(body);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(502).json({ error: 'Proxy error', message: error.message });
  }
}
