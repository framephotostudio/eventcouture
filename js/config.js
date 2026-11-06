/* Event Couture settings. Fill these in when each account is connected.
   apiUrl: the Event Couture server (Cloudflare Worker). Empty = preview mode (no AI, no live venue data, no charges).
   amazonTag: Amazon Associates tracking ID, e.g. "yourname-20".
   preview: true shows the preview ribbon and uses no-charge checkout. */
window.EC_CONFIG = {
  apiUrl: '',
  amazonTag: 'eventcouture-20',
  preview: true,
  launchFree: true,
  freeUntil: '2026-11-19',   /* the free promotion's last day; plans started on or before it stay free after payments switch on */   /* launch offer: keeping a plan is free on the website too, until payments are connected; set false to show prices */
  supportEmail: 'hello@eventcouture.app',
  legalName: 'Always Luxe',   /* the business name on Privacy and Terms */
  governingState: 'Texas',   /* e.g. 'Texas': the state whose laws govern the Terms */
  /* Always Luxe Concierge Booking (US plans): paste each Stripe Payment Link. The offer stays hidden until at least one is set.
     call: a free 15-minute call booking link (for example Calendly). founding: true shows the founding client prices. */
  concierge: { links: { essentials: '', signature: '', full: '', allin: '' }, call: '', founding: true, stripe: false },   /* stripe: card checkout on our server; switched on by deploy once both Stripe secrets are saved */
  turnstile: '',   /* Cloudflare Turnstile site key (public). Filled in by deploy when the Turnstile widget exists; empty = no check */
  version: '0.64.0'
};
