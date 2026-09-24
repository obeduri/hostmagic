import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOSTMAGIC_LOGO_BASE64 } from './logo-base64.js';

let cachedLogoBuffer: Buffer | null = null;

/**
 * Attempts to locate and read magichost.webp across various runtime environments
 * (direct repository execution, global npm install, bundled dist directory)
 */
export function getLogoBuffer(): Buffer {
  if (cachedLogoBuffer) {
    return cachedLogoBuffer;
  }

  const candidates: string[] = [];

  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    candidates.push(
      path.resolve(currentDir, '..', '..', 'magichost.webp'),
      path.resolve(currentDir, '..', 'magichost.webp'),
      path.resolve(currentDir, 'magichost.webp'),
    );
  } catch {}

  candidates.push(
    path.resolve(process.cwd(), 'magichost.webp'),
    path.resolve(__dirname || '', '..', 'magichost.webp'),
    path.resolve(__dirname || '', 'magichost.webp'),
  );

  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate)) {
        const buf = fs.readFileSync(candidate);
        if (buf && buf.length > 0) {
          cachedLogoBuffer = buf;
          return buf;
        }
      }
    } catch {}
  }

  // Bulletproof fallback: use embedded full Hostmagic WebP logo
  cachedLogoBuffer = Buffer.from(HOSTMAGIC_LOGO_BASE64, 'base64');
  return cachedLogoBuffer;
}

/**
 * Returns a data URI for the logo
 */
export function getLogoDataUri(): string {
  const buf = getLogoBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

/**
 * Generates the Web App Manifest (PWA)
 */
export function getPwaManifest(isSettingsHost = false, _host = ''): string {
  const startUrl = isSettingsHost ? '/' : '/__hostmagic';

  const manifest = {
    name: 'Hostmagic Gateway & Settings Hub',
    short_name: 'Hostmagic',
    description: 'Local development reverse proxy, domain router, and process manager',
    start_url: startUrl,
    scope: '/',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#0f62fe',
    orientation: 'any',
    icons: [
      {
        src: '/__hostmagic/magichost.webp',
        sizes: '192x192 512x512',
        type: 'image/webp',
        purpose: 'any',
      },
      {
        src: '/__hostmagic/magichost.webp',
        sizes: '192x192 512x512',
        type: 'image/webp',
        purpose: 'maskable',
      },
    ],
    categories: ['developer', 'utilities', 'productivity'],
    shortcuts: [
      {
        name: 'Settings Hub',
        short_name: 'Settings',
        url: startUrl,
        icons: [
          {
            src: '/__hostmagic/magichost.webp',
            sizes: '192x192',
            type: 'image/webp',
          },
        ],
      },
    ],
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * Generates the PWA Service Worker (sw.js)
 */
export function getPwaServiceWorker(): string {
  return `// Hostmagic Progressive Web App Service Worker
const CACHE_NAME = 'hostmagic-pwa-v1';
const STATIC_ASSETS = [
  '/__hostmagic',
  '/__hostmagic/manifest.json',
  '/__hostmagic/magichost.webp',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;600&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and proxy websockets/HMR
  if (event.request.method !== 'GET') return;
  if (
    url.pathname.includes('webpack-hmr') ||
    url.pathname.includes('hot-update') ||
    url.pathname.includes('/@vite') ||
    url.pathname.includes('/_next/static/webpack/')
  ) {
    return;
  }

  // Network-first strategy for APIs and live dynamic routes
  if (url.pathname.startsWith('/__hostmagic/api/') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ offline: true, error: 'Offline - service currently unreachable' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Stale-while-revalidate for static dashboard shell & icons
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
`;
}
