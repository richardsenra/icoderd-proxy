export default async function handler(req, res) {
  // Get full path from query
  const path = req.query.path ? '/' + req.query.path.join('/') : '/';
  
  // Get query string
  const query = new URLSearchParams(req.query);
  query.delete('path');
  const queryString = query.toString();
  
  const targetUrl = `https://icoderd.integracao.academiacode.dev.br${path}${queryString ? '?' + queryString : ''}`;
  
  console.log(`Proxying: ${req.method} ${targetUrl}`);
  
  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'icoderd.integracao.academiacode.dev.br',
        'user-agent': req.headers['user-agent'] || 'icoderd-proxy'
      }
    };
    
    // Remove headers that shouldn't be forwarded
    delete fetchOptions.headers['connection'];
    delete fetchOptions.headers['content-length'];
    
    const response = await fetch(targetUrl, fetchOptions);
    const body = await response.text();
    
    // Set status
    res.status(response.status);
    
    // Copy relevant headers
    const headersToForward = [
      'content-type',
      'content-length',
      'cache-control',
      'last-modified',
      'etag',
      'server',
      'set-cookie',
      'access-control-allow-origin',
      'access-control-allow-credentials',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];
    
    response.headers.forEach((value, name) => {
      if (headersToForward.includes(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    });
    
    res.send(body);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(502).json({
      error: 'Bad Gateway',
      message: error.message,
      target: targetUrl
    });
  }
}
