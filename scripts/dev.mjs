import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, projectRoot } from './build.mjs';

export function resolveRequest(dist, request) {
  const url = new URL(request, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  let file = path.resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(path.resolve(dist) + path.sep)) return { status: 404 };
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!url.pathname.endsWith('/')) return { status: 308, location: url.pathname + '/' + url.search };
    file = path.join(file, 'index.html');
  }
  if (!existsSync(file) || !statSync(file).isFile()) return { status: 404 };
  return { status: 200, file };
}

export function startDevServer({ root = projectRoot, host = '127.0.0.1', port = 4173 } = {}) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Choose a valid port, e.g. --port 4173.');
  build(root);
  const dist = path.join(root, 'dist');
  const clients = new Set();
  let revision = 0, buildError = '', timer;
  const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf' };
  const reload = '<script>const siteUpdates=new EventSource("/__events");siteUpdates.addEventListener("change",()=>location.reload());</script>';
  const server = createServer((request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
    if (request.url === '/__events') {
      response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      response.write(`event: ready\ndata: ${revision}\n\n`);
      clients.add(response); request.on('close', () => clients.delete(response)); return;
    }
    try {
      const target = resolveRequest(dist, request.url);
      if (target.status !== 200) {
        response.writeHead(target.status, target.location ? { Location: target.location } : {});
        response.end(target.status === 404 ? 'Not found' : ''); return;
      }
      const extension = path.extname(target.file);
      if (buildError && extension === '.html') {
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Build failed. Fix the content file and save again.\n\n' + buildError); return;
      }
      let body = readFileSync(target.file);
      if (extension === '.html') body = body.toString().replace('</body>', reload + '</body>');
      response.writeHead(200, { 'Content-Type': mime[extension] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch { response.writeHead(400); response.end('Bad request'); }
  });
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { const result = build(root); buildError = ''; console.log(`Rebuilt ${result.papers} papers.`); }
      catch (error) { buildError = error.message; console.error(buildError); }
      revision += 1;
      for (const client of clients) client.write(`event: change\ndata: ${revision}\n\n`);
    }, 150);
  };
  const watchers = ['content', 'src', 'assets'].map(folder => watch(path.join(root, folder), { recursive: true }, rebuild));
  const heartbeat = setInterval(() => { for (const client of clients) client.write(': keepalive\n\n'); }, 20000);
  const stop = () => {
    clearTimeout(timer); clearInterval(heartbeat); watchers.forEach(watcher => watcher.close());
    for (const client of clients) client.end();
    server.close();
  };
  server.on('error', error => { stop(); console.error(error.message); process.exitCode = 1; });
  server.listen(port, host, () => console.log(`Preview: http://${host}:${port}/\nEdit content/ to rebuild and reload. Ctrl+C to stop.`));
  return { server, stop };
}

if (typeof process !== 'undefined' && process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
    const preview = startDevServer({ host: option('--host', '127.0.0.1'), port: Number(option('--port', process.env.PORT || 4173)) });
    process.once('SIGINT', preview.stop); process.once('SIGTERM', preview.stop);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
