import './globals.css';

export const metadata = {
  metadataBase: new URL('https://mailmind-chi.vercel.app'),
  title: 'MailMind — AI Email Assistant',
  description: 'Your AI-powered inbox assistant. Read, classify, and reply to emails with permission-based AI drafts.',
  keywords: 'email assistant, AI email, inbox management, smart replies',
  openGraph: {
    title: 'MailMind — AI Email Assistant',
    description: 'Your AI-powered inbox assistant. Read, classify, and reply to emails with permission-based AI drafts.',
    url: 'https://mailmind-chi.vercel.app',
    siteName: 'MailMind',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mailmind-chi.vercel.app',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
