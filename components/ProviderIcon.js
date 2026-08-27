'use client';

import React from 'react';

/**
 * Authentic vector brand icons matching official designs for
 * Google/Gmail, Microsoft Outlook, Yahoo Mail, Apple iCloud, and Custom IMAP.
 */

export function GmailIcon({ size = 20, className = '', style = {}, title = 'Google / Gmail' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      {/* Top Red V-flap / roof */}
      <path
        d="M4.5 4h15c1.38 0 2.5 1.12 2.5 2.5v.3L12 14.2 2 6.8V6.5C2 5.12 3.12 4 4.5 4z"
        fill="#EA4335"
      />
      {/* Left Blue Pillar */}
      <path
        d="M2 6.8v10.7C2 18.88 3.12 20 4.5 20H6V9.8L2 6.8z"
        fill="#4285F4"
      />
      {/* Right Green Pillar */}
      <path
        d="M22 6.8v10.7c0 1.38-1.12 2.5-2.5 2.5H18V9.8l4-3z"
        fill="#34A853"
      />
      {/* Bottom / Yellow Center Fold */}
      <path
        d="M6 9.8V20h12V9.8l-6 4.4-6-4.4z"
        fill="#FBBC05"
      />
      {/* Subtle Shadow overlay under flap */}
      <path
        d="M6 9.8l6 4.4 6-4.4v-.8L12 13.4 6 9z"
        fill="#C5221F"
        opacity="0.25"
      />
    </svg>
  );
}

