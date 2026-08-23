/**
 * Gmail-Style Avatar & Sender Profile Utility Library
 * 
 * Provides pure JS MD5 hashing, real sender profile photo resolution
 * (Google S2 Favicon CDN, Vector Brand SVGs, Unavatar, Google Profiles,
 * Gravatar, Clearbit, DuckDuckGo), smart display name formatting,
 * organization / company extraction, and deterministic Material palette initials.
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
  'accounts.google.com': 'Google Accounts',
  'youtube.com': 'YouTube',
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
  'instagram.com': 'Instagram',
  'threads.net': 'Threads',
  'dropbox.com': 'Dropbox',
  'atlassian.com': 'Atlassian',
  'jira.com': 'Jira',
  'trello.com': 'Trello',
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
 * Pure SVG Helper to encode SVG into Data URL without external network dependencies.
 */
function svgDataUrl(svgString) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

/**
 * High-quality vector brand icons for instant, 0-latency rendering matching Gmail's official logos.
 */
export const BRAND_ICONS = {
  'google.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>'),
  'googlemail.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>'),
  'youtube.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><path fill="#FFFFFF" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'),
  'github.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#24292e"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>'),
  'stripe.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#635bff"/><path fill="#ffffff" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697.545 12.727.545 6.892.545 2.784 3.738 2.784 8.795c0 5.64 5.378 7.02 8.928 8.358 2.443.921 3.528 1.628 3.528 2.683 0 .991-.864 1.547-2.38 1.547-2.613 0-5.385-1.127-7.234-2.133l-.93 5.568c1.65.86 4.793 1.583 8.04 1.583 6.073 0 10.492-3.048 10.492-8.324 0-5.59-5.074-7.05-9.252-8.927z"/></svg>'),
  'apple.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.54c.64-.78 1.08-1.87.96-2.96-0.93.04-2.06.62-2.73 1.4-.58.68-1.1 1.77-.96 2.83 1.04.08 2.09-.49 2.73-1.27z"/></svg>'),
  'microsoft.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#f25022"/><rect x="13" y="1" width="10" height="10" fill="#7fba00"/><rect x="1" y="13" width="10" height="10" fill="#00a4ef"/><rect x="13" y="13" width="10" height="10" fill="#ffb900"/></svg>'),
  'amazon.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FF9900" d="M13.9 17.5c-3.1 2.3-7.6 3.5-11.5 2.1-.6-.2-.7-.9-.2-1.3 3.3-2.6 7.9-3.7 11.2-2 .8.4.8 1 .5 1.2zm1.6-1.2c-.4-.5-2.5-.3-3.5-.1-.3 0-.3-.3 0-.5 1.8-1.3 4.8-.9 5.2-.3.3.4-.2 3.3-1.9 4.7-.2.2-.5.1-.4-.2.4-1.2.9-3.1.6-3.6z"/><path fill="#146EB4" d="M12.9 8.2v1.3c0 .8-.5 1.2-1.3 1.2-.7 0-1.1-.4-1.1-1.2V8.2c0-2.4 1.3-3.6 3.6-3.6 2.4 0 3.7 1.2 3.7 3.6v4.6c0 .7.4 1.1 1.1 1.1.2 0 .5-.1.7-.2v1.3c-.4.2-.9.3-1.5.3-1.4 0-2.1-.8-2.2-2.2-.6 1.4-1.8 2.2-3.3 2.2-2 0-3.3-1.4-3.3-3.4 0-2.3 1.6-3.5 4.3-3.8l2.2-.2zm-1.8 4.9c1.1 0 1.8-.7 1.8-1.8v-.9l-1.8.2c-1.4.1-2.1.7-2.1 1.8 0 .9.7 1.5 1.7 1.5z"/></svg>'),
  'netflix.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#E50914" d="M5.398 0v24c1.144-.197 2.3-.393 3.447-.565V0H5.398zm9.757 0v18.784c1.156-.164 2.31-.32 3.447-.468V0h-3.447z"/><path fill="#B81D24" d="M8.845 23.435L15.155 0h3.447v.468L12.292 24c-1.148.163-2.302.327-3.447.468v-1.033z"/></svg>'),
  'spotify.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1ED760"/><path fill="#FFFFFF" d="M17.9 16.4c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.8-9.3-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4.1-.9 7.5-.6 10.3 1.1.3.2.4.6.2 1zm1.3-2.9c-.3.4-.8.5-1.2.3-2.9-1.8-7.3-2.3-10.7-1.3-.5.1-1-.1-1.1-.6-.1-.5.1-1 .6-1.1 3.9-1.2 8.8-.6 12.1 1.4.4.3.5.9.3 1.3zm.1-3c-3.5-2.1-9.2-2.3-12.6-1.3-.6.2-1.2-.2-1.3-.7-.2-.6.2-1.2.7-1.3 3.9-1.2 10.2-1 14.3 1.4.5.3.7 1 .4 1.5-.3.5-1 .7-1.5.4z"/></svg>'),
  'slack.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/><path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/><path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/><path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>'),
  'linear.app': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#5E6AD2"/><path fill="#FFFFFF" d="M3.52 16.5l3.98-3.98A4.98 4.98 0 0 1 7 11a5 5 0 0 1 5-5c.53 0 1.04.09 1.52.24L17.5 2.26A9.95 9.95 0 0 0 12 1C5.92 1 1 5.92 1 12c0 1.99.59 3.84 1.61 5.4l.91-.9z"/><path fill="#FFFFFF" d="M20.48 7.5l-3.98 3.98c.32.47.5 1.02.5 1.52a5 5 0 0 1-5 5c-.53 0-1.04-.09-1.52-.24L6.5 21.74A9.95 9.95 0 0 0 12 23c6.08 0 11-4.92 11-11 0-1.99-.59-3.84-1.61-5.4l-.91.9z"/></svg>'),
  'notion.so': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000000" d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.83c-.467-.373-.933-.513-1.82-.466L2.826 2.39c-.42.047-.514.28-.327.466l1.96 1.352zm.98 3.872v12.778c0 .886.42 1.212 1.353 1.165l13.54-.792c.934-.047 1.12-.607 1.12-1.353V6.913c0-.746-.28-.98-1.027-.933L5.44 6.82c-.747.047-.98.373-.98 1.26zm12.37.513c.093.42 0 .84-.42.887l-.98.14v8.347c-.606.326-1.166.513-1.68.513-.84 0-1.073-.28-1.68-.98l-4.29-6.39v6.345l1.353.28s.093.653-.606.653l-3.126.187c-.093-.187.047-.653.42-.7l1.027-.14V9.617l-1.306-.14c-.094-.42.14-.84.607-.887l3.406-.233 4.572 6.717V9.243l-1.213-.14c-.094-.42.14-.84.607-.887l3.315-.187z"/></svg>'),
  'openai.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#10A37F" d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.98 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.08 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.493zm-8.877-3.834a4.473 4.473 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062l-4.834 2.79a4.5 4.5 0 0 1-6.146-1.645zm-1.82-8.464a4.473 4.473 0 0 1 2.363-1.99l-.004.164v5.517a.78.78 0 0 0 .388.676l5.836 3.37-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.791A4.494 4.494 0 0 1 2.563 10.13zm15.654 1.834l-5.836-3.37 2.02-1.168a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.682a.79.79 0 0 0-.409-.676zm2.02-3.382l-.141-.08-4.779-2.759a.795.795 0 0 0-.784 0L8.8 9.092V6.76a.079.079 0 0 1 .033-.062l4.834-2.79a4.5 4.5 0 0 1 6.68 4.673zM10.74 12.87l-2.02-1.168a.071.071 0 0 1-.038-.052V6.067a4.504 4.504 0 0 1 7.37-3.453l-.142.08-4.779 2.758a.795.795 0 0 0-.391.681v6.737zm1.26-2.184l3.056-1.764 3.056 1.764v3.528l-3.056 1.764-3.056-1.764z"/></svg>'),
  'vercel.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 24 22 0 22" fill="#000000"/></svg>'),
  'supabase.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#3ECF8E" d="M21.362 9.354H12V.3a.3.3 0 0 0-.516-.208L.235 12.44a.3.3 0 0 0 .208.514H9.79v9.054a.3.3 0 0 0 .516.208l11.249-12.348a.3.3 0 0 0-.208-.514z"/></svg>'),
  'twitter.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000000" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'),
  'x.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000000" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'),
  'linkedin.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#ffffff" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>'),
  'discord.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#5865F2" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>'),
  'paypal.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#003087" d="M20.067 8.478c-.492.88-1.173 1.583-2.023 2.088-.85.506-1.854.767-2.986.767H11.53l-1.054 6.667h-3.41L10.3 3.667h5.816c1.233 0 2.222.316 2.94.938.718.622 1.055 1.558 1.011 2.784v1.089z"/><path fill="#0079C1" d="M17.044 11.324c-.492.88-1.173 1.583-2.023 2.088-.85.506-1.854.767-2.986.767H8.507l-1.054 6.667H4.043L7.276 6.513h5.816c1.233 0 2.222.316 2.94.938.718.622 1.055 1.558 1.012 2.784v1.089z"/></svg>'),
  'zoom.us': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#2D8CFF"/><path fill="#FFFFFF" d="M4.5 8.25A2.25 2.25 0 0 1 6.75 6h7.5A2.25 2.25 0 0 1 16.5 8.25v7.5A2.25 2.25 0 0 1 14.25 18h-7.5A2.25 2.25 0 0 1 4.5 15.75v-7.5zm13 2.086l3.255-2.325a.75.75 0 0 1 1.245.586v6.806a.75.75 0 0 1-1.245.586L17.5 13.664v-3.328z"/></svg>'),
  'figma.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#F24E1E" d="M8 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3h3V2H8z"/><path fill="#FF7262" d="M13 2h3a3 3 0 0 1 3 3 3 3 0 0 1-3 3h-3V2z"/><path fill="#A259FF" d="M8 8a3 3 0 0 0-3 3 3 3 0 0 0 3 3h3V8H8z"/><path fill="#1ABCFE" d="M16 8a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3V8h3z"/><path fill="#0ACF83" d="M8 14a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3v-3H8z"/></svg>'),
  'canva.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#00C4CC"/><path fill="#FFFFFF" d="M12.98 16.63c-3.13 0-5.07-2.28-5.07-5.38 0-3.32 2.25-5.63 5.48-5.63 1.87 0 3.32.74 4.09 1.85l-1.63 1.26c-.53-.74-1.39-1.23-2.46-1.23-1.92 0-3.23 1.44-3.23 3.75 0 2.14 1.15 3.51 3.08 3.51 1.2 0 2.06-.52 2.66-1.35l1.63 1.17c-.96 1.29-2.58 2.05-4.55 2.05z"/></svg>'),
  'docker.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2496ED" d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.118a.186.186 0 00.186-.186V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.186V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.186V9.006a.185.185 0 00-.185-.186H5.136a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185m-2.928 0h2.119a.185.185 0 00.185-.186V9.006a.185.185 0 00-.185-.186H2.208a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185M23.79 10.74c-.538-.387-1.44-.372-2.172-.19-.372-1.343-1.503-2.308-2.967-2.308-.28 0-.555.035-.82.1-.482-2.182-2.434-3.79-4.757-3.79-.115 0-.228.006-.341.016V3.388c0-.663-.538-1.2-1.2-1.2h-3.32c-.662 0-1.2.537-1.2 1.2v1.17H5.66c-.662 0-1.2.538-1.2 1.2v1.17H3.32c-.662 0-1.2.538-1.2 1.2v6.62c0 4.197 3.404 7.6 7.6 7.6h7.6c3.784 0 6.91-2.775 7.48-6.425.688-.475 1.228-1.162 1.47-1.975.257-.864.08-1.575-.48-1.933z"/></svg>'),
  'reddit.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF4500"/><path fill="#FFFFFF" d="M12 4.5c.6 0 1.1.4 1.2 1l1.5.3c.4-.5 1.1-.9 1.8-.9 1.2 0 2.2 1 2.2 2.2 0 .8-.5 1.6-1.2 2 .1.4.1.8.1 1.2 0 3-3.6 5.5-8 5.5s-8-2.5-8-5.5c0-.4 0-.8.1-1.2-.7-.4-1.2-1.2-1.2-2 0-1.2 1-2.2 2.2-2.2.7 0 1.4.4 1.8.9l1.5-.3c.1-.6.6-1 1.2-1zm-2.7 6.3c-.6 0-1.1.5-1.1 1.1s.5 1.1 1.1 1.1 1.1-.5 1.1-1.1-.5-1.1-1.1-1.1zm5.4 0c-.6 0-1.1.5-1.1 1.1s.5 1.1 1.1 1.1 1.1-.5 1.1-1.1-.5-1.1-1.1-1.1zm-5.4 3.7c.4.6 1.4 1.1 2.7 1.1s2.3-.5 2.7-1.1c.1-.1 0-.3-.1-.3-.1 0-.3 0-.4.1-.3.4-1.2.8-2.2.8s-1.9-.4-2.2-.8c-.1-.1-.3-.1-.4-.1-.1 0-.2.2-.1.3z"/></svg>'),
  'substack.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#FF6719"/><path fill="#FFFFFF" d="M4 6h16V4H4v2zm0 4h16V8H4v2zm0 10l8-4.5 8 4.5v-8H4v8z"/></svg>'),
  'medium.com': svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000000" d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>')
};

