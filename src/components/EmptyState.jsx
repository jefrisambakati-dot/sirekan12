import { ShieldCheck } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="empty-state">
      <ShieldCheck size={48} strokeWidth={1.5} className="empty-state__icon" />
      <h2 className="empty-state__title">Semua aman.</h2>
      <p className="empty-state__desc">Tidak ada insiden kecurangan solar.</p>
    </div>
  );
}
