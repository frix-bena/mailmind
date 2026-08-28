/**
 * App Password Generator & Provider Guide Utilities
 * Generates secure, formatted app-specific passwords and provides official
 * provider instructions and deep-links for Google, Microsoft, Yahoo, Apple, Zoho, Fastmail, and Custom IMAP.
 */

export const PROVIDER_GUIDES = {
  google: {
    id: 'google',
    name: 'Google / Gmail',
    shortName: 'Gmail',
    brandName: 'Google Account',
    color: '#EA4335',
    appPasswordUrl: 'https://myaccount.google.com/apppasswords',
    securityUrl: 'https://myaccount.google.com/security',
    format: 'spaced_16', // 16 chars: xxxx xxxx xxxx xxxx
    formatExample: 'abcd efgh ijkl mnop',
    requires2FA: true,
    steps: [
      {
        step: 1,
        title: 'Ensure 2-Step Verification is ON',
        desc: 'Google requires 2-Step Verification enabled before generating App Passwords.'
      },
      {
        step: 2,
        title: 'Open Google App Passwords page',
        desc: 'Visit https://myaccount.google.com/apppasswords in your browser.'
      },
      {
        step: 3,
        title: 'Name your App Password',
        desc: 'Enter "MailMind" as the App name and click Create.'
      },
      {
        step: 4,
        title: 'Copy the 16-character code',
        desc: 'Google will display a 16-character password (e.g. "abcd efgh ijkl mnop"). Copy and paste it here.'
      }
    ],
    tips: 'Google App Passwords are 16 letters without spaces required when connecting, but Google displays them in 4 groups of 4 for easy reading.'
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft Outlook / Office 365',
    shortName: 'Outlook',
    brandName: 'Microsoft Account',
    color: '#0078D4',
    appPasswordUrl: 'https://account.live.com/proofs/AppPassword',
    securityUrl: 'https://account.microsoft.com/security',
    format: 'alphanumeric_16',
    formatExample: 'k9Nm-2PxL-8VbQ-4WtZ',
    requires2FA: true,
    steps: [
      {
        step: 1,
        title: 'Turn on Two-Step Verification',
        desc: 'Ensure Two-Step Verification is active on your Microsoft account security page.'
      },
      {
        step: 2,
        title: 'Go to Advanced Security Options',
        desc: 'Navigate to Additional Security Options -> App Passwords.'
      },
      {
        step: 3,
        title: 'Create new App Password',
        desc: 'Click "Create a new app password" under the App passwords section.'
      },
      {
        step: 4,
        title: 'Copy the password',
        desc: 'Copy the generated app password and use it here in MailMind.'
      }
    ],
    tips: 'For Office 365 work/school accounts, your IT administrator must have Authenticated SMTP / IMAP enabled in the Microsoft 365 Admin Center.'
  },
  yahoo: {
    id: 'yahoo',
    name: 'Yahoo Mail',
    shortName: 'Yahoo',
    brandName: 'Yahoo Security',
    color: '#6001D2',
    appPasswordUrl: 'https://login.yahoo.com/account/security/app-passwords',
    securityUrl: 'https://login.yahoo.com/account/security',
    format: 'spaced_16',
    formatExample: 'xxxx xxxx xxxx xxxx',
    requires2FA: false,
    steps: [
      {
        step: 1,
        title: 'Open Yahoo Account Security',
        desc: 'Sign in to your Yahoo Account Security page.'
      },
      {
        step: 2,
        title: 'Generate App Password',
        desc: 'Scroll down and click "Generate app password" or "Manage app passwords".'
      },
      {
        step: 3,
        title: 'Label as MailMind',
        desc: 'Enter "MailMind" as your app name and click Generate.'
      },
      {
        step: 4,
        title: 'Copy and paste',
        desc: 'Copy the 16-character code and paste it into the Password field.'
      }
    ],
    tips: 'Yahoo Mail requires an app password for all third-party IMAP applications.'
  },
  icloud: {
    id: 'icloud',
    name: 'Apple iCloud Mail',
    shortName: 'iCloud',
    brandName: 'Apple ID Security',
    color: '#0284C7',
    appPasswordUrl: 'https://appleid.apple.com/account/manage',
    securityUrl: 'https://appleid.apple.com/',
    format: 'dashed_16',
    formatExample: 'abcd-efgh-ijkl-mnop',
    requires2FA: true,
    steps: [
      {
        step: 1,
        title: 'Sign in to Apple ID Management',
        desc: 'Go to https://appleid.apple.com and sign in with your Apple Account.'
      },
      {
        step: 2,
        title: 'Select App-Specific Passwords',
        desc: 'In the "Sign-In and Security" section, select "App-Specific Passwords".'
      },
      {
        step: 3,
        title: 'Generate Password',
        desc: 'Click "Generate an app-specific password" (or the + icon) and enter "MailMind".'
      },
      {
        step: 4,
        title: 'Copy the password',
        desc: 'Copy the formatted code (e.g. "abcd-efgh-ijkl-mnop") and paste it into MailMind.'
      }
    ],
    tips: 'Apple requires app-specific passwords for all third-party email clients accessing @icloud.com or @me.com mailboxes.'
  },
  zoho: {
    id: 'zoho',
    name: 'Zoho Mail',
    shortName: 'Zoho',
    brandName: 'Zoho Accounts',
    color: '#10B981',
    appPasswordUrl: 'https://accounts.zoho.com/home#security/app_passwords',
    securityUrl: 'https://accounts.zoho.com/',
    format: 'spaced_16',
    formatExample: 'xxxx xxxx xxxx xxxx',
    requires2FA: true,
    steps: [
      {
        step: 1,
        title: 'Open Zoho Security Settings',
        desc: 'Log in to Zoho Accounts and go to Security -> Application-Specific Passwords.'
      },
      {
        step: 2,
        title: 'Generate New Password',
        desc: 'Click "Generate New Password", name it "MailMind", and click Generate.'
      },
      {
        step: 3,
        title: 'Copy the password',
        desc: 'Copy the generated password code and paste it here in MailMind.'
      }
    ],
    tips: 'Zoho accounts with TFA (Two-Factor Authentication) require an Application-Specific Password for IMAP access.'
  },
  fastmail: {
    id: 'fastmail',
    name: 'Fastmail',
    shortName: 'Fastmail',
    brandName: 'Fastmail Settings',
    color: '#6366F1',
    appPasswordUrl: 'https://www.fastmail.com/settings/security/tokens',
    securityUrl: 'https://www.fastmail.com/settings/security',
    format: 'alphanumeric_16',
    formatExample: 'fmp-xxxx-xxxx-xxxx',
    requires2FA: false,
    steps: [
      {
        step: 1,
        title: 'Open Fastmail App Passwords',
        desc: 'Go to Settings -> Privacy & Security -> App Passwords in Fastmail.'
      },
      {
        step: 2,
        title: 'New App Password',
        desc: 'Click "New App Password", choose "Mail (IMAP/SMTP)" access, and name it "MailMind".'
      },
      {
        step: 3,
        title: 'Copy token',
        desc: 'Copy the generated app password token into MailMind.'
      }
    ],
    tips: 'Fastmail provides granular app passwords specifically scoped for IMAP/SMTP mail sync.'
  },
  custom: {
    id: 'custom',
    name: 'Custom IMAP / Self-Hosted',
    shortName: 'Custom IMAP',
    brandName: 'Custom Mail Server',
    color: '#8B5CF6',
    appPasswordUrl: null,
    securityUrl: null,
    format: 'alphanumeric_16',
    formatExample: 'k9Nm2PxL8VbQ4WtZ',
    requires2FA: false,
    steps: [
      {
        step: 1,
        title: 'Check your mail server settings',
        desc: 'Ensure IMAP (port 993 SSL) and SMTP (port 465 SSL or 587 STARTTLS) are enabled.'
      },
      {
        step: 2,
        title: 'Obtain or generate password / API token',
        desc: 'Use your mailbox password, app token, or generate a high-entropy random app key below.'
      },
      {
        step: 3,
        title: 'Enter server details',
        desc: 'Provide your IMAP host (e.g. imap.yourdomain.com) and port in the connection form.'
      }
    ],
    tips: 'You can use the built-in Secure Password Generator below to create high-entropy passwords for your custom mail accounts.'
  }
};

