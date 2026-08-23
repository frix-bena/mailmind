'use client';

import React from 'react';
import EmailAvatar from '@/components/EmailAvatar';
import { extractDisplayName } from '@/lib/avatar-utils';

export default function TopbarUserButton({ user, onClick }) {
  if (!user || !user.email) return null;

  const displayName = extractDisplayName(user.name, user.email);
  const avatarSrc = user.avatar || user.picture || user.photoUrl || user.image || null;
  const avatarColor = user.avatarColor || user.color || null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="topbar-user-btn"
      title={`Google Account: ${displayName} (${user.email})`}
      aria-label={`Google Account: ${displayName}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3px',
        background: 'transparent',
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, background 0.15s ease',
        outline: 'none',
        flexShrink: 0
      }}
    >
      <EmailAvatar
        src={avatarSrc}
        email={user.email}
        name={displayName}
        size={34}
        isUser={true}
        color={avatarColor}
        showTooltip={false}
        style={{
          border: '1.5px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)'
        }}
      />
    </button>
  );
}
