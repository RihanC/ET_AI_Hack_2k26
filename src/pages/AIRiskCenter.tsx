import React, { useState } from 'react';
import {
  Brain, AlertTriangle, TrendingUp, ChevronRight, Zap,
  Clock, Users, FileText, Cpu, Play, RotateCcw, Info
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts';
import { riskFactors, trendData24h, sensors, workers, permits, alerts } from '../data/mockData';
import './AIRiskCenter.css';

interface AIRiskCenterProps {
  liveKPI: any;
  onNavigate: (page: string) => void;
}

const compoundRisks = [
  {
    id: 'CR1',
    title: 'Oxygen Deficiency + Confined Space + Non-Compliant PPE',
    zone: 'Zone F — Tank Farm',
    probability: 87,
    timeToEscalation: '< 8 minutes',
    severity: 'critical' as const,
    factors: ['O₂ at 18.2% (↓ from 19.8%)', 'Worker W004 in confined space', 'PPE non-compliant', 'Permit compliance 62%'],
    recommendation: 'IMMEDIATE: Evacuate W004 from Zone F. Suspend PTW-2024-0042. Activate confined space rescue protocol.',
    confidence: 94,
  },
  {
    id: 'CR2',
    title: 'H₂S Rising + High Temperature + Hot-Work Permit Active',
    zone: 'Zone A — Blast Furnace',
    probability: 64,
    timeToEscalation: '~35 minutes',
    severity: 'warning' as const,
    factors: ['H₂S 8.4 ppm (↑ 38% in 2h)', 'Temperature at 1487°C trending up', 'Hot-work permit active', 'Tapping operation in progress'],
    recommendation: 'Increase ventilation rate by 40%. Alert worker W001. Monitor H₂S trend — if reaches 9 ppm, consider work suspension.',
    confidence: 78,
  },
  {
    id: 'CR3',
    title: 'CO Elevation + Worker Presence + Inadequate Ventilation',
    zone: 'Zone B — Converter',
    probability: 51,
    timeToEscalation: '~55 minutes',
    severity: 'warning' as const,
    factors: ['CO at 23.1 ppm (threshold 25)', 'Safety officer W002 present', 'Ventilation at 72% capacity', 'CO trending up slowly'],
    recommendation: 'Restore ventilation to 100% capacity. Brief W002 on CO status. Increase monitoring frequency to 30 seconds.',
    confidence: 71,
  },
];

const whatIfScenarios = [
  { name: 'Current State', risk: 68, gas: 8.4, workers: 1 },
  { name: 'If Evacuate F', risk: 48, gas: 8.4, workers: 0 },
  { name: 'If Increase Vent', risk: 58, gas: 5.2, workers: 1 },
  { name: 'If Suspend PTW', risk: 52, gas: 8.4, workers: 0 },
  { name: 'All Actions', risk: 32, gas: 5.2, workers: 0 },
];

const radarData = riskFactors.map(rf => ({
  subject: rf.factor.split(' ')[0],
  current: rf.score,
  threshold: 60,
}));

const AIRiskCenter: React.FC<AIRiskCenterProps> = ({ liveKPI, onNavigate }) => {
  const [selectedRisk, setSelectedRisk] = useState(compoundRisks[0]);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<null | number>(null);

  const riskScore = Math.round(liveKPI.riskScore);
  const riskColor = riskScore >= 75 ? '#EF4444' : riskScore >= 50 ? '#F59E0B' : '#22C55E';

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
            {riskFactors.map(rf => (
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
                onClick={() => setSelectedRisk(cr)}
              >
                <span className={`pulse-dot ${cr.severity === 'critical' ? 'critical' : 'warning'}`} style={{width:6,height:6}} />
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
              {selectedRisk.factors.map((f, i) => (
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
          <AreaChart data={trendData24h} margin={{top:4,right:4,left:-24,bottom:0}}>
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
