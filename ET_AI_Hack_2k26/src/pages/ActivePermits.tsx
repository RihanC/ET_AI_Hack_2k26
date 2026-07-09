import React, { useState, useEffect } from 'react';
import { FileText, Clock, Users, Zap, AlertTriangle, CheckCircle, X, Brain, ChevronRight } from 'lucide-react';
import { permitsApi, workersApi } from '../services/api';
import { getSocket, connectSocket, EVENTS } from '../services/socket';
import type { Permit } from '../data/types';
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

function mapApiPermit(p: any): Permit {
  return {
    id: p.id,
    type: (p.type || 'hot-work').toLowerCase().replace('_', '-') as Permit['type'],
    title: p.title || '',
    zone: p.zone?.name || p.zoneName || p.zone || '',
    issuer: p.issuer ? `${p.issuer.firstName || ''} ${p.issuer.lastName || ''}`.trim() : 'N/A',
    workers: p.workers ? p.workers.map((w: any) => w.id || w) : [],
    equipment: p.equipment ? p.equipment.map((eq: any) => eq.name || eq.equipment?.name || eq) : [],
    startTime: p.startTime ? new Date(p.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
    endTime: p.endTime ? new Date(p.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
    status: (p.status || 'pending').toLowerCase() as Permit['status'],
    riskLevel: (p.riskLevel || 'low').toLowerCase() as Permit['riskLevel'],
    compliance: p.compliance ?? 100,
    aiRecommendation: p.aiRecommendation || 'No recommendations',
  };
}

function mapApiWorker(w: any): any {
  return {
    id: w.id,
    name: w.name,
    role: w.role,
    ppeStatus: (w.ppeStatus || 'compliant').toLowerCase(),
  };
}

const ActivePermits: React.FC<ActivePermitsProps> = ({ onNavigate }) => {
  const [permitsList, setPermitsList] = useState<Permit[]>([]);
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [tab, setTab] = useState<'active' | 'expired' | 'pending'>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [permitsRes, workersRes] = await Promise.all([
        permitsApi.getAll(),
        workersApi.getAll(),
      ]);

      if (permitsRes.success && Array.isArray(permitsRes.data)) {
        const mapped = permitsRes.data.map(mapApiPermit);
        setPermitsList(mapped);
      }
      if (workersRes.success && Array.isArray(workersRes.data)) {
        setWorkersList(workersRes.data.map(mapApiWorker));
      }
    } catch (err) {
      console.warn('Permits api fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();

    const socket = getSocket() || connectSocket();
    const handlePermitCreated = (data: any) => {
      if (data) fetchAll();
    };
    const handlePermitUpdated = (data: any) => {
      if (data) fetchAll();
    };

    if (socket) {
      socket.on(EVENTS.PERMIT_CREATED, handlePermitCreated);
      socket.on(EVENTS.PERMIT_UPDATED, handlePermitUpdated);
    }

    return () => {
      if (socket) {
        socket.off(EVENTS.PERMIT_CREATED, handlePermitCreated);
        socket.off(EVENTS.PERMIT_UPDATED, handlePermitUpdated);
      }
    };
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await permitsApi.approve(id);
      fetchAll();
    } catch (err) {
      console.error('Approve permit failed:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await permitsApi.reject(id);
      fetchAll();
    } catch (err) {
      console.error('Reject permit failed:', err);
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await permitsApi.suspend(id);
      fetchAll();
    } catch (err) {
      console.error('Suspend permit failed:', err);
    }
  };

  const filtered = permitsList.filter(p =>
    tab === 'active' ? p.status === 'active' :
    tab === 'expired' ? p.status === 'expired' :
    p.status === 'pending'
  );

  const selected = permitsList.find(p => p.id === selectedId) || filtered[0] || null;

  const activeCount = permitsList.filter(p => p.status === 'active').length;
  const expiredCount = permitsList.filter(p => p.status === 'expired').length;
  const pendingCount = permitsList.filter(p => p.status === 'pending').length;
  const criticalPermits = permitsList.filter(p => p.status === 'active' && p.riskLevel === 'critical').length;

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
      <div className="grid grid-4 mb-4">
        {[
          { label: 'Active Permits', value: activeCount, borderClass: 'border-blue', color: 'var(--blue)', icon: <FileText size={16}/> },
          { label: 'Critical Risk', value: criticalPermits, borderClass: 'border-critical', color: 'var(--critical)', icon: <AlertTriangle size={16}/> },
          { label: 'Avg Compliance', value: `${Math.round(permitsList.filter(p=>p.status==='active').reduce((a,p)=>a+p.compliance,0)/activeCount) || 100}%`, borderClass: 'border-warning', color: 'var(--warning)', icon: <CheckCircle size={16}/> },
          { label: 'Pending Approval', value: pendingCount, borderClass: 'border-purple', color: 'var(--purple)', icon: <Clock size={16}/> },
        ].map(k => (
          <div key={k.label} className={`card card-sm permit-metric-card ${k.borderClass}`}>
            <div className="flex justify-between items-center">
              <span className="label">{k.label}</span>
              <span className="permit-metric-icon" style={{ color: k.color, backgroundColor: `${k.color}12` }}>{k.icon}</span>
            </div>
            <div className="permit-metric-value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="permits-grid">
        {/* Permit List */}
        <div className="card permits-list-card">
          <div className="permits-header-tabs">
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
                  onClick={() => setSelectedId(permit.id)}
                >
                  <div className="permit-card-top">
                    <div>
                      <div className="permit-type-badge" style={{ '--type-color': typeColor } as React.CSSProperties}>
                        {TYPE_LABELS[permit.type]}
                      </div>
                      <div className="permit-id">{permit.id}</div>
                    </div>
                    <div className="text-right">
                      <span className={`badge badge-${permit.riskLevel==='critical'?'critical':permit.riskLevel==='high'?'warning':'muted'}`}>
                        {permit.riskLevel.toUpperCase()}
                      </span>
                      {permit.status === 'active' && (
                        <div className="permit-card-compliance">
                          <div className="compliance-mini">
                            <div style={{ width: `${permit.compliance}%`, background: permit.compliance >= 80 ? 'var(--success)' : permit.compliance >= 60 ? 'var(--warning)' : 'var(--critical)', height: '100%', borderRadius: 2 }} />
                          </div>
                          <span className="compliance-text">{permit.compliance}% compliant</span>
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
        <div className="card" style={{ overflow: 'auto' }}>
          {selected ? (
            <div>
              {/* Header */}
              <div className="permit-detail-header">
                <div>
                  <div className="permit-type-badge" style={{ '--type-color': TYPE_COLORS[selected.type], display: 'inline-flex', marginBottom: 6 } as React.CSSProperties}>
                    {TYPE_LABELS[selected.type]}
                  </div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selected.title}</h2>
                  <div className="permit-id">{selected.id}</div>
                </div>
                <span className={`badge badge-${selected.status==='active'?'success':selected.status==='expired'?'muted':'warning'}`}>
                  {selected.status.toUpperCase()}
                </span>
              </div>

              {/* Details Grid */}
              <div className="permit-detail-grid">
                {[
                  ['Zone', selected.zone],
                  ['Issued by', selected.issuer],
                  ['Start Time', selected.startTime],
                  ['End Time', selected.endTime],
                  ['Risk Level', selected.riskLevel.toUpperCase()],
                  ['Workers', `${selected.workers.length} assigned`],
                ].map(([k,v]) => (
                  <div key={String(k)} className="permit-detail-cell">
                    <div className="permit-detail-label">{k}</div>
                    <div className="permit-detail-val">{v}</div>
                  </div>
                ))}
              </div>

              {/* Compliance */}
              {selected.status === 'active' && (
                <div className="permit-section">
                  <div className="flex justify-between items-center mb-2">
                    <div className="label">Compliance Score</div>
                    <span className="compliance-score-val font-mono" style={{ color: selected.compliance >= 80 ? 'var(--success)' : selected.compliance >= 60 ? 'var(--warning)' : 'var(--critical)' }}>
                      {selected.compliance}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill" 
                      style={{
                        width: `${selected.compliance}%`,
                        background: selected.compliance >= 80 ? 'var(--success)' : selected.compliance >= 60 ? 'var(--warning)' : 'var(--critical)'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Workers */}
              {selected.workers.length > 0 && (
                <div className="permit-section">
                  <div className="label mb-2">Assigned Workers</div>
                  {selected.workers.map(wid => {
                    const w = workersList.find(x => x.id === wid);
                    if (!w) return null;
                    return (
                      <div key={wid} className="panel-worker-row" onClick={() => onNavigate('workers')}>
                        <div className="worker-avatar-sm">
                          {w.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="worker-row-name">{w.name}</div>
                          <div className="worker-row-role">{w.role} · {w.ppeStatus}</div>
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
              <div className="permit-section">
                <div className="label mb-2">Equipment</div>
                {selected.equipment.map(eq => (
                  <div key={eq} className="equipment-tag">
                    <Zap size={11} color="var(--text-muted)" /> {eq}
                  </div>
                ))}
              </div>

              {/* AI Recommendation */}
              <div className="ai-recommendation">
                <div className="ai-rec-title"><Brain size={12}/> AI Recommendation</div>
                <p>{selected.aiRecommendation}</p>
              </div>

              {/* Actions */}
              {selected.status === 'active' && (
                <div className="permit-actions">
                  <button className="btn btn-danger flex-1 center" onClick={() => handleSuspend(selected.id)}>
                    Suspend Permit
                  </button>
                  <button className="btn btn-ghost flex-1 center" onClick={() => onNavigate('ai-risk')}>
                    <Brain size={13}/> Risk Analysis
                  </button>
                </div>
              )}
              {selected.status === 'pending' && (
                <div className="permit-actions">
                  <button className="btn btn-success-action flex-1 center" onClick={() => handleApprove(selected.id)}>
                    Approve Permit
                  </button>
                  <button className="btn btn-danger flex-1 center" onClick={() => handleReject(selected.id)}>
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
