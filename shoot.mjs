import fs from 'node:fs'; fs.mkdirSync('showcase', { recursive: true });
const API = 'https://event-couture-api.facecouture.workers.dev', H = { origin: 'https://eventcouture.app', 'content-type': 'application/json' }, out = {};
const t0 = Date.now(); out.status = await (await fetch(API + '/api/status', { headers: H })).text(); out.statusMs = Date.now() - t0;
for (const [i, q] of [['dj', 'arabic wedding DJ'], ['venue', 'wedding venue ballroom'], ['photographer', 'wedding photographer']].entries()) {
  const t = Date.now(); const r = await fetch(API + '/api/places', { method: 'POST', headers: H, body: JSON.stringify({ query: q[1], city: 'Los Angeles, CA', cat: q[0], level: 'S' }) });
  const txt = await r.text(); out['places' + i] = { status: r.status, ms: Date.now() - t, body: txt.slice(0, 300) };
}
fs.writeFileSync('showcase/api.json', JSON.stringify(out, null, 1)); console.log('done');
