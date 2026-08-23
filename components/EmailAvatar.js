'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  getAvatarSources,
  getSenderColor,
  getSenderInitial,
  extractCleanEmail,
  isVerifiedSender,
  extractDomain,
  BRAND_DOMAINS,
  BRAND_ICONS,
  getGoogleFaviconUrl
} from '@/lib/avatar-utils';

/**
 * Gmail-Style Avatar Component with Progressive Fallback Strategy & Verified Badges
 * 
 * Strategy:
 * 1. Primary: Direct high-res Vector Brand SVG / Google S2 Favicon CDN
 * 2. Secondary: Real Google Profile / Unavatar / Gravatar
 * 3. Fallback: Native Gmail-style circular initials with deterministic Material color
 * 
 * Sizing & Layout Guarantee:
 * - Strict circular geometry (aspect-ratio 1:1, border-radius 50%, overflow hidden)
 * - Brand logos styled with clean containment on crisp contrast background matching real Gmail
 * - Personal profile photos fill circle with object-cover
 * - Typography and initials render with Google Sans / Roboto medium weight
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
  color: customColor,
  isUser = false,
  ring = false,
  showCameraBadge = false,
  onCameraClick,
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
  const fontSize = Math.max(10, Math.round(numericSize * 0.46));

  // Compute deterministic initials, domain, color, and verification
  const initial = useMemo(() => getSenderInitial(name, email), [name, email]);
  const color = useMemo(() => getSenderColor(email || name, customColor), [email, name, customColor]);
  const cleanEmail = useMemo(() => extractCleanEmail(email), [email]);
  const domain = useMemo(() => extractDomain(cleanEmail), [cleanEmail]);
  const isVerified = useMemo(() => isVerifiedSender(cleanEmail, domain), [cleanEmail, domain]);

  // Compute prioritized image sources (Direct src, Google Profile, Gravatar, Brand SVG, Clearbit)
  const sources = useMemo(
    () => {
      const list = [];
      if (src) list.push({ type: 'custom', url: src, isBrand: false });
      const fallbackList = getAvatarSources(cleanEmail, numericSize, allowClearbit, isUser);
      return [...list, ...fallbackList];
    },
    [src, cleanEmail, numericSize, allowClearbit, isUser]
  );

  const [sourceIndex, setSourceIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset state whenever email, src, size, or candidate sources change
  useEffect(() => {
    setSourceIndex(0);
    setImageError(false);
    setImageLoaded(false);
  }, [src, cleanEmail, numericSize, allowClearbit, isUser]);

  const currentSource = sources[sourceIndex] || null;
  const imageSrc = currentSource ? currentSource.url : null;
  const isBrandIcon = !isUser && (currentSource?.isBrand || (currentSource?.type === 'brand_svg' || currentSource?.type === 'google_fav'));

  const handleImageError = () => {
    // If there's another fallback source in the cascade, advance to it
    if (sourceIndex + 1 < sources.length) {
      setSourceIndex(prev => prev + 1);
      setImageLoaded(false);
    } else {
      // Completely unmount <img> and fall back to initials
      setImageError(true);
    }
  };

  const displayName = name || (cleanEmail ? cleanEmail.split('@')[0] : 'User');
  const tooltipText = showTooltip ? (name && cleanEmail ? `${name} <${cleanEmail}>` : displayName) : undefined;
  const imageAlt = alt || `${displayName}'s avatar`;

  const badgeSize = Math.max(13, Math.round(numericSize * 0.34));
  const cameraBadgeSize = Math.max(18, Math.round(numericSize * 0.36));

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
    outline: ring ? '2px solid var(--accent, #6c63ff)' : 'none',
    outlineOffset: '2px',
    ...style
  };

  // Inner circular mask style ensuring crisp circular containment & Gmail color
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
    background: imageLoaded && isBrandIcon
      ? '#ffffff'
      : (color.hex || color.gradient || '#1a73e8'),
    userSelect: 'none',
    boxShadow: imageLoaded && isBrandIcon
      ? 'inset 0 0 0 1px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.15)'
      : 'inset 0 0 0 1px rgba(255, 255, 255, 0.15), 0 1px 3px rgba(0, 0, 0, 0.25)'
  };

  // Centered initials text style matching Gmail's clean Google Sans / Roboto typography
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

  // Image style guaranteeing proper containment for brand marks and cover for personal photos
  const imageStyle = isBrandIcon
    ? {
        position: 'absolute',
        top: '16%',
        left: '16%',
        width: '68%',
        height: '68%',
        maxWidth: '68%',
        maxHeight: '68%',
        objectFit: 'contain',
        objectPosition: 'center',
        display: 'block',
        opacity: imageLoaded ? 1 : 0,
        transition: 'opacity 0.15s ease-in-out',
        zIndex: 1,
        boxSizing: 'border-box'
      }
    : {
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

  // Verified BIMI checkmark badge overlay style matching Gmail's official blue seal
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
    background: '#1a73e8',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid var(--surface, #1a1a24)',
    zIndex: 2,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.45)',
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
          2. CONSTRAINED IMAGE LAYER:
          Rendered over the base layer, perfectly fitted using object-fit contain/cover.
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
        3. GMAIL VERIFIED BADGE OVERLAY:
        Rendered outside the clipped circle to maintain badge visibility without clipping.
      */}
      {!showCameraBadge && (showVerifiedBadge || (showVerifiedBadge !== false && isVerified && numericSize >= 30)) && (
        <span
          title="Verified Sender — Google verified domain (BIMI / DMARC Authenticated)"
          className="email-avatar-badge"
          style={badgeStyle}
        >
          <svg
            viewBox="0 0 24 24"
            width="75%"
            height="75%"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: 'block' }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}

      {/*
        4. GOOGLE ACCOUNT CAMERA / EDIT BADGE:
        Rendered on user avatar when editing/managing profile picture in Google Account modal or Settings.
      */}
      {showCameraBadge && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            if (onCameraClick) onCameraClick();
          }}
          title="Change profile picture"
          aria-label="Change profile picture"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: `${cameraBadgeSize}px`,
            height: `${cameraBadgeSize}px`,
            minWidth: `${cameraBadgeSize}px`,
            minHeight: `${cameraBadgeSize}px`,
            borderRadius: '50%',
            background: 'var(--surface2, #242436)',
            color: 'var(--text, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--surface, #151520)',
            cursor: 'pointer',
            padding: 0,
            zIndex: 3,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
            transition: 'transform 0.15s ease, background 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.background = 'var(--accent, #6c63ff)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--surface2, #242436)'; }}
        >
          <svg
            viewBox="0 0 24 24"
            width="60%"
            height="60%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
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
  getGoogleFaviconUrl,
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
  BRAND_ICONS,
} from '@/lib/avatar-utils';



