import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Users, Plus, Edit2, Trash2, QrCode, X, Check,
  Phone, CreditCard, User, Search, Download, Printer,
  ChevronLeft, AlertTriangle, Loader, CheckCircle2,
  Eye, EyeOff, Mail
} from 'lucide-react';

// ─── QR Modal ────────────────────────────────────────────────────────────────
function QrModal({ driver, appUrl, onClose }) {
  const canvasRef = useRef(null);

  // Build the correct QR URL — works even when hash routing is used
  const baseUrl = appUrl.replace(/\/$/, '');
  const qrValue = driver.qr_token
    ? `${baseUrl}/#/driver?token=${driver.qr_token}`
    : '';

  function handleDownload() {
    const canvas = document.getElementById(`qr-canvas-${driver.id}`);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `QR_${driver.name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function handlePrint() {
    const canvas = document.getElementById(`qr-canvas-${driver.id}`);
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>QR - ${driver.name}</title>
      <style>
        body{font-family:sans-serif;text-align:center;padding:40px;background:#fff;}
        h2{margin:0 0 4px;font-size:22px;}
        p{margin:0 0 20px;color:#666;font-size:14px;}
        img{border:2px solid #eee;border-radius:12px;padding:12px;}
        .token{margin-top:8px;font-size:13px;font-family:monospace;background:#f5f5f5;padding:6px 12px;border-radius:6px;display:inline-block;}
        .info{margin-top:20px;font-size:13px;color:#444;}
      </style></head>
      <body>
        <h2>${driver.name}</h2>
        <p>${driver.phone || ''} ${driver.license_number ? '· SIM: ' + driver.license_number : ''}</p>
        <img src="${dataUrl}" width="220"/>
        <div class="token">Token: ${driver.qr_token || '—'}</div>
        <div class="info">Scan QR untuk akses App Driver SIREKAN</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  if (!driver.qr_token) {
    return (
      <div className="dm-overlay" onClick={onClose}>
        <div className="dm-modal dm-modal--sm" onClick={e => e.stopPropagation()}>
          <div className="dm-modal__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <QrCode size={18} style={{ color: '#ef4444' }} />
              <h2 className="dm-modal__title">QR Tidak Tersedia</h2>
            </div>
            <button className="dm-icon-btn" onClick={onClose}><X size={16} /></button>
          </div>
          <div className="dm-modal__body" style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ color: '#fca5a5', fontSize: 14, marginBottom: 8 }}>
              Driver <strong style={{ color: '#fff' }}>{driver.name}</strong> belum memiliki QR Token.
            </p>
            <p style={{ color: '#686868', fontSize: 13 }}>
              Refresh halaman untuk auto-generate token, atau hapus dan tambahkan driver ini kembali.
            </p>
            <button className="dm-btn dm-btn--outline" style={{ marginTop: 16 }} onClick={onClose}>Tutup</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dm-overlay" onClick={onClose}>
      <div className="dm-modal dm-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="dm-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <QrCode size={18} style={{ color: '#6b62f2' }} />
            <h2 className="dm-modal__title">QR Code — {driver.name}</h2>
          </div>
          <button className="dm-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="dm-modal__body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 20,
            boxShadow: '0 0 0 1px rgba(107,98,242,0.2), 0 8px 32px rgba(107,98,242,0.15)'
          }}>
            <QRCodeCanvas
              id={`qr-canvas-${driver.id}`}
              ref={canvasRef}
              value={qrValue}
              size={220}
              level="H"
            />
          </div>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <p style={{ color: '#a3a3a3', fontSize: 13, margin: '0 0 6px' }}>Scan QR ini untuk membuka App Driver SIREKAN</p>
            <div style={{
              background: 'rgba(107,98,242,0.08)', border: '1px solid rgba(107,98,242,0.2)',
              borderRadius: 8, padding: '8px 14px', display: 'inline-block'
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#9b8ff7', letterSpacing: '0.5px' }}>
                {driver.qr_token}
              </span>
            </div>
            <p style={{ color: '#404040', fontSize: 10, margin: '6px 0 0', wordBreak: 'break-all' }}>{qrValue}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button className="dm-btn dm-btn--outline" style={{ flex: 1 }} onClick={handleDownload}>
              <Download size={14} /> Download PNG
            </button>
            <button className="dm-btn dm-btn--primary" style={{ flex: 1 }} onClick={handlePrint}>
              <Printer size={14} /> Print QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Driver Form Modal ────────────────────────────────────────────────────────
function DriverFormModal({ driver, onClose, onSuccess }) {
  const isEdit = !!driver;
  const [form, setForm] = useState({
    name: driver?.name || '',
    phone: driver?.phone || '',
    license_number: driver?.license_number || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Nama wajib diisi.'); return; }

    setLoading(true);
    try {
      if (isEdit) {
        // Update driver record
        const { error: dErr } = await supabase
          .from('drivers')
          .update({ 
            name: form.name.trim(), 
            phone: form.phone.trim(), 
            license_number: form.license_number.trim() 
          })
          .eq('id', driver.id);
        if (dErr) throw dErr;
      } else {
        // Generate a clean and readable unique token format like: qr_budi_47
        const cleanName = form.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomNum = Math.floor(10 + Math.random() * 90);
        const generatedQrToken = `qr_${cleanName}_${randomNum}`;

        // Directly insert into drivers table (no auth signUp needed)
        const { error: dErr } = await supabase.from('drivers').insert({
          company_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          name: form.name.trim(),
          phone: form.phone.trim(),
          license_number: form.license_number.trim(),
          qr_token: generatedQrToken,
          status: 'active'
        });
        if (dErr) throw dErr;
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dm-overlay" onClick={onClose}>
      <div className="dm-modal" onClick={e => e.stopPropagation()}>
        <div className="dm-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={18} style={{ color: '#6b62f2' }} />
            <h2 className="dm-modal__title">{isEdit ? 'Edit Driver' : 'Tambah Driver Baru'}</h2>
          </div>
          <button className="dm-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <form className="dm-modal__body" onSubmit={handleSubmit}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13
            }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div className="dm-form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="dm-field">
              <label className="dm-label"><User size={12} /> Nama Lengkap *</label>
              <input className="dm-input" name="name" value={form.name} onChange={handleChange} placeholder="Nama lengkap driver" required />
            </div>
            <div className="dm-field">
              <label className="dm-label"><Phone size={12} /> Nomor HP</label>
              <input className="dm-input" name="phone" value={form.phone} onChange={handleChange} placeholder="08xxxxxxxxxx" />
            </div>
            <div className="dm-field">
              <label className="dm-label"><CreditCard size={12} /> Nomor SIM</label>
              <input className="dm-input" name="license_number" value={form.license_number} onChange={handleChange} placeholder="Nomor SIM" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="button" className="dm-btn dm-btn--outline" style={{ flex: 1 }} onClick={onClose} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="dm-btn dm-btn--primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <Loader size={14} className="spin-icon" /> : <Check size={14} />}
              {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ driver, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  async function handleDelete() {
    setLoading(true);
    await onConfirm(driver.id);
    setLoading(false);
  }
  return (
    <div className="dm-overlay" onClick={onClose}>
      <div className="dm-modal dm-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="dm-modal__header">
          <h2 className="dm-modal__title" style={{ color: '#ef4444' }}>
            <Trash2 size={18} /> Hapus Driver
          </h2>
          <button className="dm-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="dm-modal__body">
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '14px 16px', marginBottom: 20, color: '#fca5a5', fontSize: 14, lineHeight: 1.6
          }}>
            ⚠️ Anda yakin ingin menghapus driver <strong style={{ color: '#fff' }}>{driver.name}</strong>?
            <br /><span style={{ fontSize: 12, color: '#ef4444' }}>Data perjalanan dan riwayat driver ini akan tetap tersimpan.</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="dm-btn dm-btn--outline" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Batal</button>
            <button className="dm-btn dm-btn--danger" style={{ flex: 1 }} onClick={handleDelete} disabled={loading}>
              {loading ? <Loader size={14} className="spin-icon" /> : <Trash2 size={14} />}
              {loading ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DriverManagementPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error' }

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [deleteDriver, setDeleteDriver] = useState(null);
  const [qrDriver, setQrDriver] = useState(null);

  const appUrl = window.location.origin;

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('drivers')
        .select('id, name, phone, license_number, qr_token, status, created_at')
        .order('created_at', { ascending: false });
      if (fetchErr) throw fetchErr;

      // Auto-fix any drivers missing a qr_token
      const toFix = (data || []).filter(d => !d.qr_token);
      for (const d of toFix) {
        const cleanName = d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomNum = Math.floor(10 + Math.random() * 90);
        const generatedToken = `qr_${cleanName}_${randomNum}`;
        await supabase.from('drivers').update({ qr_token: generatedToken }).eq('id', d.id);
        d.qr_token = generatedToken; // patch local copy
      }

      setDrivers(data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  async function handleDelete(id) {
    try {
      const { error: err } = await supabase.from('drivers').delete().eq('id', id);
      if (err) throw err;
      showToast('Driver berhasil dihapus.', 'success');
      setDeleteDriver(null);
      fetchDrivers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleSuccess(msg = 'Data berhasil disimpan!') {
    setShowAdd(false);
    setEditDriver(null);
    showToast(msg, 'success');
    fetchDrivers();
  }

  const filtered = drivers.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.phone?.includes(search) ||
    d.license_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="page-container" id="driver-management">
      {/* Header */}
      <div className="dm-page-header">
        <div>
          <p className="dm-page-eyebrow">
            <a href="#/dashboard" style={{ color: '#6b62f2', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ChevronLeft size={14} /> Dashboard
            </a>
          </p>
          <h1 className="dm-page-title">Manajemen Driver</h1>
          <p className="dm-page-subtitle">Kelola data supir armada — tambah, edit, hapus, dan cetak QR Code akses.</p>
        </div>
        <button className="dm-btn dm-btn--primary dm-btn--lg" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Tambah Driver
        </button>
      </div>

      {/* Stats bar */}
      <div className="dm-stats-bar">
        <div className="dm-stat-chip">
          <Users size={14} style={{ color: '#6b62f2' }} />
          <span className="dm-stat-chip__value">{drivers.length}</span>
          <span className="dm-stat-chip__label">Total Driver</span>
        </div>
        <div className="dm-stat-chip">
          <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
          <span className="dm-stat-chip__value">{drivers.length}</span>
          <span className="dm-stat-chip__label">Aktif</span>
        </div>
        <div className="dm-stat-chip">
          <QrCode size={14} style={{ color: '#f59e0b' }} />
          <span className="dm-stat-chip__value">{drivers.length}</span>
          <span className="dm-stat-chip__label">QR Tersedia</span>
        </div>
      </div>

      {/* Search */}
      <div className="dm-search-bar">
        <div className="dm-search-wrap">
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#686868' }} />
          <input
            className="dm-input dm-search-input"
            placeholder="Cari driver berdasarkan nama, HP, atau SIM..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="dm-table-wrap glass-card">
        {error ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#ef4444' }}>
            <AlertTriangle size={28} style={{ marginBottom: 8 }} /><br />
            Gagal memuat data: {error}
          </div>
        ) : loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#686868' }}>
            <Loader size={28} className="spin-icon" style={{ marginBottom: 12 }} /><br />
            Memuat data driver...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#686868' }}>
            <Users size={32} style={{ opacity: 0.3, marginBottom: 12 }} /><br />
            {search ? `Tidak ditemukan driver dengan kata kunci "${search}"` : 'Belum ada driver. Klik Tambah Driver.'}
          </div>
        ) : (
          <table className="dm-table">
            <thead>
              <tr>
                <th className="dm-th">#</th>
                <th className="dm-th">Nama Driver</th>
                <th className="dm-th dm-th--hide-mobile">Nomor HP</th>
                <th className="dm-th dm-th--hide-mobile">Nomor SIM</th>
                <th className="dm-th" style={{ textAlign: 'center' }}>QR Code</th>
                <th className="dm-th" style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((driver, idx) => (
                <tr key={driver.id} className="dm-tr">
                  <td className="dm-td" style={{ color: '#686868', fontSize: 13 }}>{idx + 1}</td>
                  <td className="dm-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `hsl(${(idx * 37) % 360}, 65%, 48%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0
                      }}>
                        {driver.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#e5e5e5', fontSize: 14 }}>{driver.name}</p>
                        <p className="dm-th--show-mobile" style={{ margin: 0, color: '#686868', fontSize: 12 }}>
                          {driver.phone || '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="dm-td dm-td--hide-mobile" style={{ color: '#a3a3a3', fontSize: 14 }}>
                    {driver.phone || <span style={{ color: '#404040' }}>—</span>}
                  </td>
                  <td className="dm-td dm-td--hide-mobile" style={{ color: '#a3a3a3', fontSize: 14 }}>
                    {driver.license_number || <span style={{ color: '#404040' }}>—</span>}
                  </td>
                  <td className="dm-td" style={{ textAlign: 'center' }}>
                    <button
                      className="dm-qr-btn"
                      onClick={() => setQrDriver(driver)}
                      title="Lihat QR Code"
                    >
                      <QrCode size={16} />
                    </button>
                  </td>
                  <td className="dm-td" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="dm-icon-btn dm-icon-btn--edit"
                        onClick={() => setEditDriver(driver)}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="dm-icon-btn dm-icon-btn--delete"
                        onClick={() => setDeleteDriver(driver)}
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Hidden QR canvas grid (untuk generate semua QR sekaligus) */}
      <div style={{ position: 'absolute', left: -9999, top: -9999, visibility: 'hidden' }}>
        {drivers.map(d => (
          <QRCodeCanvas
            key={d.id}
            id={`qr-canvas-${d.id}`}
            value={`${appUrl}/#/driver?token=${d.qr_token || ''}`}
            size={300}
            level="H"
          />
        ))}
      </div>

      {/* Modals */}
      {showAdd && (
        <DriverFormModal
          driver={null}
          onClose={() => setShowAdd(false)}
          onSuccess={() => handleSuccess('Driver baru berhasil ditambahkan! ✅')}
        />
      )}
      {editDriver && (
        <DriverFormModal
          driver={editDriver}
          onClose={() => setEditDriver(null)}
          onSuccess={() => handleSuccess('Data driver berhasil diperbarui! ✅')}
        />
      )}
      {deleteDriver && (
        <DeleteModal
          driver={deleteDriver}
          onClose={() => setDeleteDriver(null)}
          onConfirm={handleDelete}
        />
      )}
      {qrDriver && (
        <QrModal
          driver={qrDriver}
          appUrl={appUrl}
          onClose={() => setQrDriver(null)}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: toast.type === 'success' ? '#86efac' : '#fca5a5',
          padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          backdropFilter: 'blur(16px)', zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeInUp 0.3s ease',
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}
    </main>
  );
}
