'use client';

import { useEffect, useMemo, useState } from 'react';

import { PushEnable } from '@/components/PushEnable';
import { MapPanel } from '@/components/MapPanel';

type DashboardResponse = {
  geofence: {
    name: string;
    center: { lat: number; lng: number };
    radiusKm: number;
  };
  devices: Array<{
    deviceId: string;
    deviceName: string;
    lastSeen?: string;
    lastGeofenceInside?: boolean;
  }>;
  latestLocations: Array<{
    deviceId: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    isInGeofence: boolean;
    accuracy: number;
  }>;
  recentAlerts: Array<{
    _id: string;
    deviceId: string;
    deviceName: string;
    timestamp: string;
    distanceFromCenterKm: number;
    latitude: number;
    longitude: number;
  }>;
};

export function DashboardClient() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
      try {
        const res = await fetch('/api/dashboard', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load dashboard');
        const json = (await res.json()) as DashboardResponse;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed');
      }
    }

    load();

    timer = setInterval(load, 20_000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  const markers = useMemo(() => {
    if (!data) return [];
    const locationsByDevice = new Map(data.latestLocations.map((l) => [l.deviceId, l] as const));
    return data.devices
      .map((d) => {
        const loc = locationsByDevice.get(d.deviceId);
        if (!loc) return null;
        return {
          deviceId: d.deviceId,
          deviceName: d.deviceName,
          lat: loc.latitude,
          lng: loc.longitude,
          isInGeofence: loc.isInGeofence,
        };
      })
      .filter(Boolean) as Array<{ deviceId: string; deviceName: string; lat: number; lng: number; isInGeofence: boolean }>;
  }, [data]);

  const locationsByDevice = useMemo(() => {
    if (!data) return new Map<string, DashboardResponse['latestLocations'][number]>();
    return new Map(data.latestLocations.map((l) => [l.deviceId, l] as const));
  }, [data]);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans text-black dark:bg-black dark:text-zinc-50">
        <main className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="rounded-xl border border-black/10 bg-white p-4 text-sm dark:border-white/10 dark:bg-black">
            Error: {error}
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans text-black dark:bg-black dark:text-zinc-50">
        <main className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="rounded-xl border border-black/10 bg-white p-4 text-sm dark:border-white/10 dark:bg-black">
            Loading…
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-black dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-2">
          <div className="text-2xl font-semibold tracking-tight">Locust Dashboard</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Geofence: {data.geofence.name} — radius {data.geofence.radiusKm} km
          </div>
        </header>

        <PushEnable />

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MapPanel center={data.geofence.center} radiusKm={data.geofence.radiusKm} markers={markers} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
              <div className="text-sm font-semibold">Devices</div>
              <div className="mt-3 space-y-2">
                {data.devices.map((d) => {
                  const loc = locationsByDevice.get(d.deviceId);
                  const inside = loc?.isInGeofence ?? false;
                  return (
                    <div key={d.deviceId} className="flex items-center justify-between gap-3 rounded-lg border border-black/5 p-3 dark:border-white/10">
                      <div>
                        <div className="text-sm font-medium">{d.deviceName}</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">{d.deviceId}</div>
                      </div>
                      <div className={inside ? 'text-xs font-semibold text-red-500' : 'text-xs font-semibold text-blue-500'}>
                        {inside ? 'IN GEOFENCE' : 'OUTSIDE'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
              <div className="text-sm font-semibold">Recent alerts</div>
              <div className="mt-3 space-y-2">
                {data.recentAlerts.length === 0 ? (
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">No alerts yet</div>
                ) : (
                  data.recentAlerts.slice(0, 8).map((a) => (
                    <div key={a._id} className="rounded-lg border border-black/5 p-3 text-sm dark:border-white/10">
                      <div className="font-medium">{a.deviceName}</div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        {new Date(a.timestamp).toLocaleString()} — {a.distanceFromCenterKm.toFixed(2)} km from center
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="text-xs text-zinc-600 dark:text-zinc-400">Data refresh: reload page to fetch latest.</footer>
      </main>
    </div>
  );
}
