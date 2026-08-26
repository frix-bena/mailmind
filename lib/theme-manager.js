'use client';

import { useState, useEffect, useCallback } from 'react';

export const THEME_MODES = {
  DARK: 'dark',
  LIGHT: 'light',
  CUSTOM: 'custom'
};

export const CUSTOM_PRESETS = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    emoji: '⚡',
    desc: 'Electric cyan & neon violet on deep midnight void',
    accent: '#00f0ff',
    accentHover: '#38bdf8',
    accentGlow: 'rgba(0, 240, 255, 0.25)',
    bg: '#070a14',
    bgPage: '#03060f',
    surface: 'rgba(12, 19, 36, 0.88)',
    surface2: 'rgba(18, 30, 56, 0.88)',
    border: 'rgba(0, 240, 255, 0.18)',
    border2: 'rgba(0, 240, 255, 0.32)',
    text: '#f0fdff',
    muted: '#7dd3fc',
    muted2: '#38bdf8',
    radius: '8px',
    meshOpacity: 0.16
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    emoji: '🌲',
    desc: 'Lush emerald green & mint on deep slate moss',
    accent: '#10b981',
    accentHover: '#34d399',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
    bg: '#061a14',
    bgPage: '#030f0b',
    surface: 'rgba(10, 34, 26, 0.88)',
    surface2: 'rgba(16, 48, 38, 0.88)',
    border: 'rgba(52, 211, 153, 0.18)',
    border2: 'rgba(52, 211, 153, 0.32)',
    text: '#f0fdf4',
    muted: '#86efac',
    muted2: '#4ade80',
    radius: '14px',
    meshOpacity: 0.15
  },
  {
    id: 'sunset',
    name: 'Sunset Rose',
    emoji: '🌅',
    desc: 'Warm coral rose & amber on deep crimson velvet',
    accent: '#f43f5e',
    accentHover: '#fb7185',
    accentGlow: 'rgba(244, 63, 94, 0.25)',
    bg: '#180b14',
    bgPage: '#10050c',
    surface: 'rgba(36, 16, 28, 0.88)',
    surface2: 'rgba(52, 24, 40, 0.88)',
    border: 'rgba(244, 63, 94, 0.18)',
    border2: 'rgba(244, 63, 94, 0.32)',
    text: '#fff1f2',
    muted: '#fda4af',
    muted2: '#fb7185',
    radius: '16px',
    meshOpacity: 0.16
  },
  {
    id: 'ocean',
    name: 'Ocean Royal',
    emoji: '🌊',
    desc: 'Royal sapphire blue & sky cyan on deep oceanic navy',
    accent: '#2563eb',
    accentHover: '#3b82f6',
    accentGlow: 'rgba(37, 99, 235, 0.25)',
    bg: '#081024',
    bgPage: '#040814',
    surface: 'rgba(14, 24, 48, 0.88)',
    surface2: 'rgba(22, 38, 72, 0.88)',
    border: 'rgba(59, 130, 246, 0.18)',
    border2: 'rgba(59, 130, 246, 0.32)',
    text: '#eff6ff',
    muted: '#93c5fd',
    muted2: '#60a5fa',
    radius: '12px',
    meshOpacity: 0.15
  },
  {
    id: 'amber',
    name: 'Solarized Amber',
    emoji: '☀️',
    desc: 'Warm golden amber on warm coffee espresso',
    accent: '#f59e0b',
    accentHover: '#fbbf24',
    accentGlow: 'rgba(245, 158, 11, 0.22)',
    bg: '#1a1610',
    bgPage: '#100e0a',
    surface: 'rgba(38, 30, 20, 0.88)',
    surface2: 'rgba(54, 42, 28, 0.88)',
    border: 'rgba(245, 158, 11, 0.18)',
    border2: 'rgba(245, 158, 11, 0.32)',
    text: '#fef3c7',
    muted: '#fcd34d',
    muted2: '#fbbf24',
    radius: '10px',
    meshOpacity: 0.15
  },
  {
    id: 'monokai',
    name: 'Obsidian Minimal',
    emoji: '🖤',
    desc: 'Pitch black OLED with sharp purple glow highlights',
    accent: '#a855f7',
    accentHover: '#c084fc',
    accentGlow: 'rgba(168, 85, 247, 0.22)',
    bg: '#000000',
    bgPage: '#000000',
    surface: 'rgba(18, 18, 18, 0.96)',
    surface2: 'rgba(28, 28, 28, 0.96)',
    border: 'rgba(255, 255, 255, 0.12)',
    border2: 'rgba(255, 255, 255, 0.22)',
    text: '#ffffff',
    muted: '#a1a1aa',
    muted2: '#71717a',
    radius: '6px',
    meshOpacity: 0.08
  }
];

