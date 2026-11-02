// Live check: vendor reply links and phone numbers on the real server.
import fs from 'node:fs';
fs.mkdirSync('showcase', { recursive: true });
const API = 'https://event-couture-api.facecouture.workers.dev', H = { 'content-type': 'application/json', origin: 'https://eventcouture.app' }, out = {};
let r = await fetch(API + '/api/ask/new', { method: 'POST', headers: H, body: JSON.stringify({ key: 'live-check-' + 'x'.repeat(30), d: { type: 'Wedding', city: 'Houston, TX', guests: 150, need: 'Catering', vendor: 'Live check (please ignore)' } }) });
out.askNew = [r.status, await r.json()];
if (out.askNew[1].id) { r = await fetch(API + '/api/ask/' + out.askNew[1].id, { headers: { origin: 'https://eventcouture.app' } }); out.askGet = [r.status, await r.json()]; }
r = await fetch(API + '/api/places', { method: 'POST', headers: H, body: JSON.stringify({ query: 'wedding DJ', city: 'Houston, TX', cat: 'dj', kind: 'vendor', level: 'S' }) });
const j = await r.json(); out.places = [r.status, (j.places || []).slice(0, 5).map(p => [p.name, p.phone || '(no phone)'])];
fs.writeFileSync('showcase/live.json', JSON.stringify(out, null, 1)); console.log(JSON.stringify(out)); process.exit(0);
