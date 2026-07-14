import { useState, useEffect } from 'react';
import { LayoutDashboard, FileBarChart, Truck, User, LogOut, Mail, Shield, X, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function FloatingNav({ currentHash }) {
  const isDashboard = currentHash === '#/dashboard' || currentHash === '' || currentHash === '#/';
  const isReports   = currentHash === '#/reports';
  const isDriver    = currentHash === '#/driver';
  const isDriverMgmt = currentHash === '#/drivers';

  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || !mounted) return;

        const { data } = await supabase
          .from('users')
          .select('full_name, email, role')
          .eq('id', session.user.id)
          .single();

        if (data && mounted) {
          setUserProfile({
            ...data,
            avatar: data.full_name?.charAt(0)?.toUpperCase() || 'U',
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    }
    loadProfile();
    return () => { mounted = false; };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.hash = '#/login';
    setShowProfile(false);
  }

  const roleLabel = userProfile?.role === 'dispatcher' ? 'Admin Dispatcher'
    : userProfile?.role === 'driver' ? 'Supir' : userProfile?.role || 'User';

  const roleColor = userProfile?.role === 'dispatcher' ? '#6b62f2'
    : userProfile?.role === 'driver' ? '#22c55e' : '#a3a3a3';

  const navLinks = [
    { hash: '#/dashboard', label: 'Dashboard',  icon: LayoutDashboard, active: isDashboard },
    { hash: '#/reports',   label: 'Laporan',    icon: FileBarChart,    active: isReports },
    { hash: '#/drivers',   label: 'Driver',     icon: Users,           active: isDriverMgmt },
    { hash: '#/driver',    label: 'App Driver', icon: Truck,           active: isDriver },
  ];

  return (
    <>
      <nav className="floating-nav no-print" id="floating-nav" style={{ padding: '0 16px' }}>
        <div className="floating-nav__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>

          {/* Brand */}
          <span className="floating-nav__wordmark" style={{ fontWeight: 800, letterSpacing: '0.08em', fontSize: 14 }}>
            SIREKAN
          </span>

          {/* Nav links */}
          <div className="floating-nav__links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navLinks.map(link => {
              const Icon = link.icon;
              return (
                <a
                  key={link.hash}
                  href={link.hash}
                  className={`floating-nav__link ${link.active ? 'floating-nav__link--active' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 10,
                    fontSize: 13, fontWeight: link.active ? 600 : 400,
                    color: link.active ? '#e5e5e5' : '#686868',
                    background: link.active ? 'rgba(107,98,242,0.12)' : 'transparent',
                    border: link.active ? '1px solid rgba(107,98,242,0.25)' : '1px solid transparent',
                    textDecoration: 'none', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!link.active) { e.currentTarget.style.color = '#e5e5e5'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}}
                  onMouseLeave={e => { if (!link.active) { e.currentTarget.style.color = '#686868'; e.currentTarget.style.background = 'transparent'; }}}
                >
                  <Icon size={14} strokeWidth={1.5} />
                  {link.label}
                </a>
              );
            })}

            {/* Profile as 4th nav item */}
            <button
              onClick={() => setShowProfile(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 10,
                fontSize: 13, fontWeight: showProfile ? 600 : 400,
                color: showProfile ? '#e5e5e5' : '#686868',
                background: showProfile ? 'rgba(107,98,242,0.12)' : 'transparent',
                border: showProfile ? '1px solid rgba(107,98,242,0.25)' : '1px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!showProfile) { e.currentTarget.style.color = '#e5e5e5'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}}
              onMouseLeave={e => { if (!showProfile) { e.currentTarget.style.color = '#686868'; e.currentTarget.style.background = 'transparent'; }}}
            >
              {/* Avatar circle */}
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: `linear-gradient(135deg, ${roleColor}, ${roleColor}77)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                border: `1.5px solid ${roleColor}55`
              }}>
                {userProfile?.avatar || <User size={11} />}
              </div>
              {userProfile?.full_name?.split(' ')[0] || 'Profil'}
            </button>
          </div>

          {/* CTA */}
          <button
            className="floating-nav__cta"
            id="nav-cta"
            onClick={() => { window.location.hash = '#/reports'; }}
          >
            Lihat Laporan →
          </button>
        </div>
      </nav>

      {/* Profile Dropdown */}
      {showProfile && (
        <>
          <div
            onClick={() => setShowProfile(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          />
          <div style={{
            position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)',
            zIndex: 999, width: 300,
            background: 'rgba(12,12,12,0.98)',
            border: '1px solid rgba(229,229,229,0.1)',
            borderRadius: 16, padding: 20,
            backdropFilter: 'blur(24px)',
            boxShadow: '0 -12px 48px rgba(0,0,0,0.7)',
          }}>
            <style>{`
              @keyframes slideUp2 {
                from { opacity:0; transform: translateX(-50%) translateY(16px); }
                to   { opacity:1; transform: translateX(-50%) translateY(0); }
              }
            `}</style>

            {/* Close button */}
            <button
              onClick={() => setShowProfile(false)}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none', color: '#686868',
                cursor: 'pointer', padding: 4, borderRadius: 6,
              }}
              onMouseOver={e => e.currentTarget.style.color = '#e5e5e5'}
              onMouseOut={e => e.currentTarget.style.color = '#686868'}
            >
              <X size={15} />
            </button>

            {/* Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `linear-gradient(135deg, ${roleColor}, ${roleColor}66)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: '#fff',
                boxShadow: `0 0 20px ${roleColor}44`,
                border: `2px solid ${roleColor}55`, flexShrink: 0,
              }}>
                {userProfile?.avatar || '?'}
              </div>
              <div>
                <p style={{ color: '#e5e5e5', fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>
                  {userProfile?.full_name || 'Pengguna'}
                </p>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                  background: `${roleColor}20`, color: roleColor,
                  border: `1px solid ${roleColor}40`,
                  padding: '2px 8px', borderRadius: 4
                }}>
                  <Shield size={9} />
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Info rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', background: 'rgba(255,255,255,0.03)',
                borderRadius: 8, border: '1px solid rgba(229,229,229,0.06)'
              }}>
                <Mail size={13} style={{ color: '#686868', flexShrink: 0 }} />
                <span style={{ color: '#a3a3a3', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userProfile?.email || '—'}
                </span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', background: 'rgba(255,255,255,0.03)',
                borderRadius: 8, border: '1px solid rgba(229,229,229,0.06)'
              }}>
                <Shield size={13} style={{ color: '#686868', flexShrink: 0 }} />
                <span style={{ color: '#a3a3a3', fontSize: 12 }}>Hak Akses: {roleLabel}</span>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(229,229,229,0.07)', marginBottom: 12 }} />

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '10px 16px',
                color: '#ef4444', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.border = '1px solid rgba(239,68,68,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.border = '1px solid rgba(239,68,68,0.2)'; }}
            >
              <LogOut size={15} />
              Keluar dari Akun
            </button>
          </div>
        </>
      )}
    </>
  );
}
