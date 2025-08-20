// mesh-lite/api/server.ts
import http from 'node:http';

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ ok: true, service: 'mesh-lite' }));
});

server.listen(8787, () => console.log('mesh-lite api on :8787'));
