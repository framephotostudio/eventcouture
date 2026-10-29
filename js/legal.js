/* Privacy Policy and Terms of Use. Business details come from js/config.js (legalName, supportEmail, governingState). */
(function (root) {
  var C = root.EC_CONFIG || {};
  var NAME = C.legalName || 'Always Luxe';
  var EMAIL = C.supportEmail || '';
  var STATE = C.governingState || '';
  var UPDATED = 'October 25, 2026';
  var mail = EMAIL ? '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>' : 'the contact address on our Help page';
  var law = STATE ? 'the State of ' + STATE : 'the state in which ' + NAME + ' is established';

  root.EC_LEGAL = {
    updated: UPDATED,
    privacy:
      '<h2>Privacy Policy</h2><p class="muted small">Event Couture by ' + NAME + ' · website and apps · Last updated ' + UPDATED + '</p>' +
      '<div class="panel stack"><p><b>The short version.</b> Your plans, guest lists and photos are saved on your own device. We don’t have accounts, we don’t sell or share your personal information for advertising, and we don’t use your information to train AI. When you ask us to create concepts or search for venues, we send only what that request needs to the service that answers it.</p></div>' +

      '<h3>1. Who we are</h3><p>Event Couture is an event-planning service operated by ' + NAME + ' (“we”, “us”). This policy explains what information Event Couture handles, why, who receives it and the choices you have. Questions: ' + mail + '.</p>' +

      '<h3>2. What we handle and why</h3><div class="panel legal-table">' +
      '<div><b>Your event details</b> (event type, date, time, city, guest count, budget, setting, drinks, who is paying, must-haves, description, chosen colors and vibes)<span>Saved on your device. Sent through our server to our AI provider when you ask for concepts, only to create them.</span></div>' +
      '<div><b>Inspiration photos and links</b> you add<span>Saved on your device. Photos are sent through our server to our AI provider when you ask for concepts, only to read their colors and style for that request.</span></div>' +
      '<div><b>Guest information</b> you enter (names, RSVP status, plus-ones, dietary needs, seating, gifts) and co-host names<span>Saved on your device. Never sent to vendors, advertisers or our AI provider.</span></div>' +
      '<div><b>Shared invitations</b> (when you share your invitation link: the event name, date, time, place, dress code, colors, polls, gift list, payment usernames and each person\u2019s share)<span>Stored on our server so the guests you send the link to can open it. Your budget, guest list and notes are never included.</span></div>' +
      '<div><b>RSVPs and votes from guests</b> (name, yes or no, plus-ones, dietary needs, poll votes, gifts marked bought)<span>Stored on our server only so the host can see them in their plan. Deleted automatically 30 days after the event, or right away when the host deletes the event.</span></div>' +
      '<div><b>Payment links</b> (Venmo, Cash App, PayPal usernames) and cost-splitting amounts<span>Saved on your device, and shown on your event page to the guests you share it with.</span></div>' +
      '<div><b>Venue and vendor searches</b> (city, area, kind of place) and your starting point for drive times<span>Sent through our server to Google Maps Platform to return places and drive times.</span></div>' +
      '<div><b>Vendor listings</b> (business name, email, phone, Instagram, prices, policies) entered on For vendors<span>Stored on our server and shown to people planning events in the cities you serve, except your email, which is shared only with a host whose quote request you answer. Edit your listing anytime; email us to remove it.</span></div>' +
      '<div><b>Quote requests</b> (city, kind of vendor, event type, date, guest count, theme, budget for that item and any note you add)<span>Stored on our server and shown to listed vendors in that city and category. Your name and contact details are never included. Requests and replies are deleted automatically 14 days after your event date, or after 90 days when there is no date.</span></div>' +
      '<div><b>Technical data</b> (IP address, browser type, time of request)<span>Received by our hosting and server providers when your device connects. Our server keeps a short-lived count of requests per IP address to prevent abuse; it expires within about an hour.</span></div>' +
      '<div><b>Purchases</b> (when payments are switched on)<span>Handled by our payment processor or by Apple or Google. We receive confirmation of what you bought; we never receive your full card number.</span></div>' +
      '<div><b>Usage statistics</b> (which pages are opened and which buttons are tapped, plus general choices such as the kind of event, city, guest-count range and budget range)<span>Sent to Google Analytics to count visits and see which features people use. We never send names, guest lists, photos, what you type, or your event\u2019s details. Advertising features are turned off. Nothing is sent if your browser asks sites not to track you (Do Not Track or Global Privacy Control).</span></div>' +
      '</div>' +
      '<p>We don’t collect precise location, contacts, or advertising IDs, and we don’t use advertising trackers on Event Couture.</p>' +

      '<h3>3. Who receives information</h3><p>We share information only with service providers that run Event Couture for us, and only for that purpose:</p><ul class="incl">' +
      '<li><span><b>Google (Gemini API)</b> creates concepts from your event details and inspiration. Google processes these requests under its API terms; our server doesn’t store them.</span></li>' +
      '<li><span><b>Google Maps Platform</b> returns venues, vendors, ratings and drive times.</span></li>' +
      '<li><span><b>Google Analytics</b> counts visits and feature use, as described above. Face Couture, also from Always Luxe, uses the same Google Analytics account, so a visit to both sites can be counted together.</span></li>' +
      '<li><span><b>Cloudflare</b> runs our server; <b>GitHub Pages</b> hosts the website; <b>Google Fonts</b> provides the typefaces. Each receives standard technical data when your device connects.</span></li>' +
      '<li><span><b>Stores you choose to visit</b> (Amazon, Etsy, Spotify, Apple Music, Venmo, Cash App, PayPal, Google Maps). Links open their sites, which have their own privacy policies. Some shopping links earn us a commission; they’re marked where they appear. As an Amazon Associate, Event Couture earns from qualifying purchases.</span></li>' +
      '<li><span><b>Authorities</b>, when the law requires it or to protect people from harm.</span></li></ul>' +
      '<p>We do not sell personal information, share it for cross-context behavioral advertising, or use it for profiling. If ' + NAME + '’s business is ever sold or merged, this policy will continue to apply to information transferred with it.</p>' +

      '<h3>4. How long information is kept</h3><p>Information saved on your device stays until you delete it: delete an event under Overview, Your pass, or clear this site’s data in your browser, or delete the app. Shared invitations, and the RSVPs and votes guests send through them, are deleted from our server 30 days after the event date (or about 13 months after sharing if no date is set), or right away when the host deletes the event. Abuse-prevention counts on our server expire within about an hour.</p>' +

      '<h3>5. Your choices and rights</h3><p>You can view, edit or delete everything Event Couture saves at any time, because it is on your device. Depending on where you live (for example California, Colorado, Connecticut, Texas, Virginia and other US states, Canada under PIPEDA and Quebec\u2019s privacy law, or the EU and UK), you may have rights to know, access, correct, delete or get a copy of your personal information, to opt out of sale, sharing, targeted advertising and profiling, and to appeal a decision about your request. We don’t sell, share for advertising or profile, so there is nothing to opt out of; we honor Global Privacy Control signals regardless. To make a request or appeal, contact ' + mail + '. We will respond within 45 days, won’t discriminate against you for using your rights, and may need to confirm the request came from you. You may use an authorized agent.</p>' +

      '<h3>6. Guests and other people</h3><p>When you add guests, co-hosts or photos of other people, you’re responsible for having a good reason to share their information with us and for telling them how it will be used. Guests who want their information removed can ask the host or contact us.</p>' +

      '<h3>7. Children</h3><p>Event Couture is meant for adults planning events and is not directed to children under 13. We don’t knowingly collect personal information from children. Hosts planning a child’s party may enter the child’s first name as an event detail; it stays on the host’s device. If you believe a child has given us information, contact us and we will delete anything we hold.</p>' +

      '<h3>8. Security</h3><p>Connections to Event Couture and our server are encrypted (HTTPS), and our service keys stay on our server. Because your plan lives on your device, keep your device locked and back it up. No system is perfectly secure; if we learn of a breach affecting you, we will notify you as the law requires.</p>' +

      '<h3>9. Where information is processed</h3><p>Our providers may process information in the United States and other countries. Where required, they use recognized safeguards for international transfers.</p>' +

      '<h3>10. Changes</h3><p>We’ll update this page and its date when this policy changes, and tell you inside Event Couture before any change that affects how your information is used.</p>' +

      '<h3>11. Contact</h3><p>' + NAME + ' · ' + mail + '</p>',

    terms:
      '<h2>Terms of Use</h2><p class="muted small">Event Couture by ' + NAME + ' · Last updated ' + UPDATED + '</p>' +
      '<p>These terms are an agreement between you and ' + NAME + ' (“we”, “us”) for using Event Couture, the website and apps (the “Service”). By using the Service you agree to them. If you don’t agree, please don’t use the Service.</p>' +

      '<h3>1. Who can use it</h3><p>You must be at least 18, or the age of majority where you live, to plan events or buy anything on Event Couture. Guests of any age may view an invitation a host shares with them.</p>' +

      '<h3>2. What Event Couture is</h3><p>Event Couture is planning software. It creates design concepts, estimated budgets, venue and vendor ideas, menus, playlists, checklists and schedules from what you tell it. We are not an event planner, venue, caterer, travel agent or vendor, and we don’t book, supply or supervise any service for you.</p>' +

      '<h3>3. Prices are estimates</h3><p>Every price is labeled. Planning estimates are based on typical local rates for your city and guest count, including tax, service charges and tips where they usually apply. They are not quotes or offers, and real prices, minimums, availability and rules can differ. Confirm everything with each venue and vendor before you book or pay. Event Pass prices are shown before you pay.</p>' +

      '<h3>4. Venues, vendors and other websites</h3><p>Venues, vendors, products and songs we show are suggestions from public sources such as Google Maps and online stores. Ratings come from those sources. Vendors listed on Event Couture describe their own services and prices; listings and replies are theirs, and anyone can report one. We don’t endorse or guarantee any business, product or result. You contract with and pay vendors directly, and they are responsible for their own services, licenses, insurance and conduct. Links to other sites are provided for convenience and their own terms apply. Some shopping links earn us a commission at no extra cost to you.</p>' +

      '<h3>5. Money between people</h3><p>Cost splitting and cash funds use your own Venmo, Cash App or PayPal links. We never receive, hold or transfer money between hosts, guests or vendors, and we aren’t responsible for those payments or disputes about them.</p>' +

      '<h3>6. Event Pass and payments</h3><p>Planning is free. To keep a plan and use guest features you buy one Event Pass for that event, priced by how many people you invite. It is a one-time purchase, not a subscription. It lasts until 12 months after purchase or 30 days after your event date, whichever is later; the exact date is shown before you pay. If you invite more people later you pay only the difference to move up a size. Prices are in US dollars and may include applicable tax. Purchases made through Apple or Google are processed by them under their terms. While Event Couture is in preview, no payment is taken.' + (C.app ? ' In the iPhone and Android apps, planning and keeping a plan are currently free; if paid features are added later, they will be sold only through Apple or Google in-app purchase, with the price shown before you buy.' : '') + '</p>' +

      '<h3>7. Refunds</h3><p>Because you see your full plan before you pay, Event Pass purchases are final once the plan is kept, except where the law gives you a right to a refund, or if a feature you paid for doesn’t work and we can’t fix it, in which case contact us within 30 days of purchase and we’ll refund you. Refunds for purchases made through Apple or Google are requested from them.</p>' +

      '<h3>8. Your content</h3><p>You own the photos, descriptions, guest lists and other content you add. You give us permission to process it only to run the Service for you, including sending it to the providers described in our Privacy Policy. Only add content you have the right to use, and other people’s information only with a good reason to share it. Concepts, plans and text we generate for you are yours to use for your event.</p>' +

      '<h3>9. AI-generated suggestions</h3><p>Concepts, menus, playlists and other suggestions may be generated by AI. They can contain mistakes and are not professional advice. Menu ideas don’t guarantee allergy safety: confirm every allergy and dietary need with your caterer or restaurant. Song suggestions don’t include a license to play music in public; your venue or DJ is responsible for that.</p>' +

      '<h3>10. Your event, your responsibility</h3><p>You are responsible for your event, including permits, venue rules, capacity limits, safety, accessibility, weather plans, supervision of children, and serving alcohol only to guests of legal drinking age and responsibly.</p>' +

      '<h3>11. Vendors who list on Event Couture</h3><p>If you list a business, you confirm you are authorized to do so, that your information, prices and policies are accurate and kept up to date, and that you hold any licenses and insurance your services require. We may edit, refuse or remove listings. Listing doesn’t make you our employee, partner or agent.</p>' +

      '<h3>12. Acceptable use</h3><p>Don’t misuse the Service: no unlawful, harassing, hateful or sexual content involving minors; no impersonation; no attempts to get around limits, scrape, overload, reverse-engineer or break the Service or our server; no use of someone else’s information without a good reason. We may suspend access for misuse.</p>' +

      '<h3>13. Our property</h3><p>The Event Couture name, logo, design, software and sample content belong to ' + NAME + ' and its licensors. You may use the Service for your own events, but you may not copy, resell or build a competing service from it. Sample photos on the home page are AI-generated inspiration, not events we organized. If you send us feedback, we may use it without owing you anything.</p>' +

      '<h3>14. Disclaimers</h3><p>The Service is provided “as is” and “as available”. To the fullest extent the law allows, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose and non-infringement, and we don’t promise that estimates are accurate or that the Service will be uninterrupted or error-free. Because plans are saved on your device, clearing your browser data or losing your device can delete them.</p>' +

      '<h3>15. Limits on our liability</h3><p>To the fullest extent the law allows, ' + NAME + ' is not liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, data or goodwill, or for anything a venue, vendor, guest or other third party does or doesn’t do. Our total liability for any claim about the Service is limited to the greater of the amount you paid us in the 12 months before the claim or US $100. Some places don’t allow these limits, so they may not fully apply to you.</p>' +

      '<h3>16. Indemnity</h3><p>If you break these terms or the law, or your content or event causes a claim against us, you agree to cover our reasonable losses and costs from that claim, to the extent the law allows.</p>' +

      '<h3>17. Disputes</h3><p>Contact us first at ' + mail + ' so we can try to fix the problem informally within 30 days. These terms are governed by the laws of ' + law + ' and applicable US federal law, without regard to conflict-of-law rules. Either of us may bring a claim in small-claims court if it qualifies. Otherwise, disputes will be heard in the state or federal courts located in ' + law.replace(/^the State of /, '') + ', and both of us consent to that jurisdiction. If you are a consumer in a place that gives you the right to bring claims in your local courts or under your local law, nothing here takes that right away.</p>' +

      '<h3>18. Changes and ending</h3><p>We may update the Service and these terms. We’ll change the date above and, for important changes, tell you inside Event Couture before they apply. You can stop using the Service at any time. We may stop offering it; if we stop while your Event Pass is active, we’ll give you notice and a way to save your plan, or a prorated refund.</p>' +

      '<h3>19. General</h3><p>If part of these terms can’t be enforced, the rest still applies. Not enforcing a term isn’t a waiver. You may not transfer these terms; we may transfer them with our business. These terms and our Privacy Policy are the whole agreement about the Service.</p>' +

      '<h3>20. Contact</h3><p>' + NAME + ' · ' + mail + '</p>'
  };
})(typeof window !== 'undefined' ? window : globalThis);
