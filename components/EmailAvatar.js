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
 * - Flicker-free progressive loading (initials shown instantly while image loads)
 * - Zero broken image icons (onError triggers next source or initials)
 * - Fully styled with Tailwind CSS + resilient inline styles
 * - Deterministic color mapping (same sender always has same color)
 * 
 * @param {Object} props
 * @param {string} props.email - The sender's email address
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

  // Compute prioritized image sources (Gravatar -> Clearbit)
  const sources = useMemo(
    () => getAvatarSources(cleanEmail, numericSize, allowClearbit),
    [cleanEmail, numericSize, allowClearbit]
  );

  const [sourceIndex, setSourceIndex] = useState(0);
  const [imageStatus, setImageStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'

  // Reset state whenever email, size, or candidate sources change
  useEffect(() => {
    setSourceIndex(0);
    setImageStatus(sources.length > 0 ? 'loading' : 'error');
  }, [cleanEmail, sources.length]);

  const currentSource = sources[sourceIndex] || null;
  const hasImageCandidate = currentSource && imageStatus !== 'error';

  const handleImageLoad = () => {
    setImageStatus('loaded');
  };

  const handleImageError = () => {
    // If there's another fallback source (e.g. Clearbit after Gravatar 404), advance to it
    if (sourceIndex + 1 < sources.length) {
      setSourceIndex(prev => prev + 1);
      setImageStatus('loading');
    } else {
      setImageStatus('error');
    }
  };

  const displayName = name || (cleanEmail ? cleanEmail.split('@')[0] : 'User');
  const tooltipText = showTooltip ? (name && cleanEmail ? `${name} <${cleanEmail}>` : displayName) : undefined;
  const imageAlt = alt || `${displayName}'s avatar`;

  return (
    <div
      role="img"
      aria-label={imageAlt}
      title={tooltipText}
      onClick={onClick}
      className={`
        relative inline-flex items-center justify-center flex-shrink-0
        rounded-full select-none overflow-hidden font-semibold text-white
        ${color.bgClass}
        ${className}
      `.trim()}
      style={{
        width: numericSize,
        height: numericSize,
        minWidth: numericSize,
        minHeight: numericSize,
        fontSize: `${fontSize}px`,
        backgroundColor: color.hex,
        borderRadius: '50%',
        lineHeight: 1,
        cursor: onClick ? 'pointer' : 'inherit',
        ...style,
      }}
      {...rest}
    >
      {/* 
        GMAIL-STYLE INITIALS (Crucial Fallback + Instant Placeholder):
        Rendered immediately so there is zero UI flicker or layout jump 
        while Gravatar / Clearbit image is loading in the background.
      */}
      <span
        aria-hidden="true"
        className="uppercase pointer-events-none select-none"
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 600,
          color: '#ffffff',
          userSelect: 'none',
        }}
      >
        {initial}
      </span>

      {/* 
        PROGRESSIVE IMAGE (Gravatar -> Clearbit):
        Layered on top with smooth opacity fade-in.
        If loading fails (404), onError advances to next source or stays on initials.
      */}
      {hasImageCandidate && (
        <img
          key={currentSource.url}
          src={currentSource.url}
          alt={imageAlt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`
            absolute inset-0 w-full h-full object-cover rounded-full
            transition-opacity duration-200 ease-in-out
            ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}
          `.trim()}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            opacity: imageStatus === 'loaded' ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
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

