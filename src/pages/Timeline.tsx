import React, { useState } from 'react';
import { Search, Filter, Clock, Cpu, Users, FileText, Zap, Brain, ChevronRight, AlertTriangle } from 'lucide-react';
import { timelineEvents } from '../data/mockData';
import type { TimelineEvent } from '../data/mockData';
import './Timeline.css';

interface TimelineProps {
  onNavigate: (page: string) => void;
}

const CAT_ICONS: Record<string, React.ReactNode> = {
  sensor: <Cpu size={13} />,
  worker: <Users size={13} />,
  permit: <FileText size={13} />,
  equipment: <Zap size={13} />,
  ai: <Brain size={13} />,
  system: <AlertTriangle size={13} />,
};

const CAT_COLORS: Record<string, string> = {
  sensor: '#22C55E',
  worker: '#3B82F6',
  permit: '#F59E0B',
  equipment: '#94A3B8',
  ai: '#8B5CF6',
  system: '#06B6D4',
};

const SEV_COLORS: Record<string, string> = {
  critical: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

const Timeline: React.FC<TimelineProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [sevFilter, setSevFilter] = useState<string>('all');
  const [selected, setSelected] = useState<TimelineEvent | null>(timelineEvents[0]);

  const filtered = timelineEvents.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                        e.description.toLowerCase().includes(search.toLowerCase()) ||
                        e.zone.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || e.category === catFilter;
    const matchSev = sevFilter === 'all' || e.severity === sevFilter;
    return matchSearch && matchCat && matchSev;
  });

  const getNavTarget = (event: TimelineEvent): string => {
    if (event.category === 'sensor') return 'sensors';
    if (event.category === 'worker') return 'workers';
    if (event.category === 'permit') return 'permits';
    if (event.category === 'equipment') return 'plant-map';
    if (event.category === 'ai') return 'ai-risk';
    return 'dashboard';
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operational Timeline</h1>
          <p className="page-subtitle">24-hour event log · What happened? · {timelineEvents.length} events recorded</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="badge badge-critical">
            {timelineEvents.filter(e => e.severity === 'critical').length} Critical
          </span>
          <span className="badge badge-warning">
            {timelineEvents.filter(e => e.severity === 'warning').length} Warnings
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center mb-4 flex-wrap">
        <div className="input-with-icon" style={{maxWidth:260}}>
          <Search size={13} className="input-icon" />
          <input className="input" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tabs">
          {['all','sensor','worker','permit','equipment','ai','system'].map(cat => (
            <button
              key={cat}
              className={`tab ${catFilter===cat?'active':''}`}
              onClick={() => setCatFilter(cat)}
              style={catFilter===cat && cat!=='all' ? {color:CAT_COLORS[cat]} : {}}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="tabs">
          {['all','critical','warning','info'].map(sev => (
            <button
              key={sev}
              className={`tab ${sevFilter===sev?'active':''}`}
              onClick={() => setSevFilter(sev)}
              style={sevFilter===sev && sev!=='all' ? {color:SEV_COLORS[sev]||'inherit'} : {}}
            >
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-sm text-secondary" style={{marginLeft:'auto'}}>{filtered.length} events</span>
      </div>

      {/* Timeline Grid */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:16,height:'calc(100vh - var(--header-height) - 220px)',overflow:'hidden'}}>
        {/* Event List */}
        <div className="card" style={{padding:0,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border-color)',fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em'}}>
            {filtered.length} Events · Today · Morning Shift
          </div>
          <div className="timeline-spine-container" style={{flex:1,overflowY:'auto', padding: '24px 0'}}>
            <div className="timeline-spine-line" />
            {filtered.map((evt, i) => {
              const catColor = CAT_COLORS[evt.category];
              const sevColor = SEV_COLORS[evt.severity];
              const isSelected = selected?.id === evt.id;
              return (
                <div
                  key={evt.id}
                  className={`timeline-spine-item ${i % 2 === 0 ? 'left' : 'right'} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelected(evt)}
                >
                  <div className="timeline-spine-connector">
                    <div className="timeline-spine-dot" style={{background:sevColor, boxShadow: evt.severity==='critical' ? `0 0 8px ${sevColor}60`:undefined}} />
                  </div>
                  
                  <div className="timeline-spine-content card-sm" style={{borderColor: isSelected ? sevColor : 'var(--border-color)', borderWidth: isSelected ? 2 : 1}}>
                    <div className="timeline-event-header">
                      <span className="cat-badge" style={{background:`${catColor}15`,color:catColor,border:`1px solid ${catColor}30`}}>
                        {CAT_ICONS[evt.category]} {evt.category}
                      </span>
                      <span className="text-xs text-muted" style={{fontFamily:'var(--font-mono)'}}>{evt.timestamp}</span>
                    </div>
                    <div className="timeline-event-title">{evt.title}</div>
                    <div className="timeline-event-desc">{evt.description}</div>
                    <div className="timeline-event-footer">
                      <span className="text-xs text-muted" style={{display:'flex',alignItems:'center',gap:3}}>
                        <Clock size={9}/> {evt.zone}
                      </span>
                      <span className={`badge badge-${evt.severity==='critical'?'critical':evt.severity==='warning'?'warning':'muted'}`}>
                        {evt.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Detail */}
        <div className="card" style={{overflow:'auto'}}>
          {selected ? (
            <div>
              <div className="cat-badge" style={{
                background:`${CAT_COLORS[selected.category]}15`,
                color:CAT_COLORS[selected.category],
                border:`1px solid ${CAT_COLORS[selected.category]}30`,
                display:'inline-flex',
                marginBottom:12
              }}>
                {CAT_ICONS[selected.category]} {selected.category.toUpperCase()} EVENT
              </div>
              <h2 style={{fontSize:15,fontWeight:700,marginBottom:6,lineHeight:1.3}}>{selected.title}</h2>
              <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:14}}>{selected.description}</p>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
                {[
                  ['Timestamp', selected.timestamp],
                  ['Zone', selected.zone],
                  ['Category', selected.category],
                  ['Severity', selected.severity.toUpperCase()],
                ].map(([k,v]) => (
                  <div key={String(k)} style={{background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-md)',padding:'8px 10px'}}>
                    <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:600,marginTop:2,color:k==='Severity'?SEV_COLORS[selected.severity]:'var(--text-primary)'}}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Severity context */}
              <div style={{
                padding:12,borderRadius:'var(--radius-md)',marginBottom:14,
                background:selected.severity==='critical'?'rgba(239,68,68,0.07)':selected.severity==='warning'?'rgba(245,158,11,0.07)':'rgba(59,130,246,0.07)',
                border:`1px solid ${SEV_COLORS[selected.severity]}25`,
              }}>
                <div style={{fontSize:12,fontWeight:700,color:SEV_COLORS[selected.severity],marginBottom:4}}>
                  {selected.severity === 'critical' ? '⚡ Critical Action Required' :
                   selected.severity === 'warning' ? '⚠️ Attention Required' :
                   'ℹ️ Informational'}
                </div>
                <p style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.5}}>
                  {selected.severity === 'critical'
                    ? 'This event requires immediate response. Automated notifications have been sent to the Safety Officer and Emergency Response Team.'
                    : selected.severity === 'warning'
                    ? 'This event has been flagged for attention. Monitor the situation closely and take corrective action if escalation continues.'
                    : 'Logged for operational awareness. No immediate action required.'}
                </p>
              </div>

              <button
                className="btn btn-primary w-full mb-2"
                style={{justifyContent:'center'}}
                onClick={() => onNavigate(getNavTarget(selected))}
              >
                View in {selected.category.charAt(0).toUpperCase() + selected.category.slice(1)} Monitor
                <ChevronRight size={13}/>
              </button>
            </div>
          ) : (
            <div className="panel-empty">
              <Clock size={32} color="var(--text-muted)" />
              <p>Select an event to view details and navigate to the related page</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
