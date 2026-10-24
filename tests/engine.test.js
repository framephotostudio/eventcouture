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
  assert(rich.total <= 90000 && rich.total > 85000, 'uses a big budget: ' + rich.total);
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
  assert(E.runOfShow(ev).some(r => /Pay the bill/.test(r.text)));
});
console.log(n + ' checks passed');
