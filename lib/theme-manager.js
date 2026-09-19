'use client';

import { useState, useEffect, useCallback } from 'react';

export const THEME_MODES = {
  DARK: 'dark',
  LIGHT: 'light',
  CUSTOM: 'custom'
};

export const CUSTOM_PRESETS = [
  {
    id: 'terracotta',
    name: 'Terracotta & Slate',
    tag: 'Artisanal',
    desc: 'Artisanal warm terracotta on architectural graphite',
    accent: '#c4683c',
    accentHover: '#ad572d',
    accentGlow: 'rgba(196, 104, 60, 0.15)',
    bg: '#181b1f',
    bgPage: '#131518',
    surface: '#1d2127',
    surface2: '#242932',
    border: 'rgba(255, 255, 255, 0.08)',
    border2: 'rgba(255, 255, 255, 0.14)',
    text: '#edece8',
    muted: '#91969f',
    muted2: '#6a6f78',
    radius: '10px'
  },
  {
    id: 'forest',
    name: 'Nordic Spruce',
    tag: 'Botanical',
    desc: 'Lush muted spruce & sage on deep pine slate',
    accent: '#388e68',
    accentHover: '#2f7a59',
    accentGlow: 'rgba(56, 142, 104, 0.15)',
    bg: '#141a17',
    bgPage: '#0f1412',
    surface: '#18201c',
    surface2: '#1f2824',
    border: 'rgba(255, 255, 255, 0.08)',
    border2: 'rgba(255, 255, 255, 0.14)',
    text: '#eaf2ed',
    muted: '#8fa096',
    muted2: '#68776e',
    radius: '10px'
  },
  {
    id: 'navy',
    name: 'Archival Navy',
    tag: 'Maritime',
    desc: 'Steely maritime indigo & storm blue on dark slate',
    accent: '#467694',
    accentHover: '#3b6580',
    accentGlow: 'rgba(70, 118, 148, 0.15)',
    bg: '#14181c',
    bgPage: '#0f1316',
    surface: '#181d22',
    surface2: '#20262c',
    border: 'rgba(255, 255, 255, 0.08)',
    border2: 'rgba(255, 255, 255, 0.14)',
    text: '#e8edf0',
    muted: '#8b98a1',
    muted2: '#66737c',
    radius: '10px'
  },
  {
    id: 'amber',
    name: 'Cognac & Espresso',
    tag: 'Editorial',
    desc: 'Burnished amber ochre on roasted warm espresso',
    accent: '#b37930',
    accentHover: '#9e6927',
    accentGlow: 'rgba(179, 121, 48, 0.15)',
    bg: '#1a1815',
    bgPage: '#141210',
    surface: '#201d19',
    surface2: '#282420',
    border: 'rgba(255, 255, 255, 0.08)',
    border2: 'rgba(255, 255, 255, 0.14)',
    text: '#efece6',
    muted: '#9d978e',
    muted2: '#736e66',
    radius: '10px'
  },
  {
    id: 'paper',
    name: 'Linen & Ink',
    tag: 'Tactile',
    desc: 'Warm tactile linen paper with deep iron charcoal ink',
    accent: '#b4512b',
    accentHover: '#99401e',
    accentGlow: 'rgba(180, 81, 43, 0.12)',
    bg: '#ece9e1',
    bgPage: '#f6f5f0',
    surface: '#fcfbf7',
    surface2: '#eeebe3',
    border: 'rgba(28, 30, 33, 0.08)',
    border2: 'rgba(28, 30, 33, 0.14)',
    text: '#1b1d20',
    muted: '#5e646e',
    muted2: '#848a94',
    radius: '10px'
  }
];

