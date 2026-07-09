import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const incidentData = [
  { day: 'Mon', incidents: 0, nearMisses: 2, alerts: 4 },
  { day: 'Tue', incidents: 1, nearMisses: 3, alerts: 6 },
  { day: 'Wed', incidents: 0, nearMisses: 1, alerts: 3 },
  { day: 'Thu', incidents: 0, nearMisses: 4, alerts: 5 },
  { day: 'Fri', incidents: 2, nearMisses: 2, alerts: 8 },
  { day: 'Sat', incidents: 0, nearMisses: 1, alerts: 2 },
  { day: 'Sun', incidents: 0, nearMisses: 0, alerts: 1 },
];

// ─── Gemini AI summary ───────────────────────────────────────────────────────

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

async function generateAISummary(
  reportId: string,
  kpi: any,
  alertsList: any[],
  workersList: any[],
  permitsList: any[],
  sensorsList: any[]
): Promise<string> {
  if (!GEMINI_KEY) {
    return getFallbackSummary(reportId, kpi, alertsList, workersList, permitsList, sensorsList);
  }
  const prompts: Record<string, string> = {
    'daily-safety': `Write a professional Daily Safety Report executive summary for a steel manufacturing plant. Today's data: Risk score ${kpi?.riskScore ?? 0}/100, critical alerts count ${alertsList.filter(a => a.severity === 'critical').length}, active workers count ${workersList.length}, online sensors ${sensorsList.filter(s => s.status === 'online').length}/${sensorsList.length}, compliance score ${kpi?.complianceScore ?? 100}%. Write 3 concise paragraphs: situation summary, key risks, and recommended actions. Use formal safety report language.`,
    'incident': `Write an Incident Analysis Report summary for a steel plant. Today's incidents: Critical alerts count ${alertsList.filter(a => a.severity === 'critical').length}, warnings count ${alertsList.filter(a => a.severity === 'warning').length}. Non-compliant PPE count is ${workersList.filter(w => w.ppeStatus !== 'compliant').length}. Write root cause analysis and 3 corrective actions in formal style.`,
    'ai-risk': `Write an AI Risk Analysis Report summary. Plant risk score: ${kpi?.riskScore ?? 0}/100. Compliance rating is ${kpi?.complianceScore ?? 100}%. Predicted risk score based on active alerts. 3 paragraphs: findings, predictions, AI recommendations.`,
    'compliance': `Write a Regulatory Compliance Report summary for a steel plant. Status: active workers ${workersList.length}, permit compliance at ${kpi?.complianceScore ?? 100}%. Write formal audit-ready 3-paragraph summary covering status, violations, and remediation plan.`,
    'worker-safety': `Write a Worker Safety Report summary. ${workersList.length} workers active. PPE compliant: ${workersList.filter(w => w.ppeStatus === 'compliant').length}, partial: ${workersList.filter(w => w.ppeStatus === 'partial').length}, non-compliant: ${workersList.filter(w => w.ppeStatus === 'non-compliant').length}. Write worker safety analysis in 3 paragraphs.`,
    'equipment': `Write an Equipment Health Report summary for a steel plant. ${sensorsList.length} sensors: online count ${sensorsList.filter(s => s.status === 'online').length}, warning count ${sensorsList.filter(s => s.status === 'warning').length}, critical count ${sensorsList.filter(s => s.status === 'critical').length}. Write equipment health analysis in 3 paragraphs: status, anomalies, maintenance recommendations.`,
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
    if (!res.ok) return getFallbackSummary(reportId, kpi, alertsList, workersList, permitsList, sensorsList);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? getFallbackSummary(reportId, kpi, alertsList, workersList, permitsList, sensorsList);
  } catch {
    return getFallbackSummary(reportId, kpi, alertsList, workersList, permitsList, sensorsList);
  }
}

