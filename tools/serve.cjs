// Local preview only. GitHub Pages can serve these same files unchanged.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8'};
http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch (_) { response.writeHead(400).end(); return; }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || pathname.split(/[\\/]/).some(part => part.startsWith('.')) || !types[path.extname(file)]) { response.writeHead(404).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404).end(); return; }
    response.writeHead(200, {'Content-Type': types[path.extname(file)]}); response.end(data);
  });
}).listen(Number(process.env.PORT || 8085), '127.0.0.1', () => console.log('Local: http://127.0.0.1:' + (process.env.PORT || 8085)));
