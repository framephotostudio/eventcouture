/* Event Couture settings. Fill these in when each account is connected.
   apiUrl: the Event Couture server (Cloudflare Worker). Empty = preview mode (no AI, no live venue data, no charges).
   amazonTag: Amazon Associates tracking ID, e.g. "yourname-20".
   preview: true shows the preview ribbon and uses no-charge checkout. */
window.EC_CONFIG = {
  apiUrl: '',
  amazonTag: '',
  preview: true,
  supportEmail: 'hello@facecouture.app',
  legalName: 'Always Luxe',   /* the business name on Privacy and Terms */
  governingState: '',        /* e.g. 'Texas': the state whose laws govern the Terms */
  version: '0.40.0'
};