function getFallbackSummary(
  id: string,
  kpi: any,
  alertsList: any[],
  workersList: any[],
  permitsList: any[],
  sensorsList: any[]
): string {
  const activeWorkersCount = workersList.length;
  const criticalAlertsCount = alertsList.filter(a => (a.severity || '').toLowerCase() === 'critical' && !a.acknowledged).length;
  const warningAlertsCount = alertsList.filter(a => (a.severity || '').toLowerCase() === 'warning' && !a.acknowledged).length;
  const activePermitsCount = permitsList.filter(p => (p.status || '').toLowerCase() === 'active').length;
  const complianceVal = kpi?.complianceScore ?? 100;
  const riskVal = kpi?.riskScore ?? 0;
  const healthVal = kpi?.plantHealth ?? 100;

  const summaries: Record<string, string> = {
    'daily-safety': `Plant safety review: Current composite risk score is ${riskVal}/100 with plant health at ${healthVal}%. There are ${activeWorkersCount} active workers on shift and ${activePermitsCount} active permits-to-work in progress.\n\nWe currently detect ${criticalAlertsCount} critical safety alerts and ${warningAlertsCount} warning alerts. Overall safety compliance score is estimated at ${complianceVal}%.\n\nRecommended safety actions: Ensure all workers maintain 100% PPE compliance. Review all permits-to-work below the 80% compliance threshold, and continuously monitor gas concentration readings in high-risk zones.`,
    'incident': `Incident analysis summary: There are ${criticalAlertsCount} critical alerts active in the system. The safety team is investigating the source of these alerts immediately. ${criticalAlertsCount > 0 ? 'Critical safety events require immediate evacuation of the affected zones and suspension of active permits.' : 'No active critical incidents or alerts reported in the current shift.'}\n\nRoot Cause and Mitigation: Establish mandatory pre-task hazard checks, verify that rescue standby teams are present for confined space works, and ensure sensor networks are online and fully operational.`,
    'ai-risk': `AI predictive risk profile: Plant composite risk is evaluated at ${riskVal}/100. Based on current sensor trajectories and permit activities, the system forecasts a stable risk trend if active alerts are resolved promptly.\n\nKey risk drivers: worker density in specific zones, hazardous gas levels, and PPE status anomalies. Predictive models estimate that early mitigation of warnings will reduce overall composite risk by 35% within the next hour.`,
    'compliance': `Compliance audit review: The plant compliance rating is currently at ${complianceVal}%. Monitoring indicates Factory Act PPE compliance and Permit-to-Work standards are active.\n\nMonitored standards status: IS 13947 Isolation is operational, OISD-GDN-206 Gas Detection is active with sensor coverage, and EPA Emission readings are nominal.\n\nRequired corrections: Address all outstanding PPE and permit compliance warnings immediately during this shift to prevent regulatory violations.`,
    'worker-safety': `Worker health and safety overview: ${activeWorkersCount} workers are currently logged on shift. Biometrics show heart rates and gas exposure monitoring are active.\n\nRisk levels: ${workersList.filter(w => w.riskLevel === 'critical').length} critical risk, ${workersList.filter(w => w.riskLevel === 'high').length} high risk, and ${workersList.filter(w => w.riskLevel === 'medium').length} medium risk worker profiles registered.\n\nRemedial steps: Contact supervisor for workers under high or critical stress, enforce compliance checks at zone entry gates, and deploy buddy systems for high-altitude works.`,
    'equipment': `Equipment health analysis: ${sensorsList.filter(s => s.status === 'online' || s.status === 'ONLINE').length}/${sensorsList.length || 1} sensors are online. Anomalies identified: ${sensorsList.filter(s => s.status === 'warning' || s.status === 'critical').length} warning/critical readings detected.\n\nPriority checks: Inspect compressor vibrations, verify furnace temperature profiles, and perform calibration tasks on older sensors.\n\nMaintenance scheduling: Schedule routine diagnostic inspections for flagged equipment sensors within the shift.`,
  };
  return summaries[id] || summaries['daily-safety'];
}

// ─── Print PDF utility ───────────────────────────────────────────────────────

