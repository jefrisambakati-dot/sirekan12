import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Camera, Scan, Truck, ArrowRight, ShieldCheck, LogOut, 
  Loader, User, Play, Pause, AlertOctagon, Compass, 
  Gauge, PhoneCall, Activity, FileText, CheckCircle, X, MapPin 
} from 'lucide-react';
import MapContainer from './MapContainer';
import FuelGraph from './FuelGraph';
import './DriverDashboard.css';

export default function DriverApp() {
  const [driver, setDriver] = useState(null);
  const [plannedTrips, setPlannedTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [fuelBefore, setFuelBefore] = useState('');
  
  const [qrInput, setQrInput] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [hasSession, setHasSession] = useState(false);

  // Speedometer simulation state
  const [simSpeed, setSimSpeed] = useState(0);

  // Modal states
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState('Kebocoran Solar');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [fuelAfter, setFuelAfter] = useState('');

  const qrScannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  // Fetch driver trips (both planned and in_progress)
  async function fetchDriverTrips(driverId) {
    try {
      const { data: tripsData, error: tripsErr } = await supabase
        .from('trips')
        .select(`
          id, status, start_time, fuel_before_liter, fuel_after_liter,
          vehicles ( id, hull_number, plate_number, fuel_tank_capacity ),
          routes ( id, name, distance_km, source_location, destination_location, polyline )
        `)
        .eq('driver_id', driverId)
        .in('status', ['planned', 'in_progress', 'paused'])
        .order('created_at', { ascending: false });

      if (tripsErr) throw tripsErr;

      // For active trip, also fetch latest GPS point
      let enrichedTrips = tripsData || [];
      const activeRaw = enrichedTrips.find(t => t.status === 'in_progress' || t.status === 'paused');
      if (activeRaw) {
        const { data: gpsRows } = await supabase
          .from('gps_data')
          .select('latitude, longitude, speed_kmh, recorded_at, location_name')
          .eq('trip_id', activeRaw.id)
          .order('recorded_at', { ascending: false })
          .limit(1);

        const latestGps = gpsRows && gpsRows.length > 0
          ? { lat: parseFloat(gpsRows[0].latitude), lng: parseFloat(gpsRows[0].longitude), speed: gpsRows[0].speed_kmh }
          : null;

        activeRaw.latestGps = latestGps;
      }

      const active = activeRaw || null;
      const planned = enrichedTrips.filter(t => t.status === 'planned') || [];

      setActiveTrip(active || null);
      setPlannedTrips(planned);
      if (planned.length > 0 && !selectedTripId) {
        setSelectedTripId(planned[0].id);
      }
    } catch (err) {
      console.error('Error fetching driver trips:', err);
      setErrorMsg('Gagal memuat rencana perjalanan.');
    }
  }

  // Check if session exists and load driver details if role is driver
  useEffect(() => {
    let mounted = true;
    async function loadDriverFromSession() {
      setLoading(true);
      setErrorMsg(null);
      try {
        // 1. Check if a token is passed in the URL (e.g. from scanning with standard phone camera)
        const hash = window.location.hash;
        if (hash.includes('?')) {
          const query = hash.split('?')[1];
          const params = new URLSearchParams(query);
          const urlToken = params.get('token') || params.get('driverId');
          if (urlToken && mounted) {
            // Remove the token query param from URL to clean it up
            window.location.hash = hash.split('?')[0];
            await handleVerifyDriverToken(urlToken);
            setLoading(false);
            return;
          }
        }

        // 2. Check if a token is saved in localStorage (keeps supir logged in)
        const savedToken = localStorage.getItem('driverToken');
        if (savedToken && mounted) {
          const { data: driverData, error: driverErr } = await supabase
            .from('drivers')
            .select('*')
            .eq('qr_token', savedToken)
            .single();

          if (!driverErr && driverData && mounted) {
            setDriver(driverData);
            await fetchDriverTrips(driverData.id);
            setLoading(false);
            return;
          }
        }

        // 3. Fallback to Supabase session role (legacy fallback)
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (session?.user) {
          setHasSession(true);
          
          const { data: userProfile, error: profileErr } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (!profileErr && userProfile?.role === 'driver') {
            const { data: driverData, error: driverErr } = await supabase
              .from('drivers')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (!driverErr && driverData && mounted) {
              setDriver(driverData);
              await fetchDriverTrips(driverData.id);
            }
          }
        }
      } catch (err) {
        console.error('Error loading driver session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDriverFromSession();
    return () => {
      mounted = false;
    };
  }, []);

  // Fluctuating speed simulation when trip is active
  useEffect(() => {
    if (!activeTrip || activeTrip.status !== 'in_progress') {
      setSimSpeed(0);
      return;
    }
    setSimSpeed(Math.floor(38 + Math.random() * 15));
    const interval = setInterval(() => {
      setSimSpeed(Math.floor(38 + Math.random() * 15));
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTrip]);

  // Real-time subscription to check if our active trip got completed or changed elsewhere
  useEffect(() => {
    if (!activeTrip?.id) return;
    const channel = supabase
      .channel(`active_trip_changes_${activeTrip.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${activeTrip.id}` },
        (payload) => {
          if (payload.new && driver) {
            if (payload.new.status === 'completed') {
              setActiveTrip(null);
              fetchDriverTrips(driver.id);
            } else {
              setActiveTrip(prev => prev ? { ...prev, status: payload.new.status } : null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTrip?.id, driver]);

  // Poll latest GPS for active trip every 5 seconds to move truck marker on map
  useEffect(() => {
    if (!activeTrip?.id || activeTrip.status !== 'in_progress') return;
    const poll = async () => {
      const { data: gpsRows } = await supabase
        .from('gps_data')
        .select('latitude, longitude, speed_kmh, recorded_at')
        .eq('trip_id', activeTrip.id)
        .order('recorded_at', { ascending: false })
        .limit(1);
      if (gpsRows && gpsRows.length > 0) {
        const g = gpsRows[0];
        const freshGps = { lat: parseFloat(g.latitude), lng: parseFloat(g.longitude), speed: g.speed_kmh };
        setActiveTrip(prev => prev ? { ...prev, latestGps: freshGps } : null);
        setSimSpeed(Math.round(g.speed_kmh || 0));
      }
    };
    poll(); // immediate
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [activeTrip?.id, activeTrip?.status]);

  // Stop camera when component unmounts or scanner status changes
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  async function startScanner() {
    setScannerActive(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode('qr-reader');
        scannerInstanceRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            handleVerifyDriverToken(decodedText);
            stopScanner();
          },
          () => {}
        );
      } catch (err) {
        console.error('Camera access error:', err);
        setErrorMsg('Gagal mengakses kamera. Silakan gunakan Simulasi Input Token di bawah.');
        setScannerActive(false);
      }
    }, 300);
  }

  function stopScanner() {
    if (scannerInstanceRef.current && scannerInstanceRef.current.isScanning) {
      scannerInstanceRef.current.stop()
        .then(() => {
          scannerInstanceRef.current = null;
          setScannerActive(false);
        })
        .catch(err => console.error('Error stopping scanner:', err));
    } else {
      setScannerActive(false);
    }
  }

  async function handleVerifyDriverToken(token) {
    setLoading(true);
    setErrorMsg(null);
    try {
      let cleanToken = token.trim();
      // If the scanned text is a full URL, extract the token/driverId parameter
      if (cleanToken.includes('?')) {
        const query = cleanToken.split('?')[1];
        const params = new URLSearchParams(query);
        cleanToken = params.get('token') || params.get('driverId') || cleanToken;
      }

      const { data: driverData, error: driverErr } = await supabase
        .from('drivers')
        .select('*')
        .eq('qr_token', cleanToken)
        .single();

      if (driverErr || !driverData) {
        throw new Error('Supir dengan QR Token tersebut tidak ditemukan.');
      }

      setDriver(driverData);
      localStorage.setItem('driverToken', cleanToken); // Persist driver token locally
      await fetchDriverTrips(driverData.id);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Token tidak valid.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartTrip(e) {
    e.preventDefault();
    if (!selectedTripId) {
      setErrorMsg('Pilihlah rencana perjalanan terlebih dahulu.');
      return;
    }
    if (!fuelBefore || isNaN(fuelBefore) || parseFloat(fuelBefore) <= 0) {
      setErrorMsg('Masukkan volume solar awal yang valid.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const selectedTrip = plannedTrips.find(t => t.id === selectedTripId);
      const polyline = selectedTrip?.routes?.polyline;
      const startCoord = polyline && polyline.length > 0 ? polyline[0] : [122.5137, -3.9772];

      const { error } = await supabase
        .from('trips')
        .update({
          status: 'in_progress',
          start_time: new Date().toISOString(),
          fuel_before_liter: parseFloat(fuelBefore),
        })
        .eq('id', selectedTripId);

      if (error) throw error;

      // Insert initial GPS coordinate immediately so map isn't blank
      await supabase
        .from('gps_data')
        .insert({
          trip_id: selectedTripId,
          latitude: startCoord[1],
          longitude: startCoord[0],
          speed_kmh: 0,
          recorded_at: new Date().toISOString(),
          location_name: selectedTrip?.routes?.source_location || 'Titik Asal',
          is_geofence_official: true
        });

      // Insert initial Fuel Sensor data immediately so graph isn't blank
      await supabase
        .from('fuel_sensor_data')
        .insert({
          trip_id: selectedTripId,
          fuel_level_liter: parseFloat(fuelBefore),
          fuel_cap_status: 'CLOSED',
          temperature_celsius: 34.0,
          recorded_at: new Date().toISOString()
        });

      setSuccessMsg('Perjalanan berhasil dimulai! Layar dialihkan ke Dashboard Aktif.');
      if (driver) {
        await fetchDriverTrips(driver.id);
      }
      setFuelBefore('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memulai perjalanan: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePauseTrip() {
    if (!activeTrip) return;
    setLoading(true);
    try {
      const newStatus = activeTrip.status === 'in_progress' ? 'paused' : 'in_progress';
      const { error } = await supabase
        .from('trips')
        .update({ status: newStatus })
        .eq('id', activeTrip.id);
      
      if (error) throw error;
      setActiveTrip(prev => ({ ...prev, status: newStatus }));
      setSuccessMsg(`Perjalanan berhasil ${newStatus === 'paused' ? 'ditunda sementara' : 'dilanjutkan'}!`);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal mengubah status perjalanan.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEndTrip(e) {
    e.preventDefault();
    if (!activeTrip) return;
    if (!fuelAfter || isNaN(fuelAfter) || parseFloat(fuelAfter) <= 0) {
      setErrorMsg('Masukkan volume solar akhir yang valid.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          fuel_after_liter: parseFloat(fuelAfter)
        })
        .eq('id', activeTrip.id);

      if (error) throw error;

      setSuccessMsg('Perjalanan selesai! Data perjalanan Anda berhasil direkonsiliasi.');
      setShowEndModal(false);
      setFuelAfter('');
      setActiveTrip(null);
      if (driver) {
        await fetchDriverTrips(driver.id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal mengakhiri perjalanan.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReportIncident(e) {
    e.preventDefault();
    if (!activeTrip) return;
    if (!incidentNotes.trim()) {
      setErrorMsg('Silakan masukkan catatan insiden.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('alerts')
        .insert({
          trip_id: activeTrip.id,
          fraud_type: 'incident_report',
          severity: 'critical',
          status: 'open',
          description: `LAPORAN SUPIR (${driver?.name || 'Supir'}): [${incidentType}] ${incidentNotes}`,
          evidence_data: { reporter_name: driver?.name, reported_at: new Date().toISOString() }
        });

      if (error) throw error;
      setSuccessMsg('Laporan insiden berhasil dikirim ke Pusat Dispatcher.');
      setShowIncidentModal(false);
      setIncidentNotes('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal mengirim laporan insiden.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    localStorage.removeItem('driverToken'); // Clear driver profile
    setDriver(null);
    setPlannedTrips([]);
    setActiveTrip(null);
    setSelectedTripId('');
    setFuelBefore('');
    setErrorMsg(null);
    setSuccessMsg(null);
    // Stay on driver scan screen
    window.location.hash = '#/driver';
  }

  return (
    <div className="driver-app-container" style={{ padding: activeTrip ? '0' : '20px 0' }}>
      {/* Back button to admin dashboard if dispatcher is logged in */}
      {hasSession && !activeTrip && (
        <a 
          href="#/dashboard" 
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#a3a3a3',
            textDecoration: 'none',
            fontSize: '13px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e5e5e5'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#a3a3a3'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
        >
          ← Kembali ke Dashboard Admin
        </a>
      )}

      {errorMsg && (
        <div className="driver-app-alert driver-app-alert--error" style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1100, maxWidth: '90%' }}>
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} style={{ marginLeft: 12, opacity: 0.7 }}><X size={14}/></button>
        </div>
      )}

      {successMsg && (
        <div className="driver-app-alert driver-app-alert--success" style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1100, maxWidth: '90%' }}>
          <ShieldCheck size={20} />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} style={{ marginLeft: 12, opacity: 0.7 }}><X size={14}/></button>
        </div>
      )}

      {/* RENDER VIEW 1: ACTIVE TRIP DASHBOARD */}
      {driver && activeTrip ? (
        <div className="driver-dashboard-wrapper">
          {/* Header Panel */}
          <header className="driver-dashboard-header">
            <div className="driver-info-block">
              <div className="driver-avatar-circle">
                {driver.name.charAt(0).toUpperCase()}
              </div>
              <div className="driver-text">
                <h3>{driver.name}</h3>
                <p>Armada: {activeTrip.vehicles?.hull_number || 'Truk'} ({activeTrip.vehicles?.plate_number || '—'})</p>
              </div>
            </div>
            
            <div className="header-status-actions">
              <span className={activeTrip.status === 'in_progress' ? 'status-pill-active' : 'status-pill-paused'}>
                <span className="pulse-dot"></span>
                {activeTrip.status === 'in_progress' ? 'Perjalanan Aktif' : 'Ditunda'}
              </span>
              <button onClick={handleReset} className="btn-header-logout">
                Keluar
              </button>
            </div>
          </header>

          {/* Grid Layout */}
          <div className="dashboard-grid">
            
            {/* Left Column: Stats & Controls */}
            <div className="dashboard-sidebar-column">
              
              {/* Telemetry Indicator */}
              <div className="telemetry-card">
                <div className="speedometer-dial" style={{ borderTopColor: simSpeed > 50 ? '#ef4444' : '#6b62f2' }}>
                  <span className="speedometer-value">{simSpeed}</span>
                  <span className="speedometer-unit">KM/JAM</span>
                </div>
                <div className="card-title-row" style={{ justifyContent: 'center', marginBottom: 6 }}>
                  <Activity size={14} /> Live Telemetri Sensor
                </div>
                <div className="telemetry-stats-row">
                  <div className="telemetry-stat-item">
                    <div className="telemetry-stat-label">Tutup Tangki</div>
                    <div className="telemetry-stat-value" style={{ color: '#22c55e' }}>AMAN</div>
                  </div>
                  <div className="telemetry-stat-item">
                    <div className="telemetry-stat-label">Safety Score</div>
                    <div className="telemetry-stat-value" style={{ color: '#22c55e' }}>98/100</div>
                  </div>
                </div>
              </div>

              {/* Route Summary */}
              <div className="route-details-card">
                <div className="card-title-row">
                  <Compass size={14} /> Detail Rute Perjalanan
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="route-point">
                    <div className="route-dot"></div>
                    <div className="route-point-text">
                      <h4>Asal</h4>
                      <p>{activeTrip.routes?.source_location || 'Loading...'}</p>
                    </div>
                  </div>
                  <div className="route-point">
                    <div className="route-dot destination"></div>
                    <div className="route-point-text">
                      <h4>Tujuan</h4>
                      <p>{activeTrip.routes?.destination_location || 'Loading...'}</p>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: '#a3a3a3', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Jarak Estimasi:</span>
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>{activeTrip.routes?.distance_km} KM</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="control-actions-card">
                <div className="card-title-row" style={{ marginBottom: 4 }}>
                  <Gauge size={14} /> Kontrol Perjalanan
                </div>
                
                <button onClick={handlePauseTrip} className={activeTrip.status === 'in_progress' ? 'btn-control-pause' : 'btn-control-resume'}>
                  {activeTrip.status === 'in_progress' ? (
                    <>
                      <Pause size={16} /> Tunda Perjalanan
                    </>
                  ) : (
                    <>
                      <Play size={16} /> Lanjutkan Perjalanan
                    </>
                  )}
                </button>

                <button onClick={() => setShowIncidentModal(true)} className="btn-control-incident">
                  <AlertOctagon size={16} /> Laporkan Insiden
                </button>

                <button onClick={() => setShowEndModal(true)} className="btn-control-end">
                  <CheckCircle size={16} /> Akhiri Perjalanan
                </button>
              </div>

            </div>

            {/* Right Column: Live Map & Fuel Monitor */}
            <div className="dashboard-map-sensor-column">
              {/* Map */}
              <div className="map-card-wrapper">
                <MapContainer 
                  selectedTripId={activeTrip.id} 
                  selectedTruckId={activeTrip.vehicles?.hull_number}
                  activeTrips={[activeTrip]}
                />
              </div>

              {/* Fuel sensor graph */}
              <div className="sensor-card-wrapper">
                <FuelGraph 
                  selectedTripId={activeTrip.id}
                  selectedTruckId={activeTrip.vehicles?.hull_number}
                  selectedTrip={activeTrip}
                />
              </div>
            </div>

          </div>

          {/* INCIDENT REPORT MODAL */}
          {showIncidentModal && (
            <div className="modal-overlay">
              <div className="modal-content-glass">
                <div className="modal-header">
                  <h3><AlertOctagon size={18} style={{ color: '#ef4444' }} /> Laporkan Insiden</h3>
                  <button onClick={() => setShowIncidentModal(false)} className="btn-close-modal"><X size={18}/></button>
                </div>
                <form onSubmit={handleReportIncident}>
                  <div className="modal-form-group">
                    <label>Jenis Insiden</label>
                    <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
                      <option value="Kebocoran Solar">Kebocoran Solar (Fuel Leak)</option>
                      <option value="Ban Bocor">Ban Bocor (Flat Tire)</option>
                      <option value="Jalan Terhambat">Rute Terblokir / Macet Total</option>
                      <option value="Kecelakaan">Kecelakaan Kerja</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div className="modal-form-group">
                    <label>Catatan & Kronologi Kejadian</label>
                    <textarea 
                      rows="4" 
                      placeholder="Jelaskan detail insiden secara singkat..." 
                      value={incidentNotes} 
                      onChange={(e) => setIncidentNotes(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <div className="modal-actions-row">
                    <button type="button" onClick={() => setShowIncidentModal(false)} className="btn-cancel">Batal</button>
                    <button type="submit" className="btn-submit">Kirim Laporan</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* END TRIP MODAL */}
          {showEndModal && (
            <div className="modal-overlay">
              <div className="modal-content-glass">
                <div className="modal-header">
                  <h3><CheckCircle size={18} style={{ color: '#6b62f2' }} /> Konfirmasi Akhiri Perjalanan</h3>
                  <button onClick={() => setShowEndModal(false)} className="btn-close-modal"><X size={18}/></button>
                </div>
                <form onSubmit={handleEndTrip}>
                  <p style={{ fontSize: 13, color: '#a3a3a3', marginBottom: 16 }}>
                    Pastikan kendaraan telah tiba di lokasi tujuan resmi sebelum mengakhiri perjalanan ini.
                  </p>
                  <div className="modal-form-group">
                    <label>Volume Solar Akhir Tangki (Liter)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder="Contoh: 180.5" 
                      value={fuelAfter} 
                      onChange={(e) => setFuelAfter(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="modal-actions-row">
                    <button type="button" onClick={() => setShowEndModal(false)} className="btn-cancel">Kembali</button>
                    <button type="submit" className="btn-submit">Selesaikan Trip</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* RENDER VIEW 2: WELCOME SCANNER / START TRIP SELECTION */
        <div className="driver-app-card glass-card" style={{ margin: '40px auto' }}>
          <div className="driver-app-header">
            <Scan className="driver-app-logo-icon" />
            <h1>SIREKAN Driver</h1>
            <p>Sistem Pemindaian QR & Aktivasi Trip</p>
          </div>

          {loading && (
            <div className="driver-app-loading">
              <Loader className="spin" size={24} />
              <p>Memproses data...</p>
            </div>
          )}

          {/* QR Scan or Manual Input Stage */}
          {!driver && !loading && (
            <div className="driver-app-scan-step">
              <p className="step-desc">
                Pindai QR Code pada aplikasi supir Anda atau masukkan token secara manual untuk melihat rencana perjalanan hari ini.
              </p>

              {scannerActive ? (
                <div className="qr-scanner-box">
                  <div id="qr-reader" ref={qrScannerRef} style={{ width: '100%' }}></div>
                  <button type="button" className="btn-secondary" onClick={stopScanner} style={{ marginTop: 12 }}>
                    Batal Pemindaian
                  </button>
                </div>
              ) : (
                <button type="button" className="driver-app-scan-btn" onClick={startScanner}>
                  <Camera size={24} />
                  <span>Pindai QR Supir</span>
                </button>
              )}

              <div className="driver-app-divider">
                <span>atau</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (qrInput) handleVerifyDriverToken(qrInput);
                }}
                className="driver-app-sim-form"
              >
                <label>Simulasi Token QR</label>
                <div className="driver-app-sim-input-row">
                  <input
                    type="text"
                    placeholder="Contoh: qr_budi_01"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                  />
                  <button type="submit" className="btn-primary">
                    Kirim
                  </button>
                </div>
                <span className="helper-text">Tips: Gunakan token supir aktif seperti <strong>qr_budi_01</strong> atau <strong>qr_hendra_02</strong>.</span>
              </form>
            </div>
          )}

          {/* Planned Trip Setup Form */}
          {driver && !loading && (
            <div className="driver-app-trip-step">
              <div className="driver-profile-summary">
                <div className="driver-profile-avatar">
                  <User size={20} />
                </div>
                <div>
                  <h3>{driver.name}</h3>
                  <p>SIM: {driver.license_number}</p>
                </div>
                <button onClick={handleReset} className="driver-app-logout" title="Keluar">
                  <LogOut size={16} />
                </button>
              </div>

              {plannedTrips.length === 0 ? (
                <div className="driver-app-empty-trips">
                  <p>Tidak ada rencana perjalanan (`planned`) untuk Anda hari ini.</p>
                  <button onClick={handleReset} className="btn-secondary" style={{ marginTop: 16 }}>
                    Selesai / Scan Supir Lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleStartTrip} className="driver-app-trip-form">
                  <div className="driver-app-form-group">
                    <label>Pilih Rencana Perjalanan</label>
                    <select
                      value={selectedTripId}
                      onChange={(e) => setSelectedTripId(e.target.value)}
                      required
                    >
                      {plannedTrips.map(trip => (
                        <option key={trip.id} value={trip.id}>
                          {trip.routes?.name} — Truk {trip.vehicles?.hull_number || '—'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="driver-app-form-group">
                    <label>Volume Solar Sebelum Berangkat (Liter)</label>
                    <div className="fuel-input-wrapper">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Contoh: 250"
                        value={fuelBefore}
                        onChange={(e) => setFuelBefore(e.target.value)}
                        required
                      />
                      <span>L</span>
                    </div>
                  </div>

                  <button type="submit" className="driver-app-submit-btn">
                    Mulai Perjalanan
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
