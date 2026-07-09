import React, { useState, useEffect } from 'react';
import {
  Brain, AlertTriangle, TrendingUp, ChevronRight, Zap,
  Clock, Users, FileText, Cpu, Play, RotateCcw, Info
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts';
import { sensorsApi, workersApi, permitsApi, alertsApi } from '../services/api';
import './AIRiskCenter.css';

interface AIRiskCenterProps {
  liveKPI: any;
  onNavigate: (page: string) => void;
}

// Compound risks and what-if scenarios are computed dynamically inside the component

const AIRiskCenter: React.FC<AIRiskCenterProps> = ({ liveKPI, onNavigate }) => {
  const [sensorsList, setSensorsList] = useState<any[]>([]);
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [permitsList, setPermitsList] = useState<any[]>([]);
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      try {
        const [sensorsRes, workersRes, permitsRes, alertsRes] = await Promise.all([
          sensorsApi.getAll(),
          workersApi.getAll(),
          permitsApi.getAll(),
          alertsApi.getAll(),
        ]);
        if (active) {
          if (sensorsRes.success && Array.isArray(sensorsRes.data)) setSensorsList(sensorsRes.data);
          if (workersRes.success && Array.isArray(workersRes.data)) setWorkersList(workersRes.data);
          if (permitsRes.success && Array.isArray(permitsRes.data)) setPermitsList(permitsRes.data);
          if (alertsRes.success && Array.isArray(alertsRes.data)) setAlertsList(alertsRes.data);
        }
      } catch (err) {
        console.warn('AIRiskCenter API load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAll();
    return () => { active = false; };
  }, []);

  // Compute compound risks dynamically
  const compoundRisks: any[] = [];

  // 1. Confined space / high-hazard ppe compliance
  const activeConfinedSpacePermits = permitsList.filter(
    (p) => (p.status === 'active' || p.status === 'ACTIVE') && p.type === 'confined-space'
  );
  activeConfinedSpacePermits.forEach((permit) => {
    const zoneName = permit.zone?.name || permit.zoneName || permit.zone || 'Confined Space Zone';
    const workersInZone = workersList.filter(
      (w) => w.zone?.name === zoneName || w.zoneName === zoneName || w.zone === zoneName
    );
    const nonCompliantWorker = workersInZone.find((w) => w.ppeStatus !== 'compliant');
    const o2Sensor = sensorsList.find(
      (s) =>
        (s.zone?.name === zoneName || s.zoneName === zoneName || s.zone === zoneName) &&
        (s.type === 'gas' || s.type === 'GAS') &&
        (s.name.includes('O₂') || s.name.includes('Oxygen'))
    );

    if (nonCompliantWorker || (o2Sensor && o2Sensor.status === 'critical')) {
      compoundRisks.push({
        id: `CR-CONF-${permit.id}`,
        title: 'Oxygen Deficiency + Confined Space + Non-Compliant PPE',
        zone: zoneName,
        probability: permit.compliance < 80 ? 87 : 72,
        timeToEscalation: '< 8 minutes',
        severity: 'critical' as const,
        factors: [
          o2Sensor ? `O₂ sensor ${o2Sensor.name.split('—')[0]} at ${o2Sensor.value}${o2Sensor.unit} (${o2Sensor.status})` : 'Low Oxygen levels',
          nonCompliantWorker ? `Worker ${nonCompliantWorker.name} in zone has ${nonCompliantWorker.ppeStatus} PPE` : 'Confined space active',
          `Permit compliance is ${permit.compliance}%`,
        ],
        recommendation: `IMMEDIATE: Evacuate workers from ${zoneName}. Suspend permit ${permit.id}. Activate confined space rescue protocol.`,
        confidence: 94,
      });
    }
  });

  // 2. Gas warnings + High Temp + Hot work
  const activeHotWorkPermits = permitsList.filter(
    (p) => (p.status === 'active' || p.status === 'ACTIVE') && p.type === 'hot-work'
  );
  activeHotWorkPermits.forEach((permit) => {
    const zoneName = permit.zone?.name || permit.zoneName || permit.zone || 'Hot Work Zone';
    const gasWarningSensor = sensorsList.find(
      (s) =>
        (s.zone?.name === zoneName || s.zoneName === zoneName || s.zone === zoneName) &&
        (s.type === 'gas' || s.type === 'GAS') &&
        (s.status === 'warning' || s.status === 'critical')
    );
    const tempSensor = sensorsList.find(
      (s) =>
        (s.zone?.name === zoneName || s.zoneName === zoneName || s.zone === zoneName) &&
        (s.type === 'temperature' || s.type === 'TEMPERATURE')
    );

    if (gasWarningSensor || (tempSensor && tempSensor.value > 1000)) {
      compoundRisks.push({
        id: `CR-HOT-${permit.id}`,
        title: 'Gas Concentration + High Temperature + Hot-Work Permit Active',
        zone: zoneName,
        probability: gasWarningSensor?.status === 'critical' ? 88 : 64,
        timeToEscalation: '~35 minutes',
        severity: gasWarningSensor?.status === 'critical' ? ('critical' as const) : ('warning' as const),
        factors: [
          gasWarningSensor ? `${gasWarningSensor.name.split('—')[0]} at ${gasWarningSensor.value}${gasWarningSensor.unit}` : 'Hazardous gas readings',
          tempSensor ? `Temperature at ${tempSensor.value}°C` : 'High furnace heat',
          `Hot-work permit ${permit.id} active`,
        ],
        recommendation: `Increase ventilation rate by 40% in ${zoneName}. Alert worker operations. Suspend permit ${permit.id} if gas exceeds threshold.`,
        confidence: 78,
      });
    }
  });

  // 3. General active alerts warning fallback
  const unresolvedAlerts = alertsList.filter((a) => !a.acknowledged && !a.resolved);
  if (compoundRisks.length === 0 && unresolvedAlerts.length > 0) {
    const primaryAlert = unresolvedAlerts[0];
    const alertZone = primaryAlert.zone?.name || primaryAlert.zoneName || primaryAlert.zone || 'Plant Floor';
    compoundRisks.push({
      id: `CR-GEN-${primaryAlert.id}`,
      title: `${primaryAlert.title} + Active Hazards`,
      zone: alertZone,
      probability: primaryAlert.severity === 'critical' ? 75 : 50,
      timeToEscalation: '~45 minutes',
      severity: primaryAlert.severity === 'critical' ? ('critical' as const) : ('warning' as const),
      factors: [
        `Active Alert: ${primaryAlert.description}`,
        `Safety event source: ${primaryAlert.source || 'Sensor Network'}`,
      ],
      recommendation: `Acknowledge alert ${primaryAlert.id}. Deploy field technician to verify conditions in ${alertZone}.`,
      confidence: 80,
    });
  }

  // Fallback safe card if no risk is present
  if (compoundRisks.length === 0) {
    compoundRisks.push({
      id: 'SAFE',
      title: 'All Safety Parameters Within Safe Thresholds',
      zone: 'All Plant Zones',
      probability: 0,
      timeToEscalation: 'N/A',
      severity: 'info' as const,
      factors: ['All sensor telemetry online and nominal', 'No active critical safety events', 'All worker PPE fully compliant'],
      recommendation: 'Continue routine safety inspections. Maintain active sensor telemetry monitoring and shift supervision.',
      confidence: 100,
    });
  }

  const dynamicRiskFactors = [
    { factor: 'Gas Concentration', score: Math.min(100, Math.max(10, Math.round(liveKPI.riskScore * 1.1))), weight: 0.3, trend: 'up', color: '#EF4444' },
    { factor: 'Worker Exposure', score: Math.min(100, 20 + (liveKPI.activeWorkers * 8)), weight: 0.25, trend: 'stable', color: '#F59E0B' },
    { factor: 'Equipment Health', score: Math.min(100, Math.max(10, 100 - Math.round(liveKPI.plantHealth))), weight: 0.2, trend: 'stable', color: '#F59E0B' },
    { factor: 'Permit Risk', score: Math.min(100, 10 + (liveKPI.activePermits * 12)), weight: 0.15, trend: 'up', color: '#EF4444' },
    { factor: 'Environmental', score: 42, weight: 0.1, trend: 'down', color: '#22C55E' },
  ];

  const radarData = dynamicRiskFactors.map(rf => ({
    subject: rf.factor.split(' ')[0],
    current: rf.score,
    threshold: 60,
  }));

  const trendData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    riskScore: Math.round(Math.max(10, Math.min(95, liveKPI.riskScore - 15 + Math.sin(i * 0.4) * 10 + Math.random() * 5))),
  }));

  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const selectedRisk = compoundRisks.find(r => r.id === selectedRiskId) || compoundRisks[0];
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<null | number>(null);

  const riskScore = Math.round(liveKPI.riskScore);
  const riskColor = riskScore >= 75 ? '#EF4444' : riskScore >= 50 ? '#F59E0B' : '#22C55E';

  const whatIfScenarios = [
    { name: 'Current State', risk: riskScore, gas: Math.round((riskScore * 0.12) * 10) / 10, workers: liveKPI.activeWorkers },
    { name: 'If Evacuate Zone', risk: Math.max(5, Math.round(riskScore * 0.7)), gas: Math.round((riskScore * 0.12) * 10) / 10, workers: Math.max(0, liveKPI.activeWorkers - 1) },
    { name: 'If Increase Vent', risk: Math.max(5, Math.round(riskScore * 0.85)), gas: Math.round((riskScore * 0.08) * 10) / 10, workers: liveKPI.activeWorkers },
    { name: 'If Suspend PTW', risk: Math.max(5, Math.round(riskScore * 0.75)), gas: Math.round((riskScore * 0.12) * 10) / 10, workers: Math.max(0, liveKPI.activeWorkers - 1) },
    { name: 'All Actions', risk: Math.max(2, Math.round(riskScore * 0.45)), gas: Math.round((riskScore * 0.08) * 10) / 10, workers: 0 },
  ];

  const runSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimResult(32);
      setSimulating(false);
    }, 1800);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="chart-tooltip-label">{label}</div>
          {payload.map((p: any) => (
            <div key={p.name} className="chart-tooltip-row">
              <span style={{color:p.fill||p.stroke}}>{p.name}:</span>
              <span>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title flex gap-2 items-center">
            <Brain size={20} color="#8B5CF6" /> AI Risk Center
          </h1>
          <p className="page-subtitle">Compound risk analysis · Why is this dangerous? · Updated 30s ago</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="badge badge-purple">
            <Brain size={10} /> AI ACTIVE
          </span>
          <span className="badge badge-critical">
            {compoundRisks.filter(r => r.severity === 'critical').length} COMPOUND RISKS
          </span>
        </div>
      </div>

      {/* Top Grid: Gauge + Radar + Breakdown */}
      <div className="risk-top-grid">
        {/* Risk Gauge */}
        <div className="card card-sm">
          <div className="card-title mb-3">Overall Risk Score</div>
          <div className="risk-gauge-container">
            <svg viewBox="0 0 200 120" width="200" height="120" style={{display:'block',margin:'0 auto'}}>
              <defs>
                <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22C55E"/>
                  <stop offset="50%" stopColor="#F59E0B"/>
                  <stop offset="100%" stopColor="#EF4444"/>
                </linearGradient>
              </defs>
              <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke="#1F2937" strokeWidth="16" strokeLinecap="round"/>
              <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke="url(#gaugeGrad)"
                strokeWidth="16" strokeLinecap="round"
                strokeDasharray={`${(riskScore / 100) * 251} 251`} opacity="0.3"/>
              <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke={riskColor}
                strokeWidth="16" strokeLinecap="round"
                strokeDasharray={`${(riskScore / 100) * 251} 251`}/>
              {/* Needle */}
              {(() => {
                const angle = -180 + (riskScore / 100) * 180;
                const rad = (angle * Math.PI) / 180;
                const nx = 100 + 65 * Math.cos(rad);
                const ny = 105 + 65 * Math.sin(rad);
                return <line x1="100" y1="105" x2={nx} y2={ny} stroke="white" strokeWidth="2" strokeLinecap="round"/>;
              })()}
              <circle cx="100" cy="105" r="5" fill={riskColor}/>
              <text x="100" y="90" textAnchor="middle" fill="white" fontSize="28" fontWeight="800" letterSpacing="-1">{riskScore}</text>
              <text x="100" y="108" textAnchor="middle" fill={riskColor} fontSize="9" fontWeight="700" letterSpacing="1">
                {riskScore >= 75 ? 'HIGH RISK' : riskScore >= 50 ? 'MODERATE' : 'LOW RISK'}
              </text>
            </svg>
            <div className="gauge-stats">
              <div className="gauge-stat">
                <span>Confidence</span>
                <strong style={{color:riskColor}}>91%</strong>
              </div>
              <div className="gauge-stat">
                <span>Last Peak</span>
                <strong>74 @ 09:45</strong>
              </div>
              <div className="gauge-stat">
                <span>Predicted Peak</span>
                <strong className="text-critical">82 @ 11:45</strong>
              </div>
              <div className="gauge-stat">
                <span>Trend</span>
                <strong><TrendingUp size={12} color="#EF4444" /> Rising</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="card card-sm">
          <div className="card-title mb-2">Risk Factor Radar</div>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData} margin={{top:0,right:20,bottom:0,left:20}}>
              <PolarGrid stroke="#1F2937" />
              <PolarAngleAxis dataKey="subject" tick={{fill:'#94A3B8',fontSize:11}} />
              <Radar name="Risk Level" dataKey="current" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Threshold" dataKey="threshold" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.05} strokeWidth={1} strokeDasharray="4 2" />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex gap-3 justify-center" style={{marginTop:4}}>
            <div className="flex items-center gap-1 text-xs text-secondary"><div style={{width:8,height:2,background:'#EF4444',borderRadius:1}}/> Current</div>
            <div className="flex items-center gap-1 text-xs text-secondary"><div style={{width:8,height:2,background:'#3B82F6',borderRadius:1}}/> Safe Threshold</div>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="card card-sm">
          <div className="card-title mb-3">Risk Breakdown</div>
          <div className="risk-breakdown">
            {dynamicRiskFactors.map(rf => (
              <div key={rf.factor} className="breakdown-item">
                <div className="breakdown-header">
                  <span className="breakdown-name">{rf.factor}</span>
                  <span className="breakdown-score" style={{color:rf.color}}>{rf.score}</span>
                </div>
                <div className="breakdown-bar">
                  <div className="breakdown-fill" style={{width:`${rf.score}%`, background:rf.color}} />
                  <div className="breakdown-threshold" style={{left:'60%'}} />
                </div>
                <div className="breakdown-weight">Weight: {(rf.weight*100).toFixed(0)}% · Trend:
                  <span style={{color: rf.trend==='up'?'#EF4444':rf.trend==='down'?'#22C55E':'#94A3B8'}}>
                    {' '}{rf.trend === 'up' ? '↑ Rising' : rf.trend === 'down' ? '↓ Falling' : '→ Stable'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compound Risk Detection */}
      <div className="card card-sm" style={{marginTop:16}}>
        <div className="card-header">
          <div>
            <div className="card-title flex gap-2 items-center">
              <Zap size={13} color="#F59E0B" /> Compound Risk Detection
            </div>
            <div className="card-subtitle">AI identifies when multiple factors combine to create non-linear risk</div>
          </div>
          <div className="flex gap-2">
            {compoundRisks.map(cr => (
              <button
                key={cr.id}
                className={`tab ${selectedRisk.id === cr.id ? 'active' : ''}`}
                onClick={() => setSelectedRiskId(cr.id)}
              >
                <span className={`pulse-dot ${cr.severity === 'critical' ? 'critical' : cr.severity === 'warning' ? 'warning' : 'info'}`} style={{width:6,height:6}} />
                {cr.zone.split(' — ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="compound-risk-detail">
          <div className="compound-risk-main">
            {/* Title & Stats */}
            <div className={`compound-risk-header ${selectedRisk.severity}`}>
              <AlertTriangle size={16} />
              <div>
                <div className="compound-risk-title">{selectedRisk.title}</div>
                <div className="compound-risk-zone">{selectedRisk.zone}</div>
              </div>
              <div className="compound-risk-meta">
                <div className="compound-meta-stat">
                  <span>Explosion Probability</span>
                  <strong style={{color: selectedRisk.severity==='critical'?'#EF4444':'#F59E0B', fontSize:22}}>
                    {selectedRisk.probability}%
                  </strong>
                </div>
                <div className="compound-meta-stat">
                  <span>Time to Critical</span>
                  <strong style={{color: selectedRisk.severity==='critical'?'#EF4444':'#F59E0B', fontSize:16}}>
                    {selectedRisk.timeToEscalation}
                  </strong>
                </div>
                <div className="compound-meta-stat">
                  <span>AI Confidence</span>
                  <strong style={{color:'var(--blue)'}}>{selectedRisk.confidence}%</strong>
                </div>
              </div>
            </div>

            {/* Factor Chain */}
            <div className="factor-chain">
              {selectedRisk.factors.map((f: string, i: number) => (
                <React.Fragment key={f}>
                  <div className="factor-chip">
                    {f.includes('O₂') || f.includes('H₂S') || f.includes('CO') ? <Cpu size={11} onClick={() => onNavigate('sensors')} style={{cursor:'pointer'}} /> :
                     f.includes('Worker') || f.includes('PPE') ? <Users size={11} onClick={() => onNavigate('workers')} style={{cursor:'pointer'}} /> :
                     f.includes('Permit') ? <FileText size={11} onClick={() => onNavigate('permits')} style={{cursor:'pointer'}} /> :
                     <AlertTriangle size={11} />}
                    {f}
                  </div>
                  {i < selectedRisk.factors.length - 1 && (
                    <ChevronRight size={14} color="var(--text-muted)" />
                  )}
                </React.Fragment>
              ))}
              <ChevronRight size={14} color="#EF4444" />
              <div className="factor-chip critical-factor">
                <AlertTriangle size={11} />
                {selectedRisk.severity === 'critical' ? 'Immediate Risk' : 'Elevated Risk'}
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="ai-recommendation">
              <div className="ai-rec-title">
                <Brain size={12} /> AI Recommendation
              </div>
              <p>{selectedRisk.recommendation}</p>
            </div>
          </div>

          {/* What-If Simulation */}
          <div className="what-if-panel">
            <div className="what-if-title">
              <Play size={12} /> What-If Simulation
            </div>
            <p className="what-if-desc">Simulate the effect of safety interventions on risk score</p>

            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={whatIfScenarios} margin={{top:4,right:4,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false}/>
                <XAxis dataKey="name" tick={{fill:'#4B5563',fontSize:9}} tickLine={false}/>
                <YAxis tick={{fill:'#4B5563',fontSize:10}} tickLine={false} axisLine={false} domain={[0,100]}/>
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="risk" name="Risk Score" radius={[4,4,0,0]}
                  fill="#EF4444"
                  label={{ position: 'top', fontSize: 10, fill: '#94A3B8' }}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="what-if-actions">
              <button
                className={`btn btn-primary btn-sm w-full justify-center ${simulating ? 'loading' : ''}`}
                onClick={runSimulation}
                style={{justifyContent:'center'}}
              >
                {simulating ? <><RotateCcw size={12} className="spin" /> Simulating...</> : <><Play size={12} /> Run All Interventions</>}
              </button>
              {simResult !== null && (
                <div className="sim-result">
                  <span className="text-success">✓ Simulation Complete</span>
                  <span>Risk reduced to <strong className="text-success">{simResult}/100</strong> with all actions</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Timeline */}
      <div className="card card-sm" style={{marginTop:16}}>
        <div className="card-header">
          <div className="card-title">Risk Score Timeline — Last 24 Hours</div>
          <div className="flex gap-2">
            <span className="badge badge-critical">Peak: 74 @ 09:45</span>
            <span className="badge badge-warning">Current: {riskScore}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={trendData} margin={{top:4,right:4,left:-24,bottom:0}}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false}/>
            <XAxis dataKey="hour" tick={{fill:'#4B5563',fontSize:10}} tickLine={false} interval={3}/>
            <YAxis tick={{fill:'#4B5563',fontSize:10}} tickLine={false} axisLine={false} domain={[0,100]}/>
            <Tooltip content={<CustomTooltip />} />
            {/* Danger zone reference */}
            <Area type="monotone" dataKey="riskScore" name="Risk Score" stroke="#EF4444" strokeWidth={2} fill="url(#riskGrad)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AIRiskCenter;
