import React, { useState, useRef, useCallback } from 'react';
import {
  BarChart3, Download, FileText, Shield, Users, Cpu,
  AlertTriangle, TrendingUp, Brain, CheckCircle2, X,
  Loader, Calendar, Clock, Printer, ChevronRight,
  Activity, Zap, RefreshCw, Filter
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend
} from 'recharts';
import {
  sensors, workers, permits, alerts, kpiData, trendData24h,
  riskFactors, complianceChecks, timelineEvents
} from '../data/mockData';
import './ReportsAnalytics.css';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReportDef {
  id: string;
  name: string;
  description: string;
  frequency: string;
  lastGenerated: string;
  color: string;
  icon: React.ReactNode;
  category: 'safety' | 'compliance' | 'operations' | 'ai';
}

// ─── Report Definitions ──────────────────────────────────────────────────────

const reportDefs: ReportDef[] = [
  {
    id: 'daily-safety',
    name: 'Daily Safety Report',
    description: 'Complete daily overview of all safety incidents, sensor alerts, worker activity, and permit compliance across all plant zones.',
    frequency: 'Daily',
    lastGenerated: 'Today 06:00',
    color: '#3B82F6',
    icon: <Shield size={16} />,
    category: 'safety',
  },
  {
    id: 'incident',
    name: 'Incident Analysis Report',
    description: 'Detailed breakdown of safety incidents, root-cause analysis, corrective actions taken, and lessons learned.',
    frequency: 'On Demand',
    lastGenerated: 'Yesterday 14:32',
    color: '#EF4444',
    icon: <AlertTriangle size={16} />,
    category: 'safety',
  },
  {
    id: 'ai-risk',
    name: 'AI Risk Analysis Report',
    description: 'AI-powered compound risk scoring, predictive trend analysis, and zone-level risk forecasts for next 24 hours.',
    frequency: 'Weekly',
    lastGenerated: '3 days ago',
    color: '#8B5CF6',
    icon: <Brain size={16} />,
    category: 'ai',
  },
  {
    id: 'compliance',
    name: 'Regulatory Compliance Report',
    description: 'Full regulatory status against OISD, IS, EPA, and Factory Act standards — suitable for auditors and inspectors.',
    frequency: 'Monthly',
    lastGenerated: '28 days ago',
    color: '#10B981',
    icon: <CheckCircle2 size={16} />,
    category: 'compliance',
  },
  {
    id: 'worker-safety',
    name: 'Worker Safety Report',
    description: 'Individual worker risk profiles, PPE compliance scores, gas exposure analysis, and biometric anomaly summary.',
    frequency: 'Weekly',
    lastGenerated: '5 days ago',
    color: '#06B6D4',
    icon: <Users size={16} />,
    category: 'safety',
  },
  {
    id: 'equipment',
    name: 'Equipment Health Report',
    description: 'Sensor performance trends, equipment condition scoring, maintenance triggers, and vibration/temperature anomalies.',
    frequency: 'Weekly',
    lastGenerated: '6 days ago',
    color: '#F59E0B',
    icon: <Cpu size={16} />,
    category: 'operations',
  },
];

// ─── Chart Data ──────────────────────────────────────────────────────────────

const radarData = riskFactors.map(rf => ({
  subject: rf.factor.split(' ')[0],
  score: rf.score,
  safe: 60,
}));

const workerComplianceData = workers.map(w => ({
  name: w.name.split(' ')[0],
  risk: w.riskLevel === 'critical' ? 95 : w.riskLevel === 'high' ? 75 : w.riskLevel === 'medium' ? 50 : 25,
  heartRate: w.heartRate,
  exposure: w.gasExposure,
}));

const sensorHealthData = sensors.map(s => ({
  name: s.name.split('—')[0].trim().replace(/[₀-₉]/g, ''),
  value: Math.round((s.value / s.threshold) * 100),
  threshold: 100,
  status: s.status,
}));

const permitComplianceData = permits.filter(p => p.status === 'active').map(p => ({
  id: p.id.replace('PTW-2024-0', '#'),
  compliance: p.compliance,
  risk: p.riskLevel === 'critical' ? 95 : p.riskLevel === 'high' ? 75 : p.riskLevel === 'medium' ? 50 : 25,
}));