export const BACKGROUND_TONES = [
  { id: 'dark-default', name: 'Graphite Slate', color: '#131518', bg: '#181b1f', surface: '#1d2127', isLight: false },
  { id: 'forest-dark',  name: 'Spruce Forest',  color: '#0f1412', bg: '#141a17', surface: '#18201c', isLight: false },
  { id: 'navy-dark',    name: 'Maritime Slate', color: '#0f1316', bg: '#14181c', surface: '#181d22', isLight: false },
  { id: 'amber-dark',   name: 'Warm Espresso',  color: '#141210', bg: '#1a1815', surface: '#201d19', isLight: false },
  { id: 'light-clean',  name: 'Archival Paper', color: '#f6f5f0', bg: '#ece9e1', surface: '#fcfbf7', isLight: true },
  { id: 'light-warm',   name: 'Warm Linen',     color: '#f5f2eb', bg: '#ebe6dc', surface: '#faf8f2', isLight: true },
  { id: 'light-slate',  name: 'Soft Stone',     color: '#f2f4f6', bg: '#e7ebef', surface: '#f8fafb', isLight: true }
];

export const ACCENT_SWATCHES = [
  { hex: '#c4683c', name: 'Terracotta' },
  { hex: '#388e68', name: 'Sage Spruce' },
  { hex: '#467694', name: 'Maritime Blue' },
  { hex: '#b37930', name: 'Warm Amber' },
  { hex: '#9d536e', name: 'Heather Rose' },
  { hex: '#5b6987', name: 'Chambray Slate' },
  { hex: '#876751', name: 'Burnished Umber' },
  { hex: '#587b7a', name: 'Mineral Teal' }
];

export const DEFAULT_THEME = {
  mode: THEME_MODES.DARK,
  preset: 'terracotta',
  customSettings: {
    accent: '#c4683c',
    accentHover: '#ad572d',
    accentGlow: 'rgba(196, 104, 60, 0.15)',
    bgToneId: 'dark-default',
    radius: '10px'
  }
};

/**
 * Convert hex to rgba helper
 */
export function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(196, 104, 60, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(196, 104, 60, ${alpha})`;
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
      return;
    }

    // Custom customized values
    const cs = themeObj.customSettings || DEFAULT_THEME.customSettings;
    const accent = cs.accent || '#c4683c';
    const accentGlow = cs.accentGlow || hexToRgba(accent, 0.15);
    const accentHover = cs.accentHover || accent;
    const toneObj = BACKGROUND_TONES.find(t => t.id === cs.bgToneId) || BACKGROUND_TONES[0];
    const isLightBg = toneObj.isLight;
    const radius = cs.radius || '10px';

    root.setAttribute('data-theme-preset', 'custom-palette');
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-hover', accentHover);
    root.style.setProperty('--accent-glow', accentGlow);
    root.style.setProperty('--bg', toneObj.bg);
    root.style.setProperty('--bg-page', toneObj.color);
    root.style.setProperty('--surface', toneObj.surface);
    root.style.setProperty('--surface2', isLightBg ? '#eeebe3' : '#242932');
    root.style.setProperty('--sidebar-bg', toneObj.surface);
    root.style.setProperty('--topbar-bg', toneObj.surface);
    root.style.setProperty('--modal-bg', isLightBg ? '#faf9f5' : '#1b1e24');
    root.style.setProperty('--mobile-nav-bg', toneObj.surface);
    root.style.setProperty('--border', isLightBg ? 'rgba(28, 30, 33, 0.08)' : 'rgba(255, 255, 255, 0.08)');
    root.style.setProperty('--border2', isLightBg ? 'rgba(28, 30, 33, 0.14)' : 'rgba(255, 255, 255, 0.14)');
    root.style.setProperty('--text', isLightBg ? '#1b1d20' : '#edece8');
    root.style.setProperty('--muted', isLightBg ? '#5e646e' : '#91969f');
    root.style.setProperty('--muted2', isLightBg ? '#848a94' : '#6a6f78');
    root.style.setProperty('--radius', radius);
    root.style.setProperty('--radius-sm', `calc(${radius} * 0.65)`);
    root.style.setProperty('--radius-lg', `calc(${radius} * 1.35)`);
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
      updateTheme({ mode: THEME_MODES.CUSTOM, preset: current.preset || 'terracotta' });
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
