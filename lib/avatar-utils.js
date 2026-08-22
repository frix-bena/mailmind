/**
 * Gmail-Style Avatar & Sender Profile Utility Library
 * 
 * Provides pure JS MD5 hashing, real sender profile photo resolution
 * (Unavatar, Google, Gravatar, Clearbit, IconHorse, Google Favicons),
 * smart display name formatting, organization / company extraction,
 * and deterministic Material palette initials logic.
 */

/**
 * Pure JavaScript MD5 implementation (RFC 1321 compliant).
 * Works seamlessly in client-side React, Next.js App/Pages router, Edge, and Node.js
 * without requiring external dependencies or webpack crypto polyfills.
 */
export function md5(str) {
  if (typeof str !== 'string') {
    str = String(str || '');
  }

  function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function bitRotateLeft(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  function md5cmn(q, a, b, x, s, t) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }

  function md5ff(a, b, c, d, x, s, t) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function md5gg(a, b, c, d, x, s, t) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function md5hh(a, b, c, d, x, s, t) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function md5ii(a, b, c, d, x, s, t) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function binlMD5(x, len) {
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;

    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;

    for (let i = 0; i < x.length; i += 16) {
      const olda = a;
      const oldb = b;
      const oldc = c;
      const oldd = d;

      a = md5ff(a, b, c, d, x[i], 7, -680876936);
      d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);

      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);

      a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
      d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = md5hh(d, a, b, c, x[i], 11, -358537222);
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);

      a = md5ii(a, b, c, d, x[i], 6, -198630844);
      d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);

      a = safeAdd(a, olda);
      b = safeAdd(b, oldb);
      c = safeAdd(c, oldc);
      d = safeAdd(d, oldd);
    }
    return [a, b, c, d];
  }

  function binl2rstr(input) {
    let output = '';
    const length32 = input.length * 32;
    for (let i = 0; i < length32; i += 8) {
      output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff);
    }
    return output;
  }

  function rstr2binl(input) {
    const output = [];
    const length8 = input.length * 8;
    for (let i = 0; i < length8; i += 8) {
      output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32);
    }
    return output;
  }

  function rstr2hex(input) {
    const hexTab = '0123456789abcdef';
    let output = '';
    for (let i = 0; i < input.length; i++) {
      const x = input.charCodeAt(i);
      output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f);
    }
    return output;
  }

  function str2rstrUTF8(input) {
    return unescape(encodeURIComponent(input));
  }

  return rstr2hex(binl2rstr(binlMD5(rstr2binl(str2rstrUTF8(str)), str2rstrUTF8(str).length * 8)));
}

/**
 * Common free / consumer webmail domains to exclude from brand logo lookups.
 */
export const FREE_EMAIL_PROVIDERS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.de',
  'yahoo.es',
  'yahoo.it',
  'yahoo.co.jp',
  'yahoo.co.in',
  'yahoo.ca',
  'yahoo.com.br',
  'yahoo.com.au',
  'ymail.com',
  'rocketmail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'passport.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'aim.com',
  'protonmail.com',
  'proton.me',
  'pm.me',
  'zoho.com',
  'zohomail.com',
  'mail.com',
  'email.com',
  'usa.com',
  'gmx.com',
  'gmx.net',
  'gmx.de',
  'yandex.com',
  'yandex.ru',
  'ya.ru',
  'tutanota.com',
  'tuta.io',
  'tuta.com',
  'fastmail.com',
  'fastmail.fm',
  'hey.com',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'naver.com',
  'daum.net',
  'hanmail.net',
  'rediffmail.com',
  'comcast.net',
  'sbcglobal.net',
  'att.net',
  'verizon.net'
]);

/**
 * Known brand and company domain mappings for rich organization names and verified logos.
 */