const incidentData = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  incidents: [0, 1, 0, 0, 2, 0, 0][i],
  nearMisses: [2, 3, 1, 4, 2, 1, 0][i],
  alerts: [4, 6, 3, 5, 8, 2, 1][i],
}));

// ─── Gemini AI summary ───────────────────────────────────────────────────────

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

async function generateAISummary(reportId: string): Promise<string> {
  if (!GEMINI_KEY) {
    return getFallbackSummary(reportId);
  }
  const prompts: Record<string, string> = {
    'daily-safety': `Write a professional Daily Safety Report executive summary for a steel manufacturing plant. Today's data: Risk score 68/100, 2 critical alerts (O₂ deficiency Zone F at 18.2%, PPE non-compliance Worker W004), 4 warnings (H₂S 8.4ppm Zone A, CO 23.1ppm Zone B, compressor vibration 7.8mm/s, low permit compliance). 8 workers active, 11/12 sensors online, 47 incident-free days. Write 3 concise paragraphs: situation summary, key risks, and recommended actions. Use formal safety report language.`,
    'incident': `Write an Incident Analysis Report summary for a steel plant. Today's incidents: Critical O₂ deficiency (18.2%) in Tank T-14 confined space with non-compliant worker (no SCBA). Near-miss: H₂S trending up in Blast Furnace Zone. Root causes: rescue team not on standby, PPE check bypassed. Write root cause analysis and 3 corrective actions in formal style.`,
    'ai-risk': `Write an AI Risk Analysis Report summary. Plant risk score: 68/100 trending up. Compound risks: (1) O₂+confined space+PPE non-compliance = 87% escalation probability in Zone F. (2) H₂S+temperature+hot-work = 64% probability in Zone A. Predicted risk score: 74 in 2h, 83 in 6h without intervention. 3 paragraphs: findings, predictions, AI recommendations.`,
    'compliance': `Write a Regulatory Compliance Report summary for a steel plant. Status: IS 13947 PASS, OISD-GDN-206 PASS (12/12 sensors), Factory Act 1948 FAIL (workers W004 non-compliant, W003 partial), OISD-STD-105 FAIL (PTW-0042 at 62%), IS 15683 PASS, EPA PASS (SO₂ 4.2mg/m³). Overall score: 73/100. Write formal audit-ready 3-paragraph summary covering status, violations, and remediation plan.`,
    'worker-safety': `Write a Worker Safety Report summary. 8 workers active. Critical: Suresh Kumar (W004) in confined space, PPE non-compliant, heart rate 105bpm, O₂ exposure risk. High: Arjun Sharma (W001) H₂S 7.2ppm exposure, heart rate 94bpm. High: Deepak Verma (W003) partial PPE in compressor area. 5 others within safe parameters. Write worker safety analysis in 3 paragraphs.`,
    'equipment': `Write an Equipment Health Report summary for a steel plant. 12 sensors: 1 critical (S007 O₂ at 18.2%), 4 warnings (H₂S, CO, vibration 7.8mm/s, H₂). Compressor C3 vibration trending up 12% in 30 min. Blast Furnace temperature at 1487°C approaching 1500°C threshold. 11/12 sensors online. Write equipment health analysis in 3 paragraphs: status, anomalies, maintenance recommendations.`,
  };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompts[reportId] || prompts['daily-safety'] }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.3 }
        })
      }
    );
    if (!res.ok) return getFallbackSummary(reportId);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? getFallbackSummary(reportId);
  } catch {
    return getFallbackSummary(reportId);
  }
}

