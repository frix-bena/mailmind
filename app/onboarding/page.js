'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = ['connect', 'tone', 'notifications', 'done'];

const providers = [
  {
    id: 'google',
    name: 'Sign in with Google',
    icon: '🔴',
    color: '#4285F4',
    scopes: 'gmail.readonly · gmail.send · gmail.modify',
  },
  {
    id: 'microsoft',
    name: 'Sign in with Microsoft',
    icon: '🔷',
    color: '#00A4EF',
    scopes: 'Mail.Read · Mail.Send',
  },
];

const tones = [
  { id: 'professional', label: 'Professional', emoji: '💼', desc: 'Polished and clear — great for work emails' },
  { id: 'casual',       label: 'Casual',       emoji: '😊', desc: 'Relaxed and friendly — feels like you' },
  { id: 'brief',        label: 'Brief',         emoji: '⚡', desc: 'Short and direct — max 3 sentences' },
];

function ProgressBar({ step }) {
  const idx = STEPS.indexOf(step);
  const pct = ((idx) / (STEPS.length - 1)) * 100;
  return (
    <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 40 }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: 'linear-gradient(90deg, var(--accent), #a78bfa)',
        borderRadius: 2, transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState('connect');
  const [provider, setProvider] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [tone, setTone] = useState('professional');
  const [inApp, setInApp] = useState(true);
  const [digest, setDigest] = useState(false);

  const handleConnect = (p) => {
    setProvider(p);
    setConnecting(true);
    // Simulate OAuth redirect & return
    setTimeout(() => {
      setConnecting(false);
      setStep('tone');
    }, 1800);
  };

  const handleDone = () => {
    // Persist prefs to localStorage for demo
    localStorage.setItem('mailmind_user', JSON.stringify({
      provider, tone, inApp, digest, connected: true,
      name: 'Alex Rivera', email: provider === 'google' ? 'alex.rivera@gmail.com' : 'alex.rivera@outlook.com',
    }));
    router.push('/inbox');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(108,99,255,0.12), transparent)',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 520 }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 14px',
          }}>✉️</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
            Mail<span style={{ color: 'var(--accent)' }}>Mind</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Your AI-powered inbox assistant</p>
        </div>

        <ProgressBar step={step} />

        {/* Step: Connect */}
        {step === 'connect' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Connect your inbox</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
              Securely connect via OAuth — we never store your password. You can disconnect anytime.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {providers.map(p => (
                <button
                  key={p.id}
                  className="btn btn-ghost"
                  onClick={() => handleConnect(p.id)}
                  disabled={connecting}
                  style={{
                    justifyContent: 'flex-start', gap: 14, padding: '16px 20px',
                    fontSize: 15, fontWeight: 600, position: 'relative',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{p.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>Scopes: {p.scopes}</div>
                  </div>
                  {connecting && provider === p.id && (
                    <span className="spinner" style={{ position: 'absolute', right: 20 }} />
                  )}
                </button>
              ))}
            </div>
            <p style={{ marginTop: 24, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
              🔒 OAuth 2.0 only — revocable anytime from your account settings
            </p>
          </div>
        )}

        {/* Step: Tone */}
        {step === 'tone' && (
          <div className="fade-in">
            <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>✅ Inbox connected!</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Pick your reply tone</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
              MailMind will use this style when drafting replies for you. You can change it later.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {tones.map(t => (
                <div
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                    background: tone === t.id ? 'var(--accent-glow)' : 'var(--surface)',
                    border: `1px solid ${tone === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t.desc}</div>
                  </div>
                  {tone === t.id && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 18 }}>✓</span>}
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setStep('notifications')}>
              Continue →
            </button>
          </div>
        )}

        {/* Step: Notifications */}
        {step === 'notifications' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Notification preferences</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
              Stay in the loop without opening your email client.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
              {[
                { label: 'In-app notifications', desc: 'Bell icon updates in real-time', val: inApp, set: setInApp },
                { label: 'Daily digest email', desc: 'Morning summary of what came in', val: digest, set: setDigest },
              ].map(item => (
                <div key={item.label} className="card" style={{ padding: '16px 20px' }}>
                  <div className="toggle-wrap">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <div className={`toggle${item.val ? ' on' : ''}`} onClick={() => item.set(v => !v)} />
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setStep('done')}>
              Save & continue →
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="fade-in" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>You're all set!</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, maxWidth: 340, margin: '0 auto 32px' }}>
              MailMind is now reading your inbox, summarizing emails, and drafting replies — waiting for your approval before anything gets sent.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto 32px' }}>
              {['✅ Inbox connected via OAuth', `✅ Reply tone: ${tone}`, '✅ Notifications configured', '✅ No email sent without your approval'].map(s => (
                <div key={s} style={{ fontSize: 14, color: 'var(--success)', textAlign: 'left' }}>{s}</div>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', maxWidth: 320, margin: '0 auto' }} onClick={handleDone}>
              Open my inbox →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
