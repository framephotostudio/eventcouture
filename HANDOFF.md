# Event Couture by Always Luxe: developer handoff

**Version 0.14 · October 24, 2026**
**Live site:** https://facecouture.app/eventcouture/
**Code:** https://github.com/framephotostudio/eventcouture (public; every push to `main` deploys automatically)
**Server:** https://event-couture-api.facecouture.workers.dev (status at `/api/status`)

## 1. What the product does

Event Couture turns a host's inspiration (photos, a description, spoken words, or picked colors and vibes) into a complete, priced event plan for any kind of event and any budget. It covers brunches, birthdays, showers, bachelorettes, graduations, weddings and galas.

1. The host shares inspiration and event details.
2. They confirm the details on a review screen.
3. The AI creates three original concepts (look, decor, menu style, music, dress code).
4. The host picks one and gets the full plan: budget, venues, vendors, food and drink, style and shopping, a 10-song playlist, timeline, guests, voting, invitations and registry.
5. Planning is free. At the end the host pays once (the Event Pass) to keep the plan and share it with guests.

## 2. Ground rules from the owner (do not change without her sign-off)

- Luxury look and feel at every budget. Editorial and calm: ivory pages, deep plum, sparing champagne gold. Event photography provides the color.
- Planning is free. Payment is asked for at the end, to keep and share the plan.
- No subscriptions. Revenue comes from the Event Pass, AI credits, packages, add-ons, and affiliate, registry and featured-vendor income.
- The app never holds money between people. Cost splitting uses the host's own Venmo, Cash App or PayPal links.
- No cold outreach to vendors. Vendors are never emailed unless they have joined.
- No AI-generated pictures of a customer's event. Plans use the host's own photos. The home-page sample photos are labeled as AI-generated inspiration.
- Anything that would need the owner's ongoing personal work is left out.
- Phone and desktop must behave the same. Test both.
- The budget is a maximum, never a target. Never silently change the guest count, venue type or must-haves.
- Estimates are labeled as estimates, never presented as quotes or bookings.

## 3. Pricing in the app

**Event Pass** (one time, per event, based on everyone invited including plus-ones and the host):

| People invited | Price |
|---|---|
| Up to 25 | $9.99 |
| 26 to 75 | $19.99 |
| 76 to 150 | $39.99 |
| 151 to 350 | $69.99 |
| 351 to 500 | $79.99 |
| 501 to 2,000 | $99.99 |
| 2,001 to 5,000 | $199.99 |
| 5,001 to 10,000 | $349.99 |
| Each extra 5,000 | +$150 |

Moving up a size charges only the difference. AI credits: 10 for $4.99, 25 for $9.99, 60 for $19.99. Package: three more concepts, $7.99. Add-ons: matching graphics $6.99; outfit boards, multilingual page, album space, more vendor options and thank-you drafts at $4.99 each; planner branding $9.99. **Add-ons are listed but do not deliver anything yet** (see section 9). The removed AI picture products (venue illustrations, invitation artwork) must stay removed.

## 4. How it is built

- **Website and app:** plain HTML, CSS and JavaScript. No framework, no build step. One page with hash routes (`#/`, `#/new/1`, `#/e/<id>/budget` and so on). It runs as the website now and is ready to wrap with Capacitor for iPhone and Android.
- **Saving:** in the browser (localStorage). There are no accounts yet.
- **Server:** a Cloudflare Worker (`worker/index.js`) that holds the keys and calls:
  - **Google Gemini** for concepts. It picks the newest available Gemini Flash model automatically, retries once if an answer is cut off, and returns error codes without exposing keys.
  - **Google Places (New)** for venues and vendors, with quality filters.
  - **Google Routes** for drive times.
  - A **daily spending cap** of $0.66 (about $20 a month) kept in Cloudflare KV (`EC_KV`).
- **Deploy:** `.github/workflows/deploy.yml` runs on every push to `main`. It:
  1. Loads the four repository secrets.
  2. Finds the Cloudflare account from the token.
  3. Creates the KV store once.
  4. Deploys the Worker and sets its secrets.
  5. Writes the Worker URL into `js/config.js`.
  6. Publishes the site to GitHub Pages (custom domain facecouture.app, path `/eventcouture`).
