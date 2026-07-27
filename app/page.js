'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
      background: 'var(--bg)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 40 }}>✉️</div>
        <div className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    </div>
  );
}
