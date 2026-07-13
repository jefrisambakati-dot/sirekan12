import { Truck, User, Calendar, MapPin, Radio } from 'lucide-react';
import { timeAgo } from '../utils/helpers';

export default function ActiveDrivers({ activeTrips = [], selectedTripId, onSelectTrip }) {
  return (
    <div className="active-drivers-list">
      {activeTrips.length === 0 ? (
        <div className="active-drivers-empty">
          <Radio size={32} className="active-drivers-empty__icon" style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 13 }}>Tidak ada supir yang beroperasi saat ini.</p>
        </div>
      ) : (
        activeTrips.map((trip) => {
          const isSelected = trip.id === selectedTripId;
          return (
            <div 
              key={trip.id} 
              className={`active-driver-card ${isSelected ? 'active-driver-card--active' : ''}`}
              onClick={() => onSelectTrip(trip)}
            >
              <div className="active-driver-card__header">
                <div className="active-driver-name">
                  <User size={14} className="active-driver-icon" style={{ color: isSelected ? '#a5a1f9' : '#686868' }} />
                  <span>{trip.drivers?.name || 'Supir Tanpa Nama'}</span>
                </div>
                <span className="active-badge">
                  <span className="active-badge__ping" />
                  Jalan
                </span>
              </div>

              <div className="active-driver-card__body">
                <div className="active-driver-info-row">
                  <Truck size={12} style={{ color: '#686868' }} />
                  <span>
                    Truk: <strong>{trip.vehicles?.hull_number || '—'}</strong> ({trip.vehicles?.plate_number || '—'})
                  </span>
                </div>
                <div className="active-driver-info-row">
                  <MapPin size={12} style={{ color: '#686868' }} />
                  <span>Rute: {trip.routes?.name || 'Rute Uji Coba'}</span>
                </div>
                <div className="active-driver-info-row">
                  <Calendar size={12} style={{ color: '#686868' }} />
                  <span>Mulai: {timeAgo(trip.start_time)}</span>
                </div>
              </div>

              <div className="active-driver-card__footer">
                <span>Solar Awal: <strong>{trip.fuel_before_liter ?? '—'} L</strong></span>
                {trip.latestGps && (
                  <span className="active-driver-position">
                    Posisi: {trip.latestGps.name || 'Dalam Perjalanan'}
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