export const BACKGROUND_TONES = [
  { id: 'dark-default', name: 'Dark Indigo', color: '#090a10', bg: '#0f0f13', surface: 'rgba(22, 22, 34, 0.82)', isLight: false },
  { id: 'deep-void',    name: 'Midnight Void', color: '#03050c', bg: '#070a14', surface: 'rgba(12, 19, 36, 0.88)', isLight: false },
  { id: 'pitch-black',  name: 'Pitch Black', color: '#000000', bg: '#000000', surface: 'rgba(18, 18, 18, 0.95)', isLight: false },
  { id: 'forest-dark',  name: 'Forest Slate', color: '#030f0b', bg: '#061a14', surface: 'rgba(10, 34, 26, 0.88)', isLight: false },
  { id: 'warm-espresso',name: 'Warm Espresso', color: '#100e0a', bg: '#1a1610', surface: 'rgba(38, 30, 20, 0.88)', isLight: false },
  { id: 'light-clean',  name: 'Crisp White', color: '#f3f4f9', bg: '#ffffff', surface: 'rgba(255, 255, 255, 0.92)', isLight: true },
  { id: 'light-slate',  name: 'Soft Slate', color: '#eef2f6', bg: '#f8fafc', surface: 'rgba(255, 255, 255, 0.92)', isLight: true },
  { id: 'light-warm',   name: 'Warm Sand', color: '#faf6f0', bg: '#fffdf9', surface: 'rgba(255, 255, 255, 0.92)', isLight: true }
];

export const ACCENT_SWATCHES = [
  { hex: '#6c63ff', name: 'MailMind Purple' },
  { hex: '#3b82f6', name: 'Royal Blue' },
  { hex: '#00f0ff', name: 'Neon Cyan' },
  { hex: '#10b981', name: 'Emerald Green' },
  { hex: '#f43f5e', name: 'Rose Red' },
  { hex: '#f59e0b', name: 'Amber Gold' },
  { hex: '#a855f7', name: 'Vibrant Violet' },
  { hex: '#ec4899', name: 'Neon Pink' },
  { hex: '#06b6d4', name: 'Ocean Teal' },
  { hex: '#8b5cf6', name: 'Deep Indigo' }
];

export const DEFAULT_THEME = {
  mode: THEME_MODES.DARK, // 'dark' | 'light' | 'custom'
  preset: 'dark',
  customSettings: {
    accent: '#6c63ff',
    accentHover: '#7b74ff',
    accentGlow: 'rgba(108, 99, 255, 0.22)',
    bgToneId: 'dark-default',
    radius: '12px',
    surfaceStyle: 'glass'
  }
};

/**
 * Convert hex to rgba helper
 */
export function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(108, 99, 255, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(108, 99, 255, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get stored theme config from localStorage safely
 */
export function getStoredTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem('mailmind_theme');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_THEME,
        ...parsed,
        customSettings: {
          ...DEFAULT_THEME.customSettings,
          ...(parsed.customSettings || {})
        }
      };
    }
  } catch (err) {
    console.warn('Failed to parse stored theme:', err);
  }
  return DEFAULT_THEME;
}

/**
 * Apply theme to document.documentElement (CSS attributes & custom properties)
 */
