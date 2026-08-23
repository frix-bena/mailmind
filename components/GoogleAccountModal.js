'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmailAvatar, { GMAIL_AVATAR_PALETTE } from '@/components/EmailAvatar';
import { extractDisplayName } from '@/lib/avatar-utils';

export default function GoogleAccountModal({
  user,
  onClose,
  onOpenCompose,
  onDisconnect,
  onUserUpdate
}) {
  const router = useRouter();
  const displayName = extractDisplayName(user?.name, user?.email);
  const firstName = displayName.split(' ')[0] || 'User';

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'photo' | 'color'
  const [photoUrl, setPhotoUrl] = useState(user?.avatar || user?.picture || user?.photoUrl || '');
  const [selectedColor, setSelectedColor] = useState(user?.avatarColor || user?.color || '');
  const [tempPhotoUrl, setTempPhotoUrl] = useState(photoUrl);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setPhotoUrl(user?.avatar || user?.picture || user?.photoUrl || '');
    setSelectedColor(user?.avatarColor || user?.color || '');
    setTempPhotoUrl(user?.avatar || user?.picture || user?.photoUrl || '');
  }, [user]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Please select an image smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (dataUrl) {
        setTempPhotoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async (newAvatar, newColor) => {
    setSaving(true);
    const updated = {
      ...(user || {}),
      avatar: newAvatar !== undefined ? newAvatar : photoUrl,
      picture: newAvatar !== undefined ? newAvatar : photoUrl,
      avatarColor: newColor !== undefined ? newColor : selectedColor,
      color: newColor !== undefined ? newColor : selectedColor,
    };

    // Update localStorage
    try {
      localStorage.setItem('mailmind_user', JSON.stringify(updated));
    } catch {}

    // Update backend config
    try {
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar: updated.avatar,
          picture: updated.picture,
          avatarColor: updated.avatarColor,
          color: updated.color,
          name: updated.name
        })
      });
    } catch {}

    if (onUserUpdate) {
      onUserUpdate(updated);
    }

    setPhotoUrl(updated.avatar);
    setSelectedColor(updated.avatarColor);
    setSaving(false);
    setSuccessMsg('Profile picture updated!');
    setTimeout(() => setSuccessMsg(''), 2500);
    setActiveTab('overview');
  };

  const handleResetToGoogle = () => {
    setTempPhotoUrl('');
    handleSaveAvatar('', selectedColor);
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        zIndex: 1000,
        backdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        animation: 'fadeIn 0.15s ease'
      }}
    >
      <div
        className="modal google-account-card"
        style={{
          maxWidth: 440,
          width: '100%',
          padding: 0,
          borderRadius: 24,
          background: 'var(--surface, #1e1e2d)',
          border: '1px solid var(--border2, #2f2f44)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.55)',
          overflow: 'hidden',
          animation: 'scaleUp 0.18s ease-out'
        }}
      >
        {/* Google Account Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--border, #2a2a3c)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted, #94a3b8)', letterSpacing: '0.2px' }}>
              Google Account
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: 18,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* User Profile Overview Body */}
        <div style={{ padding: '24px 24px 20px', textAlign: 'center' }}>
          {/* Main Large Gmail Avatar with Camera Badge */}
          <div style={{ display: 'inline-block', position: 'relative', marginBottom: 12 }}>
            <EmailAvatar
              src={photoUrl}
              email={user?.email}
              name={displayName}
              size={80}
              isUser={true}
              color={selectedColor}
              showCameraBadge={true}
              onCameraClick={() => setActiveTab(activeTab === 'photo' ? 'overview' : 'photo')}
              style={{
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                border: '2px solid rgba(255, 255, 255, 0.15)'
              }}
            />
          </div>

          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            margin: '4px 0 2px',
            fontFamily: '"Google Sans", "Product Sans", Roboto, system-ui, sans-serif'
          }}>
            Hi, {firstName}!
          </h2>

          <div style={{
            fontSize: 13.5,
            color: 'var(--muted, #94a3b8)',
            marginBottom: 16,
            fontFamily: 'monospace'
          }}>
            {user?.email}
          </div>

          {successMsg && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid var(--success)',
              color: '#86efac',
              fontSize: 12,
              padding: '6px 12px',
              borderRadius: 20,
              marginBottom: 14,
              display: 'inline-block'
            }}>
              ✅ {successMsg}
            </div>
          )}

          {/* Manage Profile Picture Pill Button */}
          <button
            onClick={() => setActiveTab(activeTab === 'overview' ? 'photo' : 'overview')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: activeTab !== 'overview' ? 'var(--surface2)' : 'transparent',
              border: '1px solid var(--border2, #3b3b54)',
              color: 'var(--text)',
              fontSize: 13,
              fontWeight: 500,
              padding: '7px 18px',
              borderRadius: 100,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: 18
            }}
          >
            <span>📷</span>
            {activeTab === 'overview' ? 'Customize Profile Picture' : 'Hide Customizer'}
          </button>

          {/* Profile Picture Customizer Panel */}
          {activeTab !== 'overview' && (
            <div style={{
              background: 'var(--surface2, #252538)',
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              textAlign: 'left',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('photo')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    background: activeTab === 'photo' ? 'var(--accent)' : 'transparent',
                    color: activeTab === 'photo' ? '#fff' : 'var(--muted)',
                    cursor: 'pointer'
                  }}
                >
                  🖼️ Photo URL / Upload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('color')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    background: activeTab === 'color' ? 'var(--accent)' : 'transparent',
                    color: activeTab === 'color' ? '#fff' : 'var(--muted)',
                    cursor: 'pointer'
                  }}
                >
                  🎨 Google Colors
                </button>
              </div>

              {activeTab === 'photo' && (
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                    Profile Photo URL or Direct Image Link:
                  </label>
                  <input
                    type="url"
                    value={tempPhotoUrl}
                    onChange={e => setTempPhotoUrl(e.target.value)}
                    placeholder="https://example.com/my-avatar.jpg"
                    style={{
                      width: '100%',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      color: 'var(--text)',
                      fontSize: 12.5,
                      marginBottom: 10,
                      boxSizing: 'border-box'
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <label
                      style={{
                        flex: 1,
                        background: 'var(--surface)',
                        border: '1px dashed var(--border2)',
                        borderRadius: 8,
                        padding: '7px 10px',
                        fontSize: 12,
                        textAlign: 'center',
                        color: 'var(--muted)',
                        cursor: 'pointer'
                      }}
                    >
                      📁 Upload Photo from Computer
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleResetToGoogle}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, padding: '5px 10px' }}
                      title="Fetch photo automatically from Google / Gravatar"
                    >
                      🔄 Auto Google Sync
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAvatar(tempPhotoUrl, selectedColor)}
                      disabled={saving}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11, padding: '5px 14px' }}
                    >
                      {saving ? 'Saving…' : 'Apply Photo'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'color' && (
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
                    Select Authentic Google Material Design Avatar Color:
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: 6,
                    marginBottom: 12
                  }}>
                    {GMAIL_AVATAR_PALETTE.map((pal) => {
                      const isSelected = (selectedColor && selectedColor.toLowerCase() === pal.hex.toLowerCase()) ||
                        (!selectedColor && !photoUrl && pal.hex === '#1a73e8');
                      return (
                        <button
                          key={pal.hex}
                          type="button"
                          onClick={() => {
                            setSelectedColor(pal.hex);
                            handleSaveAvatar('', pal.hex);
                          }}
                          title={pal.name}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: pal.hex,
                            border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.2)',
                            boxShadow: isSelected ? '0 0 0 2px var(--accent)' : 'none',
                            cursor: 'pointer',
                            transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                            transition: 'transform 0.15s ease'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Details Box */}
          <div style={{
            background: 'var(--surface2, #242436)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            border: '1px solid var(--border)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)' }}>Account Provider:</span>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#22c55e', fontSize: 11 }}>●</span>
                {user?.provider === 'gmail' || user?.provider === 'google' ? 'Google / Gmail' : (user?.provider || 'Gmail')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>AI Reply Tone:</span>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{user?.tone || 'Professional'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Monitoring Mode:</span>
              <span style={{ fontWeight: 600 }}>Permission-First</span>
            </div>
          </div>

          {/* Main Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                onClose();
                onOpenCompose && onOpenCompose();
              }}
              style={{ borderRadius: 10, padding: '9px 12px' }}
            >
              ✉️ Compose Email
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                onClose();
                router.push('/settings');
              }}
              style={{ borderRadius: 10, padding: '9px 12px' }}
            >
              ⚙️ Account Settings
            </button>
          </div>

          {/* Disconnect / Sign Out */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <button
              onClick={() => {
                onClose();
                onDisconnect && onDisconnect();
              }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger, #f87171)',
                padding: '7px 20px',
                borderRadius: 100,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Sign out / Disconnect Account
            </button>
          </div>
        </div>

        {/* Google-style Footer */}
        <div style={{
          padding: '12px 20px',
          background: 'rgba(0, 0, 0, 0.15)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          fontSize: 11,
          color: 'var(--muted)'
        }}>
          <a href="#" onClick={e => e.preventDefault()} style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
          <span>•</span>
          <a href="#" onClick={e => e.preventDefault()} style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
