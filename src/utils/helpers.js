/**
 * Safely parse evidence_data from alert to extract loss_liter
 */
export function parseLossLiter(evidenceData) {
  if (!evidenceData) return null;
  try {
    const data = typeof evidenceData === 'string' ? JSON.parse(evidenceData) : evidenceData;
    return data?.loss_liter ?? null;
  } catch {
    return null;
  }
}

/**
 * Parse duration_seconds from evidence_data
 */
export function parseDuration(evidenceData) {
  if (!evidenceData) return null;
  try {
    const data = typeof evidenceData === 'string' ? JSON.parse(evidenceData) : evidenceData;
    return data?.duration_seconds ?? null;
  } catch {
    return null;
  }
}

/**
 * Get hull_number from nested alert join data
 */
export function getHullNumber(alert) {
  return alert?.trips?.vehicles?.hull_number || '—';
}

/**
 * Get plate_number from nested alert join data
 */
export function getPlateNumber(alert) {
  return alert?.trips?.vehicles?.plate_number || '—';
}

/**
 * Format fraud_type to human-readable label
 */
export function formatFraudType(type) {
  const labels = {
    fuel_theft: 'Pencurian Solar',
    weight_manipulation: 'Manipulasi Timbangan',
    route_deviation: 'Deviasi Rute',
    other: 'Lainnya',
  };
  return labels[type] || type;
}

/**
 * Format severity for display
 */
export function formatSeverity(severity) {
  const labels = {
    critical: 'Kritis',
    high: 'Tinggi',
    medium: 'Sedang',
    low: 'Rendah',
  };
  return labels[severity] || severity;
}

/**
 * Format timestamp to relative time string (Indonesian)
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format timestamp for chart axis
 */
export function formatChartTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