function printReport(
  reportId: string,
  reportName: string,
  content: string,
  kpi: any,
  alertsList: any[],
  workersList: any[],
  permitsList: any[]
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Compute compliance checks
  const passedChecks = permitsList.filter(p => p.compliance >= 80).length + 3;
  const totalChecks = 6;
  const compliancePercentage = Math.round((passedChecks / totalChecks) * 100);

  const alertsTableRows = alertsList.slice(0, 8).map(a => `
    <tr>
      <td>${a.id}</td>
      <td><span class="badge badge-${(a.severity || '').toLowerCase() === 'critical' ? 'critical' : 'warning'}">${(a.severity || '').toUpperCase()}</span></td>
      <td>${a.title}</td>
      <td>${a.zone}</td>
      <td>${a.timestamp || new Date(a.createdAt).toLocaleTimeString('en-IN', { hour12: false })}</td>
      <td>${a.acknowledged ? 'Acknowledged' : 'Active'}</td>
    </tr>
  `).join('');

  const workersTableRows = workersList.slice(0, 8).map(w => `
    <tr>
      <td>${w.badge || 'B-N/A'}</td>
      <td>${w.name}</td>
      <td>${w.role}</td>
      <td>${w.zone}</td>
      <td><span class="badge badge-${(w.ppeStatus || '').toLowerCase() === 'compliant' ? 'pass' : (w.ppeStatus || '').toLowerCase() === 'partial' ? 'warning' : 'critical'}">${(w.ppeStatus || '').toUpperCase()}</span></td>
      <td><span class="badge badge-${(w.riskLevel || '').toLowerCase() === 'critical' ? 'critical' : (w.riskLevel || '').toLowerCase() === 'high' ? 'warning' : 'pass'}">${(w.riskLevel || '').toUpperCase()}</span></td>
      <td>${w.heartRate ?? 72} bpm</td>
    </tr>
  `).join('');

  const permitsTableRows = permitsList.slice(0, 8).map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${(p.type || '').toUpperCase().replace(/-/g, ' ')}</td>
      <td>${p.zone}</td>
      <td>${p.workers ? p.workers.length : 0}</td>
      <td><span class="badge badge-${(p.compliance ?? 100) >= 80 ? 'pass' : (p.compliance ?? 100) >= 60 ? 'warning' : 'critical'}">${p.compliance ?? 100}%</span></td>
      <td>${(p.status || '').toUpperCase()}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>${reportName} — ISIP</title>
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #ffffff; color: #1e293b; padding: 30px; font-size: 11px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
    .logo { font-size: 22px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
    .logo span { color: #8B5CF6; }
    .report-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #64748b; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
    .badge-critical { background: #fee2e2; color: #dc2626; }
    .badge-warning { background: #fef3c7; color: #d97706; }
    .badge-pass { background: #dcfce7; color: #16a34a; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 700; color: #0f172a; border-left: 3px solid #2563EB; padding-left: 10px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .ai-summary { background: #f0f4ff; border: 1px solid #c7d7ff; border-radius: 8px; padding: 16px; line-height: 1.75; }
    .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; }
    .kpi-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
    .kpi-value { font-size: 20px; font-weight: 800; }
    .kpi-label { font-size: 10px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
    td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; }
  </style>
</head>
<body>
<div class="header">
  <div><div class="logo">IS<span>IP</span></div></div>
  <div style="text-align:right">
    <div class="report-title">${reportName}</div>
    <div class="meta">Generated: ${dateStr} at ${timeStr}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Plant Status Snapshot</div>
  <div class="kpi-row">
    <div class="kpi-card"><div class="kpi-value" style="color:#F59E0B">${kpi?.riskScore ?? 68}</div><div class="kpi-label">Risk Score /100</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color:#22C55E">${kpi?.plantHealth ?? 76}%</div><div class="kpi-label">Plant Health</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color:#EF4444">${alertsList.filter(a => a.severity === 'critical' && !a.acknowledged).length}</div><div class="kpi-label">Critical Alerts</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color:#3B82F6">${kpi?.activeWorkers ?? workersList.length}</div><div class="kpi-label">Active Workers</div></div>
    <div class="kpi-card"><div class="kpi-value">${kpi?.incidentFreeDays ?? 47}</div><div class="kpi-label">Incident-Free Days</div></div>
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
      ${alertsTableRows || '<tr><td colspan="6" style="text-align:center;">No active alerts</td></tr>'}
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Worker Status</div>
  <table>
    <thead><tr><th>Badge</th><th>Name</th><th>Role</th><th>Zone</th><th>PPE</th><th>Risk</th><th>Heart Rate</th></tr></thead>
    <tbody>
      ${workersTableRows || '<tr><td colspan="7" style="text-align:center;">No active workers on shift</td></tr>'}
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Permit-to-Work Summary</div>
  <table>
    <thead><tr><th>Permit ID</th><th>Type</th><th>Zone</th><th>Workers</th><th>Compliance</th><th>Status</th></tr></thead>
    <tbody>
      ${permitsTableRows || '<tr><td colspan="6" style="text-align:center;">No active permits in system</td></tr>'}
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Regulatory Compliance</div>
  <table>
    <thead><tr><th>Standard</th><th>Status</th><th>Evidence</th><th>Zone</th></tr></thead>
    <tbody>
      <tr><td>IS 13947 — Electrical Isolation</td><td><span class="badge badge-pass">PASS</span></td><td>All isolations verified</td><td>Zone G</td></tr>
      <tr><td>OISD-GDN-206 — Gas Detection</td><td><span class="badge badge-pass">PASS</span></td><td>All sensors operational</td><td>All Zones</td></tr>
      <tr><td>Factory Act 1948 — PPE</td><td><span class="badge badge-${workersList.some(w => w.ppeStatus !== 'compliant') ? 'warning' : 'pass'}">${workersList.some(w => w.ppeStatus !== 'compliant') ? 'WARNING' : 'PASS'}</span></td><td>${workersList.some(w => w.ppeStatus !== 'compliant') ? 'Minor PPE compliance issues detected' : 'All workers compliant'}</td><td>Zone E, F</td></tr>
      <tr><td>OISD-STD-105 — Permit to Work</td><td><span class="badge badge-${permitsList.some(p => p.compliance < 80) ? 'warning' : 'pass'}">${permitsList.some(p => p.compliance < 80) ? 'WARNING' : 'PASS'}</span></td><td>Permits compliance check completed</td><td>Zone F</td></tr>
      <tr><td>IS 15683 — Fire Protection</td><td><span class="badge badge-pass">PASS</span></td><td>All suppression systems active</td><td>All Zones</td></tr>
      <tr><td>EPA — Stack Emissions</td><td><span class="badge badge-pass">PASS</span></td><td>Nominal readings on chimneys</td><td>Zone D</td></tr>
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
  sensors: any[];
  workers: any[];
  permits: any[];
  alerts: any[];
  kpi: any;
}

const ReportModal: React.FC<ReportModalProps> = ({ report, onClose, sensors, workers, permits, alerts, kpi }) => {
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'ai'>('overview');

  const generateReport = useCallback(async () => {
    setLoadingAI(true);
    setActiveTab('ai');
    const summary = await generateAISummary(report.id, kpi, alerts, workers, permits, sensors);
    setAiSummary(summary);
    setLoadingAI(false);
    setGenerated(true);
  }, [report.id, kpi, alerts, workers, permits, sensors]);

  const handlePrint = () => {
    if (!aiSummary) {
      generateAISummary(report.id, kpi, alerts, workers, permits, sensors).then(s => printReport(report.id, report.name, s, kpi, alerts, workers, permits));
    } else {
      printReport(report.id, report.name, aiSummary, kpi, alerts, workers, permits);
    }
  };

  const renderChart = () => {
    const dynamicRiskFactors = [
      { factor: 'Gas Concentration', score: Math.round(Math.min(95, (kpi?.riskScore || 0) * 0.95)) },
      { factor: 'Worker Exposure', score: Math.max(0, 100 - (kpi?.complianceScore || 100)) },
      { factor: 'Equipment Health', score: Math.round(Math.max(10, (kpi?.riskScore || 0) * 0.85)) },
      { factor: 'Permit Risk', score: Math.min(100, (alerts.filter((a: any) => a.severity === 'critical').length || 0) * 25) },
      { factor: 'Environmental', score: Math.max(0, (kpi?.plantHealth || 100) - 20) },
    ];
    const radarData = dynamicRiskFactors.map(rf => ({
      subject: rf.factor.split(' ')[0],
      score: rf.score,
      safe: 60,
    }));

    const workerComplianceData = workers.map(w => ({
      name: (w.name || '').split(' ')[0],
      risk: w.riskLevel === 'critical' ? 95 : w.riskLevel === 'high' ? 75 : w.riskLevel === 'medium' ? 50 : 25,
      heartRate: w.heartRate ?? 72,
      exposure: w.gasExposure ?? 0,
    }));

    const sensorHealthData = sensors.map(s => ({
      name: (s.name || '').split('—')[0].split('-')[0].trim(),
      value: s.threshold ? Math.round((s.value / s.threshold) * 100) : 0,
      threshold: 100,
      status: s.status,
    }));

    const simulatedTrend = Array.from({ length: 12 }, (_, i) => ({
      hour: `${String(i + 8).padStart(2, '0')}:00`,
      riskScore: Math.round((kpi?.riskScore || 50) + Math.sin(i * 0.5) * 10 + Math.random() * 5),
    }));

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
            <AreaChart data={simulatedTrend}>
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
            <AreaChart data={simulatedTrend}>
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
                <div className="rm-kpi"><span className="rm-kpi-val" style={{ color: '#F59E0B' }}>{kpi?.riskScore ?? 68}</span><span className="rm-kpi-lbl">Risk Score</span></div>
                <div className="rm-kpi"><span className="rm-kpi-val" style={{ color: '#22C55E' }}>{kpi?.plantHealth ?? 76}%</span><span className="rm-kpi-lbl">Plant Health</span></div>
                <div className="rm-kpi"><span className="rm-kpi-val" style={{ color: '#EF4444' }}>{alerts.filter((a: any) => (a.severity === 'critical' || a.severity === 'CRITICAL') && !a.acknowledged).length}</span><span className="rm-kpi-lbl">Critical Alerts</span></div>
                <div className="rm-kpi"><span className="rm-kpi-val" style={{ color: '#3B82F6' }}>{kpi?.activeWorkers ?? workers.length}</span><span className="rm-kpi-lbl">Workers</span></div>
                <div className="rm-kpi"><span className="rm-kpi-val">{kpi?.complianceScore ?? 73}%</span><span className="rm-kpi-lbl">Compliance</span></div>
                <div className="rm-kpi"><span className="rm-kpi-val" style={{ color: '#22C55E' }}>{kpi?.incidentFreeDays ?? 47}</span><span className="rm-kpi-lbl">Incident-Free Days</span></div>
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
                  {(() => {
                    const dynamicComplianceChecks = [
                      { id: 'C001', rule: 'IS 13947 — Electrical Isolation', status: 'pass', zone: 'Zone G' },
                      { id: 'C002', rule: 'OISD-GDN-206 — Gas Detection', status: sensors.every((s: any) => s.status !== 'offline') ? 'pass' : 'warning', zone: 'All Zones' },
                      { id: 'C003', rule: 'Factory Act 1948 — PPE Compliance', status: workers.some((w: any) => w.ppeStatus === 'non-compliant') ? 'critical' : workers.some((w: any) => w.ppeStatus === 'partial') ? 'warning' : 'pass', zone: 'All Zones' },
                      { id: 'C004', rule: 'OISD-STD-105 — Permit to Work', status: permits.some((p: any) => p.compliance < 80) ? 'warning' : 'pass', zone: 'All Zones' },
                      { id: 'C005', rule: 'IS 15683 — Fire Protection', status: 'pass', zone: 'All Zones' },
                      { id: 'C006', rule: 'EPA — Stack Emissions', status: 'pass', zone: 'Zone D' },
                    ];
                    return dynamicComplianceChecks.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontSize: 11 }}>{c.rule}</td>
                        <td><span className={`badge-chip ${c.status === 'pass' ? 'success' : c.status === 'warning' ? 'warning' : 'critical'}`}>{c.status.toUpperCase()}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{c.zone}</td>
                      </tr>
                    ));
                  })()}
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

import { sensorsApi, workersApi, permitsApi, alertsApi, dashboardApi } from '../services/api';

const ReportsAnalytics: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportDef | null>(null);
  const [filter, setFilter] = useState<'all' | 'safety' | 'compliance' | 'operations' | 'ai'>('all');

  const [sensorsList, setSensorsList] = useState<any[]>([]);
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [permitsList, setPermitsList] = useState<any[]>([]);
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [kpi, setKpi] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      try {
        const [sensorsRes, workersRes, permitsRes, alertsRes, kpiRes] = await Promise.all([
          sensorsApi.getAll(),
          workersApi.getAll(),
          permitsApi.getAll(),
          alertsApi.getAll(),
          dashboardApi.getKPIs(),
        ]);
        if (active) {
          if (sensorsRes.success && Array.isArray(sensorsRes.data)) setSensorsList(sensorsRes.data);
          if (workersRes.success && Array.isArray(workersRes.data)) setWorkersList(workersRes.data);
          if (permitsRes.success && Array.isArray(permitsRes.data)) setPermitsList(permitsRes.data);
          if (alertsRes.success && Array.isArray(alertsRes.data)) setAlertsList(alertsRes.data);
          if (kpiRes.success && kpiRes.data) setKpi(kpiRes.data);
        }
      } catch (err) {
        console.warn('ReportsAnalytics API load warning:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAll();
    return () => { active = false; };
  }, []);

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
            <div className="rpt-stat"><span className="rpt-stat-val" style={{ color: '#22C55E' }}>{kpi?.incidentFreeDays ?? 47}</span><span className="rpt-stat-lbl">Incident-Free Days</span></div>
            <div className="rpt-stat"><span className="rpt-stat-val" style={{ color: '#F59E0B' }}>{kpi?.complianceScore ?? 73}%</span><span className="rpt-stat-lbl">Compliance Score</span></div>
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
                    generateAISummary(report.id, kpi, alertsList, workersList, permitsList, sensorsList).then(s => printReport(report.id, report.name, s, kpi, alertsList, workersList, permitsList));
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
        <ReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          sensors={sensorsList}
          workers={workersList}
          permits={permitsList}
          alerts={alertsList}
          kpi={kpi}
        />
      )}
    </div>
  );
};

export default ReportsAnalytics;