function getFallbackSummary(id: string): string {
  const summaries: Record<string, string> = {
    'daily-safety': 'Plant operations continued on Morning Shift with 8 active workers across 9 monitored zones. Two critical safety events were recorded: an oxygen deficiency alert in Zone F (Tank Farm) where O₂ dropped to 18.2% — below the 19.5% threshold — and a PPE non-compliance violation for Worker W004 inside a confined space without proper respiratory equipment.\n\nFour warning-level alerts are currently active: H₂S concentrations in Zone A trending upward to 8.4 ppm (threshold: 10 ppm), CO levels at 23.1 ppm in Zone B, compressor vibration at 7.8 mm/s approaching the 8 mm/s shutdown threshold, and Permit PTW-2024-0042 compliance declining to 62%.\n\nImmediate recommended actions: (1) Evacuate Worker W004 from Zone F and suspend confined-space permit. (2) Increase Zone A ventilation by 40%. (3) Brief Worker W001 on H₂S trend. The plant has maintained 47 consecutive incident-free days — protect this record with swift action.',
    'incident': 'Primary incident: At 10:21 hrs, Worker W004 (Suresh Kumar, Process Operator) entered Tank T-14 in Zone F for a scheduled internal inspection without a Self-Contained Breathing Apparatus. Simultaneously, oxygen levels registered at 18.2% — 1.3 percentage points below the IDLH threshold of 19.5%. The AI safety system flagged this as a compound critical risk at 10:23:50 hrs.\n\nRoot Cause Analysis: (1) PPE compliance check was not enforced at zone entry. (2) Rescue team was not positioned on standby prior to confined-space entry as required by OISD-GDN-169. (3) Real-time O₂ sensor alert (S007) was not escalated to the field supervisor within the required 2-minute protocol window.\n\nCorrective Actions: (1) Immediately suspend PTW-2024-0042 and evacuate Zone F. (2) Retrain all Zone F personnel on confined-space PPE requirements — mandatory within 24 hours. (3) Update entry procedure to require rescue team confirmation before permit activation.',
    'ai-risk': 'The AI Risk Engine has computed a composite plant risk score of 68/100 — classified as HIGH — representing a 12-point increase from the 06:00 baseline. The primary driver is a compound risk scenario in Zone F where three simultaneous hazard factors have converged: sub-threshold oxygen concentration, active confined-space permit, and confirmed PPE non-compliance. The model assigns an 87% escalation probability within 8 minutes without intervention.\n\nPredictive modeling of current sensor trajectories indicates the following risk progression if no corrective action is taken: 2-hour score 74, 4-hour score 79, 6-hour score 83, 8-hour score 87. Zone A contributes a secondary compound risk (64% probability, ~35 minute escalation window) as H₂S and furnace temperature are both trending upward simultaneously during an active hot-work permit.\n\nAI Recommendations: Execute immediate Zone F evacuation and permit suspension. Increase Zone A ventilation to 100% capacity. Deploy predictive maintenance inspection on Compressor C3 within 2 hours. Schedule a safety briefing for the afternoon shift handover at 14:00.',
    'compliance': 'Regulatory compliance assessment as of today\'s Morning Shift indicates an overall score of 73 out of 100. Five of eight monitored standards are in full compliance: IS 13947 (Electrical Isolation), OISD-GDN-206 (Gas Detection — 12/12 sensors operational), IS 15683 (Fire Protection), EPA Stack Emissions (SO₂ at 4.2 mg/m³ vs. 100 mg/m³ limit), and PESO Explosive Atmosphere certification.\n\nTwo standards are currently in violation: Factory Act 1948 PPE requirements (Worker W004 non-compliant, Worker W003 partial compliance) and OISD-STD-105 Permit-to-Work standards (PTW-2024-0042 at 62% compliance, below the 80% required threshold). One standard carries a warning: OISD-GDN-169 Confined Space Safety, as O₂ monitoring is active but a rescue team is not on standby.\n\nRemediation Plan: Violations must be corrected within the current shift to avoid regulatory reporting obligations. Corrective actions must be documented with photographic evidence and supervisor sign-off within 4 hours. A full compliance review is recommended before the afternoon shift begins.',
    'worker-safety': 'Eight workers are active on the Morning Shift across six plant zones. One worker is classified at Critical Risk: Suresh Kumar (W004, Process Operator) is currently inside Tank T-14 — a confined space — with PPE non-compliance confirmed. His biometric data shows an elevated heart rate of 105 bpm, suggesting physiological stress consistent with the hazardous environment.\n\nTwo workers are at High Risk: Arjun Sharma (W001) is operating in Zone A with cumulative H₂S exposure of 7.2 ppm and a heart rate of 94 bpm, and Deepak Verma (W003) is conducting compressor maintenance with only partial PPE — a missing face shield in a high-vibration environment. One worker (Rajesh Nair, W007) is classified as medium risk due to incomplete buddy-system compliance during height work.\n\nThe remaining four workers — Ravi Patel, Manish Gupta, Priya Singh, and Amit Joshi — are operating within safe biometric and environmental parameters. Recommended actions: immediate intervention for W004, PPE enforcement for W003, and buddy-system verification for W007.',
    'equipment': '12 sensors are deployed across 9 plant zones. 11 sensors are currently online and operational. One critical anomaly is active: Sensor S007 (O₂ Monitor, Zone F) is reading 18.2% oxygen — below the 19.5% safety threshold and approaching the 16% IDLH limit. This sensor is functioning correctly; the anomaly reflects actual atmospheric conditions in Zone F.\n\nFour sensors are in warning state: S001 (H₂S, Zone A) at 8.4 ppm and trending upward; S002 (CO, Zone B) at 23.1 ppm approaching 25 ppm; S006 (Vibration, Zone E — Compressor C3) at 7.8 mm/s with a 12% increase in the last 30 minutes suggesting potential bearing wear; and S012 (H₂, Zone I) at 0.4% LEL trending upward. Blast Furnace temperature (S003) is at 1,487°C, approaching the 1,500°C operational threshold.\n\nMaintenance Recommendations: (1) Schedule Compressor C3 bearing inspection within 2 hours. (2) Verify Blast Furnace cooling flow is at maximum capacity. (3) Calibrate S012 H₂ sensor — last calibration was 18 days ago. (4) Conduct full O₂ sensor audit in Zone F after evacuation is complete.',
  };
  return summaries[id] || summaries['daily-safety'];
}

