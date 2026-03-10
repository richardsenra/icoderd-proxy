# iCodeRD Proxy

Proxy reverso para iCodeRD usando Vercel com SSL válido.

Encaminha requisições HTTPS para o Coolify (191.235.34.104:3000) mantendo o certificado SSL válido da Vercel.

## Objetivo

Solucionar problema de certificado SSL auto-assinado que impedia Bitrix24 de acessar a aplicação.

## Como funciona

```
Bitrix24 (HTTPS)
    ↓
Vercel (SSL válido ✅)
    ↓
Coolify 191.235.34.104:3000 (SSL auto-assinado)
    ↓
Bitrix24 (recebe resposta com SSL Vercel ✅)
```

## Deploy

```bash
vercel
```

## Domínio

icoderd.integracao.academiacode.dev.br
