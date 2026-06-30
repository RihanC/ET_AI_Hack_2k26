import React, { useState } from 'react';
import {
  AlertTriangle, TrendingUp, TrendingDown, Minus,
  Users, Cpu, FileText, Shield, Activity, ChevronRight,
  Clock, MapPin, Brain, BarChart2, Zap, Wind
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { kpiData, trendData24h, alerts, riskFactors, timelineEvents } from '../data/mockData';
import './Dashboard.css';

interface DashboardProps {
  liveKPI: typeof kpiData;
  liveAlerts: typeof alerts;
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ liveKPI, liveAlerts, onNavigate }) => {
  const criticalAlerts = liveAlerts.filter(a => a.severity === 'critical' && !a.acknowledged);
  const warningAlerts = liveAlerts.filter(a => a.severity === 'warning' && !a.acknowledged);

  const riskColor = liveKPI.riskScore >= 75 ? '#EF4444' : liveKPI.riskScore >= 50 ? '#F59E0B' : '#22C55E';
  const healthColor = liveKPI.plantHealth >= 80 ? '#22C55E' : liveKPI.plantHealth >= 60 ? '#F59E0B' : '#EF4444';

  const kpiCards = [
    {
      label: 'Plant Health', value: `${Math.round(liveKPI.plantHealth)}%`, icon: <Shield size={16} />,
      color: healthColor, trend: 'stable', sub: 'vs. 79% yesterday'
    },
    {
      label: 'Risk Score', value: `${Math.round(liveKPI.riskScore)}/100`, icon: <Activity size={16} />,
      color: riskColor, trend: 'up', sub: '+8 pts since 08:00', action: () => onNavigate('ai-risk')
    },
    {
      label: 'Active Workers', value: liveKPI.activeWorkers, icon: <Users size={16} />,
      color: '#3B82F6', trend: 'stable', sub: '1 at critical risk'
    },
    {
      label: 'Sensors Online', value: `${liveKPI.sensorsOnline}/${liveKPI.sensorsTotal}`, icon: <Cpu size={16} />,
      color: '#22C55E', trend: 'stable', sub: '1 offline in Zone D'
    },
    {
      label: 'Active Permits', value: liveKPI.activePermits, icon: <FileText size={16} />,
      color: '#F59E0B', trend: 'stable', sub: '1 below compliance'
    },
    {
      label: 'Critical Alerts', value: criticalAlerts.length, icon: <AlertTriangle size={16} />,
      color: '#EF4444', trend: 'up', sub: `+${warningAlerts.length} warnings`, action: () => onNavigate('plant-map')
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="chart-tooltip-label">{label}</div>
          {payload.map((p: any) => (
            <div key={p.name} className="chart-tooltip-row">
              <span style={{ color: p.color }}>{p.name}:</span>
              <span>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const sparklinesData: Record<string, number[]> = {
    'Plant Health': [78, 77, 79, 78, 80, 81, 79, 80],
    'Risk Score': [55, 58, 62, 60, 64, 68, 65, 68],
    'Active Workers': [6, 7, 8, 8, 9, 8, 8, 8],
    'Sensors Online': [11, 11, 11, 11, 12, 12, 11, 11],
    'Active Permits': [4, 4, 5, 5, 6, 5, 5, 5],
    'Critical Alerts': [1, 1, 0, 0, 2, 2, 1, 2],
  };

  const generateSparklinePath = (points: number[]) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    return points.map((p, index) => {
      const x = (index / (points.length - 1)) * 60;
      const y = 20 - ((p - min) / range) * 16 - 2;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="page-content animate-fade-in" style={{ padding: 'var(--spacing-2xl)' }}>
      {/* Critical Alert Banner */}
      {criticalAlerts.length > 0 && (
        <div className="critical-banner" onClick={() => onNavigate('plant-map')}>
          <div className="critical-banner-left">
            <div className="critical-banner-icon">
              <AlertTriangle size={14} />
            </div>
            <div>
              <div className="critical-banner-title">
                {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} Require Attention
              </div>
              <div className="critical-banner-desc">{criticalAlerts[0]?.description}</div>
            </div>
          </div>
          <div className="critical-banner-action">
            View live map <ChevronRight size={13} />
          </div>
        </div>
      )}

      {/* Premium Dashboard Hero Header */}
      <div className="dashboard-hero-card" style={{ marginTop: criticalAlerts.length > 0 ? 24 : 0 }}>
        <div className="hero-greeting-section">
          <span className="hero-welcome">Good Morning, Priya</span>
          <div className="hero-meta-grid">
            <span className="hero-meta-item">Morning Shift</span>
            <span className="hero-meta-dot" />
            <span className="hero-meta-item">Plant Health: <strong>{Math.round(liveKPI.plantHealth)}%</strong></span>
            <span className="hero-meta-dot" />
            <span className="hero-meta-item">Updated 3s ago</span>
            <span className="hero-meta-dot" />
            <span className="hero-meta-item live-indicator">
              <span className="pulse-dot success" style={{ width: 6, height: 6 }} />
              Live monitoring enabled
            </span>
          </div>
        </div>
        <div className="hero-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('reports')}>
            <BarChart2 size={13} />
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiCards.map((kpi, i) => (
          <div
            key={i}
            className={`kpi-card ${kpi.action ? 'clickable' : ''}`}
            onClick={kpi.action}
          >
            <div className="kpi-header">
              <span className="kpi-label">{kpi.label}</span>
              <span className="kpi-icon-wrapper">
                {kpi.icon}
              </span>
            </div>
            <div className="kpi-body">
              <div className="kpi-value">{kpi.value}</div>
            </div>
            <div className="kpi-footer">
              <div className="kpi-trend-row">
                <span className="kpi-trend-icon">
                  {kpi.trend === 'up' ? <TrendingUp size={11} color="var(--critical)" /> :
                   kpi.trend === 'down' ? <TrendingDown size={11} color="var(--success)" /> :
                   <Minus size={11} color="var(--text-muted)" />}
                </span>
                <span className="kpi-sub">{kpi.sub}</span>
              </div>
              <div className="kpi-sparkline-container">
                <svg className="kpi-sparkline" width="60" height="20" viewBox="0 0 60 20">
                  <path
                    d={generateSparklinePath(sparklinesData[kpi.label] || [50, 50, 50, 50])}
                    fill="none"
                    stroke={kpi.color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="dashboard-main-grid">
        {/* Left Column: Plant Snapshot + AI Risk */}
        <div className="dashboard-left">
          {/* Mini Plant Snapshot */}
          <div className="card card-sm cursor-pointer" onClick={() => onNavigate('plant-map')}>
            <div className="card-header">
              <div>
                <div className="card-title">Plant Snapshot</div>
                <div className="card-subtitle">Click to open Live Plant Map</div>
              </div>
              <div className="flex gap-2 items-center">
                <span className="badge badge-critical">
                  <span className="pulse-dot critical" style={{width:5,height:5}} />
                  2 Critical
                </span>
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
            </div>
            <div className="mini-plant-map">
              <MiniPlantMap onNavigate={onNavigate} />
            </div>
          </div>

          {/* AI Risk Summary */}
          <div className="card card-sm cursor-pointer" onClick={() => onNavigate('ai-risk')}>
            <div className="card-header">
              <div>
                <div className="card-title flex gap-2 items-center">
                  <Brain size={13} color="#8B5CF6" /> AI Risk Summary
                </div>
                <div className="card-subtitle">Compound risk analysis · Updated 1m ago</div>
              </div>
              <ChevronRight size={14} color="var(--text-muted)" />
            </div>
            <div className="ai-risk-summary">
              <div className="risk-gauge-mini">
                <div className="risk-arc">
                  <svg viewBox="0 0 100 60" width="100" height="60">
                    <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#1F2937" strokeWidth="10" strokeLinecap="round"/>
                    <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke={riskColor} strokeWidth="10"
                      strokeDasharray={`${(liveKPI.riskScore / 100) * 125.7} 125.7`} strokeLinecap="round"/>
                    <text x="50" y="52" textAnchor="middle" fill="white" fontSize="16" fontWeight="700">
                      {Math.round(liveKPI.riskScore)}
                    </text>
                  </svg>
                  <div className="risk-gauge-label" style={{color: riskColor}}>
                    {liveKPI.riskScore >= 75 ? 'HIGH RISK' : liveKPI.riskScore >= 50 ? 'MODERATE' : 'LOW RISK'}
                  </div>
                </div>
                <div className="risk-factors-mini">
                  {riskFactors.map(rf => (
                    <div key={rf.factor} className="risk-factor-row">
                      <span className="risk-factor-name">{rf.factor}</span>
                      <div className="risk-factor-bar">
                        <div className="risk-factor-fill" style={{width: `${rf.score}%`, background: rf.color}} />
                      </div>
                      <span className="risk-factor-score" style={{color: rf.color}}>{rf.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Trend + Timeline */}
        <div className="dashboard-right">
          {/* 24h Trend Chart */}
          <div className="card card-sm">
            <div className="card-header">
              <div>
                <div className="card-title">24-Hour Trend Analysis</div>
                <div className="card-subtitle">Risk score · Gas levels · Worker count</div>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 text-xs text-secondary">
                  <div style={{width:8,height:2,background:'#EF4444',borderRadius:1}} />Risk
                </div>
                <div className="flex items-center gap-1 text-xs text-secondary">
                  <div style={{width:8,height:2,background:'#F59E0B',borderRadius:1}} />Gas
                </div>
                <div className="flex items-center gap-1 text-xs text-secondary">
                  <div style={{width:8,height:2,background:'#3B82F6',borderRadius:1}} />Workers
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData24h} margin={{top:4, right:4, left:-24, bottom:0}}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="hour" tick={{fill:'#4B5563', fontSize:10}} tickLine={false} interval={3} />
                <YAxis tick={{fill:'#4B5563', fontSize:10}} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="riskScore" name="Risk" stroke="#EF4444" strokeWidth={2} fill="url(#colorRisk)" dot={false} />
                <Area type="monotone" dataKey="gasLevel" name="Gas (ppm)" stroke="#F59E0B" strokeWidth={1.5} fill="url(#colorGas)" dot={false} />
                <Line type="monotone" dataKey="workerCount" name="Workers" stroke="#3B82F6" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Alerts */}
          <div className="card card-sm">
            <div className="card-header">
              <div className="card-title">Active Alerts</div>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('timeline')}>
                View All <ChevronRight size={12} />
              </button>
            </div>
            <div className="alert-list">
              {liveAlerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className={`alert-item ${alert.severity} ${alert.acknowledged ? 'ack' : ''}`}
                  onClick={() => onNavigate('plant-map')}
                >
                  <div className={`alert-severity-bar ${alert.severity}`} />
                  <div className="alert-content">
                    <div className="alert-title">{alert.title}</div>
                    <div className="alert-meta">
                      <MapPin size={10} /> {alert.zone}
                      <Clock size={10} style={{marginLeft:6}} /> {alert.timestamp}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <span className={`badge badge-${alert.severity === 'critical' ? 'critical' : 'warning'}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  )}
                  {alert.acknowledged && (
                    <span className="badge badge-muted">ACK</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-2" style={{marginTop: 16, gap: 16}}>
        {/* AI Daily Summary */}
        <div className="card card-sm">
          <div className="card-header">
            <div className="card-title flex gap-2 items-center">
              <Brain size={13} color="#8B5CF6" /> AI Daily Safety Summary
            </div>
            <span className="badge badge-purple">AI Generated</span>
          </div>
          <div className="ai-summary-text">
            <p>
              <strong>Morning Shift Assessment:</strong> Plant safety is currently at elevated risk due to compound hazards in Zone F (Tank Farm). The O₂ deficiency combined with an active confined space permit and non-compliant worker PPE creates a <span className="text-critical">critical compound risk scenario</span>.
            </p>
            <div style={{height: 10}} />
            <p>
              <strong>Key concerns:</strong> H₂S levels in Zone A are trending upward (+38% over 2 hours). CO levels in Zone B are within warning threshold. Compressor C3 vibration requires monitoring.
            </p>
            <div style={{height: 10}} />
            <p>
              <strong>Recommended actions:</strong> (1) Evacuate Zone F and suspend PTW-0042 immediately. (2) Increase gas monitoring frequency in Zone A. (3) Schedule compressor C3 inspection by 12:00.
            </p>
          </div>
          <div className="ai-summary-stats">
            <div className="ai-stat"><span>Incident-Free Days</span><strong className="text-success">47</strong></div>
            <div className="ai-stat"><span>Compliance Score</span><strong className="text-warning">73%</strong></div>
            <div className="ai-stat"><span>Predicted Risk Peak</span><strong className="text-critical">11:45</strong></div>
          </div>
        </div>

        {/* Incident Timeline mini */}
        <div className="card card-sm">
          <div className="card-header">
            <div className="card-title">Recent Events</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('timeline')}>
              Full Timeline <ChevronRight size={12} />
            </button>
          </div>
          <div className="timeline-mini">
            {timelineEvents.slice(0, 6).map((evt, i) => (
              <div key={evt.id} className="timeline-mini-item" onClick={() => onNavigate('timeline')}>
                <div className={`timeline-mini-dot ${evt.severity}`} />
                <div className="timeline-mini-line" style={{opacity: i === 5 ? 0 : 1}} />
                <div className="timeline-mini-content">
                  <div className="timeline-mini-title">{evt.title}</div>
                  <div className="timeline-mini-meta">
                    <Clock size={9} /> {evt.timestamp} · {evt.zone}
                  </div>
                </div>
                <span className={`badge badge-${evt.severity === 'critical' ? 'critical' : evt.severity === 'warning' ? 'warning' : 'muted'} text-xs`}>
                  {evt.category.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini SVG Plant Map
const MiniPlantMap: React.FC<{onNavigate: (p: string) => void}> = ({ onNavigate }) => {
  const zones = [
    { id: 'A', x: 30, y: 30, w: 100, h: 70, label: 'Zone A\nBlast Furnace', risk: 'warning' },
    { id: 'B', x: 150, y: 30, w: 80, h: 60, label: 'Zone B\nConverter', risk: 'warning' },
    { id: 'C', x: 250, y: 30, w: 70, h: 55, label: 'Zone C\nBoiler Room', risk: 'safe' },
    { id: 'D', x: 340, y: 15, w: 50, h: 30, label: 'Chimney', risk: 'safe' },
    { id: 'E', x: 30, y: 120, w: 80, h: 60, label: 'Zone E\nCompressor', risk: 'warning' },
    { id: 'F', x: 130, y: 115, w: 85, h: 65, label: 'Zone F\nTank Farm', risk: 'critical' },
    { id: 'G', x: 235, y: 105, w: 120, h: 75, label: 'Zone G\nRolling Mill', risk: 'safe' },
    { id: 'H', x: 30, y: 200, w: 70, h: 50, label: 'Zone H\nGas Plant', risk: 'safe' },
    { id: 'I', x: 120, y: 200, w: 70, h: 50, label: 'Zone I\nElectrolyzer', risk: 'warning' },
    { id: 'CR', x: 250, y: 200, w: 100, h: 50, label: 'Control Room', risk: 'safe' },
  ];

  const riskColors: Record<string, string> = {
    safe: '#22C55E',
    warning: '#F59E0B',
    critical: '#EF4444',
  };

  return (
    <svg viewBox="0 0 410 265" width="100%" style={{display:'block', borderRadius: 8}}>
      <rect width="410" height="265" fill="#0D1117" rx="8" />
      {/* Grid lines */}
      {[0,1,2,3].map(i => (
        <line key={`h${i}`} x1="0" y1={i*66} x2="410" y2={i*66} stroke="#1F2937" strokeWidth="0.5" />
      ))}
      {[0,1,2,3,4].map(i => (
        <line key={`v${i}`} x1={i*102} y1="0" x2={i*102} y2="265" stroke="#1F2937" strokeWidth="0.5" />
      ))}

      {/* Pipelines */}
      <path d="M 80 65 L 150 60 L 190 60 L 250 57" stroke="#374151" strokeWidth="2" fill="none" strokeDasharray="4 3" />
      <path d="M 80 150 L 130 147 L 215 147 L 235 140" stroke="#374151" strokeWidth="2" fill="none" strokeDasharray="4 3" />
      <path d="M 80 220 L 120 220 L 190 220 L 250 225" stroke="#374151" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />

      {zones.map(zone => (
        <g key={zone.id} onClick={() => onNavigate('plant-map')} style={{cursor:'pointer'}}>
          <rect
            x={zone.x} y={zone.y} width={zone.w} height={zone.h}
            rx="6" ry="6"
            fill={`${riskColors[zone.risk]}10`}
            stroke={riskColors[zone.risk]}
            strokeWidth={zone.risk === 'critical' ? 1.5 : 1}
            opacity={zone.risk === 'critical' ? 1 : 0.7}
          />
          {zone.risk === 'critical' && (
            <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="6" ry="6"
              fill="none" stroke={riskColors[zone.risk]} strokeWidth="1.5" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite"/>
            </rect>
          )}
          {zone.label.split('\n').map((line, i) => (
            <text key={i} x={zone.x + zone.w/2} y={zone.y + zone.h/2 - 4 + i*12}
              textAnchor="middle" fill={riskColors[zone.risk]} fontSize="8" fontWeight="600">
              {line}
            </text>
          ))}
          {/* Risk dot */}
          {zone.risk !== 'safe' && (
            <circle cx={zone.x + zone.w - 8} cy={zone.y + 8} r="4" fill={riskColors[zone.risk]}>
              {zone.risk === 'critical' && <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite"/>}
            </circle>
          )}
        </g>
      ))}

      {/* Workers */}
      {[[85,50],[200,55],[170,145],[305,145],[300,210]].map(([wx,wy], i) => (
        <circle key={i} cx={wx} cy={wy} r="5" fill="#3B82F6" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.5;0.9" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      <text x="200" y="258" textAnchor="middle" fill="#4B5563" fontSize="9">
        ● Workers  ■ Equipment Zones  — Pipelines
      </text>
    </svg>
  );
};

export default Dashboard;