// ─── Print PDF utility ───────────────────────────────────────────────────────

function printReport(reportId: string, reportName: string, content: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>${reportName} — ISIP</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a2e; background: white; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563EB; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px; }
    .logo span { color: #8B5CF6; }
    .report-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #64748b; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
    .badge-critical { background: #fee2e2; color: #dc2626; }
    .badge-warning { background: #fef3c7; color: #d97706; }
    .badge-pass { background: #dcfce7; color: #16a34a; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 700; color: #0f172a; border-left: 3px solid #2563EB; padding-left: 10px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .ai-summary { background: #f0f4ff; border: 1px solid #c7d7ff; border-radius: 8px; padding: 16px; line-height: 1.75; white-space: pre-wrap; font-size: 11.5px; }
    .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; }
    .kpi-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
    .kpi-value { font-size: 22px; font-weight: 800; color: #0f172a; }
    .kpi-label { font-size: 10px; color: #64748b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f8fafc; padding: 8px 10px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; font-size: 10px; text-transform: uppercase; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #0f172a; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">IS<span>IP</span></div>
    <div style="font-size:10px;color:#64748b;margin-top:2px;">Industrial Safety Intelligence Platform</div>
    <div style="font-size:10px;color:#64748b;">Tata Steel Ltd. — Jamshedpur Plant</div>
  </div>
  <div style="text-align:right">
    <div class="report-title">${reportName}</div>
    <div class="meta">Generated: ${dateStr} at ${timeStr}</div>
    <div class="meta">Reference: ${reportId.toUpperCase()}-${now.getTime().toString().slice(-6)}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Plant Status Snapshot</div>
  <div class="kpi-row">
    <div class="kpi-card"><div class="kpi-value" style="color:#F59E0B">68</div><div class="kpi-label">Risk Score /100</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color:#22C55E">76%</div><div class="kpi-label">Plant Health</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color:#EF4444">2</div><div class="kpi-label">Critical Alerts</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color:#3B82F6">8</div><div class="kpi-label">Active Workers</div></div>
    <div class="kpi-card"><div class="kpi-value">47</div><div class="kpi-label">Incident-Free Days</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">AI Executive Summary</div>
  <div class="ai-summary">${content}</div>
</div>

<div class="section">
  <div class="section-title">Active Alerts</div>
  <table>
    <thead><tr><th>ID</th><th>Severity</th><th>Title</th><th>Zone</th><th>Time</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td>ALT001</td><td><span class="badge badge-critical">Critical</span></td><td>O₂ Deficiency Detected</td><td>Zone F — Tank Farm</td><td>10:23:45</td><td>Unacknowledged</td></tr>
      <tr><td>ALT002</td><td><span class="badge badge-critical">Critical</span></td><td>PPE Non-Compliance</td><td>Zone F — Tank Farm</td><td>10:21:12</td><td>Unacknowledged</td></tr>
      <tr><td>ALT003</td><td><span class="badge badge-warning">Warning</span></td><td>H₂S Level Rising</td><td>Zone A — Blast Furnace</td><td>10:18:33</td><td>Unacknowledged</td></tr>
      <tr><td>ALT004</td><td><span class="badge badge-warning">Warning</span></td><td>CO Elevated</td><td>Zone B — Converter</td><td>10:15:20</td><td>Acknowledged</td></tr>
      <tr><td>ALT005</td><td><span class="badge badge-warning">Warning</span></td><td>Compressor Vibration High</td><td>Zone E</td><td>10:12:08</td><td>Unacknowledged</td></tr>
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Worker Status</div>
  <table>
    <thead><tr><th>Badge</th><th>Name</th><th>Role</th><th>Zone</th><th>PPE</th><th>Risk</th><th>Heart Rate</th></tr></thead>
    <tbody>
      <tr><td>B-3341</td><td>Suresh Kumar</td><td>Process Operator</td><td>Zone F — Tank Farm</td><td><span class="badge badge-critical">Non-Compliant</span></td><td><span class="badge badge-critical">Critical</span></td><td>105 bpm</td></tr>
      <tr><td>B-1042</td><td>Arjun Sharma</td><td>Furnace Operator</td><td>Zone A — Blast Furnace</td><td><span class="badge badge-pass">Compliant</span></td><td><span class="badge badge-warning">High</span></td><td>94 bpm</td></tr>
      <tr><td>B-2234</td><td>Deepak Verma</td><td>Maintenance Tech</td><td>Zone E — Compressor</td><td><span class="badge badge-warning">Partial</span></td><td><span class="badge badge-warning">High</span></td><td>88 bpm</td></tr>
      <tr><td>B-0891</td><td>Ravi Patel</td><td>Safety Officer</td><td>Zone B — Converter</td><td><span class="badge badge-pass">Compliant</span></td><td><span class="badge badge-warning">Medium</span></td><td>78 bpm</td></tr>
      <tr><td>B-1893</td><td>Manish Gupta</td><td>Electrical Tech</td><td>Zone G — Rolling Mill</td><td><span class="badge badge-pass">Compliant</span></td><td><span class="badge badge-warning">Medium</span></td><td>82 bpm</td></tr>
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Permit-to-Work Summary</div>
  <table>
    <thead><tr><th>Permit ID</th><th>Type</th><th>Zone</th><th>Workers</th><th>Compliance</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td>PTW-2024-0042</td><td>Confined Space</td><td>Zone F</td><td>W004</td><td><span class="badge badge-critical">62%</span></td><td>Active — AT RISK</td></tr>
      <tr><td>PTW-2024-0043</td><td>Electrical</td><td>Zone E</td><td>W003</td><td><span class="badge badge-warning">78%</span></td><td>Active — Monitor</td></tr>
      <tr><td>PTW-2024-0041</td><td>Hot Work</td><td>Zone A</td><td>W001</td><td><span class="badge badge-pass">91%</span></td><td>Active</td></tr>
      <tr><td>PTW-2024-0044</td><td>Electrical</td><td>Zone G</td><td>W005</td><td><span class="badge badge-pass">96%</span></td><td>Active</td></tr>
      <tr><td>PTW-2024-0045</td><td>Working at Height</td><td>Zone G</td><td>W007</td><td><span class="badge badge-pass">88%</span></td><td>Active</td></tr>
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Regulatory Compliance</div>
  <table>
    <thead><tr><th>Standard</th><th>Status</th><th>Evidence</th><th>Zone</th></tr></thead>
    <tbody>
      <tr><td>IS 13947 — Electrical Isolation</td><td><span class="badge badge-pass">PASS</span></td><td>All isolations verified at 06:30</td><td>Zone G</td></tr>
      <tr><td>OISD-GDN-206 — Gas Detection</td><td><span class="badge badge-pass">PASS</span></td><td>12/12 sensors operational</td><td>All Zones</td></tr>
      <tr><td>Factory Act 1948 — PPE</td><td><span class="badge badge-critical">FAIL</span></td><td>W004 non-compliant, W003 partial</td><td>Zone E, F</td></tr>
      <tr><td>OISD-STD-105 — Permit to Work</td><td><span class="badge badge-critical">FAIL</span></td><td>PTW-0042 at 62% (min 80%)</td><td>Zone F</td></tr>
      <tr><td>IS 15683 — Fire Protection</td><td><span class="badge badge-pass">PASS</span></td><td>All suppression systems active</td><td>All Zones</td></tr>
      <tr><td>EPA — Stack Emissions</td><td><span class="badge badge-pass">PASS</span></td><td>SO₂ 4.2 mg/m³ (limit 100)</td><td>Zone D</td></tr>
    </tbody>
  </table>
</div>

<div class="footer">
  <div>ISIP Industrial Safety Intelligence Platform · Confidential</div>
  <div>Auto-generated · AI-assisted summary · ${dateStr}</div>
</div>

<script>window.onload = () => window.print();</script>
</body>
</html>
  `);
  printWindow.document.close();
}

// ─── Report Preview Modal ─────────────────────────────────────────────────────

interface ReportModalProps {
  report: ReportDef;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ report, onClose }) => {
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'ai'>('overview');

  const generateReport = useCallback(async () => {
    setLoadingAI(true);
    setActiveTab('ai');
    const summary = await generateAISummary(report.id);
    setAiSummary(summary);
    setLoadingAI(false);
    setGenerated(true);
  }, [report.id]);

  const handlePrint = () => {
    if (!aiSummary) {
      generateAISummary(report.id).then(s => printReport(report.id, report.name, s));
    } else {
      printReport(report.id, report.name, aiSummary);
    }
  };

  const renderChart = () => {
    switch (report.id) {
      case 'daily-safety':
      case 'incident':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incidentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0F1322', border: '1px solid #171E31', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="incidents" name="Incidents" fill="#EF4444" radius={[4,4,0,0]} />
              <Bar dataKey="nearMisses" name="Near-Misses" fill="#F59E0B" radius={[4,4,0,0]} />
              <Bar dataKey="alerts" name="Alerts" fill="#3B82F6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'ai-risk':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData24h.slice(-12)}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0F1322', border: '1px solid #171E31', borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="riskScore" name="Risk Score" stroke="#8B5CF6" fill="url(#riskGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'compliance':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} />
              <Radar name="Score" dataKey="score" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
              <Radar name="Safe Zone" dataKey="safe" stroke="#EF4444" fill="transparent" strokeDasharray="4 4" />
            </RadarChart>
          </ResponsiveContainer>
        );
      case 'worker-safety':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workerComplianceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0F1322', border: '1px solid #171E31', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="risk" name="Risk Level" fill="#06B6D4" radius={[4,4,0,0]} />
              <Bar dataKey="heartRate" name="Heart Rate" fill="#8B5CF6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'equipment':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sensorHealthData.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" domain={[0, 140]} tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#475569', fontSize: 9 }} />
              <Tooltip contentStyle={{ background: '#0F1322', border: '1px solid #171E31', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="value" name="% of Threshold" radius={[0,4,4,0]}
                fill="#F59E0B"
                label={{ position: 'right', fontSize: 9, fill: '#475569', formatter: (v: any) => `${v}%` }}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData24h.slice(-12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0F1322', border: '1px solid #171E31', borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="riskScore" stroke={report.color} fill={report.color + '22'} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="rm-header" style={{ borderTop: `3px solid ${report.color}` }}>
          <div className="rm-header-left">
            <div className="rm-icon" style={{ background: `${report.color}18`, color: report.color }}>
              {report.icon}
            </div>
            <div>
              <div className="rm-title">{report.name}</div>
              <div className="rm-meta">
                <Clock size={10} />
                <span>Last generated: {report.lastGenerated}</span>
                <span className="rm-dot" />
                <Calendar size={10} />
                <span>{report.frequency}</span>
              </div>
            </div>
          </div>
          <div className="rm-header-actions">
            <button className="rm-btn rm-btn-primary" onClick={generateReport} disabled={loadingAI}>
              {loadingAI ? <Loader size={13} className="spin" /> : <Brain size={13} />}
              {loadingAI ? 'Generating...' : 'Generate with AI'}
            </button>
            <button className="rm-btn rm-btn-secondary" onClick={handlePrint}>
              <Printer size={13} /> Export PDF
            </button>
            <button className="rm-close" onClick={onClose}><X size={14} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="rm-tabs">
          {(['overview', 'data', 'ai'] as const).map(t => (
            <button
              key={t}
              className={`rm-tab ${activeTab === t ? 'active' : ''}`}
              onClick={() => setActiveTab(t)}
              style={activeTab === t ? { borderBottomColor: report.color, color: report.color } : {}}
            >
              {t === 'overview' && <Activity size={12} />}
              {t === 'data' && <BarChart3 size={12} />}
              {t === 'ai' && <Brain size={12} />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'ai' && generated && <span className="rm-tab-badge">AI</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rm-body">
          {activeTab === 'overview' && (
            <div className="rm-overview">
              {/* KPI strip */}
              <div className="rm-kpi-strip">
                <div className="rm-kpi"><span className="rm-kpi-val" style={{ color: '#F59E0B' }}>68</span><span className="rm-kpi-lbl">Risk Score</span></div>
                <div className="rm-kpi"><span className="rm-kpi-val" style={{ color: '#22C55E' }}>76%</span><span className="rm-kpi-lbl">Plant Health</span></div>
                <div className="rm-kpi"><span className="rm-kpi-val" style={{ color: '#EF4444' }}>2</span><span className="rm-kpi-lbl">Critical Alerts</span></div>
                <div className="rm-kpi"><span className="rm-kpi-val" style={{ color: '#3B82F6' }}>8</span><span className="rm-kpi-lbl">Workers</span></div>
                <div className="rm-kpi"><span className="rm-kpi-val">73%</span><span className="rm-kpi-lbl">Compliance</span></div>
                <div className="rm-kpi"><span className="rm-kpi-val" style={{ color: '#22C55E' }}>47</span><span className="rm-kpi-lbl">Incident-Free Days</span></div>
              </div>
              <div className="rm-section-label">24-Hour Trend</div>
              {renderChart()}
              <div className="rm-description">{report.description}</div>
              <div className="rm-generate-cta">
                <Brain size={16} style={{ color: report.color }} />
                <span>Click <strong>Generate with AI</strong> to create a full Gemini-powered analysis of this report.</span>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="rm-data">
              <div className="rm-section-label">Active Alerts</div>
              <table className="rm-table">
                <thead><tr><th>Severity</th><th>Title</th><th>Zone</th><th>Time</th></tr></thead>
                <tbody>
                  {alerts.map(a => (
                    <tr key={a.id}>
                      <td><span className={`badge-chip ${a.severity}`}>{a.severity}</span></td>
                      <td>{a.title}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{a.zone}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{a.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="rm-section-label" style={{ marginTop: 16 }}>Permit Compliance</div>
              <table className="rm-table">
                <thead><tr><th>Permit</th><th>Type</th><th>Zone</th><th>Compliance</th><th>Status</th></tr></thead>
                <tbody>
                  {permits.filter(p => p.status === 'active').map(p => (
                    <tr key={p.id}>
                      <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{p.id}</td>
                      <td style={{ fontSize: 11 }}>{p.type.replace(/-/g, ' ')}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{p.zone}</td>
                      <td>
                        <div className="compliance-bar-wrap">
                          <div className="compliance-bar" style={{
                            width: `${p.compliance}%`,
                            background: p.compliance >= 80 ? '#10B981' : p.compliance >= 60 ? '#F59E0B' : '#EF4444'
                          }} />
                          <span style={{ fontSize: 10, marginLeft: 6, color: 'var(--text-muted)' }}>{p.compliance}%</span>
                        </div>
                      </td>
                      <td><span className={`badge-chip ${p.status === 'active' ? 'info' : 'warning'}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="rm-section-label" style={{ marginTop: 16 }}>Compliance Checks</div>
              <table className="rm-table">
                <thead><tr><th>Standard</th><th>Status</th><th>Zone</th></tr></thead>
                <tbody>
                  {complianceChecks.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontSize: 11 }}>{c.rule}</td>
                      <td><span className={`badge-chip ${c.status === 'pass' ? 'success' : c.status === 'warning' ? 'warning' : 'critical'}`}>{c.status.toUpperCase()}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{c.zone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="rm-ai">
              {loadingAI && (
                <div className="rm-ai-loading">
                  <div className="rm-ai-spinner">
                    <Brain size={28} style={{ color: report.color, opacity: 0.8 }} />
                  </div>
                  <div className="rm-ai-loading-text">Gemini AI is analyzing plant data...</div>
                  <div className="rm-ai-loading-sub">Reading sensor trends · Evaluating risk factors · Writing report</div>
                </div>
              )}
              {!loadingAI && !aiSummary && (
                <div className="rm-ai-empty">
                  <Brain size={40} style={{ color: report.color, opacity: 0.4 }} />
                  <div className="rm-ai-empty-title">AI Report Not Generated Yet</div>
                  <div className="rm-ai-empty-sub">Click "Generate with AI" to get a Gemini-powered analysis of this report with current plant data.</div>
                  <button className="rm-btn rm-btn-primary" onClick={generateReport} style={{ marginTop: 16 }}>
                    <Brain size={14} /> Generate with AI
                  </button>
                </div>
              )}
              {!loadingAI && aiSummary && (
                <div className="rm-ai-content">
                  <div className="rm-ai-header">
                    <div className="rm-ai-badge">
                      <Zap size={10} /> Gemini AI · Generated {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <button className="rm-btn rm-btn-icon" onClick={generateReport} title="Regenerate">
                      <RefreshCw size={12} />
                    </button>
                  </div>
                  <div className="rm-ai-text">
                    {aiSummary.split('\n').map((para, i) =>
                      para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                    )}
                  </div>
                  <button className="rm-btn rm-btn-primary" onClick={handlePrint} style={{ marginTop: 16, alignSelf: 'flex-start' }}>
                    <Printer size={13} /> Print / Export PDF
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ReportsAnalytics: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportDef | null>(null);
  const [filter, setFilter] = useState<'all' | 'safety' | 'compliance' | 'operations' | 'ai'>('all');

  const filtered = filter === 'all' ? reportDefs : reportDefs.filter(r => r.category === filter);

  return (
    <div className="page-content animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports &amp; Analytics</h1>
          <p className="page-subtitle">AI-generated reports · PDF export · Real-time plant data</p>
        </div>
        <div className="rpt-header-actions">
          <div className="rpt-stats">
            <div className="rpt-stat"><span className="rpt-stat-val" style={{ color: '#22C55E' }}>47</span><span className="rpt-stat-lbl">Incident-Free Days</span></div>
            <div className="rpt-stat"><span className="rpt-stat-val" style={{ color: '#F59E0B' }}>73%</span><span className="rpt-stat-lbl">Compliance Score</span></div>
            <div className="rpt-stat"><span className="rpt-stat-val">{reportDefs.length}</span><span className="rpt-stat-lbl">Report Types</span></div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rpt-filter-bar">
        <Filter size={13} style={{ color: 'var(--text-muted)' }} />
        {(['all', 'safety', 'compliance', 'operations', 'ai'] as const).map(f => (
          <button
            key={f}
            className={`rpt-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary chart strip */}
      <div className="rpt-summary-strip card">
        <div className="rpt-strip-label">
          <TrendingUp size={13} style={{ color: '#8B5CF6' }} />
          <span>7-Day Safety Trend — Incidents, Near-Misses &amp; Alerts</span>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={incidentData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} />
            <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#0F1322', border: '1px solid #171E31', borderRadius: 8, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
            <Bar dataKey="incidents" name="Incidents" fill="#EF4444" radius={[3,3,0,0]} />
            <Bar dataKey="nearMisses" name="Near-Misses" fill="#F59E0B" radius={[3,3,0,0]} />
            <Bar dataKey="alerts" name="Alerts" fill="#3B82F6" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Report cards */}
      <div className="rpt-cards-grid">
        {filtered.map(report => (
          <div
            key={report.id}
            className="rpt-card card"
            onClick={() => setSelectedReport(report)}
            style={{ '--report-color': report.color } as React.CSSProperties}
          >
            <div className="rpt-card-top">
              <div className="rpt-card-icon" style={{ background: `${report.color}15`, color: report.color }}>
                {report.icon}
              </div>
              <span className="badge badge-muted text-xs">{report.frequency}</span>
            </div>
            <div className="rpt-card-name">{report.name}</div>
            <p className="rpt-card-desc">{report.description}</p>
            <div className="rpt-card-footer">
              <div className="rpt-card-meta">
                <Clock size={10} />
                <span>{report.lastGenerated}</span>
              </div>
              <div className="rpt-card-actions">
                <button
                  className="rpt-btn-icon"
                  title="Export PDF"
                  onClick={e => {
                    e.stopPropagation();
                    generateAISummary(report.id).then(s => printReport(report.id, report.name, s));
                  }}
                >
                  <Download size={12} />
                </button>
                <button className="rpt-btn-open" onClick={() => setSelectedReport(report)}>
                  Open <ChevronRight size={12} />
                </button>
              </div>
            </div>
            <div className="rpt-card-bar" style={{ background: report.color }} />
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedReport && (
        <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
};

export default ReportsAnalytics;
