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

  /* The two roles posted on Indeed on Nov 16, in her words. No pay rates on the website. */
  const others = [
    { id: 'manager', title: 'Business Development & Marketing Manager', subj: 'Business Development & Marketing Manager – [Your Name]', posted: '2026-11-16',
      meta: 'Independent contractor · Commission-based · Remote / Houston, TX',
      intro: 'We are seeking a motivated, experienced Business Development & Marketing Manager to help expand our business, generate paying clients, build vendor partnerships, and establish Event Couture as a widely recognized event planning brand.',
      sections: [
        ['Business development & sales', ['Identify, attract, and secure new paying clients for event planning services.', 'Develop and execute strategies to increase bookings and revenue.', 'Generate qualified leads and convert prospects into customers.', 'Build referral relationships with businesses, event organizers, and community groups.', 'Identify opportunities for business expansion and new revenue streams.', 'Negotiate partnerships and close business opportunities.']],
        ['Marketing & brand growth', ['Develop marketing strategies to increase brand awareness and visibility.', 'Create campaigns designed to generate viral growth and widespread brand recognition.', 'Manage social media marketing across Instagram, Facebook, TikTok, and other platforms.', 'Develop engaging content, promotional campaigns, and advertising strategies.', 'Identify influencer, media, and promotional opportunities.', 'Drive website traffic, inquiries, and customer conversions.', 'Help establish Event Couture as a trusted and recognizable brand.']],
        ['Vendor partnerships', ['Recruit venues, photographers, DJs, caterers, decorators, entertainers, and other event professionals.', 'Establish relationships with local and international vendors.', 'Negotiate vendor referral and booking arrangements.', 'Maintain relationships with vendors and business partners.', 'Generate additional revenue through vendor bookings and partnerships.']],
        ['Client & event coordination', ['Respond to client inquiries and assist with proposals.', 'Help coordinate vendor bookings and event planning services.', 'Support client relationships from initial inquiry through booking.', 'Assist with event coordination when needed.']]],
      ideal: ['Experience in business development, sales, marketing, or client acquisition.', 'Strong communication, networking, and negotiation skills.', 'Knowledge of social media marketing and digital promotion.', 'Ability to independently generate leads and close sales.', 'Creative, entrepreneurial, and results-oriented mindset.', 'Experience in event planning, hospitality, or related industries is a plus.', 'Ability to work independently with minimal supervision.'],
      apply: 'Please email your resume and a brief description of your experience in business development, sales, marketing, or client acquisition. We are especially interested in candidates who can explain how they would attract paying clients and help Event Couture achieve significant brand growth.' },
    { id: 'coordinator', title: 'Business Development & Marketing Coordinator', subj: 'Business Development & Marketing Coordinator – [Your Name]', posted: '2026-11-16',
      meta: 'Independent contractor · Commission-based · Remote / Houston, TX · Entry-level welcome',
      intro: 'We are looking for an enthusiastic, creative, and motivated Business Development & Marketing Coordinator to help promote our company, attract paying clients, build vendor partnerships, and grow Event Couture into a widely recognized event planning brand.',
      sections: [
        ['Business development & client acquisition', ['Identify and connect with potential clients seeking event planning services.', 'Generate leads and convert inquiries into paying customers.', 'Promote Event Couture through networking, referrals, social media, and direct outreach.', 'Build relationships with businesses, event organizers, and potential referral partners.', 'Identify new opportunities to increase bookings and revenue.']],
        ['Marketing & brand growth', ['Develop creative marketing strategies to increase brand awareness and visibility.', 'Help establish Event Couture as a popular and widely recognized event planning brand.', 'Create and share engaging content across Instagram, Facebook, TikTok, and other platforms.', 'Identify viral marketing opportunities, influencers, and promotional partnerships.', 'Develop campaigns to increase website traffic, customer inquiries, and bookings.', 'Help expand our audience locally, nationally, and internationally.']],
        ['Vendor partnerships', ['Identify and recruit event vendors, including venues, photographers, DJs, caterers, decorators, entertainers, and beauty professionals.', 'Introduce vendors to Event Couture and explain partnership opportunities.', 'Develop relationships with vendors and negotiate referral opportunities.', 'Help generate revenue through vendor bookings and partnerships.']],
        ['Client & event support', ['Respond to prospective client inquiries.', 'Assist with proposals, vendor recommendations, and booking coordination.', 'Follow up with leads and help convert them into confirmed bookings.', 'Maintain professional relationships with clients and vendors.']]],
      ideal: ['Experience or strong interest in business development, sales, marketing, or client acquisition.', 'Excellent communication, networking, and interpersonal skills.', 'Familiarity with social media marketing and digital promotion.', 'Comfortable contacting potential clients and businesses.', 'Creative, self-motivated, organized, and results-driven.', 'Ability to work independently and take initiative.', 'Experience in event planning, hospitality, or related industries is a plus but not required.', 'Entry-level candidates with strong sales and marketing abilities are encouraged to apply.'],
      apply: 'Please email your resume along with a brief introduction describing your experience in sales, marketing, business development, or event planning. We would also like to hear how you would help Event Couture attract paying clients, increase brand visibility, and achieve significant business growth.' }];
  const roleHtml = j => `<section class="job" id="${j.id}"><div class="panel stack"><h2 style="margin:0">${esc(j.title)}</h2><p class="small muted" style="margin:0">${esc(j.meta)}</p><p>${esc(j.intro)}</p><div class="cta"><a class="btn gold" href="mailto:${EMAIL}?subject=${encodeURIComponent(j.subj)}">Apply by email</a></div></div>
<h3>What you’ll do</h3>${j.sections.map(([h, a]) => `<h4>${esc(h)}</h4>${li(a.map(esc))}`).join('')}
<h3>Who we’re looking for</h3>${li(j.ideal.map(esc))}
<h3>How to apply</h3><p>${esc(j.apply)} Send it to <a href="mailto:${EMAIL}?subject=${encodeURIComponent(j.subj)}"><b>${EMAIL}</b></a> with the subject line <b>“${esc(j.subj)}”</b>.</p></section>`;

  const directorHtml = `<section class="job" id="director"><div class="panel stack"><h2 style="margin:0">${esc(TITLE)}</h2><p class="small muted" style="margin:0">Independent contractor · Commission-based · Remote, with optional on-site events</p><p>We are looking for an experienced, entrepreneurial business development partner to grow our brand, bring in paying clients, build vendor relationships and run marketing.</p><div class="cta"><a class="btn gold" href="mailto:${EMAIL}?subject=${subject}">Apply by email</a></div></div>
<h3>What you’ll do</h3>${sections.map(([h, a]) => `<h4>${esc(h)}</h4>${li(a.map(esc))}`).join('')}
<h3>Who we’re looking for</h3>${li(ideal.map(esc))}
<h3>How to apply</h3><p>Email your resume to <a href="mailto:${EMAIL}?subject=${subject}"><b>${EMAIL}</b></a> with the subject line <b>“Business Development – [Your Name]”</b>. Please include a short note about the clients, events or vendor partnerships you’ve brought in before, and the city or market you’d focus on.</p>
<p>We’re looking for a motivated partner who can bring real business, build lasting relationships and help Event Couture grow globally.</p></section>`;

  const roles = [{ id: 'director', title: TITLE, meta: 'Senior · Remote, optional on-site' }, { id: 'manager', title: others[0].title, meta: 'Experienced · Remote / Houston' }, { id: 'coordinator', title: others[1].title, meta: 'Entry-level welcome · Remote / Houston' }];
  const body = `<p class="lead">Event Couture is a newly launched, global AI-powered event planning platform that helps people plan weddings, birthdays, corporate events, private parties and celebrations. We offer AI planning tools, personalized event planning services, vendor connections and optional on-site coordination.</p>
<h2>Open roles</h2><div class="job-list">${roles.map(r => `<a class="panel job-link" href="#${r.id}"><b>${esc(r.title)}</b><span class="small muted">${esc(r.meta)}</span></a>`).join('')}</div>
<style>.job-list{display:grid;gap:10px;margin-bottom:28px}.job-link{display:flex;flex-direction:column;gap:2px;text-decoration:none;color:inherit}.job-link:hover{border-color:#c9a35b}.job{margin-top:36px;scroll-margin-top:80px}.job h4{margin:14px 0 4px}</style>
${directorHtml}${others.map(roleHtml).join('')}`;

  const desc = `Careers at Event Couture: ${TITLE}, ${others[0].title} and ${others[1].title}. Remote independent contractor roles bringing in clients, vendor partners and marketing growth for a global AI event planning platform.`;
  const canonical = `${BASE}careers/`;
  const org = { '@type': 'Organization', name: 'Event Couture', sameAs: BASE, logo: `${BASE}img/brand/ec-mark-256.png` };
  const job = (title, html, from, id, local) => Object.assign({ '@context': 'https://schema.org', '@type': 'JobPosting', title, description: html, datePosted: from, validThrough: until + 'T23:59:59',
    employmentType: 'CONTRACTOR', jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'USA' }, hiringOrganization: org, directApply: false, url: canonical + '#' + id },
    local ? { jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Houston', addressRegion: 'TX', postalCode: '77057', addressCountry: 'US' } } } : {});
  const ld = [job(TITLE, directorHtml, posted, 'director'), job(others[0].title, roleHtml(others[0]), others[0].posted, 'manager', 1), job(others[1].title, roleHtml(others[1]), others[1].posted, 'coordinator', 1)];
  const html = page({ rel: 1, title: 'Careers: Business Development & Marketing Roles | Event Couture', desc, h1: 'Careers at Event Couture', body, canonical, ld, crumb: 'Careers' })
    .replace(/<p class="small muted">All prices are [^<]*<\/p>/, '');
  write('careers/index.html', html);
  urls.push(canonical);
  return 1;
};
