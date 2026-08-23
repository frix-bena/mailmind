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
 * Sizing & Layout Guarantee:
 * - Strict circular geometry (aspect-ratio 1:1, border-radius 50%, overflow hidden)
 * - All content (images, initials, icons) fits perfectly within the circle without distorting or overflowing
 * - Images scale cleanly with object-cover and fill the space uniformly
 * 
 * @param {Object} props
 * @param {string} [props.src] - Direct image URL if available
 * @param {string} [props.email] - The sender's email address
 * @param {string} [props.name] - The sender's display name
 * @param {number|string} [props.size=40] - Diameter in pixels (default 40px)
 * @param {React.ReactNode} [props.icon] - Optional icon to render inside avatar
 * @param {React.ReactNode} [props.children] - Optional custom children
 * @param {string} [props.className] - Additional CSS classes
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
  icon,
  children,
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
  // Normalize size to number if numeric string is passed, minimum 16px
  const numericSize = Math.max(16, (typeof size === 'number' ? size : parseInt(size, 10)) || 40);
  const fontSize = Math.max(10, Math.round(numericSize * 0.44));

  // Compute deterministic initials, domain, color, and verification
  const initial = useMemo(() => getSenderInitial(name, email), [name, email]);
  const color = useMemo(() => getSenderColor(email || name), [email, name]);
  const cleanEmail = useMemo(() => extractCleanEmail(email), [email]);
  const domain = useMemo(() => extractDomain(cleanEmail), [cleanEmail]);
  const isVerified = useMemo(() => isVerifiedSender(cleanEmail, domain), [cleanEmail, domain]);

  // Compute prioritized image sources (Direct src, Gravatar, Clearbit)
  const sources = useMemo(
    () => {
      const list = [];
      if (src) list.push({ type: 'custom', url: src });
      const fallbackList = getAvatarSources(cleanEmail, numericSize, allowClearbit);
      return [...list, ...fallbackList];
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
    if (sourceIndex + 1 < sources.length) {
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
  const badgeFontSize = Math.max(8, Math.round(badgeSize * 0.65));

  // Outer container inline style ensuring strict geometry and alignment
  const containerStyle = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${numericSize}px`,
    height: `${numericSize}px`,
    minWidth: `${numericSize}px`,
    minHeight: `${numericSize}px`,
    maxWidth: `${numericSize}px`,
    maxHeight: `${numericSize}px`,
    aspectRatio: '1 / 1',
    flexShrink: 0,
    borderRadius: '50%',
    cursor: onClick ? 'pointer' : 'inherit',
    boxSizing: 'border-box',
    ...style
  };

  // Inner circular mask style ensuring no overflow and crisp circular containment
  const circleStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxSizing: 'border-box',
    background: color.gradient || color.hex || '#1a73e8',
    userSelect: 'none',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)'
  };

  // Centered initials text style matching Gmail's clean typography
  const initialsStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#ffffff',
    fontSize: `${fontSize}px`,
    fontWeight: 500,
    lineHeight: 1,
    textTransform: 'uppercase',
    letterSpacing: '0px',
    userSelect: 'none',
    fontFamily: '"Google Sans", "Product Sans", Roboto, system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box'
  };

  // Image style guaranteeing object-cover scaling, filling the circular mask without distortion
  const imageStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    borderRadius: '50%',
    display: 'block',
    opacity: imageLoaded ? 1 : 0,
    transition: 'opacity 0.15s ease-in-out',
    zIndex: 1,
    boxSizing: 'border-box'
  };

  // Verified badge overlay style
  const badgeStyle = {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: `${badgeSize}px`,
    height: `${badgeSize}px`,
    minWidth: `${badgeSize}px`,
    minHeight: `${badgeSize}px`,
    maxWidth: `${badgeSize}px`,
    maxHeight: `${badgeSize}px`,
    borderRadius: '50%',
    background: '#1d9bf0',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${badgeFontSize}px`,
    fontWeight: 'bold',
    border: '2px solid var(--surface, #1a1a24)',
    zIndex: 2,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
    lineHeight: 1,
    boxSizing: 'border-box',
    pointerEvents: 'none'
  };

  return (
    <div
      className={`email-avatar-root ${className}`.trim()}
      style={containerStyle}
      onClick={onClick}
      {...rest}
    >
      <div
        role="img"
        aria-label={imageAlt}
        title={tooltipText}
        className="email-avatar-circle"
        style={circleStyle}
      >
        {/* 
          1. CENTRALLY ALIGNED CONTENT (Initials / Icon / Custom Children):
          Always rendered as the base layer, perfectly centered within the circle.
        */}
        {children ? (
          <div style={initialsStyle}>{children}</div>
        ) : icon ? (
          <div style={initialsStyle}>{icon}</div>
        ) : (
          <div
            className="email-avatar-initials"
            style={initialsStyle}
          >
            {initial}
          </div>
        )}

        {/* 
          2. CONSTRAINED ABSOLUTE IMAGE LAYER:
          Rendered over the base layer, perfectly fitted using object-fit: cover.
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
            className="email-avatar-img"
            style={imageStyle}
          />
        )}
      </div>

      {/* 
        3. VERIFIED BADGE OVERLAY:
        Rendered outside the clipped circle to maintain badge visibility without clipping.
      */}
      {(showVerifiedBadge || (showVerifiedBadge !== false && isVerified && numericSize >= 32)) && (
        <span
          title="Verified Sender / Authenticated Domain"
          className="email-avatar-badge"
          style={badgeStyle}
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