- **Repository secrets** (already saved): `GEMINI_KEY`, `GOOGLE_MAPS_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Never put keys in code or chat.
- **Payments:** the site stays in preview mode (`preview: true` in `js/config.js`). "Keep my plan" records the pass on the device with no charge until real checkout is built.

## 5. File map

| File | What it holds |
|---|---|
| `index.html` | App shell: fonts, styles, scripts, loader, icons |
| `js/config.js` | Server address (filled in by deploy), preview flag, Amazon tag, version |
| `js/data.js` | Catalogs: event types, vendor categories and cost models, settings (restaurant, private room, venue, outdoors, home), cities, styles, menus, checklist, passes, credits, packages, add-ons, venue types |
| `js/engine.js` | Planning math: budgets per level, budget plan (maximum-based), pros and cons, Budget Guardian, quantities, checklist, run of show, concept matching, dress codes, pass pricing |
| `js/songs.js` | Ready-made 10-song playlists for each music mood, plus matching for AI moods |
| `js/app.js` | Every screen: home, wizard (inspiration, details, review), concepts, plan tabs, venues and vendors search, guests, voting, invitations, registry, cost splitting, extras, keep-my-plan checkout, pricing, help, legal |
| `css/app.css` | All styling. The design tokens at the top set the colors |
| `worker/index.js` | Server: `/api/status`, `/api/concepts`, `/api/places`, `/api/drive`, quality filters, spending cap |
| `worker/wrangler.toml` | Server settings: allowed websites, daily cap, model fallback |
| `.github/workflows/deploy.yml` | Automatic deploy of server and site |
| `img/` | Hero photo, seven sample event photos (`img/events/`), brand assets (`img/brand/`: logos, header banner, iOS, Android, web and store icons, splash) |
| `brand-src/` | The approved original logo and EC icon. Never redraw them |
| `tools_brand.py`, `tools_couture.py` | Rebuild every brand asset from the originals |
| `tests/` | Engine checks, browser flows, the server filter test, customer scenarios and the single-file preview builder |

## 6. Key behaviors to preserve

- **Where is it?** is required: restaurant (menu bill, no venue or catering), private room, event venue, outdoors (tent, permits, restrooms), or at home. Prices, venues, checklist, timeline, decor and shopping all follow this choice.
- **Drinks:** no alcohol, beer and wine, or full bar. This changes the drink prices, the quantities and the toast.
- **Who's paying:** host, everyone pays their own (shows the per-person amount), or splitting the cost. Cost splitting only appears when splitting.
- **Review screen** before anything is generated. Defaults never overwrite numbers the host typed.
- **Budget plan:** never goes over the maximum when the maximum is realistic. Leftover money only upgrades must-haves. Over-budget plans say "Closest plan, $X over your budget". Comparing spending levels is optional, in a pop-up.
- **Budget Guardian:** every suggestion shows real savings. Switching versions shows the true new total and only appears when it is cheaper.
- **Venue search:** matched to the plan's level and the host's words, with an area filter and a starting point for drive times. The server keeps only places rated 4.3 to 4.5 stars or higher (by level) with enough reviews, at the right price level, open, and never budget chains (mid-range chains only for Luxe for Less).
- **Vendor search:** shows the actual service (decor rentals, florists, bakeries and so on), never planners. Each category shows a typical local price range. "Ask for their price" is hidden until vendors join.
- **Dress code:** a general code for guests (Cocktail attire, Smart casual and so on) plus a specific look for the person being celebrated.
- **Free preview:** before the plan is kept, each section shows a taste (3 budget lines, 2 venue styles, 3 places, 3 vendor categories, 3 menu ideas, 2 shopping picks, 3 songs, 4 checklist steps) with a "Keep my plan" card. Guests, voting and the album open after keeping. Totals, concepts and budget fit are always free. This lock lives in the browser, so it can be bypassed until accounts exist; once there is a backend, the server should only send the locked details after payment.
- **Pop-ups and messages** close when the page changes. The keep-my-plan button cannot be double-submitted.

## 7. How to run and test

- **Run locally:** `python3 -m http.server 8765` in the project folder, then open http://localhost:8765/.
- **Tests:**
  - `node tests/engine.test.js` (20 checks)
  - `node tests/worker_places.test.mjs`
  - `python3 tests/scenarios.py` (seven real customer scenarios, including the $1,000 no-alcohol birthday dinner and the 25/26 and 75/76 price boundaries)
  - `python3 tests/e2e.py`
  - `python3 tests/live.py`
  - `python3 tests/vibe.py <folder>`
  - `python3 tests/drafts.py <folder>`
- **Single-file preview:** `python3 tests/build_preview.py <out.html>`
- **Brand assets:** `python3 tools_brand.py`

## 8. Status

**Working end to end:**
- All screens on phone and desktop.
- Real AI concepts and AI playlists.
- Real venue and vendor search with quality filters and drive times.
- Spending cap.
- Automatic deploy.
- Branding and icons.

**Works on one device only (preview):**
- Saving.
- Guest page, RSVPs, voting, co-hosts.
- Keep-my-plan checkout (no charge).
- Credits and add-on purchases (ledger entry only).
- Vendor sign-up (not published anywhere).

## 9. Still to build (needs a backend or outside service)

1. **Accounts and a database** (for example Supabase or Cloudflare D1) so plans sync across devices and guest links, RSVPs, voting and co-hosts work on other phones.
2. **Real checkout:** Stripe on the web, Apple and Google in-app purchase in the apps. Server-verified entitlements, no double charges, refunds on failure.
3. **Deliverables for each paid add-on** before selling it. Keep them hidden until they work.
4. **iPhone and Android apps:** wrap with Capacitor (the in-app browser handler is already in `app.js`) and submit using the icons in `img/brand/`.
5. **Phase 2 from the ChatGPT review:**
   - Regroup the 12 plan tabs into Overview, Budget and bookings, Guests and invitations, Tasks and timeline.
   - Shortlist, quote and booked status for venues and vendors, tied to the budget.
   - Undo for big changes.
   - Clear allowance rules, and the exact access-expiry date.
6. **Security before real payments:** sign-in checks on server routes, rate limits, and an atomic spending counter.
7. **Basic analytics** for the customer journey (start, review done, concepts viewed, plan kept, venue shortlisted, return visit).
8. **Key hygiene:** the Google Maps key was shown in a screenshot. Rotate it and restrict it to Places API (New) and Routes API.
