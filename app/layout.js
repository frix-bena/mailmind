import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0f0f13',
  colorScheme: 'dark',
  interactiveWidget: 'resizes-visual',
};

export const metadata = {
  metadataBase: new URL('https://autoscroll-chi.vercel.app'),
  title: 'MailMind — AI Email Assistant',
  description: 'Your AI-powered inbox assistant. Read, classify, and reply to emails with permission-based AI drafts.',
  keywords: 'email assistant, AI email, inbox management, smart replies',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MailMind',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'MailMind — AI Email Assistant',
    description: 'Your AI-powered inbox assistant. Read, classify, and reply to emails with permission-based AI drafts.',
    url: 'https://autoscroll-chi.vercel.app',
    siteName: 'MailMind',
    type: 'website',
  },
  alternates: {
    canonical: 'https://autoscroll-chi.vercel.app',
  },
};

export default function RootLayout({ children }) {
  const themeInitScript = `(function() {
    try {
      var raw = localStorage.getItem('mailmind_theme');
      if (!raw) return;
      var t = JSON.parse(raw);
      if (!t) return;
      var root = document.documentElement;
      var mode = t.mode || 'dark';
      root.setAttribute('data-theme', mode);
      if (mode === 'custom') {
        var presets = {
          cyberpunk: { accent: '#00f0ff', accentHover: '#38bdf8', accentGlow: 'rgba(0, 240, 255, 0.25)', bg: '#070a14', bgPage: '#03060f', surface: 'rgba(12, 19, 36, 0.88)', surface2: 'rgba(18, 30, 56, 0.88)', border: 'rgba(0, 240, 255, 0.18)', border2: 'rgba(0, 240, 255, 0.32)', text: '#f0fdff', muted: '#7dd3fc', muted2: '#38bdf8', radius: '8px' },
          emerald: { accent: '#10b981', accentHover: '#34d399', accentGlow: 'rgba(16, 185, 129, 0.25)', bg: '#061a14', bgPage: '#030f0b', surface: 'rgba(10, 34, 26, 0.88)', surface2: 'rgba(16, 48, 38, 0.88)', border: 'rgba(52, 211, 153, 0.18)', border2: 'rgba(52, 211, 153, 0.32)', text: '#f0fdf4', muted: '#86efac', muted2: '#4ade80', radius: '14px' },
          sunset: { accent: '#f43f5e', accentHover: '#fb7185', accentGlow: 'rgba(244, 63, 94, 0.25)', bg: '#180b14', bgPage: '#10050c', surface: 'rgba(36, 16, 28, 0.88)', surface2: 'rgba(52, 24, 40, 0.88)', border: 'rgba(244, 63, 94, 0.18)', border2: 'rgba(244, 63, 94, 0.32)', text: '#fff1f2', muted: '#fda4af', muted2: '#fb7185', radius: '16px' },
          ocean: { accent: '#2563eb', accentHover: '#3b82f6', accentGlow: 'rgba(37, 99, 235, 0.25)', bg: '#081024', bgPage: '#040814', surface: 'rgba(14, 24, 48, 0.88)', surface2: 'rgba(22, 38, 72, 0.88)', border: 'rgba(59, 130, 246, 0.18)', border2: 'rgba(59, 130, 246, 0.32)', text: '#eff6ff', muted: '#93c5fd', muted2: '#60a5fa', radius: '12px' },
          amber: { accent: '#f59e0b', accentHover: '#fbbf24', accentGlow: 'rgba(245, 158, 11, 0.22)', bg: '#1a1610', bgPage: '#100e0a', surface: 'rgba(38, 30, 20, 0.88)', surface2: 'rgba(54, 42, 28, 0.88)', border: 'rgba(245, 158, 11, 0.18)', border2: 'rgba(245, 158, 11, 0.32)', text: '#fef3c7', muted: '#fcd34d', muted2: '#fbbf24', radius: '10px' },
          monokai: { accent: '#a855f7', accentHover: '#c084fc', accentGlow: 'rgba(168, 85, 247, 0.22)', bg: '#000000', bgPage: '#000000', surface: 'rgba(18, 18, 18, 0.96)', surface2: 'rgba(28, 28, 28, 0.96)', border: 'rgba(255, 255, 255, 0.12)', border2: 'rgba(255, 255, 255, 0.22)', text: '#ffffff', muted: '#a1a1aa', muted2: '#71717a', radius: '6px' }
        };
        var p = presets[t.preset];
        if (p && (!t.customSettings || t.customSettings._usePresetValues)) {
          root.setAttribute('data-theme-preset', t.preset);
          for (var k in p) {
            if (k === 'bgPage') root.style.setProperty('--bg-page', p[k]);
            else if (k === 'accentHover') root.style.setProperty('--accent-hover', p[k]);
            else if (k === 'accentGlow') root.style.setProperty('--accent-glow', p[k]);
            else if (k === 'surface') { root.style.setProperty('--surface', p[k]); root.style.setProperty('--sidebar-bg', p[k]); root.style.setProperty('--topbar-bg', p[k]); root.style.setProperty('--modal-bg', p[k]); root.style.setProperty('--mobile-nav-bg', p[k]); }
            else if (k === 'radius') { root.style.setProperty('--radius', p[k]); root.style.setProperty('--radius-sm', 'calc(' + p[k] + ' * 0.65)'); root.style.setProperty('--radius-lg', 'calc(' + p[k] + ' * 1.35)'); }
            else root.style.setProperty('--' + k, p[k]);
          }
        } else if (t.customSettings) {
          var cs = t.customSettings;
          var tones = {
            'dark-default': { color: '#090a10', bg: '#0f0f13', surface: 'rgba(22, 22, 34, 0.82)', isLight: false },
            'deep-void': { color: '#03050c', bg: '#070a14', surface: 'rgba(12, 19, 36, 0.88)', isLight: false },
            'pitch-black': { color: '#000000', bg: '#000000', surface: 'rgba(18, 18, 18, 0.95)', isLight: false },
            'forest-dark': { color: '#030f0b', bg: '#061a14', surface: 'rgba(10, 34, 26, 0.88)', isLight: false },
            'warm-espresso': { color: '#100e0a', bg: '#1a1610', surface: 'rgba(38, 30, 20, 0.88)', isLight: false },
            'light-clean': { color: '#f3f4f9', bg: '#ffffff', surface: 'rgba(255, 255, 255, 0.92)', isLight: true },
            'light-slate': { color: '#eef2f6', bg: '#f8fafc', surface: 'rgba(255, 255, 255, 0.92)', isLight: true },
            'light-warm': { color: '#faf6f0', bg: '#fffdf9', surface: 'rgba(255, 255, 255, 0.92)', isLight: true }
          };
          var tone = tones[cs.bgToneId] || tones['dark-default'];
          root.setAttribute('data-theme-preset', 'custom-palette');
          root.style.setProperty('--accent', cs.accent || '#6c63ff');
          root.style.setProperty('--accent-hover', cs.accentHover || cs.accent || '#7b74ff');
          root.style.setProperty('--accent-glow', cs.accentGlow || 'rgba(108, 99, 255, 0.22)');
          root.style.setProperty('--bg', tone.bg);
          root.style.setProperty('--bg-page', tone.color);
          root.style.setProperty('--surface', tone.surface);
          root.style.setProperty('--sidebar-bg', tone.surface);
          root.style.setProperty('--topbar-bg', tone.surface);
          root.style.setProperty('--modal-bg', tone.isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(22, 24, 38, 0.96)');
          root.style.setProperty('--mobile-nav-bg', tone.surface);
          root.style.setProperty('--surface2', tone.isLight ? 'rgba(243, 244, 250, 0.95)' : 'rgba(32, 32, 50, 0.82)');
          root.style.setProperty('--border', tone.isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)');
          root.style.setProperty('--border2', tone.isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.18)');
          root.style.setProperty('--text', tone.isLight ? '#0f172a' : '#f1f1f5');
          root.style.setProperty('--muted', tone.isLight ? '#64748b' : '#9b9bb8');
          root.style.setProperty('--muted2', tone.isLight ? '#94a3b8' : '#686888');
          if (cs.radius) {
            root.style.setProperty('--radius', cs.radius);
            root.style.setProperty('--radius-sm', 'calc(' + cs.radius + ' * 0.65)');
            root.style.setProperty('--radius-lg', 'calc(' + cs.radius + ' * 1.35)');
          }
        }
      }
    } catch (e) {}
  })();`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  );
}
