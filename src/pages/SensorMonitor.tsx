import React, { useState } from 'react';
import { Search, Filter, X, TrendingUp, TrendingDown, Minus, ChevronRight, Cpu, Activity } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { sensors } from '../data/mockData';
import type { Sensor } from '../data/mockData';
import './SensorMonitor.css';

interface SensorMonitorProps {
  liveSensors: Sensor[];
  onNavigate: (page: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  online: '#22C55E', warning: '#F59E0B', critical: '#EF4444', offline: '#4B5563'
};

const SensorMonitor: React.FC<SensorMonitorProps> = ({ liveSensors, onNavigate }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Sensor | null>(null);

  const filtered = liveSensors.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.zone.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || s.type === typeFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const statusCounts = {
    online: liveSensors.filter(s => s.status === 'online').length,
    warning: liveSensors.filter(s => s.status === 'warning').length,
    critical: liveSensors.filter(s => s.status === 'critical').length,
    offline: liveSensors.filter(s => s.status === 'offline').length,
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="chart-tooltip">
          <div className="chart-tooltip-label">{label}</div>
          <div className="chart-tooltip-row">
            <span style={{color:payload[0]?.stroke}}>Value:</span>
            <span>{payload[0]?.value?.toFixed(2)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sensor-layout">
      <div className="sensor-main">
        {/* Header */}
        <div className="page-header" style={{padding:'20px 20px 16px',margin:0,borderBottom:'1px solid var(--border-color)'}}>
          <div>
            <h1 className="page-title">Sensor Monitor</h1>
            <p className="page-subtitle">Real-time sensor status · 12 sensors across 9 zones</p>
          </div>
          <div className="flex gap-2 items-center">
            {Object.entries(statusCounts).map(([status, count]) => (
              count > 0 && (
                <button
                  key={status}
                  className={`status-filter-chip ${statusFilter === status ? 'active' : ''}`}
                  style={{'--chip-color': STATUS_COLORS[status]} as React.CSSProperties}
                  onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                >
                  <span className="pulse-dot" style={{background:STATUS_COLORS[status],width:5,height:5}} />
                  {count} {status}
                </button>
              )
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="sensor-filters">
          <div className="input-with-icon" style={{maxWidth:300}}>
            <Search size={13} className="input-icon" />
            <input className="input" placeholder="Search sensors or zones..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="tabs">
            {['all','gas','temperature','pressure','vibration','flow'].map(t => (
              <button key={t} className={`tab ${typeFilter===t?'active':''}`} onClick={() => setTypeFilter(t)}>
                {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-sm text-secondary" style={{marginLeft:'auto'}}>{filtered.length} sensors</span>
        </div>

        {/* Sensor Table */}
        <div className="sensor-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sensor</th>
                <th>Type</th>
                <th>Zone</th>
                <th>Current Value</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Trend</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sensor => {
                const ratio = sensor.value / sensor.threshold;
                const sc = STATUS_COLORS[sensor.status];
                const isSelected = selected?.id === sensor.id;
                return (
                  <tr
                    key={sensor.id}
                    className={isSelected ? 'selected-row' : ''}
                    onClick={() => setSelected(isSelected ? null : sensor)}
                  >
                    <td>
                      <div className="sensor-name-cell">
                        <div className="sensor-id-badge">{sensor.id}</div>
                        <span className="sensor-name">{sensor.name.split(' — ')[0]}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-muted capitalize">{sensor.type}</span>
                    </td>
                    <td><span className="text-secondary text-sm">{sensor.zone.split(' — ')[0]}</span></td>
                    <td>
                      <div className="value-cell">
                        <span className="sensor-value" style={{color:sc}}>{sensor.value}</span>
                        <span className="sensor-unit text-muted">{sensor.unit}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="threshold-bar">
                          <div className="threshold-fill" style={{width:`${Math.min((sensor.value/sensor.max)*100,100)}%`, background:sc}} />
                        </div>
                        <span className="text-xs text-muted">{sensor.threshold} {sensor.unit}</span>
                      </div>
                    </td>
                    <td>
                      <div className="status-cell">
                        <span className="pulse-dot" style={{background:sc,width:6,height:6}} />
                        <span className={`badge badge-${sensor.status==='online'?'success':sensor.status==='warning'?'warning':sensor.status==='critical'?'critical':'muted'}`}>
                          {sensor.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td>
                      {sensor.trend==='up' ? <TrendingUp size={14} color="#EF4444" /> :
                       sensor.trend==='down' ? <TrendingDown size={14} color="#22C55E" /> :
                       <Minus size={14} color="#94A3B8" />}
                    </td>
                    <td><span className="text-xs text-muted">{sensor.lastUpdated}</span></td>
                    <td>
                      <ChevronRight size={13} color="var(--text-muted)" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      <div className={`sensor-detail-panel ${selected ? 'open' : ''}`}>
        {selected ? (
          <>
            <div className="panel-header">
              <div>
                <div className="panel-title">{selected.name.split(' — ')[0]}</div>
                <div className="panel-subtitle">{selected.equipment}</div>
              </div>
              <button className="btn-icon-header" onClick={() => setSelected(null)}><X size={14}/></button>
            </div>
            <div className="sensor-detail-content">
              {/* Reading */}
              <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border-color)'}}>
                <div className="current-reading" style={{borderColor:`${STATUS_COLORS[selected.status]}40`}}>
                  <div style={{fontSize:38,fontWeight:800,color:STATUS_COLORS[selected.status],letterSpacing:'-0.03em',lineHeight:1}}>
                    {selected.value}
                  </div>
                  <div style={{fontSize:16,color:'var(--text-secondary)',marginTop:2}}>{selected.unit}</div>
                  <div className="progress-bar" style={{marginTop:10}}>
                    <div className="progress-bar-fill" style={{
                      width:`${Math.min((selected.value/selected.max)*100,100)}%`,
                      background:STATUS_COLORS[selected.status]
                    }}/>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted">{selected.min}</span>
                    <span className="text-xs text-muted">Threshold: {selected.threshold}</span>
                    <span className="text-xs text-muted">{selected.max}</span>
                  </div>
                </div>
                <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  {[['Zone',selected.zone.split(' — ')[0]],['Type',selected.type],['Status',selected.status.toUpperCase()],['Updated',selected.lastUpdated]].map(([k,v]) => (
                    <div key={k} style={{background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-md)',padding:'6px 10px'}}>
                      <div style={{fontSize:10,color:'var(--text-muted)'}}>{k}</div>
                      <div style={{fontSize:12,fontWeight:600,marginTop:1}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historical Chart */}
              <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border-color)'}}>
                <div className="label mb-3">24-Hour History</div>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={selected.history} margin={{top:4,right:4,left:-28,bottom:0}}>
                    <defs>
                      <linearGradient id="sensorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={STATUS_COLORS[selected.status]} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={STATUS_COLORS[selected.status]} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false}/>
                    <XAxis dataKey="time" tick={{fill:'#4B5563',fontSize:9}} tickLine={false} interval={5}/>
                    <YAxis tick={{fill:'#4B5563',fontSize:9}} tickLine={false} axisLine={false}/>
                    <Tooltip content={<CustomTooltip />}/>
                    <ReferenceLine y={selected.threshold} stroke="#EF4444" strokeDasharray="4 2" strokeWidth={1} opacity={0.6}/>
                    <Area type="monotone" dataKey="value" stroke={STATUS_COLORS[selected.status]}
                      strokeWidth={2} fill="url(#sensorGrad)" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Related Equipment */}
              <div style={{padding:'14px 16px'}}>
                <div className="label mb-3">Equipment & Risk</div>
                <div style={{background:'var(--bg-primary)',border:`1px solid ${STATUS_COLORS[selected.status]}30`,borderRadius:'var(--radius-md)',padding:12}}>
                  <div style={{fontSize:12,fontWeight:600}}>{selected.equipment}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>Current Risk: <span style={{color:STATUS_COLORS[selected.status],fontWeight:700}}>{selected.status.toUpperCase()}</span></div>
                </div>
                <button className="btn btn-primary w-full mt-3" style={{justifyContent:'center'}} onClick={() => onNavigate('ai-risk')}>
                  View AI Risk Analysis
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="panel-empty">
            <Cpu size={32} color="var(--text-muted)" />
            <p>Select a sensor to view its history and details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorMonitor;