export function applyTheme(themeObj) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const mode = themeObj?.mode || THEME_MODES.DARK;

  root.setAttribute('data-theme', mode);

  if (mode === THEME_MODES.DARK) {
    root.removeAttribute('data-theme-preset');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-hover');
    root.style.removeProperty('--accent-glow');
    root.style.removeProperty('--bg');
    root.style.removeProperty('--bg-page');
    root.style.removeProperty('--surface');
    root.style.removeProperty('--surface2');
    root.style.removeProperty('--sidebar-bg');
    root.style.removeProperty('--topbar-bg');
    root.style.removeProperty('--modal-bg');
    root.style.removeProperty('--mobile-nav-bg');
    root.style.removeProperty('--border');
    root.style.removeProperty('--border2');
    root.style.removeProperty('--text');
    root.style.removeProperty('--muted');
    root.style.removeProperty('--muted2');
    root.style.removeProperty('--radius');
    root.style.removeProperty('--radius-sm');
    root.style.removeProperty('--radius-lg');
    root.style.removeProperty('--mesh-opacity');
    root.style.removeProperty('--dot-color');
    return;
  }

  if (mode === THEME_MODES.LIGHT) {
    root.removeAttribute('data-theme-preset');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-hover');
    root.style.removeProperty('--accent-glow');
    root.style.removeProperty('--bg');
    root.style.removeProperty('--bg-page');
    root.style.removeProperty('--surface');
    root.style.removeProperty('--surface2');
    root.style.removeProperty('--sidebar-bg');
    root.style.removeProperty('--topbar-bg');
    root.style.removeProperty('--modal-bg');
    root.style.removeProperty('--mobile-nav-bg');
    root.style.removeProperty('--border');
    root.style.removeProperty('--border2');
    root.style.removeProperty('--text');
    root.style.removeProperty('--muted');
    root.style.removeProperty('--muted2');
    root.style.removeProperty('--radius');
    root.style.removeProperty('--radius-sm');
    root.style.removeProperty('--radius-lg');
    root.style.removeProperty('--mesh-opacity');
    root.style.removeProperty('--dot-color');
    return;
  }

  if (mode === THEME_MODES.CUSTOM) {
    const presetId = themeObj?.preset;
    const matchedPreset = CUSTOM_PRESETS.find(p => p.id === presetId);

    if (matchedPreset && (!themeObj.customSettings || themeObj.customSettings._usePresetValues)) {
      root.setAttribute('data-theme-preset', presetId);
      root.style.setProperty('--accent', matchedPreset.accent);
      root.style.setProperty('--accent-hover', matchedPreset.accentHover);
      root.style.setProperty('--accent-glow', matchedPreset.accentGlow);
      root.style.setProperty('--bg', matchedPreset.bg);
      root.style.setProperty('--bg-page', matchedPreset.bgPage);
      root.style.setProperty('--surface', matchedPreset.surface);
      root.style.setProperty('--surface2', matchedPreset.surface2);
      root.style.setProperty('--sidebar-bg', matchedPreset.surface);
      root.style.setProperty('--topbar-bg', matchedPreset.surface);
      root.style.setProperty('--modal-bg', matchedPreset.surface);
      root.style.setProperty('--mobile-nav-bg', matchedPreset.surface);
      root.style.setProperty('--border', matchedPreset.border);
      root.style.setProperty('--border2', matchedPreset.border2);
      root.style.setProperty('--text', matchedPreset.text);
      root.style.setProperty('--muted', matchedPreset.muted);
      root.style.setProperty('--muted2', matchedPreset.muted2);
      root.style.setProperty('--radius', matchedPreset.radius);
      root.style.setProperty('--radius-sm', `calc(${matchedPreset.radius} * 0.65)`);
      root.style.setProperty('--radius-lg', `calc(${matchedPreset.radius} * 1.35)`);
      root.style.setProperty('--mesh-opacity', String(matchedPreset.meshOpacity || 0.14));
      root.style.setProperty('--dot-color', hexToRgba(matchedPreset.accent, 0.04));
      return;
    }

    // Custom customized values
    const cs = themeObj.customSettings || DEFAULT_THEME.customSettings;
    const accent = cs.accent || '#6c63ff';
    const accentGlow = cs.accentGlow || hexToRgba(accent, 0.22);
    const accentHover = cs.accentHover || accent;
    const toneObj = BACKGROUND_TONES.find(t => t.id === cs.bgToneId) || BACKGROUND_TONES[0];
    const isLightBg = toneObj.isLight;
    const radius = cs.radius || '12px';

    root.setAttribute('data-theme-preset', 'custom-palette');
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-hover', accentHover);
    root.style.setProperty('--accent-glow', accentGlow);
    root.style.setProperty('--bg', toneObj.bg);
    root.style.setProperty('--bg-page', toneObj.color);
    root.style.setProperty('--surface', toneObj.surface);
    root.style.setProperty('--surface2', isLightBg ? 'rgba(243, 244, 250, 0.95)' : 'rgba(32, 32, 50, 0.82)');
    root.style.setProperty('--sidebar-bg', toneObj.surface);
    root.style.setProperty('--topbar-bg', toneObj.surface);
    root.style.setProperty('--modal-bg', isLightBg ? 'rgba(255, 255, 255, 0.98)' : 'rgba(22, 24, 38, 0.96)');
    root.style.setProperty('--mobile-nav-bg', toneObj.surface);
    root.style.setProperty('--border', isLightBg ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--border2', isLightBg ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.18)');
    root.style.setProperty('--text', isLightBg ? '#0f172a' : '#f1f1f5');
    root.style.setProperty('--muted', isLightBg ? '#64748b' : '#9b9bb8');
    root.style.setProperty('--muted2', isLightBg ? '#94a3b8' : '#686888');
    root.style.setProperty('--radius', radius);
    root.style.setProperty('--radius-sm', `calc(${radius} * 0.65)`);
    root.style.setProperty('--radius-lg', `calc(${radius} * 1.35)`);
    root.style.setProperty('--mesh-opacity', isLightBg ? '0.08' : '0.12');
    root.style.setProperty('--dot-color', isLightBg ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)');
  }
}

