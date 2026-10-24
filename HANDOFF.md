# Event Couture by Always Luxe: developer handoff

**Version 0.21 · October 24, 2026**
**Live site:** https://facecouture.app/eventcouture/
**Code:** https://github.com/framephotostudio/eventcouture (public; every push to `main` deploys automatically)
**Server:** https://event-couture-api.facecouture.workers.dev (status at `/api/status`)

## 1. What the product does

Event Couture turns a host's inspiration (photos, a description, spoken words, or picked colors and vibes) into a complete, priced event plan for any kind of event and any budget. It covers brunches, birthdays, showers, bachelorettes, graduations, weddings and galas.

1. The host shares inspiration and event details.
2. They confirm the details on a review screen.
3. The AI creates three original concepts (look, decor, menu style, music, dress code).
4. The host picks one and gets the full plan, in four sections: Overview (summary, style and music with a named 25-song playlist, the pass), Budget & bookings (budget, venues, vendors, food and drink), Guests & invitations (guests, invite and registry, voting, photos and thank-yous) and Tasks & timeline (checklist and day-of schedule).
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

Moving up a size charges only the difference. AI credits: 10 for $4.99, 25 for $9.99, 60 for $19.99. Package: three more concepts, $7.99. Add-ons: matching graphics $6.99; outfit boards, multilingual page, album space, more vendor options and thank-you drafts at $4.99 each; planner branding $9.99. **Credits, packages and add-ons are hidden** (`SELL_EXTRAS = false` in `app.js`) until each one delivers something real (see section 9). The one free extra set of concepts stays. The removed AI picture products (venue illustrations, invitation artwork) must stay removed.

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
| `js/legal.js` | Privacy Policy and Terms of Use (business name, email and governing state come from `js/config.js`) |
| `js/songs.js` | Ready-made 25-song playlists for each music mood, plus matching for AI moods |
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
- **Bookings:** Save any venue or vendor from a search to the shortlist. The Budget page shows a Bookings panel (booked count, confirmed amount, prices received, saved businesses). Each line shows To book, Shortlisted, Got a price or Booked. Adding a quote or booking replaces the estimate in the totals.
- **Undo:** tier changes, budget-guardian swaps, concierge changes, setting changes, removed lines, saved prices and shortlist removals show an Undo button for 8 seconds.
- **Playlists:** 14 ready-made named playlists of 25 songs (`js/songs.js`), matched to the event type (romantic lists only for couples' events; no club lists at showers). AI plans name their own playlist and are topped up to 25.
- **Face Couture:** a card under What to wear and a footer link open facecouture.app. Nothing else is connected yet.
- **Fits the occasion:** drinks follow the host's choice everywhere (menus, decor, swaps, schedule); family events default to no alcohol; start times default by event type; venues match home, outdoor, daytime and kids' events; registries only show where gifts are expected; weddings get a ceremony, dinner and dancing playlist; elegant events skip balloons; dinner parties and galas don't budget an outfit.
- **Budget guardian:** for big gaps it offers real levers (how many guests fit, an indoor venue instead of outdoors, hosting at home); the smallest change that closes the gap comes first. Rounding never tips a realistic plan over the maximum. Prices the host enters show exactly as entered.
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
  - `python3 tests/bookings.py <folder>` (shortlist and bookings with a stand-in server)
  - `python3 tests/interactions.py` (every control after a plan is made: date, levels, undo, prices, guests, co-hosts, seating, splitting, album, gifts, notes, pass upgrade, new concepts, delete, help, vendor form, drafts)
  - `python3 tests/review_regressions.py` (each problem found by the independent review stays fixed)
  - `python3 tests/personas.py <folder>` (18 different clients, from a $600 kids' party to a 1,000-guest wedding; every page of each plan is read and checked)
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
- Vendor sign-up (not published anywhere).

## 9. Still to build (needs a backend or outside service)

1. **Accounts and a database** (for example Supabase or Cloudflare D1) so plans sync across devices and guest links, RSVPs, voting and co-hosts work on other phones.
2. **Real checkout:** Stripe on the web, Apple and Google in-app purchase in the apps. Server-verified entitlements, no double charges, refunds on failure.
3. **Deliverables for each paid add-on** before selling it. Keep them hidden until they work.
4. **iPhone and Android apps:** wrap with Capacitor (the in-app browser handler is already in `app.js`) and submit using the icons in `img/brand/`.
5. **Done in 0.17:** tabs grouped into four sections, shortlist and booking status, undo, and the access-expiry date.
6. **Security before real payments:** sign-in checks on server routes, rate limits, and an atomic spending counter.
7. **Basic analytics** for the customer journey (start, review done, concepts viewed, plan kept, venue shortlisted, return visit).
8. **Key hygiene:** the Google Maps key was shown in a screenshot. Rotate it and restrict it to Places API (New) and Routes API.

## 0.24.0: AI-generated inspiration gallery (branch inspiration-gallery, awaiting owner sign-off on names)
- 40 photos in img/inspo (large + sm), described in js/inspo.js, built by tools_inspo.py (edit the list there).
- Home "What are you celebrating?" + #/inspiration/<type>[/<draftId>]; every AI photo carries an "AI-generated inspiration" label.
- "Use this inspiration" starts a draft with ev.inspiration.inspo; E.withInspo puts the photo's concept first (second when the host names her own colors).
- New looks: citrus-fiesta, amalfi-lemon, blue-willow, butter-bloom, tuscan-olive.
- D.NEW_VENUES: hand-checked newly opened venues (Deco House River Oaks, Houston). Not paid placement.
- Test: tests/inspiration.py
- No alcohol words in photo names or descriptions (test checks js/inspo.js). Library look "Champagne Garden" now shows as "Sage Garden" (id unchanged).
- Get this look (Style and music page): E.lookPieces(ev) lists what to buy (Amazon/Etsy searches) or hire (links to Vendors), in this order: host's own words (PIECE_WORDS, nearest color wins), photo marks (LOVE_PIECES), then the photo's pieces (tools_inspo.py PIECES), the AI concept's pieces (worker returns "pieces"), or D.STYLE_PIECES.

## 0.25.0: analytics; three truly different concepts
- js/analytics.js: GA4, same property as Face Couture (G-JNY27DLF0Z); every event has app_name=event_couture. Only on facecouture.app, off with Do Not Track / Global Privacy Control. Page titles and addresses are replaced with clean paths (/eventcouture/plan/budget), so event names and ids never reach Google. Funnel: page_view, inspiration_filter/open/used, details_done, concepts_requested, concepts_shown (source ai|library, wait_seconds), concept_chosen, plan_kept, shop_click, venues_view, new_venue_click, song_play, face_couture_click, rsvp_sent, vendor_listing_published, event_deleted and more. Test: tests/analytics.py.
- E.withInspo now cleans AI concepts (no drink words as colors/names), drops repeats of the chosen photo or of each other, and tops up from the library so there are always 3 different looks.

## 0.26.0: second independent review (16 issues fixed)
- AI answers are untrusted: E.withInspo -> cleanConcept(c, i, ev) rebuilds each concept from plain text and hex colors only (no img/inspo/links), fills missing fields, swaps every drink word in names (swapDrinks: champagne->soft gold, mimosa->citrus, rosé->blush...), drops alcohol lines at no-alcohol events and nightclub/candle/dark looks at kids' parties.
- Always 3 different looks: repeats by name/id, the photo, and anything already shown (ev.seenLooks) are dropped; topped up from a 12-look library list.
- Photo names follow the host's occasion (E.inspoName). Her own colors lead in the library match too (E.wordsDiffer).
- Thumb src escaped; analytics city is a list city or "Other US city"; photo-swap target reset on every route; new photo drafts are saved only when the host continues; kids flag follows the occasion; long words wrap.
- Test: tests/ai_chaos.py (fake AI answers: code injection, drink names, kids club looks, broken fields, repeats, long words, photo flows).