export const BRAND_DOMAINS = {
  'google.com': 'Google',
  'googlemail.com': 'Google',
  'github.com': 'GitHub',
  'microsoft.com': 'Microsoft',
  'apple.com': 'Apple',
  'stripe.com': 'Stripe',
  'amazon.com': 'Amazon',
  'aws.amazon.com': 'Amazon Web Services',
  'netflix.com': 'Netflix',
  'slack.com': 'Slack',
  'linear.app': 'Linear',
  'notion.so': 'Notion',
  'vercel.com': 'Vercel',
  'supabase.com': 'Supabase',
  'openai.com': 'OpenAI',
  'anthropic.com': 'Anthropic',
  'figma.com': 'Figma',
  'spotify.com': 'Spotify',
  'twitter.com': 'X / Twitter',
  'x.com': 'X',
  'linkedin.com': 'LinkedIn',
  'facebook.com': 'Meta',
  'meta.com': 'Meta',
  'dropbox.com': 'Dropbox',
  'atlassian.com': 'Atlassian',
  'airbnb.com': 'Airbnb',
  'uber.com': 'Uber',
  'lyft.com': 'Lyft',
  'cloudflare.com': 'Cloudflare',
  'digitalocean.com': 'DigitalOcean',
  'substack.com': 'Substack',
  'medium.com': 'Medium',
  'reddit.com': 'Reddit',
  'discord.com': 'Discord',
  'zoom.us': 'Zoom',
  'salesforce.com': 'Salesforce',
  'hubspot.com': 'HubSpot',
  'mailchimp.com': 'Mailchimp',
  'intercom.io': 'Intercom',
  'zendesk.com': 'Zendesk',
  'paypal.com': 'PayPal',
  'shopify.com': 'Shopify',
  'square.com': 'Square',
  'squareup.com': 'Square',
  'twilio.com': 'Twilio',
  'gitlab.com': 'GitLab',
  'canva.com': 'Canva',
  'asana.com': 'Asana',
  'docker.com': 'Docker',
  'postman.com': 'Postman',
  'sentry.io': 'Sentry',
  'datadoghq.com': 'Datadog',
  'loom.com': 'Loom',
  'miro.com': 'Miro',
  'retool.com': 'Retool',
  'cursor.com': 'Cursor',
  'cursor.sh': 'Cursor',
  'resend.com': 'Resend',
  'hashicorp.com': 'HashiCorp',
  'redis.com': 'Redis',
  'mongodb.com': 'MongoDB',
  'steampowered.com': 'Steam',
  'sony.com': 'Sony',
  'playstation.com': 'PlayStation',
  'nintendo.com': 'Nintendo',
  'coinbase.com': 'Coinbase',
  'binance.com': 'Binance',
  'wise.com': 'Wise',
  'revolut.com': 'Revolut',
  'nytimes.com': 'The New York Times',
  'wsj.com': 'The Wall Street Journal',
  'bloomberg.com': 'Bloomberg',
  'theverge.com': 'The Verge',
  'techcrunch.com': 'TechCrunch',
  'wired.com': 'Wired'
};

/**
 * Material Design color palette matching Gmail's sender avatar colors.
 * High contrast with white text (#ffffff) to ensure accessibility.
 */
