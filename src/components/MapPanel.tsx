'use client';
import { useEffect, useMemo, useRef } from 'react';

type Marker = {
  deviceId: string;
  deviceName: string;
  lat: number;
  lng: number;
  isInGeofence: boolean;
};

export function MapPanel(props: {
  center: { lat: number; lng: number };
  radiusKm: number;
  markers: Marker[];
}) {
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const radiusMeters = useMemo(() => props.radiusKm * 1000, [props.radiusKm]);

  useEffect(() => {
    if (mapRef.current) return;

    let disposed = false;

    (async () => {
      const mod = await import('leaflet');
      const Leaflet = (mod as any).default ?? mod;
      leafletRef.current = Leaflet;

      if (disposed) return;

      const map = Leaflet.map('locust-map', {
        center: [props.center.lat, props.center.lng],
        zoom: 12,
        zoomControl: true,
      });

      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      Leaflet.circle([props.center.lat, props.center.lng], {
        radius: radiusMeters,
        fillOpacity: 0.08,
        weight: 2,
      }).addTo(map);

      markersLayerRef.current = Leaflet.layerGroup().addTo(map);

      mapRef.current = map;
    })();

    return () => {
      disposed = true;
      try {
        mapRef.current?.remove?.();
      } catch {
        // ignore
      }
      mapRef.current = null;
      markersLayerRef.current = null;
      leafletRef.current = null;
    };
  }, [props.center.lat, props.center.lng, radiusMeters]);

  useEffect(() => {
    const layer = markersLayerRef.current;
    const Leaflet = leafletRef.current;
    if (!layer) return;
    if (!Leaflet) return;

    layer.clearLayers();

    for (const m of props.markers) {
      const status = m.isInGeofence ? 'IN GEOFENCE' : 'OUTSIDE';
      const marker = Leaflet.circleMarker([m.lat, m.lng], {
        radius: 8,
        weight: 2,
        fillOpacity: 0.9,
      });
      marker.bindPopup(
        `<b>${m.deviceName}</b><br/>${m.lat.toFixed(6)}, ${m.lng.toFixed(6)}<br/>${status}`
      );
      marker.addTo(layer);
    }
  }, [props.markers]);

  return <div id="locust-map" className="h-[520px] w-full rounded-xl border border-black/10 dark:border-white/10" />;
}
