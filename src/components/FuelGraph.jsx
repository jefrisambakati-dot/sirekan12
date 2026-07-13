import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { useFuelData } from '../hooks/useFuelData';
import { formatChartTime } from '../utils/helpers';
import { Droplets, Gauge, TrendingDown, AlertTriangle } from 'lucide-react';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isOpen = d.fuel_cap_status === 'OPEN';
  return (
    <div style={{
      background: 'rgba(10,10,10,0.95)', border: `1px solid ${isOpen ? '#ef444455' : 'rgba(229,229,229,0.12)'}`,
      borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    }}>
      <p style={{ color: '#686868', fontSize: 11, margin: '0 0 6px 0' }}>{d.timeLabel}</p>
      <p style={{ color: '#e5e5e5', fontSize: 15, fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Droplets size={13} style={{ color: '#6b62f2' }} />
        {d.fuel_level_liter} L
      </p>
      {d.fuel_cap_status && (
        <p style={{ fontSize: 11, margin: 0, color: isOpen ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
          {isOpen ? '⚠ Tutup tangki TERBUKA' : '✓ Tutup tangki tertutup'}
        </p>
      )}
      {d.temperature_celsius && (
        <p style={{ color: '#686868', fontSize: 11, margin: '3px 0 0' }}>Suhu: {d.temperature_celsius}°C</p>
      )}
    </div>
  );
}

export default function FuelGraph({ selectedTripId, selectedTruckId, selectedTrip, activeTrips = [], alerts = [] }) {
  const { fuelData, loading } = useFuelData(selectedTripId);

  const chartData = useMemo(() => {
    return fuelData.map(d => ({
      ...d,
      fuel_level_liter: parseFloat(d.fuel_level_liter),
      timeLabel: formatChartTime(d.recorded_at),
    }));
  }, [fuelData]);

  // Detect fuel theft events — sudden drops
  const fuelTheftEvents = useMemo(() => {
    const events = [];
    for (let i = 1; i < chartData.length; i++) {
      const drop = chartData[i - 1].fuel_level_liter - chartData[i].fuel_level_liter;
      if (drop > 20 || chartData[i].fuel_cap_status === 'OPEN') {
        events.push(chartData[i].timeLabel);
      }
    }
    return events;
  }, [chartData]);

  // Look up active anomalies from database for this trip
  const activeAlertsForTrip = useMemo(() => {
    if (!selectedTripId) return [];
    return alerts.filter(a => a.trip_id === selectedTripId && a.status !== 'resolved');
  }, [alerts, selectedTripId]);

  const latestFuel = chartData.length > 0 ? chartData[chartData.length - 1].fuel_level_liter : null;
  const fuelBefore = selectedTrip?.fuel_before_liter ? parseFloat(selectedTrip.fuel_before_liter) : null;
  const fuelUsedPercent = fuelBefore && latestFuel ? Math.round(((fuelBefore - latestFuel) / fuelBefore) * 100) : null;
  const driverName = selectedTrip?.drivers?.name || '';

  // Get active fraud label
  const fraudStatusText = useMemo(() => {
    if (activeAlertsForTrip.length > 0) {
      const firstAlert = activeAlertsForTrip[0];
      const labels = {
        fuel_theft: 'Pencurian',
        fuel_leak: 'Kebocoran',
        route_deviation: 'Deviasi Rute',
        unauthorized_refuel: 'Isi Ilegal',
        speed_anomaly: 'Overspeed',
        excessive_idle: 'Mesin Idle',
        odometer_fraud: 'Odometer',
        fuel_siphoning: 'Kuras Solar',
        unauthorized_stop: 'Zona Merah',
        abnormal_consumption: 'Boros Solar',
        receipt_fraud: 'Struk Palsu'
      };
      return labels[firstAlert.fraud_type] || 'Ada Anomali';
    }
    return 'Aman';
  }, [activeAlertsForTrip]);

  return (
    <div className="fuel-graph glass-card" id="fuel-graph">
      <div className="fuel-graph__header">
        <div className="fuel-graph__title-row">
          <Gauge size={16} strokeWidth={1.5} />
          <h3 className="fuel-graph__title">Level Solar</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(fuelTheftEvents.length > 0 || activeAlertsForTrip.length > 0) && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, background: 'rgba(239,68,68,0.12)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.25)', padding: '2px 8px', borderRadius: 6, fontWeight: 700,
            }}>
              <AlertTriangle size={10} /> {Math.max(fuelTheftEvents.length, activeAlertsForTrip.length)} Anomali
            </span>
          )}
          {selectedTruckId && (
            <span className="fuel-graph__truck-tag" style={{
              background: 'rgba(107,98,242,0.12)', color: '#a5a1f9',
              border: '1px solid rgba(107,98,242,0.25)', padding: '2px 10px',
              borderRadius: 6, fontSize: 11, fontWeight: 600
            }}>
              🚚 {selectedTruckId}{driverName ? ` · ${driverName}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      {selectedTripId && !loading && latestFuel !== null && (
        <div style={{ display: 'flex', gap: 12, padding: '0 0 12px', borderBottom: '1px solid rgba(229,229,229,0.06)', marginBottom: 12 }}>
          <div style={{ flex: 1, background: 'rgba(29,29,29,0.5)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(229,229,229,0.06)' }}>
            <p style={{ color: '#686868', fontSize: 10, margin: '0 0 3px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sisa Solar</p>
            <p style={{ color: '#6b62f2', fontSize: 18, fontWeight: 700, margin: 0 }}>{latestFuel.toFixed(1)} <span style={{ fontSize: 12, color: '#686868' }}>L</span></p>
          </div>
          {fuelBefore && (
            <div style={{ flex: 1, background: 'rgba(29,29,29,0.5)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(229,229,229,0.06)' }}>
               <p style={{ color: '#686868', fontSize: 10, margin: '0 0 3px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Terpakai</p>
              <p style={{ color: (fuelUsedPercent > 20 || activeAlertsForTrip.length > 0) ? '#ef4444' : '#22c55e', fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingDown size={14} />
                {(fuelBefore - latestFuel).toFixed(1)} L
              </p>
            </div>
          )}
          <div style={{ flex: 1, background: 'rgba(29,29,29,0.5)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(229,229,229,0.06)' }}>
            <p style={{ color: '#686868', fontSize: 10, margin: '0 0 3px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Anomali</p>
            <p style={{ color: activeAlertsForTrip.length > 0 ? '#ef4444' : '#22c55e', fontSize: 16, fontWeight: 700, margin: 0 }}>
              {activeAlertsForTrip.length > 0 ? `⚠ ${fraudStatusText}` : '✓ Aman'}
            </p>
          </div>
        </div>
      )}

      {/* Driver selector if no trip selected and multiple active */}
      {!selectedTripId && activeTrips.length > 0 && (
        <div style={{ padding: '12px 0 8px' }}>
          <p style={{ color: '#686868', fontSize: 12, margin: '0 0 8px', textAlign: 'center' }}>
            Klik driver di panel kanan atau marker peta untuk melihat grafik solar mereka
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {activeTrips.map((trip, idx) => (
              <div key={trip.id} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 6,
                background: 'rgba(29,29,29,0.5)', border: '1px solid rgba(229,229,229,0.08)',
                color: '#a3a3a3', display: 'flex', alignItems: 'center', gap: 6
              }}>
                🚛 {trip.vehicles?.hull_number} · {trip.drivers?.name}
                <span style={{ color: '#22c55e', fontWeight: 600 }}>{trip.fuel_before_liter}L</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fuel-graph__body">
        {!selectedTripId ? (
          <div className="fuel-graph__placeholder" style={{ minHeight: 120 }}>
            <Droplets size={32} strokeWidth={1} className="fuel-graph__placeholder-icon" />
            <p>Pilih driver atau armada untuk melihat grafik solar</p>
          </div>
        ) : loading ? (
          <div className="fuel-graph__placeholder" style={{ minHeight: 120 }}>
            <p>Memuat data sensor solar...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="fuel-graph__placeholder" style={{ minHeight: 120 }}>
            <Droplets size={28} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>Belum ada data sensor solar untuk trip ini</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6b62f2" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6b62f2" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fuelGradientAlert" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(229,229,229,0.05)" vertical={false} />
              <XAxis dataKey="timeLabel" tick={{ fill: '#686868', fontSize: 10 }} axisLine={{ stroke: 'rgba(229,229,229,0.08)' }} tickLine={false} />
              <YAxis tick={{ fill: '#686868', fontSize: 10 }} axisLine={false} tickLine={false} unit=" L" />
              <Tooltip content={<CustomTooltip />} />
              {/* Reference lines for theft events */}
              {fuelTheftEvents.map((label, i) => (
                <ReferenceLine key={i} x={label} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5}
                  label={{ value: '⚠', position: 'top', fill: '#ef4444', fontSize: 12 }}
                />
              ))}
              <Area
                type="monotone"
                dataKey="fuel_level_liter"
                stroke={fuelTheftEvents.length > 0 ? '#ef4444' : '#6b62f2'}
                strokeWidth={2}
                fill={fuelTheftEvents.length > 0 ? 'url(#fuelGradientAlert)' : 'url(#fuelGradient)'}
                dot={(props) => {
                  const d = props.payload;
                  if (d.fuel_cap_status === 'OPEN') {
                    return <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill="#ef4444" stroke="#1d1d1d" strokeWidth={2} />;
                  }
                  return <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill="#6b62f2" stroke="#1d1d1d" strokeWidth={1.5} />;
                }}
                activeDot={{ r: 5, fill: '#6b62f2', stroke: '#1d1d1d', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
