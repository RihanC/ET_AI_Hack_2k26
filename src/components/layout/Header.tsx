import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Activity, Search, Bell, History, Shield, ChevronDown,
  Wifi, AlertTriangle, CheckCircle, LogOut
} from 'lucide-react';
import './Header.css';

interface HeaderProps {
  currentTime: Date;
  criticalAlerts: number;
  warningAlerts: number;
  plantHealth: number;
  onSearch?: (query: string) => void;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentTime, criticalAlerts, warningAlerts, plantHealth, onNavigate, onLogout }) => {
  const [searchValue, setSearchValue] = useState('');
  const [alertPulse, setAlertPulse] = useState(false);

  useEffect(() => {
    if (criticalAlerts > 0) {
      const interval = setInterval(() => setAlertPulse(p => !p), 1200);
      return () => clearInterval(interval);
    }
  }, [criticalAlerts]);

  const healthColor = plantHealth >= 80 ? '#22C55E' : plantHealth >= 60 ? '#F59E0B' : '#EF4444';
  const healthLabel = plantHealth >= 80 ? 'HEALTHY' : plantHealth >= 60 ? 'MODERATE' : 'CRITICAL';

  return (
    <header className="header">
      {/* Logo + Plant */}
      <div className="header-brand">
        <div className="header-logo">
          <Activity size={18} color="#3B82F6" strokeWidth={2.5} />
          <span className="header-logo-text">ISIP</span>
        </div>
        <div className="header-divider" />
        <div className="header-plant">
          <span className="header-plant-name">Tata Steel — Jamshedpur Complex</span>
          <span className="header-plant-sub">Unit 3 · Control Room A</span>
        </div>
      </div>

      {/* Search */}
      <div className="header-search">
        <Search size={14} className="search-icon" />
        <input
          className="search-input"
          placeholder="Search sensors, workers, zones, permits..."
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          id="global-search"
        />
        <kbd className="search-kbd">⌘K</kbd>
      </div>

      {/* Right Controls */}
      <div className="header-controls">
        {/* Shift Info */}
        <div className="header-chip">
          <Wifi size={11} color="#22C55E" />
          <span>Morning Shift</span>
          <span className="chip-dim">06:00 – 14:00</span>
        </div>

        {/* Time */}
        <div className="header-time">
          <span className="time-value">{format(currentTime, 'HH:mm:ss')}</span>
          <span className="time-date">{format(currentTime, 'dd MMM yyyy')}</span>
        </div>

        {/* Plant Health */}
        <div className="health-badge" style={{ '--health-color': healthColor } as React.CSSProperties}>
          <div className="health-ring">
            <svg viewBox="0 0 36 36" className="health-ring-svg">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={healthColor}
                strokeWidth="3"
                strokeDasharray={`${(plantHealth / 100) * 94.2} 94.2`}
                strokeDashoffset="23.55"
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <span className="health-value">{Math.round(plantHealth)}</span>
          </div>
          <div className="health-info">
            <span className="health-label" style={{ color: healthColor }}>{healthLabel}</span>
            <span className="health-sub">Plant Health</span>
          </div>
        </div>

        {/* Alerts */}
        <button
          className={`alert-counter ${criticalAlerts > 0 ? 'has-critical' : ''} ${alertPulse ? 'pulse' : ''}`}
          onClick={() => onNavigate?.('plant-map')}
          id="alert-counter-btn"
          title="View alerts"
        >
          <Bell size={14} />
          {criticalAlerts > 0 && (
            <span className="alert-badge critical">{criticalAlerts}</span>
          )}
          {warningAlerts > 0 && (
            <span className="alert-badge warning">{warningAlerts}</span>
          )}
        </button>

        {/* History */}
        <button className="btn-icon-header" id="history-btn" onClick={() => onNavigate?.('timeline')}>
          <History size={14} />
        </button>

        {/* User */}
        <button className="user-btn" id="user-menu-btn">
          <div className="user-avatar">PS</div>
          <div className="user-info">
            <span className="user-name">Priya Singh</span>
            <span className="user-role">Safety Officer</span>
          </div>
          <ChevronDown size={12} color="var(--text-muted)" />
        </button>

        {/* Logout */}
        <button
          className="btn-icon-header logout-btn"
          id="logout-btn"
          title="Sign out"
          onClick={() => onLogout?.()}
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
};

export default Header;
