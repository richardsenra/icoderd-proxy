import { httpProxy } from 'http-proxy-middleware';

export default async function handler(req, res) {
    const https = require('https');
    const http = require('http');
    const url = require('url');
    
    const targetUrl = 'https://191.235.34.104:3000' + req.url;
    const parsedUrl = new url.URL(targetUrl);
    
    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: req.method,
        headers: {
            ...req.headers,
            host: parsedUrl.hostname
        },
        rejectUnauthorized: false // Permitir SSL auto-assinado
    };
    
    return new Promise((resolve, reject) => {
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        const proxyReq = protocol.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
            resolve();
        });
        
        proxyReq.on('error', (err) => {
            console.error('Proxy error:', err);
            res.status(500).json({ error: 'Proxy error' });
            reject(err);
        });
        
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            req.pipe(proxyReq);
        } else {
            proxyReq.end();
        }
    });
}
