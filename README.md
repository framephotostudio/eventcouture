# Event Couture: iPhone and Android apps

Everything for the apps lives on this `mobile-app` branch. The website stays on `main`; each app build copies the site's code from `main`, so the apps and the website always plan events the same way. Nothing is built on anyone's computer: every push here builds both apps on GitHub (Actions → "Build Event Couture apps"). Test builds are attached to each run, and iPhone simulator screenshots are pushed to the `ci-output` branch.

| Folder | What |
|---|---|
| `app/` | The native layer: bottom tab bar, the phone's share sheet for invites, store/map/music links in an in-app browser, haptics, Android back button, offline notice, review prompt. |
| `assets/` | App icon and splash (the approved Event Couture artwork). |
| `scripts/` | `build-web.mjs` (copies the site, points it at the Event Couture server, bundles the fonts), `native-setup.sh` (icons, permissions, portrait, versions). |
| `store/` | Paste-ready listing and privacy answers. |
| `.github/workflows/` | `build-apps.yml` (test builds), `release.yml` (signed uploads to TestFlight and Google Play). |

## Accounts (the same ones as Face Couture; no new fees)
One Apple Developer account and one Google Play developer account cover every app you publish.

### Apple
1. App Store Connect → Apps → + → New App: iOS, name **Event Couture: Party Planner**, bundle ID **app.facecouture.events** (register it under Certificates, Identifiers & Profiles → Identifiers if it isn't listed), SKU `eventcouture-ios`.
2. The App Store Connect API key you made for Face Couture works for this app too.
3. Fill in App Information from `store/listing.md`; answer App Privacy from `store/privacy-labels.md`.

### Google Play
1. Play Console → Create app: **Event Couture: Party Planner**, free, App.
2. The service account from Face Couture can be granted access to this app (Users and permissions → the service account → add app, Release manager).
3. Personal accounts: closed test with 12 testers for 14 days before production.

### GitHub secrets for this repository (Settings → Secrets and variables → Actions)
The same values as in the Face Couture repository: `APPSTORE_ISSUER_ID`, `APPSTORE_KEY_ID`, `APPSTORE_PRIVATE_KEY`, `APPLE_TEAM_ID`, and for Android `PLAY_SERVICE_ACCOUNT_JSON` (the keystore secrets are created on the first Android release run; save them as the run explains).

Then Actions → "Release Event Couture apps" → Run workflow. The iPhone build goes to TestFlight; Android goes to the chosen testing track.

## Before charging for the Event Pass in the app
Apple and Google require their own in-app purchase for unlocking digital features like keeping a plan. Until that's connected, the app runs like the website's preview: planning and keeping plans are free.
