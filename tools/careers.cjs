// Careers page (/careers/): open roles at Event Couture, under the company name only (no personal names).
// Called from tools/seo.cjs. Includes JobPosting data so the role can appear in Google's job listings.
'use strict';
module.exports = function careers({ page, write, urls, esc, BASE }) {
  const EMAIL = 'hello@eventcouture.app';
  const TITLE = 'Director of Business Development, Sales & Marketing';
  const posted = '2026-11-14', until = '2027-02-14';
  const subject = encodeURIComponent('Business Development – [Your Name]');
  const li = a => `<ul class="plain">${a.map(x => `<li>${x}</li>`).join('')}</ul>`;
  const sections = [
    ['1. Client acquisition and event bookings', [
      'Find and secure paying clients for weddings, corporate events, private parties and celebrations.',
      'Generate leads through networking, referrals, social media and direct outreach.',
      'Manage inquiries, proposals, follow-ups and sales negotiations.',
      'Convert prospective clients into confirmed bookings.',
      'Develop relationships with individuals, companies and organizations that regularly host events.']],
    ['2. Vendor recruitment and partnerships', [
      'Recruit venues, photographers, DJs, caterers, decorators, entertainers, makeup artists and other event vendors.',
      'Negotiate referral fees, booking commissions, preferred pricing and partnership agreements.',
      'Develop and maintain strong vendor relationships locally, nationally and internationally.',
      'Identify sponsorships, paid vendor promotions and additional revenue opportunities.']],
    ['3. Social media and marketing', [
      'Develop and carry out social media marketing strategies.',
      'Create or coordinate engaging posts, reels, promotional videos and campaigns.',
      'Manage brand promotion across Instagram, Facebook, TikTok, LinkedIn and relevant communities.',
      'Build influencer relationships and strategic marketing partnerships.',
      'Drive website traffic, qualified leads and paying customers.']],
    ['4. Event planning and coordination (remote, with optional on-site)', [
      'Assist clients with planning weddings, celebrations and corporate events.',
      'Coordinate vendors, timelines, budgets and event logistics.',
      'Manage communications with clients and vendors before events.',
      'Optionally provide on-site event coordination, including vendor management, setup supervision, scheduling and event-day execution.',
      'Help expand Event Couture’s in-person planning services in markets where qualified partners are available.']],
    ['5. Business development and operations', [
      'Identify new markets, clients and partnership opportunities.',
      'Develop strategies to grow bookings, platform usage and revenue.',
      'Manage the sales pipeline and track leads, bookings and partnerships.',
      'Represent Event Couture professionally in client and vendor communications.',
      'Provide regular progress updates and work independently with minimal supervision.']]
  ];
  const ideal = [
    'Proven experience in business development, sales, event planning or marketing.',
    'Demonstrated ability to generate paying clients and close deals.',
    'Strong vendor relationships and negotiation skills.',
    'Experience managing social media content and promotional campaigns.',
    'Highly motivated, entrepreneurial, organized and self-directed.',
    'Event planning and on-site coordination experience is a plus.',
    'US-based candidates preferred; qualified international candidates welcome.'];
  const pay = [
    '25% of collected event planning fees from clients you personally bring in.',
    '25% of vendor booking commissions you personally secure.',
    '25% of qualifying paid vendor promotions and advertising revenue you generate.',
    '20% of qualifying sponsorship revenue you generate.'];

  const body = `<p class="lead">Event Couture is a newly launched, global AI-powered event planning platform that helps people plan weddings, birthdays, corporate events, private parties and celebrations. We offer AI planning tools, personalized event planning services, vendor connections and optional on-site coordination.</p>
<div class="panel stack"><h2 style="margin:0">${esc(TITLE)}</h2><p class="small muted" style="margin:0">Independent contractor · Remote, with optional on-site events · 100% commission</p><p>We are looking for an experienced, entrepreneurial business development partner to grow our brand, bring in paying clients, build vendor relationships and run marketing.</p><div class="cta"><a class="btn gold" href="mailto:${EMAIL}?subject=${subject}">Apply by email</a></div></div>
<h2>What you’ll do</h2>${sections.map(([h, a]) => `<h3>${esc(h)}</h3>${li(a.map(esc))}`).join('')}
<h2>Who we’re looking for</h2>${li(ideal.map(esc))}
<h2>Compensation</h2><p><b>100% commission. No base pay or upfront retainer.</b></p>${li(pay.map(esc))}
<p class="small muted">This is an independent contractor role. Commissions apply only to qualifying new revenue you personally generate and Event Couture collects, under a written agreement. Flexible, independent work with long-term growth potential.</p>
<h2>How to apply</h2><p>Email your resume to <a href="mailto:${EMAIL}?subject=${subject}"><b>${EMAIL}</b></a> with the subject line <b>“Business Development – [Your Name]”</b>. Please include a short note about the clients, events or vendor partnerships you’ve brought in before, and the city or market you’d focus on.</p>
<p>We’re looking for a motivated partner who can bring real business, build lasting relationships and help Event Couture grow globally.</p>`;

  const desc = `Join Event Couture as ${TITLE}: a remote, 100% commission independent contractor role bringing in clients, vendor partners and marketing growth for a global AI event planning platform.`;
  const canonical = `${BASE}careers/`;
  const ld = [{
    '@context': 'https://schema.org', '@type': 'JobPosting', title: TITLE,
    description: body, datePosted: posted, validThrough: until + 'T23:59:59',
    employmentType: 'CONTRACTOR', jobLocationType: 'TELECOMMUTE',
    applicantLocationRequirements: { '@type': 'Country', name: 'USA' },
    hiringOrganization: { '@type': 'Organization', name: 'Event Couture', sameAs: BASE, logo: `${BASE}img/brand/ec-mark-256.png` },
    directApply: false, url: canonical
  }];
  const html = page({ rel: 1, title: `Careers: ${TITLE} | Event Couture`, desc, h1: 'Careers at Event Couture', body, canonical, ld, crumb: 'Careers' })
    .replace(/<p class="small muted">All prices are [^<]*<\/p>/, '');
  write('careers/index.html', html);
  urls.push(canonical);
  return 1;
};
