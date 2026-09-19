'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MailIcon } from '@/components/Icons';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is connected; redirect appropriately
    try {
      const user = JSON.parse(localStorage.getItem('mailmind_user') || 'null');
      if (user?.connected) {
        router.replace('/inbox');
      } else {
        router.replace('/onboarding');
      }
    } catch {
      router.replace('/onboarding');
    }
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent)'
        }}>
          <MailIcon size={26} />
        </div>
        <div className="spinner" style={{ width: 20, height: 20 }} />
      </div>
    </div>
  );
}