export function GoogleGIcon({ size = 20, className = '', style = {}, title = 'Google' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export function OutlookIcon({ size = 20, className = '', style = {}, title = 'Microsoft Outlook' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      {/* Back Outlook Blue Envelope */}
      <rect x="7" y="3.5" width="14" height="17" rx="2.5" fill="#0078D4" />
      {/* Top envelope flap crease */}
      <path d="M7 5.5l7 5.2 7-5.2" stroke="#50E6FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95" />
      {/* Bottom fold shading */}
      <path d="M7 18.5l5.5-4.2M21 18.5l-5.5-4.2" stroke="#004E8C" strokeWidth="1.2" opacity="0.6" />
      {/* Front overlapping badge with gradient & 'O' */}
      <rect x="2.5" y="6" width="11" height="12" rx="2" fill="#005A9E" />
      <rect x="3" y="6.5" width="10" height="11" rx="1.6" fill="#106EBE" />
      {/* White 'O' letterform */}
      <ellipse cx="8" cy="12" rx="2.8" ry="3.5" fill="none" stroke="#FFFFFF" strokeWidth="1.7" />
    </svg>
  );
}

export function YahooIcon({ size = 20, className = '', style = {}, title = 'Yahoo Mail' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      <rect width="24" height="24" rx="5" fill="#6001D2" />
      {/* Official Yahoo 'Y' letterform */}
      <path
        d="M5.2 6.5l3.3 5.5v5.5h2.4v-5.5l3.3-5.5h-2.5l-2 3.6-2-3.6H5.2z"
        fill="#FFFFFF"
      />
      {/* Official Yahoo italic '!' */}
      <path
        d="M16 7.2a1.2 1.2 0 0 1 1.2-1.2c.7 0 1.2.5 1.2 1.2v5.4a1.2 1.2 0 0 1-1.2 1.2 1.2 1.2 0 0 1-1.2-1.2V7.2z"
        fill="#FFFFFF"
      />
      <circle cx="17.2" cy="16.5" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}

export function ICloudIcon({ size = 20, className = '', style = {}, title = 'Apple iCloud' }) {
  const gradId = React.useId ? `icloud-sky-${React.useId().replace(/:/g, '')}` : 'icloud-sky';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      <path
        d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}

export function ImapIcon({ size = 20, className = '', style = {}, title = 'Custom IMAP Server' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      {/* Top Server Unit */}
      <rect x="2.5" y="3.5" width="19" height="7.5" rx="2" fill="#4F46E5" stroke="#6366F1" strokeWidth="0.8" />
      <circle cx="6" cy="7.25" r="1.2" fill="#22C55E" />
      <circle cx="9" cy="7.25" r="1.2" fill="#38BDF8" />
      <line x1="14" y1="7.25" x2="18.5" y2="7.25" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" />

      {/* Bottom Server Unit */}
      <rect x="2.5" y="13" width="19" height="7.5" rx="2" fill="#3730A3" stroke="#6366F1" strokeWidth="0.8" />
      <circle cx="6" cy="16.75" r="1.2" fill="#22C55E" />
      <circle cx="9" cy="16.75" r="1.2" fill="#F59E0B" />
      <line x1="14" y1="16.75" x2="18.5" y2="16.75" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Normalizes provider string or email address to canonical provider ID.
 */
export function normalizeProvider(providerOrEmail) {
  if (!providerOrEmail || typeof providerOrEmail !== 'string') return 'google';
  const val = providerOrEmail.toLowerCase().trim();

  if (val.includes('gmail') || val.includes('google') || val.includes('googlemail')) {
    return 'google';
  }
  if (
    val.includes('outlook') ||
    val.includes('microsoft') ||
    val.includes('office365') ||
    val.includes('hotmail') ||
    val.includes('live') ||
    val.includes('msn')
  ) {
    return 'microsoft';
  }
  if (val.includes('yahoo') || val.includes('ymail') || val.includes('rocketmail')) {
    return 'yahoo';
  }
  if (
    val.includes('icloud') ||
    val.includes('apple') ||
    val.includes('me.com') ||
    val.includes('mac.com')
  ) {
    return 'icloud';
  }
  if (val.includes('imap') || val.includes('custom') || val.includes('smtp') || val.includes('server')) {
    return 'custom';
  }
  return 'google';
}

/**
 * Canonical metadata for all supported email providers.
 */
export const PROVIDER_LIST = [
  {
    id: 'google',
    name: 'Google / Gmail',
    shortName: 'Gmail',
    brandName: 'Google Gmail',
    color: '#EA4335',
    bgLight: 'rgba(234, 67, 53, 0.12)',
    hint: 'Sign in with your Google email and password (required)',
    guideUrl: null,
    guideText: 'Google Account'
  },
  {
    id: 'microsoft',
    name: 'Outlook / 365',
    shortName: 'Outlook',
    brandName: 'Microsoft Outlook / Office 365',
    color: '#0078D4',
    bgLight: 'rgba(0, 120, 212, 0.12)',
    hint: 'Sign in with your Outlook / Microsoft email and password (required)',
    guideUrl: null,
    guideText: 'Microsoft Account'
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    shortName: 'Yahoo',
    brandName: 'Yahoo Mail',
    color: '#6001D2',
    bgLight: 'rgba(96, 1, 210, 0.12)',
    hint: 'Sign in with your Yahoo email and password (required)',
    guideUrl: null,
    guideText: 'Yahoo Account'
  },
  {
    id: 'icloud',
    name: 'Apple iCloud',
    shortName: 'iCloud',
    brandName: 'Apple iCloud Mail',
    color: '#0284C7',
    bgLight: 'rgba(2, 132, 199, 0.12)',
    hint: 'Sign in with your Apple iCloud email and password (required)',
    guideUrl: null,
    guideText: 'Apple ID'
  },
  {
    id: 'custom',
    name: 'Custom IMAP',
    shortName: 'IMAP',
    brandName: 'Custom IMAP / SMTP Server',
    color: '#6366F1',
    bgLight: 'rgba(99, 102, 241, 0.12)',
    hint: 'Connect with your email address and password (required)',
    guideUrl: null,
    guideText: 'IMAP / SMTP Settings'
  }
];

/**
 * Gets provider metadata by ID or email.
 */
export function getProviderInfo(providerOrEmail) {
  const norm = normalizeProvider(providerOrEmail);
  return PROVIDER_LIST.find(p => p.id === norm) || PROVIDER_LIST[0];
}

/**
 * Main ProviderIcon component that renders the authentic real icon for any provider.
 */
export default function ProviderIcon({
  provider = 'google',
  size = 20,
  className = '',
  style = {},
  variant = 'default' // 'default' | 'badge'
}) {
  const norm = normalizeProvider(provider);

  const renderSvg = () => {
    switch (norm) {
      case 'google':
        return <GmailIcon size={size} className={className} style={style} />;
      case 'microsoft':
        return <OutlookIcon size={size} className={className} style={style} />;
      case 'yahoo':
        return <YahooIcon size={size} className={className} style={style} />;
      case 'icloud':
        return <ICloudIcon size={size} className={className} style={style} />;
      case 'custom':
        return <ImapIcon size={size} className={className} style={style} />;
      default:
        return <GmailIcon size={size} className={className} style={style} />;
    }
  };

  if (variant === 'badge') {
    const info = getProviderInfo(norm);
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size + 8,
          height: size + 8,
          borderRadius: 6,
          background: info.bgLight || 'var(--surface2)',
          border: `1px solid ${info.color}33`,
          flexShrink: 0,
          ...style
        }}
        title={info.brandName}
      >
        {renderSvg()}
      </span>
    );
  }

  return renderSvg();
}
