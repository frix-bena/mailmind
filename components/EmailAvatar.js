'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  getAvatarSources,
  getSenderColor,
  getSenderInitial,
  extractCleanEmail,
  isVerifiedSender,
  extractDomain
} from '@/lib/avatar-utils';

/**
 * Gmail-Style Avatar Component with Progressive Fallback Strategy & Verified Badges
 * 
 * Strategy:
 * 1. Primary: Fetches real profile photo / Gravatar / Google / Unavatar / GitHub
 * 2. Secondary: If custom/business domain, fetches Clearbit / Favicon / IconHorse
 * 3. Fallback: Native Gmail-style circular initials with deterministic color gradient
 * 
 * @param {Object} props
 * @param {string} [props.src] - Direct image URL if available
 * @param {string} [props.email] - The sender's email address
 * @param {string} [props.name] - The sender's display name
 * @param {number|string} [props.size=40] - Diameter in pixels (default 40)
 * @param {string} [props.className] - Additional Tailwind classes
 * @param {Object} [props.style] - Additional inline styles
 * @param {string} [props.alt] - Accessible alt text
 * @param {boolean} [props.allowClearbit=true] - Whether to attempt domain logo fetch for custom domains
 * @param {boolean} [props.showTooltip=false] - Whether to show native browser tooltip on hover
 * @param {boolean} [props.showVerifiedBadge=false] - Whether to display a verified checkmark badge
 * @param {boolean} [props.priority=false] - Eagerly load image
 * @param {Function} [props.onClick] - Optional click handler
 */
export default function EmailAvatar({
  src,
  email = '',
  name = '',
  size = 40,
  className = '',
  style = {},
  alt,
  allowClearbit = true,
  showTooltip = false,
  showVerifiedBadge = false,
  priority = false,
  onClick,
  ...rest
}) {
  // Normalize size to number if numeric string is passed
  const numericSize = typeof size === 'number' ? size : parseInt(size, 10) || 40;
  const fontSize = Math.max(11, Math.round(numericSize * 0.42));

  // Compute deterministic initials, domain, color, and verification
  const initial = useMemo(() => getSenderInitial(name, email), [name, email]);
  const color = useMemo(() => getSenderColor(email || name), [email, name]);
  const cleanEmail = useMemo(() => extractCleanEmail(email), [email]);
  const domain = useMemo(() => extractDomain(cleanEmail), [cleanEmail]);
  const isVerified = useMemo(() => isVerifiedSender(cleanEmail, domain), [cleanEmail, domain]);

  // Compute prioritized image sources (Direct src or Gravatar -> Clearbit etc.)
  const sources = useMemo(
    () => {
      if (src) return [{ type: 'custom', url: src }];
      return getAvatarSources(cleanEmail, numericSize, allowClearbit);
    },
    [src, cleanEmail, numericSize, allowClearbit]
  );

  const [sourceIndex, setSourceIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset state whenever email, src, size, or candidate sources change
  useEffect(() => {
    setSourceIndex(0);
    setImageError(false);
    setImageLoaded(false);
  }, [src, cleanEmail, numericSize, allowClearbit]);

  const currentSource = sources[sourceIndex] || null;
  const imageSrc = currentSource ? currentSource.url : null;

  const handleImageError = () => {
    // If there's another fallback source in the cascade, advance to it
    if (!src && sourceIndex + 1 < sources.length) {
      setSourceIndex(prev => prev + 1);
    } else {
      // Completely unmount <img> and fall back to initials
      setImageError(true);
    }
  };

  const displayName = name || (cleanEmail ? cleanEmail.split('@')[0] : 'User');
  const tooltipText = showTooltip ? (name && cleanEmail ? `${name} <${cleanEmail}>` : displayName) : undefined;
  const imageAlt = alt || `${displayName}'s avatar`;

  const badgeSize = Math.max(12, Math.round(numericSize * 0.32));

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: numericSize,
        height: numericSize,
        minWidth: numericSize,
        minHeight: numericSize,
        cursor: onClick ? 'pointer' : 'inherit',
        ...style
      }}
      onClick={onClick}
      {...rest}
    >
      <div
        role="img"
        aria-label={imageAlt}
        title={tooltipText}
        className={`relative w-full h-full rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-sm transition-transform duration-150 ${onClick ? 'hover:scale-105' : ''} ${className}`.trim()}
        style={{
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* 
          VIBRANT DETERMINISTIC FALLBACK INITIALS:
          Centers the initial letter with high-contrast font and smooth Material gradient.
        */}
        <div
          className={`w-full h-full flex items-center justify-center text-white font-bold select-none uppercase ${color.bgClass || ''}`.trim()}
          style={{
            background: color.gradient || color.hex,
            fontSize: `${fontSize}px`,
            letterSpacing: '-0.5px',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}
        >
          {initial}
        </div>

        {/* 
          CONSTRAINED ABSOLUTE IMAGE LAYER:
          Only rendered if src exists and has not thrown onError.
        */}
        {imageSrc && !imageError && (
          <img
            key={imageSrc}
            src={imageSrc}
            alt={imageAlt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            className="absolute inset-0 w-full h-full object-cover rounded-full z-10 transition-opacity duration-200"
            style={{
              opacity: imageLoaded ? 1 : 0
            }}
          />
        )}
      </div>

      {/* 
        VERIFIED BADGE OVERLAY:
        Rendered if showVerifiedBadge is requested and sender is a verified brand/custom domain.
      */}
      {(showVerifiedBadge || (showVerifiedBadge !== false && isVerified && numericSize >= 32)) && (
        <span
          title="Verified Sender / Authenticated Domain"
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: badgeSize,
            height: badgeSize,
            borderRadius: '50%',
            background: '#1d9bf0',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.max(8, Math.round(badgeSize * 0.65)),
            fontWeight: 'bold',
            border: '2px solid var(--surface, #1a1a24)',
            zIndex: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            lineHeight: 1
          }}
        >
          ✓
        </span>
      )}
    </div>
  );
}

// Re-export utility functions directly from the component module for convenience
export {
  md5,
  getGravatarUrl,
  getClearbitLogoUrl,
  getUnavatarUrl,
  getGoogleProfileUrl,
  getSenderInitial,
  getSenderColor,
  getAvatarSources,
  getSenderProfile,
  extractCleanEmail,
  extractDomain,
  extractDisplayName,
  extractOrganization,
  isFreeEmailProvider,
  isVerifiedSender,
  formatEmailDate,
  GMAIL_AVATAR_PALETTE,
  BRAND_DOMAINS,
} from '@/lib/avatar-utils';


