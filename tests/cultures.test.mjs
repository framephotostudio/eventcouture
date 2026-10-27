// Every cultural wedding has its music, traditions, menu, schedule and checklist: node tests/cultures.test.mjs
import assert from 'assert'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); global.window = global;
require('../js/data.js'); require('../js/engine.js');
const D = global.EC_DATA, E = global.EC_ENGINE;
for (const [k, cu] of Object.entries(D.CULTURES)) {
  const ev = { type: 'wedding', culture: k, guests: cu.guests, hours: cu.hours, city: 'Houston, TX', setting: 'indoor', time: '18:00', date: '2099-06-12' };
  for (const t of ['L', 'S', 'U']) {
    const ids = E.budget(ev, t).items.map(i => i.id);
    for (const m of cu.musicDefault) assert.ok(ids.includes(m), `${k} ${t}: music ${m} missing`);
    for (const a of cu.add) assert.ok(ids.includes(a) || D.CATEGORIES[a].tier.indexOf(t) < 0, `${k} ${t}: tradition ${a} missing`);
  }
  const fit = E.budget(Object.assign({ budget: cu.guests * 120 }, ev), 'F').items.map(i => i.id);
  for (const m of cu.musicDefault) assert.ok(fit.includes(m), `${k}: budget plan dropped chosen music ${m}`);
  const items = E.budget(ev, 'S').items;
  for (const [id, label] of Object.entries(cu.labels)) { const it = items.find(i => i.id === id); if (it) assert.equal(it.name, label, `${k}: label for ${id}`); }
  assert.ok(D.MENUS[cu.menu] && D.MENUS[cu.menu].length === 6, `${k}: menu`);
  const ros = E.runOfShow(ev).map(r => r.text).join(' | ');
  assert.ok(cu.moments.filter(m => !m[2]).every(m => ros.includes(m[1])), `${k}: schedule`);
  const cl = E.checklist(ev, new Date('2098-06-12')).map(c => c.text).join(' | ');
  const mine = D.CHECKLIST.filter(c => c.cu === k && !c.needs); assert.ok(mine.length >= 2 && mine.every(c => cl.includes(c.t.slice(0, 20))), `${k}: checklist`);
  assert.ok(cu.blurb && cu.hint && cu.search, `${k}: blurb, hint, search`);
  assert.equal(E.typeName(ev), cu.name);
  // a plain wedding never gets these
  const plain = E.budget(Object.assign({}, ev, { culture: '' }), 'S').items.map(i => i.id);
  for (const a of cu.add) if (!['mc'].includes(a)) assert.ok(!plain.includes(a), `${a} leaked into a plain wedding`);
}
console.log('cultures ok:', Object.keys(D.CULTURES).length);
