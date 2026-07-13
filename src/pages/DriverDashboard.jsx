import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import DriverHeader from '../components/DriverHeader';
import LiveMap from '../components/LiveMap';
import FuelMonitor from '../components/FuelMonitor';
import TripControls from '../components/TripControls';
import DriverNotifications from '../components/DriverNotifications';
import './driver-dashboard.css';

export default function DriverDashboard() {
  const [driver, setDriver] = useState(null);
  const [plannedTrips, setPlannedTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [fuelBefore, setFuelBefore] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Load driver using token saved in localStorage by DriverApp
  useEffect(() => {
    const token = localStorage.getItem('driverToken');
    if (!token) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: driverData, error: driverErr } = await supabase
          .from('drivers')
          .select('*')
          .eq('qr_token', token)
          .single();
        if (driverErr) throw driverErr;
        setDriver(driverData);
        const { data: tripsData, error: tripsErr } = await supabase
          .from('trips')
          .select(`id, status, start_time, vehicles ( hull_number, plate_number ), routes ( name, distance_km )`)
          .eq('driver_id', driverData.id)
          .eq('status', 'planned')
          .order('created_at', { ascending: false });
        if (tripsErr) throw tripsErr;
        setPlannedTrips(tripsData || []);
        if (tripsData && tripsData.length > 0) setSelectedTripId(tripsData[0].id);
      } catch (e) {
        console.error(e);
        setErrorMsg(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStartTrip = async (e) => {
    e.preventDefault();
    if (!selectedTripId) {
      setErrorMsg('Pilih rencana perjalanan terlebih dahulu.');
      return;
    }
    if (!fuelBefore || isNaN(fuelBefore) || parseFloat(fuelBefore) <= 0) {
      setErrorMsg('Masukkan volume solar awal yang valid.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          status: 'in_progress',
          start_time: new Date().toISOString(),
          fuel_before_liter: parseFloat(fuelBefore),
        })
        .eq('id', selectedTripId);
      if (error) throw error;
      setSuccessMsg('Perjalanan dimulai!');
      setPlannedTrips((prev) => prev.filter((t) => t.id !== selectedTripId));
      setSelectedTripId('');
      setFuelBefore('');
    } catch (e) {
      console.error(e);
      setErrorMsg('Gagal memulai perjalanan: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('driverToken');
    window.location.hash = '#/login';
  };

  return (
    <div className="driver-dashboard-container glass-card">
      {errorMsg && <div className="alert alert--error"><span>{errorMsg}</span></div>}
      {successMsg && <div className="alert alert--success"><span>{successMsg}</span></div>}
      {loading && <div className="loader"><span>Memproses…</span></div>}
      {driver && (
        <>
          <DriverHeader driver={driver} onLogout={handleLogout} />
          <div className="dashboard-main">
            <LiveMap driverId={driver.id} />
            <div className="dashboard-sidebar">
              <FuelMonitor driverId={driver.id} />
              <TripControls
                plannedTrips={plannedTrips}
                selectedTripId={selectedTripId}
                setSelectedTripId={setSelectedTripId}
                fuelBefore={fuelBefore}
                setFuelBefore={setFuelBefore}
                onStart={handleStartTrip}
              />
              <DriverNotifications driverId={driver.id} />
            </div>
          </div>
        </>
      )}
      {!driver && !loading && (
        <div className="centered-message">
          <p>Driver belum terverifikasi. Silakan pindai QR terlebih dahulu.</p>
        </div>
      )}
    </div>
  );
}