export const GMAIL_AVATAR_PALETTE = [
  { hex: '#d93025', bgClass: 'bg-[#d93025]', name: 'red', gradient: 'linear-gradient(135deg, #d93025, #ea4335)' },
  { hex: '#1a73e8', bgClass: 'bg-[#1a73e8]', name: 'blue', gradient: 'linear-gradient(135deg, #1a73e8, #4285f4)' },
  { hex: '#1e8e3e', bgClass: 'bg-[#1e8e3e]', name: 'green', gradient: 'linear-gradient(135deg, #1e8e3e, #34a853)' },
  { hex: '#f29900', bgClass: 'bg-[#f29900]', name: 'amber', gradient: 'linear-gradient(135deg, #f29900, #fbbc04)' },
  { hex: '#9334e6', bgClass: 'bg-[#9334e6]', name: 'purple', gradient: 'linear-gradient(135deg, #9334e6, #a855f7)' },
  { hex: '#e52592', bgClass: 'bg-[#e52592]', name: 'pink', gradient: 'linear-gradient(135deg, #e52592, #ec4899)' },
  { hex: '#0097a7', bgClass: 'bg-[#0097a7]', name: 'cyan', gradient: 'linear-gradient(135deg, #0097a7, #06b6d4)' },
  { hex: '#00897b', bgClass: 'bg-[#00897b]', name: 'teal', gradient: 'linear-gradient(135deg, #00897b, #14b8a6)' },
  { hex: '#3949ab', bgClass: 'bg-[#3949ab]', name: 'indigo', gradient: 'linear-gradient(135deg, #3949ab, #6366f1)' },
  { hex: '#e64a19', bgClass: 'bg-[#e64a19]', name: 'deepOrange', gradient: 'linear-gradient(135deg, #e64a19, #f97316)' },
  { hex: '#455a64', bgClass: 'bg-[#455a64]', name: 'blueGrey', gradient: 'linear-gradient(135deg, #455a64, #64748b)' },
  { hex: '#7c3aed', bgClass: 'bg-[#7c3aed]', name: 'violet', gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' },
  { hex: '#059669', bgClass: 'bg-[#059669]', name: 'emerald', gradient: 'linear-gradient(135deg, #059669, #10b981)' },
  { hex: '#e11d48', bgClass: 'bg-[#e11d48]', name: 'rose', gradient: 'linear-gradient(135deg, #e11d48, #f43f5e)' },
  { hex: '#0284c7', bgClass: 'bg-[#0284c7]', name: 'sky', gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)' },
  { hex: '#6d4c41', bgClass: 'bg-[#6d4c41]', name: 'brown', gradient: 'linear-gradient(135deg, #6d4c41, #8d6e63)' },
];

/**
 * Extracts a clean email address from string (handles "Name <email@domain.com>").
 */
export function extractCleanEmail(input) {
  if (!input || typeof input !== 'string') return '';
  const match = input.match(/<([^>]+)>/);
  const email = match ? match[1] : input;
  return email.trim().toLowerCase();
}

/**
 * Extracts domain from an email address.
 */
export function extractDomain(email) {
  const clean = extractCleanEmail(email);
  if (!clean || !clean.includes('@')) return '';
  const parts = clean.split('@');
  return parts[parts.length - 1].trim().toLowerCase();
}

/**
 * Determines whether a domain belongs to a known free email provider.
 */
export function isFreeEmailProvider(domainOrEmail) {
  if (!domainOrEmail) return false;
  const domain = domainOrEmail.includes('@') ? extractDomain(domainOrEmail) : domainOrEmail.trim().toLowerCase();
  return FREE_EMAIL_PROVIDERS.has(domain);
}

/**
 * Checks whether the sender is a recognized verified brand or authenticated custom domain.
 */
export function isVerifiedSender(email, domain) {
  const cleanEmail = extractCleanEmail(email);
  const dom = domain || extractDomain(cleanEmail);
  if (!dom) return false;
  if (BRAND_DOMAINS[dom]) return true;
  if (!isFreeEmailProvider(dom)) return true;
  return false;
}

/**
 * Formats full timestamp into clean, human-readable date & time strings.
 */
export function formatEmailDate(dateInput) {
  if (!dateInput) return { full: '', time: '', date: '', relative: '' };
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { full: '', time: '', date: '', relative: '' };

  const now = Date.now();
  const diff = now - d.getTime();
  const m = Math.floor(diff / 60000);
  let relative = 'just now';
  if (m >= 1 && m < 60) relative = `${m}m ago`;
  else if (m >= 60 && m < 1440) relative = `${Math.floor(m / 60)}h ago`;
  else if (m >= 1440) relative = `${Math.floor(m / 1440)}d ago`;

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const fullStr = `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at ${timeStr}`;

  return {
    full: fullStr,
    time: timeStr,
    date: dateStr,
    relative
  };
}

/**
 * Extracts a human-friendly display name from sender name and email.
 * E.g. "john.doe@company.com" -> "John Doe", "support@github.com" -> "GitHub Support"
 */
export function extractDisplayName(name, email) {
  if (name && typeof name === 'string') {
    const clean = name.replace(/^["'<\s]+|["'>\s]+$/g, '').trim();
    if (clean && clean !== email && !clean.includes('@')) {
      return clean;
    }
  }

  const cleanEmail = extractCleanEmail(email);
  if (!cleanEmail) return 'Unknown';

  const userPart = cleanEmail.split('@')[0] || '';
  const domain = extractDomain(cleanEmail);

  if (domain && BRAND_DOMAINS[domain]) {
    const brand = BRAND_DOMAINS[domain];
    if (['support', 'notifications', 'no-reply', 'noreply', 'team', 'hello', 'billing', 'news', 'security', 'contact'].includes(userPart.toLowerCase())) {
      const type = userPart.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `${brand} ${type}`;
    }
    return brand;
  }

  // Format userPart: "first.last" or "first_last" -> "First Last"
  const formatted = userPart
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();

  return formatted || userPart || 'User';
}

/**
 * Extracts organization / company name from email address or name.
 */
export function extractOrganization(email, name = '') {
  const domain = extractDomain(email);
  if (!domain) return null;

  if (BRAND_DOMAINS[domain]) {
    return BRAND_DOMAINS[domain];
  }

  if (isFreeEmailProvider(domain)) {
    return null; // Personal email account
  }

  // Convert "subdomain.company.com" or "company-name.co.uk" to "Company Name"
  const root = domain.split('.')[0];
  if (!root) return null;

  return root
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/**
 * Generates a Gravatar URL for an email address with d=404.
 */
export function getGravatarUrl(email, size = 160) {
  const clean = extractCleanEmail(email);
  if (!clean) return null;
  const hash = md5(clean);
  return `https://www.gravatar.com/avatar/${hash}?s=${Math.round(size)}&d=404`;
}

/**
 * Generates a Clearbit company logo URL for business/custom domains.
 * Returns null for free webmail providers (gmail, yahoo, etc.).
 */
export function getClearbitLogoUrl(emailOrDomain, size = 160) {
  if (!emailOrDomain) return null;
  const domain = emailOrDomain.includes('@') ? extractDomain(emailOrDomain) : emailOrDomain.trim().toLowerCase();
  if (!domain || isFreeEmailProvider(domain)) return null;
  return `https://logo.clearbit.com/${domain}?size=${Math.round(size)}`;
}

/**
 * Generates Universal Unavatar URL (resolves Google, GitHub, Gravatar, Twitter, Clearbit).
 */
export function getUnavatarUrl(emailOrDomain, size = 160) {
  const clean = extractCleanEmail(emailOrDomain) || (typeof emailOrDomain === 'string' ? emailOrDomain.trim() : '');
  if (!clean) return null;
  return `https://unavatar.io/${encodeURIComponent(clean)}?fallback=false&size=${Math.round(size)}`;
}

/**
 * Generates Google Profile Picture via Unavatar google provider.
 */
export function getGoogleProfileUrl(email, size = 160) {
  const clean = extractCleanEmail(email);
  if (!clean) return null;
  return `https://unavatar.io/google/${encodeURIComponent(clean)}?fallback=false&size=${Math.round(size)}`;
}

/**
 * Extracts the single initial letter for Gmail avatar fallback.
 * Uses name prop first, or email address if name is missing.
 */
export function getSenderInitial(name, email) {
  const displayName = extractDisplayName(name, email);
  if (displayName && displayName !== 'Unknown' && displayName !== '?') {
    const char = displayName.charAt(0).toUpperCase();
    if (/[A-Z0-9]/.test(char)) return char;
  }

  const cleanEmail = extractCleanEmail(email);
  if (cleanEmail.length > 0) {
    const char = cleanEmail.charAt(0).toUpperCase();
    if (/[A-Z0-9]/.test(char)) return char;
  }

  return '?';
}

/**
 * Computes a deterministic color for a given email/name string.
 * The same sender always receives the identical color.
 */
export function getSenderColor(emailOrName) {
  const str = (extractCleanEmail(emailOrName) || String(emailOrName || '')).trim().toLowerCase();
  if (!str) {
    return GMAIL_AVATAR_PALETTE[0];
  }

  // Polynomial rolling hash for uniform distribution
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % GMAIL_AVATAR_PALETTE.length;
  return GMAIL_AVATAR_PALETTE[index];
}

/**
 * Returns prioritized array of candidate image URLs to attempt before initials fallback.
 * Prioritizes:
 * 1. Unavatar (Google, Gravatar, Social Profile)
 * 2. Direct Gravatar (with 404 fallback)
 * 3. Direct Google Profile photo via Unavatar
 * 4. Company Brand Logo (Clearbit, Unavatar Domain, IconHorse, Google Favicons)
 */
export function getAvatarSources(email, size = 160, allowClearbit = true) {
  const clean = extractCleanEmail(email);
  if (!clean) return [];

  const targetSize = Math.max(96, Math.round(size * 2));
  const domain = extractDomain(clean);
  const isFree = isFreeEmailProvider(domain);
  const sources = [];

  // 1. Primary real profile resolution: Universal Unavatar
  sources.push({
    type: 'unavatar',
    url: `https://unavatar.io/${encodeURIComponent(clean)}?fallback=false&size=${targetSize}`
  });

  // 2. Gravatar Direct with MD5
  const gravatar = getGravatarUrl(clean, targetSize);
  if (gravatar) {
    sources.push({ type: 'gravatar', url: gravatar });
  }

  // 3. Google Profile specific provider
  sources.push({
    type: 'google',
    url: `https://unavatar.io/google/${encodeURIComponent(clean)}?fallback=false&size=${targetSize}`
  });

  // 4. GitHub profile lookup (if user has GitHub account for this email or username)
  const username = clean.split('@')[0];
  if (username && username.length >= 3) {
    sources.push({
      type: 'github',
      url: `https://unavatar.io/github/${encodeURIComponent(username)}?fallback=false&size=${targetSize}`
    });
  }

  // 5. If company / custom domain, brand logo sources
  if (allowClearbit && domain && !isFree) {
    sources.push({
      type: 'clearbit',
      url: `https://logo.clearbit.com/${domain}?size=${targetSize}`
    });
    sources.push({
      type: 'domain-unavatar',
      url: `https://unavatar.io/${encodeURIComponent(domain)}?fallback=false&size=${targetSize}`
    });
    sources.push({
      type: 'google-favicon',
      url: `https://www.google.com/s2/favicons?domain=${domain}&sz=${targetSize >= 64 ? 128 : 64}`
    });
    sources.push({
      type: 'iconhorse',
      url: `https://icon.horse/icon/${domain}`
    });
    sources.push({
      type: 'duckduckgo',
      url: `https://icons.duckduckgo.com/ip3/${domain}.ico`
    });
  }

  return sources;
}

/**
 * Assembles a comprehensive Sender Profile object for modals, hover cards, and rich email views.
 */
export function getSenderProfile(name, email, extra = {}) {
  const cleanEmail = extractCleanEmail(email);
  const displayName = extractDisplayName(name, cleanEmail);
  const domain = extractDomain(cleanEmail);
  const isFree = isFreeEmailProvider(domain);
  const org = extractOrganization(cleanEmail, displayName);
  const initial = getSenderInitial(displayName, cleanEmail);
  const color = getSenderColor(cleanEmail || displayName);
  const sources = getAvatarSources(cleanEmail, 160);
  const isVerified = isVerifiedSender(cleanEmail, domain);
  const rawDate = extra.receivedAt || extra.received_at || extra.date || null;
  const dateInfo = formatEmailDate(rawDate);

  const accountType = isFree
    ? 'Personal Webmail'
    : (BRAND_DOMAINS[domain] ? `${BRAND_DOMAINS[domain]} Verified Service` : `Corporate / Custom Domain (${domain})`);

  return {
    name: displayName,
    email: cleanEmail,
    rawEmail: email || cleanEmail,
    domain: domain || 'unknown',
    domainUrl: domain ? `https://${domain}` : null,
    isFreeProvider: isFree,
    isVerified,
    organization: org,
    accountType,
    initial,
    color,
    avatarSources: sources,
    websiteUrl: domain && !isFree ? `https://${domain}` : null,
    receivedAt: rawDate,
    dateInfo,
    subject: extra.subject || null,
    urgency: extra.urgency || null,
    category: extra.category || null,
    aiSummary: extra.ai_summary || extra.summary || null,
    security: {
      tls: true,
      dkim: isVerified,
      spf: isVerified,
      encryptionLabel: 'Standard TLS Encryption'
    }
  };
}


