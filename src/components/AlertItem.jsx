import { parseLossLiter, getHullNumber, formatFraudType, formatSeverity, timeAgo } from '../utils/helpers';
import { Fuel, Truck, Clock } from 'lucide-react';

export default function AlertItem({ alert, isActive, onClick }) {
  const lossLiter = parseLossLiter(alert.evidence_data);
  const hullNumber = getHullNumber(alert);
  const fraudLabel = formatFraudType(alert.fraud_type);
  const severityLabel = formatSeverity(alert.severity);
  const timestamp = timeAgo(alert.created_at);

  return (
    <button
      className={`alert-item ${isActive ? 'alert-item--active' : ''}`}
      onClick={onClick}
      id={`alert-${alert.id}`}
      type="button"
    >
      <div className="alert-item__header">
        <span className={`severity-pill severity-pill--${alert.severity}`}>
          {severityLabel}
        </span>
        <span className="alert-item__time">
          <Clock size={12} strokeWidth={1.5} />
          {timestamp}
        </span>
      </div>
      <div className="alert-item__body">
        <div className="alert-item__truck">
          <Truck size={14} strokeWidth={1.5} />
          <span className="alert-item__hull">{hullNumber}</span>
        </div>
        <p className="alert-item__fraud-type">{fraudLabel}</p>
        {alert.description && (
          <p className="alert-item__description">{alert.description}</p>
        )}
      </div>
      <div className="alert-item__footer">
        {lossLiter !== null && (
          <span className="alert-item__loss">
            <Fuel size={12} strokeWidth={1.5} />
            -{lossLiter} L
          </span>
        )}
        <span className={`alert-item__status alert-item__status--${alert.status}`}>
          {alert.status}
        </span>
      </div>
    </button>
  );
}
