import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, ShieldAlert, Truck, Sun, Moon } from 'lucide-react';

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sirekan-theme');
    const dark = saved !== null ? saved === 'dark' : true;
    setIsDark(dark);
    document.documentElement.classList.toggle('theme-light', !dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('theme-light', !next);
    localStorage.setItem('sirekan-theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: isDark ? '#fbbf24' : '#6b62f2',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.transform = 'scale(1.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {isDark ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}

export default function DashboardHeader({ alerts, activeDriversCount = 0 }) {
  const totalAlerts = alerts.length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const openCount = alerts.filter(a => a.status === 'open').length;

  return (
    <header className="dashboard-header" id="dashboard-header">
      <div className="dashboard-header__glow" />
      <div className="dashboard-header__content">
        <div className="dashboard-header__text">
          <p className="dashboard-header__eyebrow">SIREKAN COMMAND CENTER</p>
          <h1 className="dashboard-header__title">Command Center</h1>
          <p className="dashboard-header__subtitle">
            Pemantauan real-time insiden kecurangan solar
          </p>
        </div>
        <div className="dashboard-header__stats">
          <ThemeToggle />

          <div className="stat-card" id="stat-active-fleet" style={{ borderLeft: '2px solid rgba(107,98,242,0.5)' }}>
            <Truck size={16} strokeWidth={1.5} className="stat-card__icon" style={{ color: '#8b7cf8' }} />
            <span className="stat-card__value" style={{ color: '#ffffff' }}>{activeDriversCount}</span>
            <span className="stat-card__label">Armada Jalan</span>
          </div>

          <div className="stat-card" id="stat-total">
            <Activity size={16} strokeWidth={1.5} className="stat-card__icon" />
            <span className="stat-card__value">{totalAlerts}</span>
            <span className="stat-card__label">Total Alert</span>
          </div>

          <div className="stat-card stat-card--critical" id="stat-critical">
            <ShieldAlert size={16} strokeWidth={1.5} className="stat-card__icon" />
            <span className="stat-card__value">{criticalCount}</span>
            <span className="stat-card__label">Kritis</span>
          </div>

          <div className="stat-card" id="stat-open">
            <AlertCircle size={16} strokeWidth={1.5} className="stat-card__icon" />
            <span className="stat-card__value">{openCount}</span>
            <span className="stat-card__label">Terbuka</span>
          </div>
        </div>
      </div>
    </header>
  );
}
