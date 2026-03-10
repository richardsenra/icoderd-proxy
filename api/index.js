export default async function handler(req, res) {
    // Proxy para o Coolify
    const coolifyUrl = 'https://191.235.34.104:3000';
    const path = req.url.replace(/^\/?/, '');
    
    try {
        const response = await fetch(`${coolifyUrl}/${path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`, {
            method: req.method,
            headers: req.headers,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
            // Ignorar certificado auto-assinado
            agent: {
                rejectUnauthorized: false
            }
        });
        
        const data = await response.text();
        res.status(response.status);
        
        // Copiar headers
        for (const [key, value] of response.headers) {
            res.setHeader(key, value);
        }
        
        res.send(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy error', message: error.message });
    }
}
