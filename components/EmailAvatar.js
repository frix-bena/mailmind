'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  getAvatarSources,
  getSenderColor,
  getSenderInitial,
  extractCleanEmail
} from '@/lib/avatar-utils';

/**
 * Gmail-Style Avatar Component with Progressive Fallback Strategy
 * 
 * Strategy:
 * 1. Primary: Fetches Gravatar image via MD5 hash with d=404
 * 2. Secondary: If non-free custom domain, fetches Clearbit brand logo
 * 3. Fallback: Native Gmail-style circular initials with deterministic color
 * 
 * Features:
 * - Strict mask container with overflow-hidden and rounded-full
 * - Centered fallback initial <div> with deterministic background color
 * - Constrained absolute image layer with z-10 and object-cover
 * - Unmounts <img> on onError to eliminate broken icons and visual overlaps
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
  priority = false,
  onClick,
  ...rest
}) {
  // Normalize size to number if numeric string is passed
  const numericSize = typeof size === 'number' ? size : parseInt(size, 10) || 40;
  const fontSize = Math.max(10, Math.round(numericSize * 0.42));

  // Compute deterministic initials and color
  const initial = useMemo(() => getSenderInitial(name, email), [name, email]);
  const color = useMemo(() => getSenderColor(email || name), [email, name]);
  const cleanEmail = useMemo(() => extractCleanEmail(email), [email]);

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

  // Reset state whenever email, src, size, or candidate sources change
  useEffect(() => {
    setSourceIndex(0);
    setImageError(false);
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

  // Standard Tailwind size class for default 40px (w-10 h-10) or custom size
  const sizeClass = numericSize === 40 ? 'w-10 h-10' : `w-[${numericSize}px] h-[${numericSize}px]`;

  return (
    <div
      role="img"
      aria-label={imageAlt}
      title={tooltipText}
      onClick={onClick}
      className={`relative ${sizeClass} rounded-full overflow-hidden shrink-0 flex items-center justify-center ${className}`.trim()}
      style={{
        width: numericSize,
        height: numericSize,
        minWidth: numericSize,
        minHeight: numericSize,
        cursor: onClick ? 'pointer' : 'inherit',
        ...style,
      }}
      {...rest}
    >
      {/* 
        2. PERFECT CENTERING FOR FALLBACK INITIALS:
        The fallback <div> fills the container and centers the initial letter.
        The background color is applied directly to this layer.
      */}
      <div
        className={`w-full h-full flex items-center justify-center text-white font-semibold text-lg select-none uppercase ${color.bgClass || ''}`.trim()}
        style={{
          backgroundColor: color.hex,
          fontSize: numericSize !== 40 ? `${fontSize}px` : undefined,
        }}
      >
        {initial}
      </div>

      {/* 
        3. CONSTRAIN THE IMAGE & 4. CONDITIONAL RENDERING:
        Only rendered if src exists and has not thrown onError.
        Positioned absolute inset-0 with z-10 to sit cleanly on top of fallback without overflowing.
      */}
      {imageSrc && !imageError && (
        <img
          key={imageSrc}
          src={imageSrc}
          alt={imageAlt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={handleImageError}
          className="absolute inset-0 w-full h-full object-cover rounded-full z-10"
        />
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
  GMAIL_AVATAR_PALETTE,
  BRAND_DOMAINS,
} from '@/lib/avatar-utils';

