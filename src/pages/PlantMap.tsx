import React, { useState } from 'react';
import {
  Layers, X, ChevronRight, AlertTriangle, Thermometer,
  Wind, Gauge, Users, FileText, Camera, Zap,
  MapPin, Activity, Brain, ChevronDown
} from 'lucide-react';
import { sensors, workers, permits, alerts } from '../data/mockData';
import './PlantMap.css';

interface PlantMapProps {
  onNavigate: (page: string) => void;
}

type LayerKey = 'workers' | 'sensors' | 'temperature' | 'gas' | 'pressure' | 'permits' | 'equipment' | 'cctv';

const LAYERS: { key: LayerKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'workers', label: 'Workers', icon: <Users size={13} />, color: '#3B82F6' },
  { key: 'sensors', label: 'Sensors', icon: <Activity size={13} />, color: '#22C55E' },
  { key: 'temperature', label: 'Temperature', icon: <Thermometer size={13} />, color: '#EF4444' },
  { key: 'gas', label: 'Gas', icon: <Wind size={13} />, color: '#F59E0B' },
  { key: 'pressure', label: 'Pressure', icon: <Gauge size={13} />, color: '#8B5CF6' },
  { key: 'permits', label: 'Permits', icon: <FileText size={13} />, color: '#F59E0B' },
  { key: 'equipment', label: 'Equipment', icon: <Zap size={13} />, color: '#94A3B8' },
  { key: 'cctv', label: 'CCTV', icon: <Camera size={13} />, color: '#06B6D4' },
];

const ZONES = [
  { id: 'A', x: 40, y: 40, w: 160, h: 110, label: 'Zone A — Blast Furnace', risk: 'warning' as const, sensorIds: ['S001','S003','S010'], workers: ['W001'] },
  { id: 'B', x: 220, y: 40, w: 130, h: 90, label: 'Zone B — Converter', risk: 'warning' as const, sensorIds: ['S002'], workers: ['W002'] },
  { id: 'C', x: 370, y: 40, w: 110, h: 85, label: 'Zone C — Boiler Room', risk: 'safe' as const, sensorIds: ['S004'], workers: ['W008'] },
  { id: 'D', x: 500, y: 20, w: 70, h: 45, label: 'Chimney', risk: 'safe' as const, sensorIds: ['S005'], workers: [] },
  { id: 'E', x: 40, y: 170, w: 130, h: 95, label: 'Zone E — Compressor', risk: 'warning' as const, sensorIds: ['S006'], workers: ['W003'] },
  { id: 'F', x: 195, y: 155, w: 140, h: 110, label: 'Zone F — Tank Farm', risk: 'critical' as const, sensorIds: ['S007'], workers: ['W004'] },
  { id: 'G', x: 355, y: 145, w: 200, h: 120, label: 'Zone G — Rolling Mill', risk: 'safe' as const, sensorIds: ['S008','S011'], workers: ['W005','W007'] },
  { id: 'H', x: 40, y: 285, w: 115, h: 75, label: 'Zone H — Gas Plant', risk: 'safe' as const, sensorIds: ['S009'], workers: [] },
  { id: 'I', x: 175, y: 285, w: 110, h: 75, label: 'Zone I — Electrolyzer', risk: 'warning' as const, sensorIds: ['S012'], workers: [] },
  { id: 'CR', x: 355, y: 285, w: 155, h: 75, label: 'Control Room', risk: 'safe' as const, sensorIds: [], workers: ['W006'] },
];

const EQUIPMENT = [
  { x: 80, y: 80, label: 'BF-1', type: 'furnace' },
  { x: 250, y: 70, label: 'CV-2', type: 'converter' },
  { x: 400, y: 65, label: 'B3', type: 'boiler' },
  { x: 230, y: 200, label: 'T-14', type: 'tank' },
  { x: 260, y: 225, label: 'T-15', type: 'tank' },
  { x: 420, y: 195, label: 'RM-1', type: 'mill' },
];

const EXITS = [
  { x: 20, y: 360, label: 'E1' },
  { x: 580, y: 200, label: 'E2' },
  { x: 300, y: 375, label: 'E3' },
];

