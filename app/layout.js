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
  return (
    <html lang="en">
      <head>
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
