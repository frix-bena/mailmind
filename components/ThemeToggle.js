'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, THEME_MODES, CUSTOM_PRESETS } from '@/lib/theme-manager';

export default function ThemeToggle({ showLabel = false, style = {} }) {
  const router = useRouter();
  const { theme, mode, preset, setMode, setPreset, toggleNextMode } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  const getModeInfo = () => {
    if (mode === THEME_MODES.LIGHT) {
      return { icon: '☀️', label: 'Light', title: 'Theme: Light mode' };
    }
    if (mode === THEME_MODES.CUSTOM) {
      const p = CUSTOM_PRESETS.find(x => x.id === preset);
      return {
        icon: p ? p.emoji : '🎨',
        label: p ? p.name.split(' ')[0] : 'Custom',
        title: `Theme: Custom (${p ? p.name : 'Custom Palette'})`
      };
    }
    return { icon: '🌙', label: 'Dark', title: 'Theme: Dark mode' };
  };

  const info = getModeInfo();

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', ...style }}>
      <button
        type="button"
        onClick={() => setDropdownOpen(o => !o)}
        className="chip"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          fontSize: 12.5,
          fontWeight: 600,
          background: 'var(--surface2)',
          border: '1px solid var(--border2)',
          color: 'var(--text)',
          borderRadius: 20,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none'
        }}
        title={`${info.title} (Click to switch theme)`}
        aria-label={`Current theme: ${info.label}. Click to switch theme`}
      >
        <span style={{ fontSize: 14 }}>{info.icon}</span>
        {showLabel && <span style={{ textTransform: 'capitalize' }}>{info.label}</span>}
        <span style={{ fontSize: 10, opacity: 0.65, marginLeft: -2 }}>▾</span>
      </button>

      {dropdownOpen && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)',
            padding: 12,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            minWidth: 230,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginBottom: 8,
            padding: '0 4px'
          }}>
            Appearance & Theme
          </div>

          {/* 3 Main Modes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => {
                setMode(THEME_MODES.DARK);
                setDropdownOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 8,
                background: mode === THEME_MODES.DARK ? 'var(--accent-glow)' : 'transparent',
                border: `1px solid ${mode === THEME_MODES.DARK ? 'var(--accent)' : 'transparent'}`,
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🌙</span> Dark Mode
              </span>
              {mode === THEME_MODES.DARK && <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(THEME_MODES.LIGHT);
                setDropdownOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 8,
                background: mode === THEME_MODES.LIGHT ? 'var(--accent-glow)' : 'transparent',
                border: `1px solid ${mode === THEME_MODES.LIGHT ? 'var(--accent)' : 'transparent'}`,
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>☀️</span> Light Mode
              </span>
              {mode === THEME_MODES.LIGHT && <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(THEME_MODES.CUSTOM);
                setDropdownOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 8,
                background: mode === THEME_MODES.CUSTOM ? 'var(--accent-glow)' : 'transparent',
                border: `1px solid ${mode === THEME_MODES.CUSTOM ? 'var(--accent)' : 'transparent'}`,
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🎨</span> Custom Theme
              </span>
              {mode === THEME_MODES.CUSTOM && <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓</span>}
            </button>
          </div>

          {/* Quick Presets Grid */}
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 8,
            marginBottom: 8
          }}>
            <div style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 6,
              padding: '0 4px'
            }}>
              Custom Presets
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {CUSTOM_PRESETS.map((p) => {
                const isActive = mode === THEME_MODES.CUSTOM && preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPreset(p.id);
                      setDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: isActive ? 'var(--accent-glow)' : 'var(--surface2)',
                      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                      color: 'var(--text)',
                      fontSize: 11.5,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{p.emoji}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Customizer Link in Settings */}
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              router.push('/settings#theme-settings');
            }}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: '6px 4px 2px',
              color: 'var(--accent)',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            ⚙️ Customize Palette in Settings &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
