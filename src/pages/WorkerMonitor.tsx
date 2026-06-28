import React, { useState } from 'react';
import { Search, X, Heart, MapPin, ShieldCheck, ShieldX, Shield, AlertTriangle, ChevronRight, Brain, Clock } from 'lucide-react';
import { workers, sensors } from '../data/mockData';
import type { Worker } from '../data/mockData';
import './WorkerMonitor.css';

interface WorkerMonitorProps {
  onNavigate: (page: string) => void;
}

const RISK_COLORS: Record<string, string> = {
  critical: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#22C55E'
};

const PPE_ICONS: Record<string, React.ReactNode> = {
  compliant: <ShieldCheck size={14} color="#22C55E" />,
  partial: <Shield size={14} color="#F59E0B" />,
  'non-compliant': <ShieldX size={14} color="#EF4444" />,
};

const WorkerMonitor: React.FC<WorkerMonitorProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selected, setSelected] = useState<Worker | null>(null);

  const filtered = workers.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
                        w.zone.toLowerCase().includes(search.toLowerCase()) ||
                        w.role.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'all' || w.riskLevel === riskFilter;
    return matchSearch && matchRisk;
  });

  const riskCounts = {
    critical: workers.filter(w => w.riskLevel === 'critical').length,
    high: workers.filter(w => w.riskLevel === 'high').length,
    medium: workers.filter(w => w.riskLevel === 'medium').length,
    low: workers.filter(w => w.riskLevel === 'low').length,
  };

  return (
    <div className="worker-layout">
      <div className="worker-main">
        {/* Header */}
        <div className="page-header" style={{padding:'20px 20px 16px',margin:0,borderBottom:'1px solid var(--border-color)'}}>
          <div>
            <h1 className="page-title">Worker Monitor</h1>
            <p className="page-subtitle">Real-time workforce safety monitoring · {workers.length} workers on shift</p>
          </div>
          <div className="flex gap-2 items-center">
            {(Object.entries(riskCounts) as [string, number][]).map(([risk, count]) => count > 0 && (
              <button
                key={risk}
                className={`status-filter-chip ${riskFilter === risk ? 'active' : ''}`}
                style={{'--chip-color': RISK_COLORS[risk]} as React.CSSProperties}
                onClick={() => setRiskFilter(riskFilter === risk ? 'all' : risk)}
              >
                <span style={{width:5,height:5,borderRadius:'50%',background:RISK_COLORS[risk],display:'inline-block'}} />
                {count} {risk}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="sensor-filters">
          <div className="input-with-icon" style={{maxWidth:300}}>
            <Search size={13} className="input-icon" />
            <input className="input" placeholder="Search workers, zones, roles..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="text-sm text-secondary" style={{marginLeft:'auto'}}>{filtered.length} workers</span>
        </div>

        {/* Worker Table */}
        <div className="sensor-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Zone</th>
                <th>Task</th>
                <th>PPE</th>
                <th>Permit</th>
                <th>Heart Rate</th>
                <th>Nearby Hazards</th>
                <th>Risk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(worker => (
                <tr key={worker.id} className={selected?.id === worker.id ? 'selected-row' : ''}
                  onClick={() => setSelected(selected?.id === worker.id ? null : worker)}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="worker-avatar-sm" style={{background:`linear-gradient(135deg, ${RISK_COLORS[worker.riskLevel]}60, ${RISK_COLORS[worker.riskLevel]}30)`, border:`1px solid ${RISK_COLORS[worker.riskLevel]}40`}}>
                        <span style={{color:RISK_COLORS[worker.riskLevel],fontSize:9,fontWeight:700}}>
                          {worker.name.split(' ').map(n=>n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="sensor-name">{worker.name}</div>
                        <div className="text-xs text-muted">{worker.role} · {worker.badge}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="text-sm text-secondary">{worker.zone.split(' — ')[0] || worker.zone}</span></td>
                  <td><span className="text-sm">{worker.task}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      {PPE_ICONS[worker.ppeStatus]}
                      <span className={`badge badge-${worker.ppeStatus==='compliant'?'success':worker.ppeStatus==='partial'?'warning':'critical'} text-xs`}>
                        {worker.ppeStatus}
                      </span>
                    </div>
                  </td>
                  <td>
                    {worker.permit ? (
                      <span className="badge badge-blue" style={{cursor:'pointer'}} onClick={(e) => {e.stopPropagation(); onNavigate('permits');}}>
                        {worker.permit.split('-').slice(-1)[0]}
                      </span>
                    ) : <span className="text-muted text-xs">None</span>}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Heart size={11} color={worker.heartRate > 100 ? '#EF4444' : '#94A3B8'} />
                      <span style={{color: worker.heartRate > 100 ? '#EF4444' : 'var(--text-primary)', fontWeight: worker.heartRate > 100 ? 700 : 400, fontSize:13}}>
                        {worker.heartRate}
                      </span>
                      <span className="text-xs text-muted">bpm</span>
                    </div>
                  </td>
                  <td>
                    {worker.nearbyHazards.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={11} color="#F59E0B" />
                        <span className="text-sm text-warning">{worker.nearbyHazards.length} hazard{worker.nearbyHazards.length>1?'s':''}</span>
                      </div>
                    ) : <span className="text-xs text-muted">None detected</span>}
                  </td>
                  <td>
                    <span className={`badge badge-${worker.riskLevel==='critical'?'critical':worker.riskLevel==='high'?'warning':worker.riskLevel==='medium'?'blue':'success'}`}>
                      {worker.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td><ChevronRight size={13} color="var(--text-muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worker Detail Panel */}
      <div className={`sensor-detail-panel ${selected ? 'open' : ''}`}>
        {selected ? (
          <>
            <div className="panel-header">
              <div>
                <div className="panel-title">{selected.name}</div>
                <div className="panel-subtitle">{selected.role} · Badge {selected.badge}</div>
              </div>
              <button className="btn-icon-header" onClick={() => setSelected(null)}><X size={14}/></button>
            </div>
            <div className="sensor-detail-content">
              {/* Risk badge */}
              <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-color)'}}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10}}>
                  <div className="worker-avatar-lg" style={{background:`linear-gradient(135deg, ${RISK_COLORS[selected.riskLevel]}, ${RISK_COLORS[selected.riskLevel]}80)`}}>
                    {selected.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700}}>{selected.name}</div>
                    <div style={{fontSize:12,color:'var(--text-muted)'}}>{selected.shift} Shift · Zone {selected.zone.split(' ')[1] || ''}</div>
                    <span className={`badge badge-${selected.riskLevel==='critical'?'critical':selected.riskLevel==='high'?'warning':'muted'} mt-1`} style={{display:'inline-flex',marginTop:4}}>
                      {selected.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
                {/* Vitals */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  {[
                    ['Heart Rate', `${selected.heartRate} bpm`, selected.heartRate > 100 ? '#EF4444' : '#22C55E'],
                    ['Gas Exposure', `${selected.gasExposure} ppm`, '#F59E0B'],
                    ['Last Seen', selected.lastSeen, 'var(--text-primary)'],
                    ['Status', selected.status.toUpperCase(), selected.status==='active'?'#22C55E':'#EF4444'],
                  ].map(([k,v,c]) => (
                    <div key={String(k)} style={{background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-md)',padding:'8px 10px'}}>
                      <div style={{fontSize:10,color:'var(--text-muted)'}}>{k}</div>
                      <div style={{fontSize:13,fontWeight:700,color:String(c)}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PPE Status */}
              <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-color)'}}>
                <div className="label mb-2">PPE Status</div>
                <div style={{display:'flex',alignItems:'center',gap:8,padding:10,borderRadius:'var(--radius-md)',
                  background: selected.ppeStatus==='compliant'?'var(--success-dim)':selected.ppeStatus==='partial'?'var(--warning-dim)':'var(--critical-dim)',
                  border:`1px solid ${selected.ppeStatus==='compliant'?'rgba(34,197,94,0.2)':selected.ppeStatus==='partial'?'rgba(245,158,11,0.2)':'rgba(239,68,68,0.2)'}`
                }}>
                  {PPE_ICONS[selected.ppeStatus]}
                  <span style={{fontSize:12,fontWeight:600,color:selected.ppeStatus==='compliant'?'#22C55E':selected.ppeStatus==='partial'?'#F59E0B':'#EF4444'}}>
                    {selected.ppeStatus === 'compliant' ? 'All PPE requirements met' :
                     selected.ppeStatus === 'partial' ? 'Missing some PPE items (face shield)' :
                     'CRITICAL: PPE requirements not met'}
                  </span>
                </div>
              </div>

              {/* Hazards */}
              {selected.nearbyHazards.length > 0 && (
                <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-color)'}}>
                  <div className="label mb-2">Nearby Hazards</div>
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    {selected.nearbyHazards.map(h => (
                      <div key={h} className="hazard-tag">{h}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Movement History */}
              <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-color)'}}>
                <div className="label mb-2">Movement History</div>
                {selected.movementHistory.map((m, i) => (
                  <div key={i} className="timeline-mini-item">
                    <div className="timeline-mini-dot info" />
                    <div className="timeline-mini-line" style={{opacity:i===selected.movementHistory.length-1?0:1}} />
                    <div className="timeline-mini-content">
                      <div className="timeline-mini-title">{m.zone}</div>
                      <div className="timeline-mini-meta"><Clock size={9}/> {m.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nearby Sensors */}
              <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-color)'}}>
                <div className="label mb-2">Nearby Sensors</div>
                {sensors.filter(s => s.zone === selected.zone).slice(0,2).map(s => (
                  <div key={s.id} className="panel-sensor-row" onClick={() => onNavigate('sensors')}>
                    <div>
                      <div className="panel-sensor-name">{s.name.split(' — ')[0]}</div>
                      <div style={{fontSize:10,color:'var(--text-muted)'}}>{s.id}</div>
                    </div>
                    <span style={{color:s.status==='critical'?'#EF4444':s.status==='warning'?'#F59E0B':'#22C55E',fontWeight:700,fontSize:13}}>
                      {s.value} {s.unit}
                    </span>
                  </div>
                ))}
                {sensors.filter(s => s.zone === selected.zone).length === 0 && (
                  <div className="text-sm text-muted">No sensors in current zone</div>
                )}
              </div>

              {/* AI Risk + Permit */}
              <div style={{padding:'12px 16px'}}>
                <div className="panel-ai-box" style={{marginBottom:10}}>
                  <div className="panel-ai-title"><Brain size={11}/> AI Risk Assessment</div>
                  <p>
                    {selected.riskLevel === 'critical'
                      ? `${selected.name} is in a critical risk situation. PPE non-compliance in an O₂-deficient confined space poses immediate life threat. Evacuation required.`
                      : selected.riskLevel === 'high'
                      ? `${selected.name} is working in elevated-risk conditions. Gas levels are rising in their zone. Close monitoring recommended.`
                      : `${selected.name} is operating within acceptable risk parameters. Continue standard monitoring.`}
                  </p>
                </div>
                {selected.permit && (
                  <button className="btn btn-ghost btn-sm w-full mb-2" style={{justifyContent:'center'}} onClick={() => onNavigate('permits')}>
                    View Permit {selected.permit}
                  </button>
                )}
                <button className="btn btn-primary w-full" style={{justifyContent:'center'}} onClick={() => onNavigate('ai-risk')}>
                  <Brain size={13}/> Full AI Risk Analysis
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="panel-empty">
            <div style={{fontSize:32}}>👷</div>
            <p>Select a worker to view their profile, location, and risk assessment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerMonitor;