/**
 * Save theme config and notify listeners
 */
export function saveTheme(themeObj) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('mailmind_theme', JSON.stringify(themeObj));
  } catch (err) {
    console.warn('Failed to save theme to localStorage:', err);
  }
  applyTheme(themeObj);
  window.dispatchEvent(new CustomEvent('mailmind:theme-changed', { detail: themeObj }));
}

/**
 * Hook for React components to observe and change theme reactively
 */
export function useTheme() {
  const [theme, setThemeState] = useState(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = getStoredTheme();
    setThemeState(current);
    applyTheme(current);
    setMounted(true);

    const handleThemeChange = (e) => {
      if (e.detail) {
        setThemeState(e.detail);
      }
    };

    window.addEventListener('mailmind:theme-changed', handleThemeChange);
    return () => window.removeEventListener('mailmind:theme-changed', handleThemeChange);
  }, []);

  const updateTheme = useCallback((newTheme) => {
    const current = getStoredTheme();
    const merged = {
      ...current,
      ...newTheme,
      customSettings: {
        ...(current.customSettings || DEFAULT_THEME.customSettings),
        ...(newTheme.customSettings || {})
      }
    };
    setThemeState(merged);
    saveTheme(merged);
  }, []);

  const setMode = useCallback((mode) => {
    updateTheme({ mode });
  }, [updateTheme]);

  const setPreset = useCallback((presetId) => {
    const current = getStoredTheme();
    updateTheme({
      mode: THEME_MODES.CUSTOM,
      preset: presetId,
      customSettings: {
        ...(current.customSettings || DEFAULT_THEME.customSettings),
        _usePresetValues: true
      }
    });
  }, [updateTheme]);

  const toggleNextMode = useCallback(() => {
    const current = getStoredTheme();
    if (current.mode === THEME_MODES.DARK) {
      updateTheme({ mode: THEME_MODES.LIGHT });
    } else if (current.mode === THEME_MODES.LIGHT) {
      updateTheme({ mode: THEME_MODES.CUSTOM, preset: current.preset || 'cyberpunk' });
    } else {
      updateTheme({ mode: THEME_MODES.DARK });
    }
  }, [updateTheme]);

  return {
    theme,
    mode: theme.mode,
    preset: theme.preset,
    customSettings: theme.customSettings,
    mounted,
    setMode,
    setPreset,
    updateTheme,
    toggleNextMode
  };
}
