import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#131518',
  colorScheme: 'dark light',
  interactiveWidget: 'resizes-visual',
};

export const metadata = {
  metadataBase: new URL('https://autoscroll-chi.vercel.app'),
  title: 'MailMind: Intelligent Email Assistant',
  description: 'Your thoughtful inbox companion. Read, classify, and reply to messages with permission-first drafts.',
  keywords: 'email assistant, inbox intelligence, message classification, intentional design',
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
    title: 'MailMind: Intelligent Email Assistant',
    description: 'Your thoughtful inbox companion. Read, classify, and reply to messages with permission-first drafts.',
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
          terracotta: { accent: '#c4683c', accentHover: '#ad572d', accentGlow: 'rgba(196, 104, 60, 0.15)', bg: '#181b1f', bgPage: '#131518', surface: '#1d2127', surface2: '#242932', border: 'rgba(255, 255, 255, 0.08)', border2: 'rgba(255, 255, 255, 0.14)', text: '#edece8', muted: '#91969f', muted2: '#6a6f78', radius: '10px' },
          forest: { accent: '#388e68', accentHover: '#2f7a59', accentGlow: 'rgba(56, 142, 104, 0.15)', bg: '#141a17', bgPage: '#0f1412', surface: '#18201c', surface2: '#1f2824', border: 'rgba(255, 255, 255, 0.08)', border2: 'rgba(255, 255, 255, 0.14)', text: '#eaf2ed', muted: '#8fa096', muted2: '#68776e', radius: '10px' },
          navy: { accent: '#467694', accentHover: '#3b6580', accentGlow: 'rgba(70, 118, 148, 0.15)', bg: '#14181c', bgPage: '#0f1316', surface: '#181d22', surface2: '#20262c', border: 'rgba(255, 255, 255, 0.08)', border2: 'rgba(255, 255, 255, 0.14)', text: '#e8edf0', muted: '#8b98a1', muted2: '#66737c', radius: '10px' },
          amber: { accent: '#b37930', accentHover: '#9e6927', accentGlow: 'rgba(179, 121, 48, 0.15)', bg: '#1a1815', bgPage: '#141210', surface: '#201d19', surface2: '#282420', border: 'rgba(255, 255, 255, 0.08)', border2: 'rgba(255, 255, 255, 0.14)', text: '#efece6', muted: '#9d978e', muted2: '#736e66', radius: '10px' },
          paper: { accent: '#b4512b', accentHover: '#99401e', accentGlow: 'rgba(180, 81, 43, 0.12)', bg: '#ece9e1', bgPage: '#f6f5f0', surface: '#fcfbf7', surface2: '#eeebe3', border: 'rgba(28, 30, 33, 0.08)', border2: 'rgba(28, 30, 33, 0.14)', text: '#1b1d20', muted: '#5e646e', muted2: '#848a94', radius: '10px' }
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
            'dark-default': { color: '#131518', bg: '#181b1f', surface: '#1d2127', isLight: false },
            'forest-dark': { color: '#0f1412', bg: '#141a17', surface: '#18201c', isLight: false },
            'navy-dark': { color: '#0f1316', bg: '#14181c', surface: '#181d22', isLight: false },
            'amber-dark': { color: '#141210', bg: '#1a1815', surface: '#201d19', isLight: false },
            'light-clean': { color: '#f6f5f0', bg: '#ece9e1', surface: '#fcfbf7', isLight: true },
            'light-warm': { color: '#f5f2eb', bg: '#ebe6dc', surface: '#faf8f2', isLight: true },
            'light-slate': { color: '#f2f4f6', bg: '#e7ebef', surface: '#f8fafb', isLight: true }
          };
          var tone = tones[cs.bgToneId] || tones['dark-default'];
          root.setAttribute('data-theme-preset', 'custom-palette');
          root.style.setProperty('--accent', cs.accent || '#c4683c');
          root.style.setProperty('--accent-hover', cs.accentHover || cs.accent || '#ad572d');
          root.style.setProperty('--accent-glow', cs.accentGlow || 'rgba(196, 104, 60, 0.15)');
          root.style.setProperty('--bg', tone.bg);
          root.style.setProperty('--bg-page', tone.color);
          root.style.setProperty('--surface', tone.surface);
          root.style.setProperty('--sidebar-bg', tone.surface);
          root.style.setProperty('--topbar-bg', tone.surface);
          root.style.setProperty('--modal-bg', tone.isLight ? '#faf9f5' : '#1b1e24');
          root.style.setProperty('--mobile-nav-bg', tone.surface);
          root.style.setProperty('--surface2', tone.isLight ? '#eeebe3' : '#242932');
          root.style.setProperty('--border', tone.isLight ? 'rgba(28, 30, 33, 0.08)' : 'rgba(255, 255, 255, 0.08)');
          root.style.setProperty('--border2', tone.isLight ? 'rgba(28, 30, 33, 0.14)' : 'rgba(255, 255, 255, 0.14)');
          root.style.setProperty('--text', tone.isLight ? '#1b1d20' : '#edece8');
          root.style.setProperty('--muted', tone.isLight ? '#5e646e' : '#91969f');
          root.style.setProperty('--muted2', tone.isLight ? '#848a94' : '#6a6f78');
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
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Plus+Jakarta+Sans:ital,wght@0,400..800;1,400..800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  );
}
