# Event Couture: Party Planner by Always Luxe

Everything in this folder is the full source code (version 0.9 preview).

- **event-couture-preview.html**: open this one file in any browser to try the whole app. No setup needed.
- **index.html, css/, js/, img/**: the website/app source (plain HTML, CSS and JavaScript).
  - js/data.js: event types, vendor categories, cost ranges, cities, styles, pricing (Event Passes, credits, add-ons)
  - js/engine.js: the planning engine (budgets, "Made for your budget" fit, checklist, run of show, quantities)
  - js/app.js: every screen (wizard, plan tabs, guests, voting, RSVPs, registry, cost splitting, drafts)
- **worker/**: the small server (Cloudflare Worker) for AI concepts, real venues and drive times.
- **tests/**: automated tests.

The home photo is an AI-generated sample concept; price tags on it are live HTML, not part of the image.
