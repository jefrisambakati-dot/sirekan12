import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Download, Printer, Loader, FileText, ChevronLeft, Search, CheckCircle2, AlertTriangle, XCircle, TrendingDown } from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('trips')
          .select(`
            id, start_time, status,
            drivers ( name, license_number ),
            vehicles ( hull_number ),
            reconciliation_results (
              actual_fuel_consumption_liter,
              expected_fuel_consumption_liter,
              fuel_variance_percent,
              route_deviation_percent,
              reconciliation_score,
              status
            )
          `)
          .order('start_time', { ascending: false });

        if (fetchError) throw fetchError;
        setReports(data || []);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  // Compute stats/KPIs dynamically
  const stats = useMemo(() => {
    if (reports.length === 0) return { total: 0, avgScore: 0, avgDeviation: 0, criticalCount: 0 };
    
    let totalScore = 0;
    let scoreCount = 0;
    let totalDeviation = 0;
    let deviationCount = 0;
    let criticalCount = 0;

    reports.forEach(r => {
      const recon = r.reconciliation_results;
      if (recon) {
        if (recon.reconciliation_score !== null && recon.reconciliation_score !== undefined) {
          totalScore += parseFloat(recon.reconciliation_score);
          scoreCount++;
        }
        if (recon.route_deviation_percent !== null && recon.route_deviation_percent !== undefined) {
          totalDeviation += parseFloat(recon.route_deviation_percent);
          deviationCount++;
        }
        if (recon.status === 'fraud' || recon.status === 'warning' || r.status === 'failed') {
          criticalCount++;
        }
      }
    });

    return {
      total: reports.length,
      avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 100,
      avgDeviation: deviationCount > 0 ? (totalDeviation / deviationCount).toFixed(1) : '0.0',
      criticalCount
    };
  }, [reports]);

  // Filtered reports by search term
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports;
    const term = searchTerm.toLowerCase();
    return reports.filter(r => 
      (r.drivers?.name && r.drivers.name.toLowerCase().includes(term)) ||
      (r.vehicles?.hull_number && r.vehicles.hull_number.toLowerCase().includes(term)) ||
      (r.id && r.id.toLowerCase().includes(term))
    );
  }, [reports, searchTerm]);

  function handleExportCSV() {
    if (filteredReports.length === 0) return;

    const headers = [
      'ID Trip',
      'Tanggal Perjalanan',
      'Nama Supir',
      'No Lambung Truk',
      'Konsumsi Solar Aktual (L)',
      'Konsumsi Solar Ekspektasi (L)',
      'Varians Solar (%)',
      'Deviasi Rute (%)',
      'Skor Rekonsiliasi',
      'Status Trip',
      'Hasil Analisis'
    ];

    const rows = filteredReports.map(r => [
      r.id,
      new Date(r.start_time).toLocaleDateString('id-ID'),
      r.drivers?.name || '—',
      r.vehicles?.hull_number || '—',
      r.reconciliation_results?.actual_fuel_consumption_liter ?? '—',
      r.reconciliation_results?.expected_fuel_consumption_liter ?? '—',
      r.reconciliation_results?.fuel_variance_percent ?? '—',
      r.reconciliation_results?.route_deviation_percent ?? '—',
      r.reconciliation_results?.reconciliation_score ?? '—',
      r.status,
      r.reconciliation_results?.status || '—'
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sirekan_Laporan_Supir_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePrintPDF() {
    window.print();
  }

  return (
    <main className="page-container page-container--print" id="reports" style={{ paddingBottom: 120 }}>
      {/* Header Panel */}
      <div className="reports-header no-print">
        <div>
          <button 
            onClick={() => { window.location.hash = '#/dashboard'; }}
            className="reports-back"
          >
            <ChevronLeft size={16} />
            Kembali ke Dashboard
          </button>
          <h1 className="reports-title">Laporan Supir & Operasional</h1>
          <p className="reports-subtitle">Analisis rekonsiliasi bahan bakar dan deviasi rute supir</p>
        </div>
        <div className="reports-actions">
          <button onClick={handleExportCSV} className="btn-secondary" disabled={loading || filteredReports.length === 0}>
            <Download size={14} />
            Ekspor Excel (CSV)
          </button>
          <button onClick={handlePrintPDF} className="btn-primary" disabled={loading || filteredReports.length === 0}>
            <Printer size={14} />
            Cetak Laporan (PDF)
          </button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="print-header">
        <h2>SIREKAN COMMAND CENTER</h2>
        <h1>LAPORAN KINERJA OPERASIONAL & SUPIR</h1>
        <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
        <hr />
      </div>

      {/* KPI Cards Section */}
      {!loading && !error && reports.length > 0 && (
        <div className="no-print" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 16, 
          marginBottom: 24 
        }}>
          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-smoke)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Perjalanan</span>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{stats.total}</span>
            <span style={{ fontSize: 11, color: '#686868' }}>Tercatat di sistem</span>
          </div>
          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-smoke)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rata-rata Skor</span>
            <span style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              color: stats.avgScore >= 80 ? '#22c55e' : stats.avgScore >= 60 ? '#fbbf24' : '#ef4444' 
            }}>{stats.avgScore}%</span>
            <span style={{ fontSize: 11, color: '#686868' }}>Indeks kepatuhan supir</span>
          </div>
          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-smoke)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rerata Deviasi Rute</span>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{stats.avgDeviation}%</span>
            <span style={{ fontSize: 11, color: '#686868' }}>Penyimpangan jalur resmi</span>
          </div>
          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-smoke)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Indikasi Kecurangan</span>
            <span style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              color: stats.criticalCount > 0 ? '#ef4444' : '#22c55e' 
            }}>{stats.criticalCount}</span>
            <span style={{ fontSize: 11, color: '#686868' }}>Perlu perhatian segera</span>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="glass-card reports-card">
        {/* Search Bar / Filter Panel */}
        {!loading && !error && reports.length > 0 && (
          <div className="no-print" style={{ 
            padding: '16px 24px', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Search size={16} style={{ color: 'var(--color-smoke)', flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama supir, no lambung, atau ID trip..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 13,
                width: '100%',
                outline: 'none'
              }}
            />
          </div>
        )}

        {loading ? (
          <div className="reports-loading">
            <Loader size={32} className="spin" />
            <p>Memuat laporan...</p>
          </div>
        ) : error ? (
          <div className="reports-error">
            <p>⚠ Gagal memuat data: {error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="reports-empty">
            <FileText size={48} />
            <p>Belum ada data perjalanan terdaftar.</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="reports-empty no-print">
            <Search size={32} style={{ opacity: 0.3 }} />
            <p>Tidak ada hasil pencarian yang cocok untuk "{searchTerm}".</p>
          </div>
        ) : (
          <div className="reports-table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Supir</th>
                  <th>No Lambung</th>
                  <th>Aktual (L)</th>
                  <th>Ekspektasi (L)</th>
                  <th>Varians Solar</th>
                  <th>Deviasi Rute</th>
                  <th>Skor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const recon = report.reconciliation_results;
                  const variance = recon?.fuel_variance_percent;
                  const isHighVariance = variance ? Math.abs(parseFloat(variance)) > 15 : false;

                  // Render status label nicely
                  const score = recon?.reconciliation_score;
                  let scoreColor = '#686868';
                  if (score !== null && score !== undefined) {
                    scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#fbbf24' : '#ef4444';
                  }

                  let statusIcon = null;
                  let statusText = recon?.status || report.status;
                  let statusClass = `status-pill--${recon?.status || 'default'}`;

                  if (recon?.status === 'pass') {
                    statusIcon = <CheckCircle2 size={11} style={{ marginRight: 4, verticalAlign: 'middle', display: 'inline-block' }} />;
                  } else if (recon?.status === 'warning') {
                    statusIcon = <AlertTriangle size={11} style={{ marginRight: 4, verticalAlign: 'middle', display: 'inline-block' }} />;
                  } else if (recon?.status === 'fraud') {
                    statusIcon = <XCircle size={11} style={{ marginRight: 4, verticalAlign: 'middle', display: 'inline-block' }} />;
                  }

                  return (
                    <tr key={report.id} className="hover-lift" style={{ transition: 'background 0.2s' }}>
                      <td>{new Date(report.start_time).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="reports-table__bold">{report.drivers?.name || '—'}</td>
                      <td>{report.vehicles?.hull_number || '—'}</td>
                      <td>{recon?.actual_fuel_consumption_liter ? `${recon.actual_fuel_consumption_liter} L` : '—'}</td>
                      <td>{recon?.expected_fuel_consumption_liter ? `${recon.expected_fuel_consumption_liter} L` : '—'}</td>
                      <td className={isHighVariance ? 'text-critical' : ''} style={{ fontWeight: isHighVariance ? 600 : 400 }}>
                        {variance ? `${variance}%` : '—'}
                      </td>
                      <td>{recon?.route_deviation_percent ? `${recon.route_deviation_percent}%` : '—'}</td>
                      <td className="reports-table__bold" style={{ color: scoreColor }}>
                        {score !== null && score !== undefined ? `${score}` : '—'}
                      </td>
                      <td>
                        <span className={`status-pill ${statusClass}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {statusIcon}
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

