import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(
  fileURLToPath(new URL('../public/', import.meta.url)),
);
const port = Number(process.env.PORT || 4177);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
};
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const target = path.resolve(
      root,
      '.' +
        decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname),
    );
    if (!target.startsWith(root + path.sep) && target !== root) {
      response.writeHead(403).end();
      return;
    }
    let body = await readFile(target);
    // Substitute a fixture only in the isolated test server, regardless of the user's configured UID.
    if (process.env.BIRTHDAY_TEST === '1' && url.pathname === '/js/config.js') {
      body = Buffer.from(
        body
          .toString()
          .replace(
            /export const OWNER_UID\s*=\s*(['"])[^'"]*\1\s*;/,
            "export const OWNER_UID = 'test-owner';",
          ),
      );
    }
    response.writeHead(200, {
      'Content-Type': types[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log('Birthday Studio: http://127.0.0.1:' + port),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit()));
