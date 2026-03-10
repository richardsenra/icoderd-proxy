export default async function handler(req, res) {
  const targetUrl = `https://icoderd.integracao.academiacode.dev.br${req.url}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'icoderd.integracao.academiacode.dev.br'
      },
      body: req.method !== 'GET' ? req.body : undefined
    });
    
    const body = await response.text();
    res.status(response.status);
    
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    
    res.send(body);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}
