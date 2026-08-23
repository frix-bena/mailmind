'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TerminalPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/inbox');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 40 }}>✉️</div>
        <div className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    </div>
  );
}
