// Runs the real Event Couture server code locally with in-memory storage, for browser tests. node tests/market_server.mjs 8787
import http from 'http';
const src = await import('../worker/index.js');
const store = new Map();
const env = { EC_KV: { get: async k => store.has(k) ? store.get(k) : null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } }, ALLOWED_ORIGINS: 'http://localhost:8765' };
http.createServer(async (req, res) => {
  let body = ''; req.on('data', c => body += c); await new Promise(r => req.on('end', r));
  const headers = { ...req.headers, 'cf-connecting-ip': '7.7.7.' + Math.floor(Math.random() * 250) };
  const r = await src.default.fetch(new Request('http://localhost' + req.url, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text());
}).listen(+process.argv[2] || 8787);
