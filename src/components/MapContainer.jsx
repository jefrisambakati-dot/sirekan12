import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useGpsData } from '../hooks/useGpsData';
import { Navigation, Layers } from 'lucide-react';

// Marker colors per driver (cycle through palette)
const DRIVER_COLORS = [
  '#6b62f2', '#ef4444', '#f59e0b', '#22c55e',
  '#06b6d4', '#ec4899', '#8b5cf6', '#f97316',
  '#10b981', '#3b82f6',
];

export default function MapContainer({
  selectedTripId,
  selectedTruckId,
  activeTrips = [],
  onSelectTrip,
  onClearSelection
}) {
  const { gpsData, loading } = useGpsData(selectedTripId);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const maplibreglRef = useRef(null);
  const markersRef = useRef([]);
  const startEndMarkersRef = useRef([]);
  const [mapStyle, setMapStyle] = useState('satellite'); // 'satellite' | 'street'

  // Extract selected trip details and its optimal route polyline
  const selectedTrip = useMemo(() => {
    return activeTrips.find(t => t.id === selectedTripId);
  }, [activeTrips, selectedTripId]);

  const optimalPolyline = useMemo(() => {
    const p = selectedTrip?.routes?.polyline;
    if (!p) return null;
    if (typeof p === 'string') {
      try { return JSON.parse(p); } catch { return null; }
    }
    return Array.isArray(p) ? p : null;
  }, [selectedTrip]);

  const coordinates = useMemo(() => {
    return gpsData.map(point => ({
      lng: parseFloat(point.longitude),
      lat: parseFloat(point.latitude),
      speed: point.speed_kmh,
      time: point.recorded_at,
      name: point.location_name,
      official: point.is_geofence_official,
    }));
  }, [gpsData]);

  // Build map styles
  const getMapStyle = (style) => {
    if (style === 'satellite') {
      return {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: '© Esri'
          },
          labels: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
          }
        },
        layers: [
          { id: 'satellite-layer', type: 'raster', source: 'satellite', minzoom: 0, maxzoom: 22 },
          { id: 'labels-layer', type: 'raster', source: 'labels', minzoom: 0, maxzoom: 22 },
        ]
      };
    }
    return {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        { id: 'osm-layer', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }
      ]
    };
  };

  // ─── Core render functions ──────────────────────────────────────────────────

  function renderOptimalRoute(map, polyline) {
    // Remove old layers/sources
    [
      'optimal-route-shadow',
      'optimal-route-line-casing',
      'optimal-route-line',
      'optimal-route-arrow',
      'optimal-route-dashes'
    ].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource('optimal-route')) map.removeSource('optimal-route');

    if (!polyline || polyline.length === 0) return;

    map.addSource('optimal-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: polyline }
      }
    });

    // Layer 1: outer glow / shadow
    map.addLayer({
      id: 'optimal-route-shadow',
      type: 'line',
      source: 'optimal-route',
      paint: {
        'line-color': '#00cfff',
        'line-width': 14,
        'line-opacity': 0.18,
        'line-blur': 4,
      }
    });

    // Layer 2: dark border casing
    map.addLayer({
      id: 'optimal-route-line-casing',
      type: 'line',
      source: 'optimal-route',
      paint: {
        'line-color': '#002f5a',
        'line-width': 9,
        'line-opacity': 0.7,
      }
    });

    // Layer 3: main vivid blue line (ojol style)
    map.addLayer({
      id: 'optimal-route-line',
      type: 'line',
      source: 'optimal-route',
      paint: {
        'line-color': '#00aaff',
        'line-width': 5,
        'line-opacity': 1.0,
      }
    });

    // Layer 4: white dashes overlay for speed/direction effect
    map.addLayer({
      id: 'optimal-route-dashes',
      type: 'line',
      source: 'optimal-route',
      paint: {
        'line-color': '#ffffff',
        'line-width': 2,
        'line-opacity': 0.45,
        'line-dasharray': [3, 6],
      }
    });
  }

  function renderActualRoute(map, coords) {
    ['actual-route-casing', 'actual-route-line', 'actual-route-points'].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource('actual-route')) map.removeSource('actual-route');

    if (coords.length === 0) return;

    map.addSource('actual-route', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords.map(c => [c.lng, c.lat]) },
          },
          {
            type: 'Feature',
            geometry: { type: 'MultiPoint', coordinates: coords.map(c => [c.lng, c.lat]) },
          },
        ],
      },
    });

    // Casing
    map.addLayer({
      id: 'actual-route-casing',
      type: 'line',
      source: 'actual-route',
      filter: ['==', '$type', 'LineString'],
      paint: { 'line-color': '#000000', 'line-width': 5, 'line-opacity': 0.6 },
    });

    // GPS trace — green for actual driven path
    map.addLayer({
      id: 'actual-route-line',
      type: 'line',
      source: 'actual-route',
      filter: ['==', '$type', 'LineString'],
      paint: {
        'line-color': '#22c55e',
        'line-width': 3,
        'line-opacity': 0.9,
      },
    });

    // GPS waypoints
    map.addLayer({
      id: 'actual-route-points',
      type: 'circle',
      source: 'actual-route',
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-radius': 4,
        'circle-color': '#22c55e',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8,
      },
    });
  }

  function addStartEndMarkers(map, maplibregl, polyline) {
    // Clear old start/end markers
    startEndMarkersRef.current.forEach(m => m.remove());
    startEndMarkersRef.current = [];

    if (!polyline || polyline.length === 0) return;

    const startCoord = polyline[0];
    const endCoord = polyline[polyline.length - 1];

    // ── Start marker (green pill like Gojek pickup) ──
    const startEl = document.createElement('div');
    startEl.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:default;';
    startEl.innerHTML = `
      <div style="
        background: linear-gradient(135deg,#16a34a,#22c55e);
        color:#fff;
        padding:5px 13px;
        border-radius:20px;
        font-size:11px;
        font-weight:800;
        border:2.5px solid rgba(255,255,255,0.9);
        box-shadow:0 4px 16px rgba(34,197,94,0.55),0 0 0 4px rgba(34,197,94,0.15);
        white-space:nowrap;
        font-family:'DM Sans',system-ui,sans-serif;
        letter-spacing:0.5px;
        text-transform:uppercase;
        display:flex;align-items:center;gap:5px;
      ">
        <span style="font-size:14px;">🚩</span> TITIK ASAL
      </div>
      <div style="width:3px;height:10px;background:rgba(34,197,94,0.8);"></div>
      <div style="width:10px;height:10px;background:#22c55e;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px rgba(34,197,94,0.7);"></div>
    `;
    const startMarker = new maplibregl.Marker({ element: startEl, anchor: 'bottom' })
      .setLngLat(startCoord)
      .addTo(map);

    // ── End marker (red pill like Gojek destination) ──
    const endEl = document.createElement('div');
    endEl.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:default;';
    endEl.innerHTML = `
      <div style="
        background: linear-gradient(135deg,#dc2626,#ef4444);
        color:#fff;
        padding:5px 13px;
        border-radius:20px;
        font-size:11px;
        font-weight:800;
        border:2.5px solid rgba(255,255,255,0.9);
        box-shadow:0 4px 16px rgba(239,68,68,0.55),0 0 0 4px rgba(239,68,68,0.15);
        white-space:nowrap;
        font-family:'DM Sans',system-ui,sans-serif;
        letter-spacing:0.5px;
        text-transform:uppercase;
        display:flex;align-items:center;gap:5px;
      ">
        <span style="font-size:14px;">🏁</span> TITIK TUJUAN
      </div>
      <div style="width:3px;height:10px;background:rgba(239,68,68,0.8);"></div>
      <div style="width:10px;height:10px;background:#ef4444;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px rgba(239,68,68,0.7);"></div>
    `;
    const endMarker = new maplibregl.Marker({ element: endEl, anchor: 'bottom' })
      .setLngLat(endCoord)
      .addTo(map);

    startEndMarkersRef.current = [startMarker, endMarker];
  }

  // ─── Master re-render (called on every style.load) ─────────────────────────
  const renderAll = useCallback((map, maplibregl) => {
    renderOptimalRoute(map, optimalPolyline);
    renderActualRoute(map, coordinates);
    addStartEndMarkers(map, maplibregl, optimalPolyline);

    // Fit bounds to polyline or coords
    const poly = optimalPolyline;
    const co = coordinates;
    if (co.length > 0) {
      const lngs = co.map(c => c.lng);
      const lats = co.map(c => c.lat);
      map.fitBounds(
        [[Math.min(...lngs) - 0.015, Math.min(...lats) - 0.015],
         [Math.max(...lngs) + 0.015, Math.max(...lats) + 0.015]],
        { padding: 55, duration: 900 }
      );
    } else if (poly && poly.length > 0) {
      const lngs = poly.map(c => c[0]);
      const lats = poly.map(c => c[1]);
      map.fitBounds(
        [[Math.min(...lngs) - 0.015, Math.min(...lats) - 0.015],
         [Math.max(...lngs) + 0.015, Math.max(...lats) + 0.015]],
        { padding: 55, duration: 900 }
      );
    }
  }, [optimalPolyline, coordinates]);

  // ─── 1. Initialize Map ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let map;
    let cancelled = false;

    async function initMap() {
      const maplibregl = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');
      if (cancelled || !mapContainerRef.current) return;

      maplibreglRef.current = maplibregl;

      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: getMapStyle('satellite'),
        center: [122.5137, -3.9772],
        zoom: 13,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapRef.current = map;

      map.on('load', () => {
        renderAll(map, maplibregl);
      });

      // Re-render all after every style change
      map.on('style.load', () => {
        renderAll(map, maplibregl);
      });
    }

    initMap();

    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
    };
  }, []);

  // ─── 2. Toggle map style ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(getMapStyle(mapStyle));
    // style.load listener above will re-render everything automatically
  }, [mapStyle]);

  // ─── 3. Re-render route data when polyline or GPS changes ─────────────────
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreglRef.current;
    if (!map || !maplibregl) return;

    if (map.isStyleLoaded()) {
      renderAll(map, maplibregl);
    } else {
      map.once('style.load', () => renderAll(map, maplibregl));
    }
  }, [renderAll]);

  // ─── 4. Truck markers (all or selected) ───────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreglRef.current;
    if (!map || !maplibregl) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (selectedTripId) {
      const activeTrip = activeTrips.find(t => t.id === selectedTripId);
      const latestPos = activeTrip?.latestGps ||
        (coordinates.length > 0 ? coordinates[coordinates.length - 1] : null) ||
        (optimalPolyline && optimalPolyline.length > 0
          ? { lng: optimalPolyline[0][0], lat: optimalPolyline[0][1] }
          : null);
      const hullNum = activeTrip?.vehicles?.hull_number || selectedTruckId || 'Truk';

      if (latestPos) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="
              background:linear-gradient(135deg,rgba(107,98,242,0.97),rgba(59,130,246,0.97));
              color:#fff;
              padding:4px 10px;
              border-radius:10px;
              font-size:11px;
              font-weight:800;
              border:2px solid rgba(255,255,255,0.85);
              box-shadow:0 4px 16px rgba(107,98,242,0.6);
              white-space:nowrap;
              margin-bottom:5px;
              font-family:'DM Sans',system-ui,sans-serif;
              letter-spacing:0.3px;
            ">🚚 ${hullNum} (AKTIF)</div>
            <div style="
              position:relative;
              width:42px;height:42px;
              background:linear-gradient(135deg,#6b62f2,#3b82f6);
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              border:3px solid #fff;
              box-shadow:0 0 0 4px rgba(107,98,242,0.35),0 6px 20px rgba(107,98,242,0.7);
            ">
              <div style="
                position:absolute;
                width:62px;height:62px;
                background:rgba(107,98,242,0.2);
                border-radius:50%;
                animation:truck-pulse 1.6s ease-out infinite;
              "></div>
              <span style="font-size:18px;z-index:1;">🚚</span>
            </div>
          </div>
        `;

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([latestPos.lng, latestPos.lat])
          .addTo(map);

        markersRef.current.push(marker);
        map.easeTo({ center: [latestPos.lng, latestPos.lat], zoom: 14, duration: 900 });
      }
    } else {
      activeTrips.forEach((trip, idx) => {
        if (!trip.latestGps) return;
        const { lat, lng } = trip.latestGps;
        const hullNum = trip.vehicles?.hull_number || 'Truk';
        const driverName = trip.drivers?.name || '';
        const color = DRIVER_COLORS[idx % DRIVER_COLORS.length];
        const speed = trip.latestGps?.speed ?? 0;

        const el = document.createElement('div');
        el.style.cursor = 'pointer';
        el.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="
              background:rgba(10,10,10,0.9);
              border:1.5px solid ${color};
              color:#fff;
              padding:3px 9px;
              border-radius:8px;
              font-size:11px;
              font-weight:700;
              white-space:nowrap;
              margin-bottom:4px;
              box-shadow:0 2px 10px rgba(0,0,0,0.5);
              text-align:center;
              backdrop-filter:blur(8px);
            ">
              ${hullNum}${driverName ? `<br/><span style="font-size:10px;font-weight:400;color:#a3a3a3;">${driverName}</span>` : ''}
            </div>
            <div style="
              width:36px;height:36px;
              background:${color};
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 0 0 3px rgba(255,255,255,0.2),0 0 16px ${color}cc;
              border:2.5px solid #fff;
              position:relative;
            ">
              <div style="position:absolute;width:54px;height:54px;background:${color}33;border-radius:50%;animation:truck-pulse 2s ease-out infinite;"></div>
              <span style="font-size:16px;z-index:1;">🚛</span>
            </div>
            <div style="
              font-size:10px;color:#d4d4d4;
              text-align:center;margin-top:3px;
              background:rgba(0,0,0,0.65);
              border-radius:5px;padding:1px 6px;
            ">${Math.round(speed)} km/h</div>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onSelectTrip) onSelectTrip(trip);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([lng, lat])
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Fit to all active drivers
      if (activeTrips.length > 0) {
        const validCoords = activeTrips
          .filter(t => t.latestGps)
          .map(t => [t.latestGps.lng, t.latestGps.lat]);

        if (validCoords.length === 1) {
          map.easeTo({ center: validCoords[0], zoom: 13, duration: 900 });
        } else if (validCoords.length > 1) {
          const lngs = validCoords.map(c => c[0]);
          const lats = validCoords.map(c => c[1]);
          map.fitBounds(
            [[Math.min(...lngs) - 0.02, Math.min(...lats) - 0.02],
             [Math.max(...lngs) + 0.02, Math.max(...lats) + 0.02]],
            { padding: 60, duration: 900 }
          );
        } else {
          map.easeTo({ center: [122.5137, -3.9772], zoom: 12, duration: 900 });
        }
      }
    }
  }, [activeTrips, selectedTripId, coordinates, selectedTruckId, optimalPolyline, onSelectTrip]);

  return (
    <div className="map-container glass-card" id="map-container">
      <style>{`
        @keyframes truck-pulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes dash-move {
          to { stroke-dashoffset: -20; }
        }
      `}</style>

      {/* Header */}
      <div className="map-container__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="map-container__title-row">
          <Navigation size={16} strokeWidth={1.5} />
          <h3 className="map-container__title">
            {selectedTripId
              ? `Rute — ${selectedTruckId || 'Armada'}`
              : `Live View Armada (${activeTrips.length})`}
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Route legend badges */}
          {selectedTripId && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.3)',
                padding: '3px 8px', borderRadius: 6, fontSize: 10, color: '#7dd3fc', fontWeight: 600
              }}>
                <div style={{ width: 20, height: 3, background: '#00aaff', borderRadius: 2 }} />
                Rute Optimal
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                padding: '3px 8px', borderRadius: 6, fontSize: 10, color: '#86efac', fontWeight: 600
              }}>
                <div style={{ width: 20, height: 3, background: '#22c55e', borderRadius: 2 }} />
                Perjalanan Aktual
              </div>
            </div>
          )}

          {/* Map style toggle */}
          <button
            onClick={() => setMapStyle(s => s === 'satellite' ? 'street' : 'satellite')}
            title={mapStyle === 'satellite' ? 'Beralih ke Peta Jalan' : 'Beralih ke Satelit'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: '11px', background: 'rgba(229,229,229,0.07)',
              border: '1px solid rgba(229,229,229,0.13)',
              padding: '4px 10px', borderRadius: '6px',
              color: '#a3a3a3', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(229,229,229,0.13)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(229,229,229,0.07)'}
          >
            <Layers size={12} />
            {mapStyle === 'satellite' ? 'Peta Jalan' : 'Satelit'}
          </button>

          {selectedTripId ? (
            <button
              onClick={onClearSelection}
              style={{
                fontSize: '11px', 
                background: 'rgba(120, 120, 120, 0.08)',
                border: '1px solid var(--color-iron)',
                padding: '5px 10px', 
                borderRadius: '6px',
                color: 'var(--color-bone)', 
                cursor: 'pointer', 
                fontWeight: 600, 
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(120, 120, 120, 0.16)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(120, 120, 120, 0.08)'}
            >
              ← Semua Armada
            </button>
          ) : (
            <span style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '11px',
              background: 'rgba(107, 98, 242, 0.12)', 
              color: 'var(--color-indigo-haze)',
              border: '1px solid rgba(107, 98, 242, 0.25)',
              padding: '4px 10px', 
              borderRadius: '6px', 
              fontWeight: 700
            }}>
              <span style={{
                width: '6px', 
                height: '6px', 
                background: 'var(--color-indigo-haze)',
                borderRadius: '50%', 
                display: 'inline-block',
                animation: 'truck-pulse 1.5s ease-out infinite'
              }} />
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Map body */}
      <div className="map-container__body" style={{ position: 'relative' }}>
        {loading && selectedTripId && (
          <div className="map-container__placeholder" style={{
            zIndex: 5, 
            background: 'rgba(0, 0, 0, 0.45)',
            position: 'absolute', 
            inset: 0,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <p style={{ color: 'var(--color-fog)', fontSize: 13 }}>Memuat data GPS...</p>
          </div>
        )}
        {activeTrips.length === 0 && !selectedTripId && (
          <div style={{
            position: 'absolute', 
            top: '50%', 
            left: '50%',
            transform: 'translate(-50%,-50%)', 
            zIndex: 5,
            background: 'var(--color-char)', 
            padding: '12px 20px',
            borderRadius: 10, 
            border: '1px solid var(--color-iron)',
            textAlign: 'center', 
            backdropFilter: 'blur(8px)'
          }}>
            <p style={{ color: 'var(--color-fog)', fontSize: 13, margin: 0 }}>Menunggu driver memulai perjalanan...</p>
          </div>
        )}
        <div
          ref={mapContainerRef}
          className="map-container__map"
          style={{ width: '100%', height: '380px' }}
        />
      </div>

      {/* Driver legend when viewing all */}
      {!selectedTripId && activeTrips.length > 0 && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px', 
          padding: '10px 16px 12px', 
          borderTop: '1px solid var(--color-iron)' 
        }}>
          {activeTrips.map((trip, idx) => (
            <button
              key={trip.id}
              onClick={() => onSelectTrip && onSelectTrip(trip)}
              style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                background: 'rgba(120, 120, 120, 0.05)',
                border: `1px solid ${DRIVER_COLORS[idx % DRIVER_COLORS.length]}55`,
                borderRadius: 8, 
                padding: '5px 10px', 
                cursor: 'pointer',
                color: 'var(--color-bone)', 
                fontSize: 11, 
                fontWeight: 600, 
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(120, 120, 120, 0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(120, 120, 120, 0.05)'}
            >
              <span style={{ 
                width: 8, 
                height: 8, 
                background: DRIVER_COLORS[idx % DRIVER_COLORS.length], 
                borderRadius: '50%', 
                flexShrink: 0 
              }} />
              <span>{trip.vehicles?.hull_number || 'Truk'}</span>
              <span style={{ color: 'var(--color-fog)' }}>·</span>
              <span style={{ color: 'var(--color-smoke)' }}>{trip.drivers?.name || '—'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