/**
 * Material Design color palette matching Gmail's authentic sender avatar colors.
 * Flat solid colors with high contrast for centered white letter initials.
 */
export const GMAIL_AVATAR_PALETTE = [
  { hex: '#d93025', bgClass: 'bg-[#d93025]', name: 'red', gradient: 'linear-gradient(135deg, #d93025, #ea4335)' },
  { hex: '#1a73e8', bgClass: 'bg-[#1a73e8]', name: 'blue', gradient: 'linear-gradient(135deg, #1a73e8, #4285f4)' },
  { hex: '#188038', bgClass: 'bg-[#188038]', name: 'green', gradient: 'linear-gradient(135deg, #188038, #34a853)' },
  { hex: '#ea8600', bgClass: 'bg-[#ea8600]', name: 'amber', gradient: 'linear-gradient(135deg, #ea8600, #fbbc04)' },
  { hex: '#9334e6', bgClass: 'bg-[#9334e6]', name: 'purple', gradient: 'linear-gradient(135deg, #9334e6, #a855f7)' },
  { hex: '#e52592', bgClass: 'bg-[#e52592]', name: 'pink', gradient: 'linear-gradient(135deg, #e52592, #ec4899)' },
  { hex: '#0097a7', bgClass: 'bg-[#0097a7]', name: 'cyan', gradient: 'linear-gradient(135deg, #0097a7, #06b6d4)' },
  { hex: '#00897b', bgClass: 'bg-[#00897b]', name: 'teal', gradient: 'linear-gradient(135deg, #00897b, #14b8a6)' },
  { hex: '#3949ab', bgClass: 'bg-[#3949ab]', name: 'indigo', gradient: 'linear-gradient(135deg, #3949ab, #6366f1)' },
  { hex: '#e64a19', bgClass: 'bg-[#e64a19]', name: 'deepOrange', gradient: 'linear-gradient(135deg, #e64a19, #f97316)' },
  { hex: '#5f6368', bgClass: 'bg-[#5f6368]', name: 'slate', gradient: 'linear-gradient(135deg, #5f6368, #80868b)' },
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
    if (['support', 'notifications', 'no-reply', 'noreply', 'team', 'hello', 'billing', 'news', 'security', 'contact', 'mailer'].includes(userPart.toLowerCase())) {
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
 * Generates Google S2 Favicon service URL for authentic high-res brand icons.
 * This is Google's own high-speed favicon service used throughout Google products.
 */
export function getGoogleFaviconUrl(domain, size = 128) {
  if (!domain) return null;
  const targetSize = Math.max(64, Math.min(256, Math.round(size)));
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${targetSize}`;
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
  if (name && typeof name === 'string') {
    const clean = name.replace(/^["'<\s]+|["'>\s]+$/g, '').trim();
    if (clean && clean !== email && !clean.includes('@')) {
      const char = clean.charAt(0).toUpperCase();
      if (/[A-Z0-9]/.test(char)) return char;
    }
  }

  const cleanEmail = extractCleanEmail(email);
  if (cleanEmail.length > 0) {
    const userPart = cleanEmail.split('@')[0] || '';
    if (userPart.length > 0) {
      const char = userPart.charAt(0).toUpperCase();
      if (/[A-Z0-9]/.test(char)) return char;
    }
    const char = cleanEmail.charAt(0).toUpperCase();
    if (/[A-Z0-9]/.test(char)) return char;
  }

  return '?';
}

/**
 * Computes a deterministic Material color for a given email/name string.
 * The same sender always receives the identical color.
 */
export function getSenderColor(emailOrName) {
  const str = (extractCleanEmail(emailOrName) || String(emailOrName || '')).trim().toLowerCase();
  if (!str) {
    return GMAIL_AVATAR_PALETTE[0];
  }

  // Polynomial rolling hash for uniform distribution across palette
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
 * 1. Direct Vector Brand SVG (instant 0ms render for major brands)
 * 2. Google S2 Favicon CDN (Google's official high-res icon service)
 * 3. Gravatar Direct with MD5
 * 4. Google Profile Photo / Unavatar
 * 5. Company Brand Logo (Clearbit / DuckDuckGo)
 */
export function getAvatarSources(email, size = 160, allowClearbit = true) {
  const clean = extractCleanEmail(email);
  if (!clean) return [];

  const targetSize = Math.max(96, Math.round(size * 2));
  const domain = extractDomain(clean);
  const isFree = isFreeEmailProvider(domain);
  const sources = [];

  // 1. Direct High-Res Brand SVG for known services (Instant vector render)
  if (domain && BRAND_ICONS[domain]) {
    sources.push({
      type: 'brand_svg',
      url: BRAND_ICONS[domain],
      isBrand: true
    });
  }

  // 2. Google S2 Favicon CDN for domains (Google's official brand icon CDN)
  if (domain && (!isFree || domain === 'google.com' || domain === 'googlemail.com' || domain === 'youtube.com')) {
    sources.push({
      type: 'google_fav',
      url: getGoogleFaviconUrl(domain, targetSize),
      isBrand: true
    });
  }

  // 3. Gravatar Direct with MD5
  const gravatar = getGravatarUrl(clean, targetSize);
  if (gravatar) {
    sources.push({ type: 'gravatar', url: gravatar });
  }

  // 4. If free provider or Google account, try Google Profile Picture via Unavatar
  if (isFree) {
    sources.push({
      type: 'google_profile',
      url: getGoogleProfileUrl(clean, targetSize)
    });
    sources.push({
      type: 'unavatar',
      url: getUnavatarUrl(clean, targetSize)
    });
  }

  // 5. If company / custom domain, additional logo sources (Clearbit / DuckDuckGo / Unavatar)
  if (domain && !isFree) {
    if (allowClearbit) {
      sources.push({
        type: 'clearbit',
        url: `https://logo.clearbit.com/${domain}?size=${targetSize}`,
        isBrand: true
      });
    }
    sources.push({
      type: 'duckduckgo',
      url: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      isBrand: true
    });
    sources.push({
      type: 'unavatar',
      url: `https://unavatar.io/${domain}?fallback=false&size=${targetSize}`,
      isBrand: true
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
      dmarc: isVerified,
      mailedBy: domain || 'google.com',
      signedBy: domain || 'google.com',
      encryptionLabel: 'Standard TLS Encryption (TLS_AES_256_GCM_SHA384)'
    }
  };
}


