import { useState } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { useActiveDrivers } from '../hooks/useActiveDrivers';
import { getHullNumber } from '../utils/helpers';
import DashboardHeader from './DashboardHeader';
import MapContainer from './MapContainer';
import FuelGraph from './FuelGraph';
import IncidentFeed from './IncidentFeed';
import ActiveDrivers from './ActiveDrivers';

export default function DashboardPage() {
  const { alerts, loading: alertsLoading, error: alertsError } = useAlerts();
  const { activeTrips, loading: activeLoading, error: activeError } = useActiveDrivers();
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [activeTab, setActiveTab] = useState('incidents');

  const error = alertsError || activeError;

  function handleSelectAlert(alert) {
    const tripId = alert.trip_id;
    const truckId = getHullNumber(alert);

    // Toggle off if clicking the same alert
    if (tripId === selectedTripId) {
      setSelectedTripId(null);
      setSelectedTruckId(null);
      return;
    }

    setSelectedTripId(tripId);
    setSelectedTruckId(truckId);
  }

  function handleSelectTrip(trip) {
    const tripId = trip.id;
    const truckId = trip.vehicles?.hull_number || 'Truk';

    // Toggle off if clicking the same active trip
    if (tripId === selectedTripId) {
      setSelectedTripId(null);
      setSelectedTruckId(null);
      return;
    }

    setSelectedTripId(tripId);
    setSelectedTruckId(truckId);
  }

  function handleClearSelection() {
    setSelectedTripId(null);
    setSelectedTruckId(null);
  }

  return (
    <main className="page-container" id="dashboard">
      <DashboardHeader alerts={alerts} activeDriversCount={activeTrips.length} />

      {error && (
        <div className="glass-card" style={{ marginBottom: 24, padding: '16px 24px' }}>
          <p style={{ color: 'var(--color-mist)', fontSize: 14, margin: 0 }}>
            ⚠ Koneksi database: {error}
          </p>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-left">
          <MapContainer
            selectedTripId={selectedTripId}
            selectedTruckId={selectedTruckId}
            activeTrips={activeTrips}
            onSelectTrip={handleSelectTrip}
            onClearSelection={handleClearSelection}
          />
          <FuelGraph
            selectedTripId={selectedTripId}
            selectedTruckId={selectedTruckId}
            selectedTrip={activeTrips.find(t => t.id === selectedTripId) || null}
            activeTrips={activeTrips}
          />
        </div>
        <div className="dashboard-right">
          <div className="right-panel-tabs" style={{ marginBottom: 16 }}>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`panel-tab-btn ${activeTab === 'incidents' ? 'panel-tab-btn--active' : ''}`}
            >
              Incident Feed ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`panel-tab-btn ${activeTab === 'drivers' ? 'panel-tab-btn--active' : ''}`}
            >
              Supir Beroperasi ({activeTrips.length})
            </button>
          </div>

          {activeTab === 'incidents' ? (
            <IncidentFeed
              alerts={alerts}
              loading={alertsLoading}
              selectedTripId={selectedTripId}
              onSelectAlert={handleSelectAlert}
            />
          ) : (
            <div className="glass-card" style={{ padding: '16px 20px', height: 'calc(100vh - 250px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e5e5e5', margin: 0 }}>Supir Aktif</h2>
                <span style={{ fontSize: 11, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                  {activeTrips.length} Beroperasi
                </span>
              </div>
              <div style={{ height: '1px', background: 'rgba(229, 229, 229, 0.08)', marginBottom: 16 }} />
              <ActiveDrivers 
                activeTrips={activeTrips} 
                selectedTripId={selectedTripId}
                onSelectTrip={handleSelectTrip}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
