import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import './index.css';
import DashboardPage from './components/DashboardPage';
import FloatingNav from './components/FloatingNav';
import LoginPage from './components/LoginPage';
import ReportsPage from './components/ReportsPage';
import DriverApp from './components/DriverApp';
import DriverManagementPage from './components/DriverManagementPage';

function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to hash routing
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Listen to Supabase Auth state and user roles
  useEffect(() => {
    let mounted = true;

    async function fetchUserRole(userSession) {
      if (!userSession?.user) {
        if (mounted) setRole(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', userSession.user.id)
          .single();
        
        if (error) throw error;
        if (mounted && data) {
          setRole(data.role);
        }
      } catch (err) {
        console.error('Error fetching role:', err);
      }
    }

    async function initSession() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(currentSession);
          if (currentSession) {
            await fetchUserRole(currentSession);
          }
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        if (newSession) {
          await fetchUserRole(newSession);
        } else {
          setRole(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-screen" style={{
        background: '#0a0a0a',
        color: '#e5e5e5',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        <div className="spin" style={{
          width: 32,
          height: 32,
          border: '2px solid rgba(229,229,229,0.1)',
          borderTopColor: '#e5e5e5',
          borderRadius: '50%',
          marginBottom: 16
        }} />
        <p>Memuat sistem command center...</p>
      </div>
    );
  }

  // Route 1: Halaman Driver Barcode Scanner (bisa diakses driver yang terautentikasi atau dispatcher via #/driver)
  if (role === 'driver') {
    if (hash !== '#/driver') {
      window.location.hash = '#/driver';
    }
    return <DriverApp />;
  }

  if (hash === '#/driver') {
    return <DriverApp />;
  }

  // Route 2: Jika belum login, paksa ke halaman Login
  if (!session) {
    if (hash !== '#/login') {
      window.location.hash = '#/login';
    }
    return <LoginPage />;
  }

  // Route 3: Jika sudah login, cek halaman yang dituju
  if (hash === '#/login') {
    window.location.hash = '#/dashboard';
  }

  const isReports = hash === '#/reports';
  const isDriverMgmt = hash === '#/drivers';

  return (
    <div className="app">
      {isReports ? <ReportsPage /> : isDriverMgmt ? <DriverManagementPage /> : <DashboardPage />}
      <FloatingNav currentHash={hash} />
    </div>
  );
}

export default App;
