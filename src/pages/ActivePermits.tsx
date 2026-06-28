import React, { useState } from 'react';
import { FileText, Clock, Users, Zap, AlertTriangle, CheckCircle, X, Brain, ChevronRight } from 'lucide-react';
import { permits, workers } from '../data/mockData';
import type { Permit } from '../data/mockData';
import './ActivePermits.css';

interface ActivePermitsProps {
  onNavigate: (page: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  'hot-work': '#EF4444',
  'confined-space': '#F59E0B',
  'electrical': '#3B82F6',
  'working-at-height': '#8B5CF6',
  'chemical': '#06B6D4',
};

const TYPE_LABELS: Record<string, string> = {
  'hot-work': 'Hot Work',
  'confined-space': 'Confined Space',
  'electrical': 'Electrical',
  'working-at-height': 'Work at Height',
  'chemical': 'Chemical',
};

const ActivePermits: React.FC<ActivePermitsProps> = ({ onNavigate }) => {
  const [tab, setTab] = useState<'active' | 'expired' | 'pending'>('active');
  const [selected, setSelected] = useState<Permit | null>(permits[0]);

  const filtered = permits.filter(p =>
    tab === 'active' ? p.status === 'active' :
    tab === 'expired' ? p.status === 'expired' :
    p.status === 'pending'
  );

  const activeCount = permits.filter(p => p.status === 'active').length;
  const expiredCount = permits.filter(p => p.status === 'expired').length;
  const pendingCount = permits.filter(p => p.status === 'pending').length;
  const criticalPermits = permits.filter(p => p.status === 'active' && p.riskLevel === 'critical').length;

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Active Permits</h1>
          <p className="page-subtitle">Permit-to-Work management · Are permits creating additional risk?</p>
        </div>
        <div className="flex gap-2 items-center">
          {criticalPermits > 0 && (
            <span className="badge badge-critical">
              <span className="pulse-dot critical" style={{width:5,height:5}} />
              {criticalPermits} CRITICAL PERMIT{criticalPermits>1?'S':''}
            </span>
          )}
          <button className="btn btn-primary btn-sm">+ New Permit</button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid-4 mb-4">
        {[
          { label: 'Active Permits', value: activeCount, color: '#3B82F6', icon: <FileText size={16}/> },
          { label: 'Critical Risk', value: criticalPermits, color: '#EF4444', icon: <AlertTriangle size={16}/> },
          { label: 'Avg Compliance', value: `${Math.round(permits.filter(p=>p.status==='active').reduce((a,p)=>a+p.compliance,0)/activeCount)}%`, color: '#F59E0B', icon: <CheckCircle size={16}/> },
          { label: 'Pending Approval', value: pendingCount, color: '#8B5CF6', icon: <Clock size={16}/> },
        ].map(k => (
          <div key={k.label} className="card card-sm" style={{borderTop:`2px solid ${k.color}`}}>
            <div className="flex justify-between items-center">
              <span className="label">{k.label}</span>
              <span style={{color:k.color,background:`${k.color}18`,padding:'4px',borderRadius:6}}>{k.icon}</span>
            </div>
            <div style={{fontSize:28,fontWeight:800,color:k.color,letterSpacing:'-0.03em',marginTop:6,lineHeight:1}}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="permits-grid">
        {/* Permit List */}
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border-color)'}}>
            <div className="tabs">
              <button className={`tab ${tab==='active'?'active':''}`} onClick={() => setTab('active')}>
                Active ({activeCount})
              </button>
              <button className={`tab ${tab==='expired'?'active':''}`} onClick={() => setTab('expired')}>
                Expired ({expiredCount})
              </button>
              <button className={`tab ${tab==='pending'?'active':''}`} onClick={() => setTab('pending')}>
                Pending ({pendingCount})
              </button>
            </div>
          </div>
          <div className="permit-list">
            {filtered.map(permit => {
              const typeColor = TYPE_COLORS[permit.type];
              const isSelected = selected?.id === permit.id;
              return (
                <div
                  key={permit.id}
                  className={`permit-card ${isSelected ? 'selected' : ''} ${permit.riskLevel}`}
                  onClick={() => setSelected(permit)}
                >
                  <div className="permit-card-top">
                    <div>
                      <div className="permit-type-badge" style={{background:`${typeColor}15`,color:typeColor,borderColor:`${typeColor}30`}}>
                        {TYPE_LABELS[permit.type]}
                      </div>
                      <div className="permit-id" style={{marginTop:4}}>{permit.id}</div>
                    </div>
                    <div className="text-right">
                      <span className={`badge badge-${permit.riskLevel==='critical'?'critical':permit.riskLevel==='high'?'warning':'muted'}`}>
                        {permit.riskLevel.toUpperCase()}
                      </span>
                      {permit.status === 'active' && (
                        <div style={{marginTop:4}}>
                          <div className="compliance-mini">
                            <div style={{width:`${permit.compliance}%`,background:permit.compliance>=80?'#22C55E':permit.compliance>=60?'#F59E0B':'#EF4444',height:'100%',borderRadius:2}}/>
                          </div>
                          <span style={{fontSize:10,color:'var(--text-muted)'}}>{permit.compliance}% compliant</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="permit-title">{permit.title}</div>
                  <div className="permit-meta">
                    <span><Clock size={9}/> {permit.startTime} – {permit.endTime}</span>
                    <span><Users size={9}/> {permit.workers.length} worker{permit.workers.length!==1?'s':''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Permit Detail */}
        <div className="card" style={{overflow:'auto'}}>
          {selected ? (
            <div>
              {/* Header */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,paddingBottom:16,borderBottom:'1px solid var(--border-color)'}}>
                <div>
                  <div className="permit-type-badge" style={{background:`${TYPE_COLORS[selected.type]}15`,color:TYPE_COLORS[selected.type],borderColor:`${TYPE_COLORS[selected.type]}30`,display:'inline-flex',marginBottom:6}}>
                    {TYPE_LABELS[selected.type]}
                  </div>
                  <h2 style={{fontSize:16,fontWeight:700,marginBottom:4}}>{selected.title}</h2>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{selected.id}</div>
                </div>
                <span className={`badge badge-${selected.status==='active'?'success':selected.status==='expired'?'muted':'warning'}`}>
                  {selected.status.toUpperCase()}
                </span>
              </div>

              {/* Details Grid */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
                {[
                  ['Zone', selected.zone],
                  ['Issued by', selected.issuer],
                  ['Start Time', selected.startTime],
                  ['End Time', selected.endTime],
                  ['Risk Level', selected.riskLevel.toUpperCase()],
                  ['Workers', `${selected.workers.length} assigned`],
                ].map(([k,v]) => (
                  <div key={String(k)} style={{background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-md)',padding:'8px 10px'}}>
                    <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:600,marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Compliance */}
              {selected.status === 'active' && (
                <div style={{marginBottom:16}}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="label">Compliance Score</div>
                    <span style={{fontSize:18,fontWeight:800,color:selected.compliance>=80?'#22C55E':selected.compliance>=60?'#F59E0B':'#EF4444'}}>
                      {selected.compliance}%
                    </span>
                  </div>
                  <div className="progress-bar" style={{height:8}}>
                    <div className="progress-bar-fill" style={{
                      width:`${selected.compliance}%`,
                      background:selected.compliance>=80?'#22C55E':selected.compliance>=60?'#F59E0B':'#EF4444'
                    }}/>
                  </div>
                </div>
              )}

              {/* Workers */}
              {selected.workers.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div className="label mb-2">Assigned Workers</div>
                  {selected.workers.map(wid => {
                    const w = workers.find(x => x.id === wid);
                    if (!w) return null;
                    return (
                      <div key={wid} className="panel-worker-row" style={{cursor:'pointer'}} onClick={() => onNavigate('workers')}>
                        <div className="worker-avatar-sm" style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#3B82F6,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'white',flexShrink:0}}>
                          {w.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div>
                          <div style={{fontSize:12,fontWeight:600}}>{w.name}</div>
                          <div style={{fontSize:10,color:'var(--text-muted)'}}>{w.role} · {w.ppeStatus}</div>
                        </div>
                        <span className={`badge badge-${w.ppeStatus==='compliant'?'success':w.ppeStatus==='partial'?'warning':'critical'}`}>
                          PPE {w.ppeStatus}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Equipment */}
              <div style={{marginBottom:16}}>
                <div className="label mb-2">Equipment</div>
                {selected.equipment.map(eq => (
                  <div key={eq} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 10px',background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-md)',marginBottom:4,fontSize:12}}>
                    <Zap size={11} color="#94A3B8" /> {eq}
                  </div>
                ))}
              </div>

              {/* AI Recommendation */}
              <div className="ai-recommendation" style={{marginBottom:16}}>
                <div className="ai-rec-title"><Brain size={12}/> AI Recommendation</div>
                <p>{selected.aiRecommendation}</p>
              </div>

              {/* Actions */}
              {selected.status === 'active' && (
                <div className="flex gap-2">
                  <button className="btn btn-danger flex-1" style={{justifyContent:'center'}}>
                    Suspend Permit
                  </button>
                  <button className="btn btn-ghost flex-1" style={{justifyContent:'center'}} onClick={() => onNavigate('ai-risk')}>
                    <Brain size={13}/> Risk Analysis
                  </button>
                </div>
              )}
              {selected.status === 'pending' && (
                <div className="flex gap-2">
                  <button className="btn btn-primary flex-1" style={{justifyContent:'center', background:'#22C55E'}}>
                    Approve Permit
                  </button>
                  <button className="btn btn-danger flex-1" style={{justifyContent:'center'}}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="panel-empty">
              <FileText size={32} color="var(--text-muted)" />
              <p>Select a permit to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivePermits;
