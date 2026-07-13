import AlertItem from './AlertItem';
import EmptyState from './EmptyState';
import { Loader } from 'lucide-react';

export default function IncidentFeed({ alerts, loading, selectedTripId, onSelectAlert }) {
  return (
    <section className="incident-feed glass-card" id="incident-feed">
      <div className="incident-feed__header">
        <h2 className="incident-feed__title">Incident Feed</h2>
        <span className="incident-feed__count">{alerts.length}</span>
      </div>
      <div className="incident-feed__divider" />
      <div className="incident-feed__list">
        {loading ? (
          <div className="incident-feed__loading">
            <Loader size={24} strokeWidth={1.5} className="spin" />
            <p>Memuat data...</p>
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState />
        ) : (
          alerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              isActive={alert.trip_id === selectedTripId}
              onClick={() => onSelectAlert(alert)}
            />
          ))
        )}
      </div>
    </section>
  );
}