/**
 * Generate a random cryptographically secure string
 */
function getRandomBytes(length) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return array;
  }
  // Node / fallback
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

/**
 * Generates a randomized app password with selectable formats:
 * - 'spaced': 4x4 lowercase letters "abcd efgh ijkl mnop" (Google / Yahoo style)
 * - 'dashed': 4x4 lowercase letters "abcd-efgh-ijkl-mnop" (Apple iCloud style)
 * - 'alphanumeric': Mixed-case letters and numbers "k9Nm-2PxL-8VbQ-4WtZ" (Microsoft style)
 * - 'token': 24-character hex / base62 secure token
 * - 'raw': Plain 16-character continuous lowercase string
 */
export function generateAppPassword(options = {}) {
  const format = options.format || 'spaced'; // 'spaced' | 'dashed' | 'alphanumeric' | 'token' | 'raw'
  const length = options.length || 16;
  const includeNumbers = options.includeNumbers !== false;

  let charset = 'abcdefghijklmnopqrstuvwxyz';
  if (format === 'alphanumeric') {
    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  } else if (format === 'token') {
    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  } else if (includeNumbers) {
    charset = 'abcdefghjkmnpqrstuvwxyz23456789'; // Avoid ambiguous chars 0, O, 1, l, i
  }

  const randomBytes = getRandomBytes(length);
  let raw = '';
  for (let i = 0; i < length; i++) {
    raw += charset[randomBytes[i] % charset.length];
  }

  if (format === 'spaced') {
    // 4 groups of 4 characters: "xxxx xxxx xxxx xxxx"
    return raw.match(/.{1,4}/g)?.join(' ') || raw;
  }
  if (format === 'dashed') {
    // 4 groups of 4 characters: "xxxx-xxxx-xxxx-xxxx"
    return raw.match(/.{1,4}/g)?.join('-') || raw;
  }
  if (format === 'alphanumeric') {
    return raw.match(/.{1,4}/g)?.join('-') || raw;
  }
  return raw;
}

