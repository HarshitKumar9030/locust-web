'use client';

import { useEffect, useMemo, useState } from 'react';

async function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function PushEnable() {
  const [status, setStatus] = useState<'idle' | 'enabled' | 'denied' | 'error'>('idle');
  const [loading, setLoading] = useState(false);

  const supported = useMemo(() => {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  }, []);

  useEffect(() => {
    if (!supported) return;
    if (Notification.permission === 'denied') setStatus('denied');
  }, [supported]);

  async function enable() {
    try {
      setLoading(true);
      if (!supported) throw new Error('Not supported');

      const reg = await navigator.serviceWorker.register('/sw.js');

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus('denied');
        return;
      }

      const res = await fetch('/api/push/public-key');
      const { publicKey } = (await res.json()) as { publicKey: string };
      if (!publicKey) throw new Error('Missing VAPID public key');

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: await urlBase64ToUint8Array(publicKey),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });

      setStatus('enabled');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
      <div>
        <div className="text-sm font-semibold">Dashboard notifications</div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          Enable browser push alerts for geofence entries.
        </div>
      </div>
      <button
        disabled={loading || !supported}
        onClick={enable}
        className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {status === 'enabled' ? 'Enabled' : loading ? 'Enabling…' : 'Enable'}
      </button>
    </div>
  );
}
