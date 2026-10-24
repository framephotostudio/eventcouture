// Run: node tests/engine.test.js
require('../js/data.js');
require('../js/engine.js');
const E = globalThis.EC_ENGINE;
const assert = require('assert');
let n = 0;
function t(name, fn) { fn(); n++; console.log('ok', name); }

t('pass tiers match the approved prices', () => {
  assert.equal(E.passFor(1).price, 9.99);
  assert.equal(E.passFor(25).price, 9.99);
  assert.equal(E.passFor(26).price, 19.99);
  assert.equal(E.passFor(75).price, 19.99);
  assert.equal(E.passFor(150).price, 39.99);
  assert.equal(E.passFor(350).price, 69.99);
  assert.equal(E.passFor(500).price, 79.99);
  assert.equal(E.passFor(2000).price, 99.99);
  assert.equal(E.passFor(5000).price, 199.99);
  assert.equal(E.passFor(10000).price, 349.99);
  assert.equal(E.passFor(12000).price, 499.99);
  assert.equal(E.passFor(15000).price, 499.99);
  assert.equal(E.passFor(15001).price, 649.99);
});
t('upgrade pays only the difference', () => {
  assert.equal(E.upgradeCost(9.99, 40).due, 10);
  assert.equal(E.upgradeCost(39.99, 20).due, 0);
});
const brunch = { type: 'brunch', guests: 10, city: 'Houston, TX', budget: 1500, hours: 3 };
const wedding = { type: 'wedding', guests: 120, city: 'New York, NY', budget: 60000 };
t('three budget versions rise in cost', () => {
  for (const ev of [brunch, wedding, { type: 'birthday', guests: 40, city: 'Dallas, TX' }]) {
    const [l, s, u] = E.allBudgets(ev);
    assert(l.total < s.total && s.total < u.total, ev.type);
    assert(l.items.every(i => i.lo <= i.mid && i.mid <= i.hi));
    assert.equal(s.contingency, Math.round(s.mid * 0.1 / 5) * 5);
  }
});
t('brunch uses private dining, not venue + catering', () => {
  const ids = E.budget(brunch, 'S').items.map(i => i.id);
  assert(ids.includes('privateDining') && !ids.includes('venue') && !ids.includes('catering'));
});
t('outdoor adds tent and permits; officiant only for weddings', () => {
  const ids = E.budget({ type: 'birthday', guests: 40, setting: 'outdoor' }, 'L').items.map(i => i.id);
  assert(ids.includes('tent') && ids.includes('permits') && !ids.includes('officiant'));
  assert(E.budget(wedding, 'S').items.some(i => i.id === 'officiant'));
});
t('city index raises New York over Houston', () => {
  const a = E.budget({ type: 'birthday', guests: 40, city: 'Houston, TX' }, 'S').total;
  const b = E.budget({ type: 'birthday', guests: 40, city: 'New York, NY' }, 'S').total;
  assert(b > a * 1.3);
});
t('price overrides replace estimates and are labeled', () => {
  const b = E.budget({ ...brunch, overrides: { cake: { amount: 180, source: 'quote' } } }, 'S');
  const cake = b.items.find(i => i.id === 'cake');
  assert.equal(cake.mid, 180); assert.equal(cake.label, 'Confirmed quote');
});
t('guardian suggests swaps when over budget', () => {
  const ev = { type: 'birthday', guests: 60, city: 'Los Angeles, CA', budget: 3000 };
  const g = E.guardian(ev, E.budget(ev, 'U'));
  assert(g.over > 0 && g.swaps.length > 0);
  assert.equal(E.guardian({ ...ev, budget: 1e7 }, E.budget(ev, 'U')).over, 0);
});
t('capacity counts plus-ones and skips declined and waitlist', () => {
  assert.equal(E.placesUsed([{ status: 'yes', plusOnes: 1 }, { status: 'invited' }, { status: 'declined', plusOnes: 2 }, { status: 'waitlist' }]), 3);
});
t('quantities scale with guests', () => {
  const q = E.quantities({ type: 'birthday', guests: 40, hours: 4 });
  assert.equal(q.find(x => x.item === 'Chairs').qty, 40);
  assert.equal(q.find(x => x.item === 'Round tables (seat 8)').qty, 5);
  assert.equal(q[0].qty, 200);
});
t('checklist dates count back from the event date', () => {
  const c = E.checklist({ type: 'birthday', date: '2026-12-19' }, new Date('2026-10-23'));
  assert.equal(c.find(x => x.text.startsWith('Send invitations')).due, '2026-11-07');
  assert(!c.some(x => x.text.startsWith('Send save-the-dates')));
});
t('concepts follow colors and words', () => {
  const pink = E.concepts({ type: 'brunch' }, [[247, 220, 220], [232, 180, 184]], 'blush pink brunch', []);
  assert.equal(pink.length, 3); assert.equal(pink[0].id, 'blush-romance');
  const noir = E.concepts({ type: 'birthday' }, [[17, 17, 17], [201, 168, 106]], 'black and gold', []);
  assert.equal(noir[0].id, 'modern-noir');
  const more = E.concepts({ type: 'birthday' }, [[17, 17, 17]], 'black', [], noir.map(c => c.id));
  assert(!more.some(c => noir.find(x => x.id === c.id)));
});
t('run of show is in order and formatted', () => {
  const r = E.runOfShow({ type: 'birthday', time: '19:00', hours: 4 });
  assert.equal(r[2].time, '7:00 PM'); assert.equal(r[0].time, '5:00 PM');
});