const riskColors: Record<string, string> = {
  safe: '#22C55E', warning: '#F59E0B', critical: '#EF4444'
};

interface SelectedObject {
  type: 'zone' | 'sensor' | 'worker';
  id: string;
}

const PlantMap: React.FC<PlantMapProps> = ({ onNavigate }) => {
  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(
    new Set(['workers', 'sensors', 'gas', 'permits', 'equipment'])
  );
  const [selected, setSelected] = useState<SelectedObject | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleLayer = (key: LayerKey) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectedZone = selected?.type === 'zone' ? ZONES.find(z => z.id === selected.id) : null;
  const selectedSensor = selected?.type === 'sensor' ? sensors.find(s => s.id === selected.id) : null;
  const selectedWorker = selected?.type === 'worker' ? workers.find(w => w.id === selected.id) : null;

  const liveEvents = [
    { time: '10:24:01', text: 'S007: O₂ level 18.1% — CRITICAL', sev: 'critical' },
    { time: '10:23:48', text: 'W004: Movement detected in Zone F confined space', sev: 'critical' },
    { time: '10:23:15', text: 'S001: H₂S trending up — 8.6 ppm', sev: 'warning' },
    { time: '10:22:50', text: 'S006: Compressor C3 vibration spike 7.9 mm/s', sev: 'warning' },
    { time: '10:22:10', text: 'AI: Compound risk escalation detected — Zone F', sev: 'critical' },
    { time: '10:21:30', text: 'PTW-0043: Worker W003 partial PPE alert', sev: 'warning' },
    { time: '10:20:05', text: 'S002: CO level stabilizing at 22.8 ppm', sev: 'info' },
    { time: '10:19:42', text: 'System: All CCTV feeds nominal', sev: 'info' },
  ];

  return (
    <div className="plant-map-layout">
      {/* Main Map Area */}
      <div className="plant-map-main">
        {/* Top Bar */}
        <div className="plant-map-toolbar">
          <div className="flex items-center gap-3">
            <h1 className="page-title" style={{fontSize:16}}>Live Plant Map</h1>
            <div className="badge badge-success">
              <span className="pulse-dot success" style={{width:5,height:5}} />
              LIVE
            </div>
          </div>
          <div className="layer-controls">
            <span className="label">Layers:</span>
            {LAYERS.map(layer => (
              <button
                key={layer.key}
                className={`layer-btn ${activeLayers.has(layer.key) ? 'active' : ''}`}
                style={{ '--layer-color': layer.color } as React.CSSProperties}
                onClick={() => toggleLayer(layer.key)}
                id={`layer-${layer.key}`}
              >
                <span style={{ color: activeLayers.has(layer.key) ? layer.color : 'var(--text-muted)' }}>
                  {layer.icon}
                </span>
                {layer.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>+</button>
            <span className="text-sm text-secondary">{Math.round(zoom * 100)}%</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.max(z - 0.2, 0.6))}>−</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setZoom(1)}>Reset</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setZoom(1); setPan({x: 0, y: 0}); }}>Center</button>
          </div>
        </div>

        {/* SVG Digital Twin */}
        <div 
          className={`plant-map-canvas ${isDragging ? 'dragging' : ''}`}
          onClick={() => selected && setSelected(null)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            viewBox="0 0 590 375"
            className="plant-map-svg"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
              transformOrigin: 'center', 
              transition: isDragging ? 'none' : 'transform 0.3s ease' 
            }}
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#12182B" strokeWidth="0.5"/>
              </pattern>
              <filter id="glow-critical">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <rect width="590" height="375" fill="#070913"/>
            <rect width="590" height="375" fill="url(#grid)"/>

            {/* Pipelines */}
            <g opacity="0.6">
              <path d="M 200 95 L 220 85" stroke="#374151" strokeWidth="3" fill="none"/>
              <path d="M 350 85 L 370 75" stroke="#374151" strokeWidth="3" fill="none"/>
              <path d="M 170 215 L 195 205" stroke="#374151" strokeWidth="3" fill="none" strokeDasharray="5 3"/>
              <path d="M 335 210 L 355 195" stroke="#374151" strokeWidth="3" fill="none"/>
              <path d="M 100 280 L 100 285" stroke="#374151" strokeWidth="3" fill="none"/>
              <path d="M 285 280 L 285 285" stroke="#374151" strokeWidth="3" fill="none"/>
              <path d="M 480 55 L 500 42" stroke="#374151" strokeWidth="2" fill="none"/>
            </g>

            {/* Emergency Exit markers */}
            {EXITS.map(exit => (
              <g key={exit.label}>
                <rect x={exit.x - 12} y={exit.y - 10} width={24} height={20} rx="3" fill="#22C55E" opacity="0.15" stroke="#22C55E" strokeWidth="1"/>
                <text x={exit.x} y={exit.y + 4} textAnchor="middle" fill="#22C55E" fontSize="7" fontWeight="700">EXIT {exit.label}</text>
              </g>
            ))}

            {/* Zones */}
            {ZONES.map(zone => {
              const isSelected = selected?.type === 'zone' && selected.id === zone.id;
              const color = riskColors[zone.risk];
              return (
                <g key={zone.id} onClick={(e) => { e.stopPropagation(); setSelected({ type: 'zone', id: zone.id }); }}>
                  {/* Risk zone heatmap overlay */}
                  {zone.risk !== 'safe' && activeLayers.has('gas') && (
                    <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="8"
                      fill={color} opacity="0.05">
                      <animate attributeName="opacity" values="0.04;0.1;0.04" dur="2s" repeatCount="indefinite"/>
                    </rect>
                  )}

                  <rect
                    x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="8"
                    fill={`${color}0D`}
                    stroke={isSelected ? color : `${color}60`}
                    strokeWidth={isSelected ? 2 : 1}
                    filter={zone.risk === 'critical' ? 'url(#glow-critical)' : undefined}
                    style={{ cursor: 'pointer', transition: 'stroke 0.2s' }}
                  />

                  {/* Pulsing border for critical */}
                  {zone.risk === 'critical' && (
                    <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="8"
                      fill="none" stroke={color} strokeWidth="1.5">
                      <animate attributeName="stroke-opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite"/>
                    </rect>
                  )}

                  <text x={zone.x + 8} y={zone.y + 14} fill={color} fontSize="8" fontWeight="700" opacity="0.9">
                    {zone.label}
                  </text>

                  {/* Risk badge */}
                  <rect x={zone.x + zone.w - 36} y={zone.y + 6} width={30} height={14} rx="3"
                    fill={`${color}25`}/>
                  <text x={zone.x + zone.w - 21} y={zone.y + 16} textAnchor="middle" fill={color} fontSize="7" fontWeight="800">
                    {zone.risk.toUpperCase()}
                  </text>

                  {/* Worker count dot */}
                  {activeLayers.has('workers') && zone.workers.length > 0 && (
                    <g>
                      <circle cx={zone.x + 10} cy={zone.y + zone.h - 10} r="8" fill="#3B82F640" stroke="#3B82F6" strokeWidth="1"/>
                      <text x={zone.x + 10} y={zone.y + zone.h - 6} textAnchor="middle" fill="#3B82F6" fontSize="7" fontWeight="700">
                        {zone.workers.length}W
                      </text>
                    </g>
                  )}

                  {/* Sensor indicators */}
                  {activeLayers.has('sensors') && zone.sensorIds.slice(0, 2).map((sid, si) => {
                    const s = sensors.find(x => x.id === sid);
                    if (!s) return null;
                    const sc = s.status === 'critical' ? '#EF4444' : s.status === 'warning' ? '#F59E0B' : '#22C55E';
                    return (
                      <g key={sid} onClick={(e) => { e.stopPropagation(); setSelected({ type: 'sensor', id: sid }); }}>
                        <rect
                          x={zone.x + 8 + si * 36} y={zone.y + zone.h - 28}
                          width={32} height={16} rx="3"
                          fill={`${sc}20`} stroke={sc} strokeWidth="0.8"
                          style={{ cursor: 'pointer' }}
                        />
                        <text x={zone.x + 24 + si * 36} y={zone.y + zone.h - 17} textAnchor="middle" fill={sc} fontSize="7" fontWeight="600">
                          {s.type === 'gas' ? 'GAS' : s.type === 'temperature' ? 'TEMP' : s.type === 'pressure' ? 'PRES' : s.type.slice(0,4).toUpperCase()}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Equipment */}
            {activeLayers.has('equipment') && EQUIPMENT.map(eq => (
              <g key={eq.label}>
                <rect x={eq.x - 14} y={eq.y - 14} width={28} height={28} rx="4"
                  fill="#94A3B820" stroke="#94A3B860" strokeWidth="1"/>
                <text x={eq.x} y={eq.y + 4} textAnchor="middle" fill="#94A3B8" fontSize="7" fontWeight="700">{eq.label}</text>
              </g>
            ))}

            {/* Workers */}
            {activeLayers.has('workers') && workers.map((w, i) => {
              const zone = ZONES.find(z => z.workers.includes(w.id));
              if (!zone) return null;
              const wx = zone.x + 20 + (i % 3) * 20;
              const wy = zone.y + 35 + Math.floor(i / 3) * 20;
              const wc = w.riskLevel === 'critical' ? '#EF4444' : w.riskLevel === 'high' ? '#F59E0B' : '#3B82F6';
              return (
                <g key={w.id} onClick={(e) => { e.stopPropagation(); setSelected({ type: 'worker', id: w.id }); }}
                   style={{ cursor: 'pointer' }}>
                  <circle cx={wx} cy={wy} r="7" fill={`${wc}25`} stroke={wc} strokeWidth="1.5"/>
                  <text x={wx} y={wy+4} textAnchor="middle" fill={wc} fontSize="7" fontWeight="700">
                    {w.name.split(' ').map(n => n[0]).join('')}
                  </text>
                  {w.riskLevel === 'critical' && (
                    <circle cx={wx} cy={wy} r="7" fill="none" stroke={wc} strokeWidth="1.5">
                      <animate attributeName="r" values="7;10;7" dur="1s" repeatCount="indefinite"/>
                      <animate attributeName="stroke-opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
                    </circle>
                  )}
                </g>
              );
            })}

            {/* CCTV cameras */}
            {activeLayers.has('cctv') && [[50,165],[350,140],[190,150],[480,280]].map(([cx,cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="5" fill="#06B6D420" stroke="#06B6D4" strokeWidth="1"/>
                <text x={cx} y={cy+3} textAnchor="middle" fill="#06B6D4" fontSize="5">📷</text>
              </g>
            ))}

            {/* Permit zone overlays */}
            {activeLayers.has('permits') && permits.filter(p => p.status === 'active').map(permit => {
              const zone = ZONES.find(z => z.label.includes(permit.zone.split(' — ')[0]?.trim() || '')) ||
                           ZONES.find(z => permit.zone.includes(z.id));
              if (!zone) return null;
              return (
                <g key={permit.id}>
                  <rect x={zone.x + zone.w - 16} y={zone.y + 22} width={12} height={10} rx="2"
                    fill={permit.riskLevel === 'critical' ? '#EF444430' : '#F59E0B30'}
                    stroke={permit.riskLevel === 'critical' ? '#EF4444' : '#F59E0B'}
                    strokeWidth="0.8"/>
                  <text x={zone.x + zone.w - 10} y={zone.y + 30} textAnchor="middle"
                    fill={permit.riskLevel === 'critical' ? '#EF4444' : '#F59E0B'} fontSize="5" fontWeight="800">P</text>
                </g>
              );
            })}

            {/* Legend */}
            <g transform="translate(8, 355)">
              {[['#EF4444','Critical'],['#F59E0B','Warning'],['#22C55E','Safe'],['#3B82F6','Workers']].map(([c,l],i) => (
                <g key={l} transform={`translate(${i*80}, 0)`}>
                  <circle cx="5" cy="4" r="4" fill={c} opacity="0.7"/>
                  <text x="12" y="7" fill="#4B5563" fontSize="7">{l}</text>
                </g>
              ))}
            </g>
          </svg>
        </div>

        {/* Bottom Event Feed */}
        <div className="event-feed">
          <div className="event-feed-header">
            <Activity size={12} color="var(--blue)" />
            <span>Live Event Feed</span>
            <span className="badge badge-blue" style={{marginLeft:'auto'}}>STREAMING</span>
          </div>
          <div className="event-feed-scroll">
            {liveEvents.map((evt, i) => (
              <div key={i} className={`event-feed-item ${evt.sev}`}>
                <span className="event-time">{evt.time}</span>
                <span className={`event-dot ${evt.sev}`} />
                <span className="event-text">{evt.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className={`plant-map-panel ${selected ? 'open' : ''}`}>
        {selected && (
          <>
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  {selectedZone?.label || selectedSensor?.name || selectedWorker?.name}
                </div>
                <div className="panel-subtitle">
                  {selected.type === 'zone' ? 'Zone Details' :
                   selected.type === 'sensor' ? 'Sensor Details' : 'Worker Profile'}
                </div>
              </div>
              <button className="btn-icon-header" onClick={() => setSelected(null)}>
                <X size={14} />
              </button>
            </div>

            <div className="panel-content">
              {selectedZone && (
                <ZonePanel zone={selectedZone} sensors={sensors} workers={workers} permits={permits} onNavigate={onNavigate} />
              )}
              {selectedSensor && (
                <SensorPanel sensor={selectedSensor} onNavigate={onNavigate} />
              )}
              {selectedWorker && (
                <WorkerPanel worker={selectedWorker} onNavigate={onNavigate} />
              )}
            </div>
          </>
        )}
        {!selected && (
          <div className="panel-empty">
            <MapPin size={32} color="var(--text-muted)" />
            <p>Click any zone, sensor, or worker on the map to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ZonePanel: React.FC<any> = ({ zone, sensors: allSensors, workers: allWorkers, permits: allPermits, onNavigate }) => {
  const zoneSensors = allSensors.filter((s: any) => zone.sensorIds.includes(s.id));
  const zoneWorkers = allWorkers.filter((w: any) => zone.workers.includes(w.id));
  const color = riskColors[zone.risk];

  return (
    <div className="panel-sections">
      <div className="panel-section">
        <div className="panel-kv">
          <span>Risk Level</span>
          <span className={`badge badge-${zone.risk === 'critical' ? 'critical' : zone.risk === 'warning' ? 'warning' : 'success'}`}>
            {zone.risk.toUpperCase()}
          </span>
        </div>
        <div className="panel-kv">
          <span>Workers</span><strong>{zone.workers.length} active</strong>
        </div>
        <div className="panel-kv">
          <span>Sensors</span><strong>{zone.sensorIds.length} monitoring</strong>
        </div>
      </div>

      {zoneSensors.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title">Live Sensors</div>
          {zoneSensors.map((s: any) => {
            const ratio = s.value / s.threshold;
            const sc = ratio >= 1 ? '#EF4444' : ratio >= 0.8 ? '#F59E0B' : '#22C55E';
            return (
              <div key={s.id} className="panel-sensor-row" onClick={() => onNavigate('sensors')}>
                <div>
                  <div className="panel-sensor-name">{s.name.split(' — ')[0]}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)'}}>{s.equipment}</div>
                </div>
                <div className="text-right">
                  <div style={{color:sc,fontWeight:700,fontSize:14}}>{s.value} {s.unit}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)'}}>Threshold: {s.threshold}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {zoneWorkers.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title">Workers in Zone</div>
          {zoneWorkers.map((w: any) => (
            <div key={w.id} className="panel-worker-row" onClick={() => onNavigate('workers')}>
              <div className="worker-avatar-sm">{w.name.split(' ').map((n: string) => n[0]).join('')}</div>
              <div>
                <div style={{fontSize:12,fontWeight:600}}>{w.name}</div>
                <div style={{fontSize:10,color:'var(--text-muted)'}}>{w.role} · {w.task}</div>
              </div>
              <span className={`badge badge-${w.riskLevel === 'critical' ? 'critical' : w.riskLevel === 'high' ? 'warning' : 'muted'}`}>
                {w.riskLevel.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="panel-section">
        <div className="panel-ai-box">
          <div className="panel-ai-title"><Brain size={11} /> AI Analysis</div>
          <p>
            {zone.risk === 'critical'
              ? 'CRITICAL: Compound hazard detected. O₂ deficiency combined with confined space worker presence requires immediate evacuation. Permit PTW-0042 should be suspended.'
              : zone.risk === 'warning'
              ? 'This zone shows elevated readings trending toward warning thresholds. Increased monitoring frequency recommended. Ensure all PPE is compliant.'
              : 'Zone operating within normal parameters. Continue standard monitoring protocols.'}
          </p>
        </div>
        <button className="btn btn-primary w-full mt-3" style={{justifyContent:'center'}}
          onClick={() => onNavigate('ai-risk')}>
          <Brain size={13} /> View Full AI Risk Analysis
        </button>
      </div>
    </div>
  );
};

const SensorPanel: React.FC<any> = ({ sensor, onNavigate }) => {
  const ratio = sensor.value / sensor.threshold;
  const sc = ratio >= 1 ? '#EF4444' : ratio >= 0.8 ? '#F59E0B' : '#22C55E';
  return (
    <div className="panel-sections">
      <div className="panel-section">
        <div className="panel-kv"><span>Type</span><strong className="capitalize">{sensor.type}</strong></div>
        <div className="panel-kv"><span>Zone</span><strong>{sensor.zone}</strong></div>
        <div className="panel-kv"><span>Equipment</span><strong>{sensor.equipment}</strong></div>
        <div className="panel-kv"><span>Status</span>
          <span className={`badge badge-${sensor.status === 'critical' ? 'critical' : sensor.status === 'warning' ? 'warning' : 'success'}`}>
            {sensor.status.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="panel-section">
        <div className="current-reading" style={{borderColor: `${sc}40`}}>
          <div style={{fontSize:32,fontWeight:800,color:sc,letterSpacing:'-0.03em'}}>{sensor.value}</div>
          <div style={{fontSize:13,color:'var(--text-secondary)'}}>{sensor.unit}</div>
          <div style={{fontSize:10,color:'var(--text-muted)',marginTop:4}}>Threshold: {sensor.threshold} {sensor.unit}</div>
          <div className="progress-bar" style={{marginTop:8}}>
            <div className="progress-bar-fill" style={{width:`${Math.min((sensor.value/sensor.max)*100,100)}%`, background:sc}} />
          </div>
        </div>
      </div>
      <button className="btn btn-primary w-full" style={{justifyContent:'center'}} onClick={() => onNavigate('sensors')}>
        View Full Sensor History
      </button>
    </div>
  );
};

const WorkerPanel: React.FC<any> = ({ worker, onNavigate }) => {
  const rc = worker.riskLevel === 'critical' ? '#EF4444' : worker.riskLevel === 'high' ? '#F59E0B' : '#22C55E';
  return (
    <div className="panel-sections">
      <div className="panel-section">
        <div className="panel-kv"><span>Role</span><strong>{worker.role}</strong></div>
        <div className="panel-kv"><span>Zone</span><strong>{worker.zone}</strong></div>
        <div className="panel-kv"><span>Task</span><strong>{worker.task}</strong></div>
        <div className="panel-kv"><span>PPE</span>
          <span className={`badge badge-${worker.ppeStatus === 'compliant' ? 'success' : worker.ppeStatus === 'partial' ? 'warning' : 'critical'}`}>
            {worker.ppeStatus.toUpperCase()}
          </span>
        </div>
        <div className="panel-kv"><span>Heart Rate</span><strong style={{color:worker.heartRate>100?'#EF4444':'var(--text-primary)'}}>{worker.heartRate} bpm</strong></div>
        <div className="panel-kv"><span>Gas Exposure</span><strong>{worker.gasExposure} ppm</strong></div>
        <div className="panel-kv"><span>Risk Level</span>
          <span className={`badge badge-${worker.riskLevel === 'critical' ? 'critical' : worker.riskLevel === 'high' ? 'warning' : 'muted'}`}>
            {worker.riskLevel.toUpperCase()}
          </span>
        </div>
      </div>
      {worker.nearbyHazards.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title">Nearby Hazards</div>
          {worker.nearbyHazards.map((h: string) => (
            <div key={h} className="hazard-tag"><AlertTriangle size={10}/> {h}</div>
          ))}
        </div>
      )}
      <button className="btn btn-primary w-full" style={{justifyContent:'center'}} onClick={() => onNavigate('workers')}>
        View Worker Profile
      </button>
    </div>
  );
};

export default PlantMap;
