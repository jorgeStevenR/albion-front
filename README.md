# Front Albion — Guild Treasury UI

Frontend Angular para **Albion Treasury** (dashboard, avalonianas, balance, solicitudes).

## Requisitos

- Node.js 20+
- npm 10+

## Desarrollo local

```bash
npm install
npm start
```

App: `http://localhost:4200`  
El proxy de desarrollo apunta la API a `http://localhost:8080`.

## Build producción

```bash
npm run build
```

Salida en `dist/front/browser/`.

## Variables

En `src/environments/environment.prod.ts`:

```ts
apiUrl: 'https://TU-BACKEND.com/api'
```

Actualiza `apiUrl` con la URL pública del backend antes de desplegar.

## Despliegue (Vercel / Netlify / Cloudflare Pages)

1. Conecta este repositorio.
2. Build command: `npm run build`
3. Output directory: `dist/front/browser`
4. Node version: 20
5. Configura `apiUrl` en `environment.prod.ts` o usa variable de entorno en el pipeline.

## Docker (opcional)

```bash
docker build -t front-albion .
docker run -p 80:80 front-albion
```
