'use client';
import L from 'leaflet';
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
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const radiusMeters = useMemo(() => props.radiusKm * 1000, [props.radiusKm]);

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map('locust-map', {
      center: [props.center.lat, props.center.lng],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    L.circle([props.center.lat, props.center.lng], {
      radius: radiusMeters,
      fillOpacity: 0.08,
      weight: 2,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [props.center.lat, props.center.lng, radiusMeters]);

  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    for (const m of props.markers) {
      const marker = L.marker([m.lat, m.lng]);
      const status = m.isInGeofence ? 'IN GEOFENCE' : 'OUTSIDE';
      marker.bindPopup(
        `<b>${m.deviceName}</b><br/>${m.lat.toFixed(6)}, ${m.lng.toFixed(6)}<br/>${status}`
      );
      marker.addTo(layer);
    }
  }, [props.markers]);

  return <div id="locust-map" className="h-[520px] w-full rounded-xl border border-black/10 dark:border-white/10" />;
}
