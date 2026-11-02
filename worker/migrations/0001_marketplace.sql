-- Event Couture marketplace database (Cloudflare D1, SQLite). Not applied yet: it runs only after the owner approves Stage 3.
-- Apply with: npx wrangler d1 migrations apply ec_db --remote
-- Rules built in: customers pay vendors directly (payments here are only Event Couture's own fees), and only a customer
-- with a booking can review that vendor (one review per booking).

PRAGMA foreign_keys = ON;

-- People who sign in (Supabase Auth). id = the Supabase user id (the JWT "sub").
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at    TEXT
);

-- Saved events (cloud copy of a plan). plan_json holds the same object the app keeps on the device today.
CREATE TABLE events (
  id            TEXT PRIMARY KEY,
  owner_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT,
  type          TEXT,
  city          TEXT,
  event_date    TEXT,
  guests        INTEGER,
  plan_json     TEXT NOT NULL,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX events_owner ON events(owner_id);

-- Co-hosts and their permissions on an event.
CREATE TABLE event_members (
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission    TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
  PRIMARY KEY (event_id, user_id)
);

-- Vendor businesses. status: pending (waiting for approval), approved, rejected, suspended.
-- badge: none, founder_pick (the owner's recommendation), verified (documents checked).
CREATE TABLE vendors (
  id              TEXT PRIMARY KEY,
  owner_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name   TEXT NOT NULL,
  instagram       TEXT,
  website         TEXT,
  phone           TEXT,
  categories      TEXT NOT NULL,          -- JSON array of budget lines, e.g. ["hairMakeup","hair"]
  cultures        TEXT,                   -- JSON array, e.g. ["arabic"]
  base_city       TEXT NOT NULL,
  service_area    TEXT,                   -- JSON: cities, states, travel radius in miles
  travel_policy   TEXT,
  deposit_policy  TEXT,
  cancel_policy   TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  badge           TEXT NOT NULL DEFAULT 'none' CHECK (badge IN ('none', 'founder_pick', 'verified')),
  reviewed_by     TEXT REFERENCES users(id),
  reviewed_at     TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX vendors_city ON vendors(base_city, status);

-- Documents a vendor uploads for verification (license, insurance). Files live in Cloudflare R2; only the key is stored here.
CREATE TABLE vendor_documents (
  id            TEXT PRIMARY KEY,
  vendor_id     TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('license', 'insurance', 'id', 'other')),
  r2_key        TEXT NOT NULL,
  uploaded_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Portfolio photos (R2 keys) shown on the vendor's profile.
CREATE TABLE vendor_photos (
  id            TEXT PRIMARY KEY,
  vendor_id     TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  r2_key        TEXT NOT NULL,
  caption       TEXT,
  sort          INTEGER NOT NULL DEFAULT 0
);

-- What a vendor sells: packages with starting prices (whole US cents) and what's included.
CREATE TABLE listings (
  id              TEXT PRIMARY KEY,
  vendor_id       TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category        TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  price_from_cents INTEGER NOT NULL CHECK (price_from_cents >= 0),
  price_unit      TEXT NOT NULL DEFAULT 'event' CHECK (price_unit IN ('event', 'person', 'hour', 'guest')),
  min_guests      INTEGER,
  max_guests      INTEGER,
  addons_json     TEXT,                   -- JSON array of { name, price_cents }
  active          INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX listings_vendor ON listings(vendor_id, active);

-- Availability: blocks of time a vendor is booked or unavailable (partial days allowed).
CREATE TABLE availability (
  id            TEXT PRIMARY KEY,
  vendor_id     TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  starts_at     TEXT NOT NULL,            -- ISO date-time, vendor's local time
  ends_at       TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('booked', 'unavailable', 'tentative')),
  CHECK (ends_at > starts_at)
);
CREATE INDEX availability_vendor ON availability(vendor_id, starts_at);

-- A customer's inquiry or booking with a vendor, tied to one event. Money for the vendor is paid to the vendor directly;
-- agreed amounts are recorded here for the customer's budget only.
CREATE TABLE bookings (
  id              TEXT PRIMARY KEY,
  event_id        TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  customer_id     TEXT NOT NULL REFERENCES users(id),
  vendor_id       TEXT NOT NULL REFERENCES vendors(id),
  listing_id      TEXT REFERENCES listings(id),
  status          TEXT NOT NULL DEFAULT 'inquiry' CHECK (status IN ('inquiry', 'quoted', 'booked', 'completed', 'cancelled')),
  quote_cents     INTEGER,
  deposit_cents   INTEGER,
  deposit_due     TEXT,
  balance_due     TEXT,
  starts_at       TEXT,
  ends_at         TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX bookings_event ON bookings(event_id);
CREATE INDEX bookings_vendor ON bookings(vendor_id, status);

-- Messages inside one booking (not a general inbox). Files (mood boards, contracts) live in R2.
CREATE TABLE messages (
  id            TEXT PRIMARY KEY,
  booking_id    TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id     TEXT NOT NULL REFERENCES users(id),
  body          TEXT,
  file_r2_key   TEXT,
  file_name     TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  read_at       TEXT,
  CHECK (body IS NOT NULL OR file_r2_key IS NOT NULL)
);
CREATE INDEX messages_booking ON messages(booking_id, created_at);

-- Event Couture's own fees only (concierge tiers, Event Pass). Stripe Checkout Sessions, confirmed by the signed webhook.
CREATE TABLE payments (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT REFERENCES users(id),
  event_id            TEXT REFERENCES events(id),
  product             TEXT NOT NULL CHECK (product IN ('concierge_essentials', 'concierge_signature', 'concierge_full', 'concierge_allin', 'event_pass')),
  amount_cents        INTEGER NOT NULL CHECK (amount_cents > 0),
  currency            TEXT NOT NULL DEFAULT 'usd',
  stripe_session_id   TEXT NOT NULL UNIQUE,
  stripe_payment_intent TEXT,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'failed', 'expired')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at             TEXT
);

-- Every Stripe webhook event handled once (idempotency on the Stripe event id).
CREATE TABLE stripe_events (
  id            TEXT PRIMARY KEY,         -- Stripe event id, evt_...
  type          TEXT NOT NULL,
  received_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reviews: only from a booking that reached 'booked' or 'completed'; one per booking.
CREATE TABLE reviews (
  id                  TEXT PRIMARY KEY,
  booking_id          TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  vendor_id           TEXT NOT NULL REFERENCES vendors(id),
  author_id           TEXT NOT NULL REFERENCES users(id),
  overall             INTEGER NOT NULL CHECK (overall BETWEEN 1 AND 5),
  communication       INTEGER NOT NULL CHECK (communication BETWEEN 1 AND 5),
  punctuality         INTEGER NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
  value               INTEGER NOT NULL CHECK (value BETWEEN 1 AND 5),
  body                TEXT,
  media_json          TEXT,               -- JSON array of R2 keys (photos, short videos)
  status              TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'reported')),
  vendor_reply        TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX reviews_vendor ON reviews(vendor_id, status);