t('plan made for your budget lands at the budget and protects must-haves', () => {
  const ev = { type: 'wedding', guests: 200, city: 'Houston, TX', budget: 30000, priorities: ['photographer'] };
  const f = E.budgetFit(ev);
  assert(Math.abs(f.total - 30000) <= 60, 'total ' + f.total);
  const s = E.budget(ev, 'S').items.find(i => i.id === 'photographer').mid;
  assert(f.items.find(i => i.id === 'photographer').mid >= s * 0.99, 'photographer protected');
  assert(f.dropped.length > 0);
  const rich = E.budgetFit({ ...ev, budget: 90000 });
  assert(rich.total <= 90000 && rich.spare > 0, 'a budget is a maximum, never filled just because: ' + rich.total);
  assert(rich.items.find(i => i.id === 'photographer').mid > s, 'leftover money upgrades the must-have');
  const tight = E.budgetFit({ type: 'birthday', guests: 40, city: 'Dallas, TX', budget: 800 });
  assert(tight.shortBy > 0, 'reports when a budget is too small');
  assert.equal(E.budget(ev, 'F').tier.id, 'F');
});
t('restaurant lunch prices menu ordering, not a venue event', () => {
  const ev = { type: 'birthday', guests: 10, city: 'Houston, TX', setting: 'restaurant', time: '12:30', hours: 2, budget: 2000 };
  const s = E.budget(ev, 'S'); const ids = s.items.map(i => i.id);
  assert(!ids.includes('venue') && !ids.includes('catering') && !ids.includes('rentals') && !ids.includes('dj'), ids.join());
  assert(ids.includes('restaurantFood') && ids.includes('cake'));
  assert(s.perGuest >= 45 && s.perGuest <= 90, 'per guest ' + s.perGuest);
  const dinner = E.budget({ ...ev, time: '19:00' }, 'S');
  assert(dinner.total > s.total, 'dinner costs more than lunch');
  const fit = E.budgetFit(ev);
  assert(!fit.items.some(i => i.id === 'photographer'), 'budget fit does not add hired extras at a restaurant');
  assert(fit.total < 1500, 'does not spend money just because it is there: ' + fit.total);
  assert(E.checklist(ev).some(c => /reserve a table/.test(c.text)) && !E.checklist(ev).some(c => /Book key vendors/.test(c.text)));
  assert(E.runOfShow(ev).some(r => /Settle the bill|settles their own check/.test(r.text)));
});
t('ChatGPT scenario: Houston birthday dinner, 10 people, $1,000 max, no alcohol', () => {
  const ev = { type: 'birthday', guests: 10, expected: 10, city: 'Houston, TX', setting: 'restaurant', time: '19:00', hours: 2, budget: 1000, alcohol: 'none' };
  const f = E.budgetFit(ev);
  assert(f.total <= 1000 && !f.shortBy, 'fits under the maximum: ' + f.total);
  assert(f.items.some(i => /Non-alcoholic/.test(i.name)) && !f.items.some(i => /beer|wine/i.test(i.name)), 'no alcohol priced');
  assert.equal(E.passFor(10).price, 9.99);
});
t('budget guardian only suggests real savings, with true totals', () => {
  const ev = { type: 'birthday', guests: 60, city: 'Los Angeles, CA', budget: 3000 };
  for (const tier of ['L', 'S', 'U', 'F']) {
    const b = E.budget(ev, tier);
    E.guardian(ev, b).swaps.forEach(s => {
      assert(s.save > 0, 'every suggestion saves money');
      if (s.kind === 'tier') assert(E.budget(ev, s.to).total < b.total, 'switching versions really costs less');
    });
  }
});
t('impossible budget is labeled honestly', () => {
  const f = E.budgetFit({ type: 'wedding', guests: 150, city: 'New York, NY', budget: 5000 });
  assert(f.shortBy > 0 && f.total > 5000);
});
t('pass tier boundaries', () => {
  assert.equal(E.passFor(25).price, 9.99); assert.equal(E.passFor(26).price, 19.99);
  assert.equal(E.passFor(75).price, 19.99); assert.equal(E.passFor(76).price, 39.99);
  assert.equal(E.upgradeCost(9.99, 26).due, 10);
});
t('brunch timeline has no birthday song unless it is a birthday', () => {
  assert(!E.runOfShow({ type: 'brunch', setting: 'restaurant', time: '11:00', hours: 2 }).some(r => /birthday/.test(r.text)));
  assert(E.runOfShow({ type: 'birthday', setting: 'restaurant', time: '19:00', hours: 2 }).some(r => /birthday/.test(r.text)));
});
console.log(n + ' checks passed');
// chosen photo + AI repeat of it + drink word as a color: three different looks, no "Champagne" names
{
  const E2 = globalThis.EC_ENGINE; if (!globalThis.EC_INSPO) require('../js/inspo.js');
  const ev = { type: 'baby-shower', guests: 30, inspiration: { inspo: 'lavender-garden-shower', text: 'lavender', vibes: [] } };
  const ai = [{ id: 'a', name: 'Lavender Garden Shower' }, { id: 'b', name: 'Champagne & Sage Terrace', mood: 'warm champagne neutrals' }, { id: 'c', name: 'Lavender Garden Party' }];
  const out = E2.withInspo(ev, ai, [], E2.concepts(ev, [], 'lavender', [], []));
  const names = out.map(c => c.name);
  if (out.length !== 3 || new Set(names).size !== 3 || names.filter(n => /lavender garden/i.test(n)).length !== 1 || names.some(n => /champagne/i.test(n)) || out[0].inspo !== 'lavender-garden-shower') { console.error('FAIL three different looks', names); process.exit(1); }
  console.log('ok three different looks with no drink names');
}
{
  const E3 = globalThis.EC_ENGINE;
  const n = E3.lookPieces({ type: 'birthday', inspiration: { text: 'pastel colored napkins, multicolored candles, fresh flowered runners' } }, { id: 'x' }).map(p => p.name).join('|');
  if (/Red /.test(n)) { console.error('FAIL color inside a word', n); process.exit(1); }
  const k = E3.lookPieces({ type: 'kids-birthday', kids: true, inspiration: { text: 'lanterns and candles' } }, { id: 'x' });
  if (k.some(p => /candle/i.test(p.name + ' ' + p.q))) { console.error('FAIL candles at a kids party', k); process.exit(1); }
  console.log('ok shopping colors and kids pieces');
}