/**
 * Clean and normalize an app password string (stripping whitespace / dashes if needed)
 */
export function cleanAppPassword(input) {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/\s+/g, '').replace(/-/g, '').trim();
}

/**
 * Formats a raw password string into a clean visual 4x4 representation
 */
export function formatAppPassword(input, formatType = 'spaced') {
  const clean = cleanAppPassword(input);
  if (!clean) return '';
  if (formatType === 'dashed') {
    return clean.match(/.{1,4}/g)?.join('-') || clean;
  }
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

/**
 * Returns provider guide metadata for a given provider or email address
 */
export function getProviderAppPasswordGuide(providerOrEmail) {
  if (!providerOrEmail) return PROVIDER_GUIDES.google;
  const val = String(providerOrEmail).toLowerCase().trim();

  if (val.includes('gmail') || val.includes('google') || val.includes('googlemail')) {
    return PROVIDER_GUIDES.google;
  }
  if (val.includes('outlook') || val.includes('microsoft') || val.includes('office365') || val.includes('hotmail') || val.includes('live')) {
    return PROVIDER_GUIDES.microsoft;
  }
  if (val.includes('yahoo') || val.includes('ymail') || val.includes('rocketmail')) {
    return PROVIDER_GUIDES.yahoo;
  }
  if (val.includes('icloud') || val.includes('apple') || val.includes('me.com') || val.includes('mac.com')) {
    return PROVIDER_GUIDES.icloud;
  }
  if (val.includes('zoho')) {
    return PROVIDER_GUIDES.zoho;
  }
  if (val.includes('fastmail')) {
    return PROVIDER_GUIDES.fastmail;
  }
  if (val.includes('custom') || val.includes('imap') || val.includes('smtp')) {
    return PROVIDER_GUIDES.custom;
  }
  return PROVIDER_GUIDES.google;
}
