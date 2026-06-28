// ============================================================
// ISIP — Mock Data Layer
// All simulated industrial data for demonstration
// ============================================================

export interface Sensor {
  id: string;
  name: string;
  type: 'gas' | 'temperature' | 'pressure' | 'vibration' | 'humidity' | 'flow';
  zone: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  threshold: number;
  status: 'online' | 'offline' | 'warning' | 'critical';
  lastUpdated: string;
  equipment: string;
  trend: 'up' | 'down' | 'stable';
  history: { time: string; value: number }[];
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  zone: string;
  task: string;
  ppeStatus: 'compliant' | 'non-compliant' | 'partial';
  permit: string | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  heartRate: number;
  gasExposure: number;
  nearbyHazards: string[];
  lastSeen: string;
  shift: string;
  badge: string;
  status: 'active' | 'break' | 'emergency' | 'evacuated';
  movementHistory: { time: string; zone: string }[];
}

export interface Permit {
  id: string;
  type: 'hot-work' | 'confined-space' | 'electrical' | 'working-at-height' | 'chemical';
  title: string;
  zone: string;
  issuer: string;
  workers: string[];
  equipment: string[];
  startTime: string;
  endTime: string;
  status: 'active' | 'pending' | 'expired' | 'suspended';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  compliance: number;
  aiRecommendation: string;
}

export interface Alert {
  id: string;
  type: 'gas' | 'temperature' | 'pressure' | 'equipment' | 'worker' | 'permit' | 'system';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  zone: string;
  timestamp: string;
  acknowledged: boolean;
  source: string;
}

export interface TimelineEvent {
  id: string;
  category: 'sensor' | 'worker' | 'permit' | 'equipment' | 'ai' | 'system';
  title: string;
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  zone: string;
  relatedId?: string;
}

// ---- Sensor Data ----
export const sensors: Sensor[] = [
  {
    id: 'S001', name: 'H₂S Monitor — Blast Furnace A', type: 'gas', zone: 'Zone A - Blast Furnace',
    value: 8.4, unit: 'ppm', min: 0, max: 20, threshold: 10, status: 'warning',
    lastUpdated: '14s ago', equipment: 'Blast Furnace Unit 1', trend: 'up',
    history: generateHistory(8.4, 0.8, 24)
  },
  {
    id: 'S002', name: 'CO Detector — Converter Bay', type: 'gas', zone: 'Zone B - Converter',
    value: 23.1, unit: 'ppm', min: 0, max: 50, threshold: 25, status: 'warning',
    lastUpdated: '8s ago', equipment: 'Converter Unit 2', trend: 'up',
    history: generateHistory(23.1, 2.1, 24)
  },
  {
    id: 'S003', name: 'Temperature — Furnace Outlet', type: 'temperature', zone: 'Zone A - Blast Furnace',
    value: 1487, unit: '°C', min: 1200, max: 1600, threshold: 1500, status: 'warning',
    lastUpdated: '3s ago', equipment: 'Blast Furnace Unit 1', trend: 'up',
    history: generateHistory(1487, 35, 24)
  },
  {
    id: 'S004', name: 'Pressure — Steam Header', type: 'pressure', zone: 'Zone C - Boiler Room',
    value: 12.8, unit: 'bar', min: 8, max: 16, threshold: 14, status: 'online',
    lastUpdated: '5s ago', equipment: 'Steam Boiler B3', trend: 'stable',
    history: generateHistory(12.8, 0.5, 24)
  },
  {
    id: 'S005', name: 'SO₂ Sensor — Stack Emission', type: 'gas', zone: 'Zone D - Chimney',
    value: 4.2, unit: 'mg/m³', min: 0, max: 10, threshold: 8, status: 'online',
    lastUpdated: '12s ago', equipment: 'Emission Stack', trend: 'stable',
    history: generateHistory(4.2, 0.3, 24)
  },
  {
    id: 'S006', name: 'Vibration — Compressor #3', type: 'vibration', zone: 'Zone E - Compressor Station',
    value: 7.8, unit: 'mm/s', min: 0, max: 12, threshold: 8, status: 'warning',
    lastUpdated: '2s ago', equipment: 'Compressor C3', trend: 'up',
    history: generateHistory(7.8, 0.9, 24)
  },
  {
    id: 'S007', name: 'O₂ Deficiency — Tank Farm', type: 'gas', zone: 'Zone F - Tank Farm',
    value: 18.2, unit: '%', min: 16, max: 21, threshold: 19.5, status: 'critical',
    lastUpdated: '1s ago', equipment: 'Tank T-14', trend: 'down',
    history: generateHistory(18.2, 0.4, 24)
  },
  {
    id: 'S008', name: 'Flame Detector — Rolling Mill', type: 'temperature', zone: 'Zone G - Rolling Mill',
    value: 342, unit: '°C', min: 200, max: 500, threshold: 450, status: 'online',
    lastUpdated: '6s ago', equipment: 'Rolling Mill M1', trend: 'stable',
    history: generateHistory(342, 12, 24)
  },
  {
    id: 'S009', name: 'CH₄ Detector — Gas Plant', type: 'gas', zone: 'Zone H - Gas Plant',
    value: 1.8, unit: '%LEL', min: 0, max: 5, threshold: 3, status: 'online',
    lastUpdated: '9s ago', equipment: 'Gas Processing Unit', trend: 'stable',
    history: generateHistory(1.8, 0.2, 24)
  },
  {
    id: 'S010', name: 'Flow Rate — Cooling Water', type: 'flow', zone: 'Zone A - Blast Furnace',
    value: 420, unit: 'L/min', min: 350, max: 500, threshold: 380, status: 'online',
    lastUpdated: '4s ago', equipment: 'Cooling System A', trend: 'stable',
    history: generateHistory(420, 15, 24)
  },
  {
    id: 'S011', name: 'Pressure — Hydraulic System', type: 'pressure', zone: 'Zone G - Rolling Mill',
    value: 28.6, unit: 'bar', min: 20, max: 35, threshold: 32, status: 'online',
    lastUpdated: '7s ago', equipment: 'Hydraulic Press H2', trend: 'down',
    history: generateHistory(28.6, 1.2, 24)
  },
  {
    id: 'S012', name: 'H₂ Sensor — Electrolyzer', type: 'gas', zone: 'Zone I - Electrolyzer',
    value: 0.4, unit: '%', min: 0, max: 1, threshold: 0.5, status: 'warning',
    lastUpdated: '11s ago', equipment: 'Electrolyzer Unit E1', trend: 'up',
    history: generateHistory(0.4, 0.04, 24)
  },
];

function generateHistory(base: number, variance: number, hours: number): { time: string; value: number }[] {
  const now = new Date();
  return Array.from({ length: hours }, (_, i) => {
    const t = new Date(now.getTime() - (hours - 1 - i) * 3600000);
    const v = base + (Math.random() - 0.5) * variance * 2;
    return {
      time: `${String(t.getHours()).padStart(2,'0')}:00`,
      value: parseFloat(v.toFixed(2))
    };
  });
}

// ---- Worker Data ----
export const workers: Worker[] = [
  {
    id: 'W001', name: 'Arjun Sharma', role: 'Furnace Operator', zone: 'Zone A - Blast Furnace',
    task: 'Tapping operation', ppeStatus: 'compliant', permit: 'PTW-2024-0041',
    riskLevel: 'high', heartRate: 94, gasExposure: 7.2, nearbyHazards: ['H₂S Elevation', 'High Temp'],
    lastSeen: '12s ago', shift: 'Morning', badge: 'B-1042', status: 'active',
    movementHistory: [
      { time: '06:00', zone: 'Gate Entry' }, { time: '06:45', zone: 'Zone A' },
      { time: '09:30', zone: 'Control Room' }, { time: '10:15', zone: 'Zone A - Blast Furnace' }
    ]
  },
  {
    id: 'W002', name: 'Ravi Patel', role: 'Safety Officer', zone: 'Zone B - Converter',
    task: 'Safety Inspection', ppeStatus: 'compliant', permit: null,
    riskLevel: 'medium', heartRate: 78, gasExposure: 18.4, nearbyHazards: ['CO Elevation'],
    lastSeen: '4s ago', shift: 'Morning', badge: 'B-0891', status: 'active',
    movementHistory: [
      { time: '06:00', zone: 'Gate Entry' }, { time: '07:00', zone: 'Zone C' },
      { time: '08:30', zone: 'Zone B - Converter' }
    ]
  },
  {
    id: 'W003', name: 'Deepak Verma', role: 'Maintenance Technician', zone: 'Zone E - Compressor Station',
    task: 'Vibration analysis', ppeStatus: 'partial', permit: 'PTW-2024-0043',
    riskLevel: 'high', heartRate: 88, gasExposure: 2.1, nearbyHazards: ['High Vibration', 'Moving Parts'],
    lastSeen: '28s ago', shift: 'Morning', badge: 'B-2234', status: 'active',
    movementHistory: [
      { time: '07:00', zone: 'Maintenance Bay' }, { time: '08:00', zone: 'Zone E - Compressor Station' }
    ]
  },
  {
    id: 'W004', name: 'Suresh Kumar', role: 'Process Operator', zone: 'Zone F - Tank Farm',
    task: 'Tank inspection', ppeStatus: 'non-compliant', permit: 'PTW-2024-0042',
    riskLevel: 'critical', heartRate: 105, gasExposure: 0.8, nearbyHazards: ['O₂ Deficiency', 'Confined Space'],
    lastSeen: '2s ago', shift: 'Morning', badge: 'B-3341', status: 'active',
    movementHistory: [
      { time: '06:30', zone: 'Gate Entry' }, { time: '07:15', zone: 'Zone F - Tank Farm' }
    ]
  },
  {
    id: 'W005', name: 'Manish Gupta', role: 'Electrical Technician', zone: 'Zone G - Rolling Mill',
    task: 'Electrical maintenance', ppeStatus: 'compliant', permit: 'PTW-2024-0044',
    riskLevel: 'medium', heartRate: 82, gasExposure: 0.3, nearbyHazards: ['High Voltage', 'Moving Parts'],
    lastSeen: '18s ago', shift: 'Morning', badge: 'B-1893', status: 'active',
    movementHistory: [
      { time: '07:30', zone: 'Electrical Room' }, { time: '09:00', zone: 'Zone G - Rolling Mill' }
    ]
  },
  {
    id: 'W006', name: 'Priya Singh', role: 'Safety Inspector', zone: 'Control Room',
    task: 'Monitoring operations', ppeStatus: 'compliant', permit: null,
    riskLevel: 'low', heartRate: 72, gasExposure: 0.1, nearbyHazards: [],
    lastSeen: '1s ago', shift: 'Morning', badge: 'B-0523', status: 'active',
    movementHistory: [
      { time: '06:00', zone: 'Gate Entry' }, { time: '06:10', zone: 'Control Room' }
    ]
  },
  {
    id: 'W007', name: 'Rajesh Nair', role: 'Crane Operator', zone: 'Zone G - Rolling Mill',
    task: 'Material handling', ppeStatus: 'compliant', permit: 'PTW-2024-0045',
    riskLevel: 'medium', heartRate: 80, gasExposure: 0.5, nearbyHazards: ['Working at Height', 'Heavy Load'],
    lastSeen: '35s ago', shift: 'Morning', badge: 'B-4421', status: 'active',
    movementHistory: [
      { time: '06:00', zone: 'Gate Entry' }, { time: '07:00', zone: 'Zone G - Rolling Mill' }
    ]
  },
  {
    id: 'W008', name: 'Amit Joshi', role: 'Boiler Operator', zone: 'Zone C - Boiler Room',
    task: 'Steam pressure monitoring', ppeStatus: 'compliant', permit: null,
    riskLevel: 'low', heartRate: 76, gasExposure: 1.2, nearbyHazards: ['High Pressure'],
    lastSeen: '7s ago', shift: 'Morning', badge: 'B-3092', status: 'active',
    movementHistory: [
      { time: '06:00', zone: 'Gate Entry' }, { time: '06:30', zone: 'Zone C - Boiler Room' }
    ]
  },
];

// ---- Permit Data ----
export const permits: Permit[] = [
  {
    id: 'PTW-2024-0041', type: 'hot-work', title: 'Blast Furnace Tapping — Unit 1',
    zone: 'Zone A - Blast Furnace', issuer: 'Priya Singh', workers: ['W001'],
    equipment: ['Blast Furnace Unit 1', 'Tapping Equipment T-3'],
    startTime: '06:00', endTime: '14:00', status: 'active',
    riskLevel: 'high', compliance: 91,
    aiRecommendation: 'Continuous H₂S monitoring required. Temperature trending upward — consider early termination at 13:00 if temp exceeds 1500°C.'
  },
  {
    id: 'PTW-2024-0042', type: 'confined-space', title: 'Tank T-14 Internal Inspection',
    zone: 'Zone F - Tank Farm', issuer: 'Ravi Patel', workers: ['W004'],
    equipment: ['Tank T-14', 'Rescue Equipment'],
    startTime: '07:00', endTime: '11:00', status: 'active',
    riskLevel: 'critical', compliance: 62,
    aiRecommendation: '⚠️ CRITICAL: O₂ level at 18.2% (below 19.5% threshold). Worker W004 PPE non-compliant. Recommend immediate evacuation and permit suspension.'
  },
  {
    id: 'PTW-2024-0043', type: 'electrical', title: 'Compressor C3 Maintenance',
    zone: 'Zone E - Compressor Station', issuer: 'Priya Singh', workers: ['W003'],
    equipment: ['Compressor C3', 'Isolation Switch IS-12'],
    startTime: '08:00', endTime: '12:00', status: 'active',
    riskLevel: 'high', compliance: 78,
    aiRecommendation: 'Worker W003 missing face shield (partial PPE). Vibration escalating — monitor compressor bearing temperature closely.'
  },
  {
    id: 'PTW-2024-0044', type: 'electrical', title: 'Rolling Mill Electrical Panel Maintenance',
    zone: 'Zone G - Rolling Mill', issuer: 'Ravi Patel', workers: ['W005'],
    equipment: ['Electrical Panel EP-7', 'Rolling Mill M1'],
    startTime: '09:00', endTime: '13:00', status: 'active',
    riskLevel: 'medium', compliance: 96,
    aiRecommendation: 'All safety prerequisites met. Maintain isolation verification every 2 hours.'
  },
  {
    id: 'PTW-2024-0045', type: 'working-at-height', title: 'Rolling Mill Crane Beam Inspection',
    zone: 'Zone G - Rolling Mill', issuer: 'Priya Singh', workers: ['W007'],
    equipment: ['Overhead Crane OC-2', 'Safety Harness'],
    startTime: '07:00', endTime: '10:00', status: 'active',
    riskLevel: 'medium', compliance: 88,
    aiRecommendation: 'Fall arrest system verified. Ensure buddy system active — only one worker detected in zone.'
  },
  {
    id: 'PTW-2024-0038', type: 'chemical', title: 'Acid Line Maintenance — Pickling Section',
    zone: 'Zone G - Rolling Mill', issuer: 'Ravi Patel', workers: [],
    equipment: ['Pickling Tank PT-3'],
    startTime: '00:00', endTime: '06:00', status: 'expired',
    riskLevel: 'high', compliance: 100,
    aiRecommendation: 'Permit expired. Verify all chemical line isolations before re-entry.'
  },
  {
    id: 'PTW-2024-0046', type: 'hot-work', title: 'Boiler Tube Welding — Boiler B4',
    zone: 'Zone C - Boiler Room', issuer: 'Ravi Patel', workers: [],
    equipment: ['Boiler B4'],
    startTime: '14:00', endTime: '18:00', status: 'pending',
    riskLevel: 'high', compliance: 0,
    aiRecommendation: 'Pending approval. Ensure fire watch is assigned and extinguisher positioned before approval.'
  },
];

// ---- Alerts ----
export const alerts: Alert[] = [
  {
    id: 'ALT001', type: 'gas', severity: 'critical',
    title: 'O₂ Deficiency Detected', description: 'Oxygen level dropped to 18.2% in Zone F - Tank Farm. Worker W004 at risk.',
    zone: 'Zone F - Tank Farm', timestamp: '10:23:45', acknowledged: false, source: 'S007'
  },
  {
    id: 'ALT002', type: 'worker', severity: 'critical',
    title: 'PPE Non-Compliance', description: 'Worker Suresh Kumar (W004) entered confined space without proper PPE.',
    zone: 'Zone F - Tank Farm', timestamp: '10:21:12', acknowledged: false, source: 'W004'
  },
  {
    id: 'ALT003', type: 'gas', severity: 'warning',
    title: 'H₂S Level Rising', description: 'H₂S concentration trending up to 8.4 ppm. Threshold is 10 ppm.',
    zone: 'Zone A - Blast Furnace', timestamp: '10:18:33', acknowledged: false, source: 'S001'
  },
  {
    id: 'ALT004', type: 'gas', severity: 'warning',
    title: 'CO Elevated', description: 'Carbon monoxide at 23.1 ppm, approaching 25 ppm threshold.',
    zone: 'Zone B - Converter', timestamp: '10:15:20', acknowledged: true, source: 'S002'
  },
  {
    id: 'ALT005', type: 'equipment', severity: 'warning',
    title: 'Compressor Vibration High', description: 'Compressor C3 vibration at 7.8 mm/s approaching 8 mm/s limit.',
    zone: 'Zone E - Compressor Station', timestamp: '10:12:08', acknowledged: false, source: 'S006'
  },
  {
    id: 'ALT006', type: 'permit', severity: 'warning',
    title: 'Permit Compliance Low', description: 'PTW-2024-0042 compliance score dropped to 62%. Review required.',
    zone: 'Zone F - Tank Farm', timestamp: '10:08:55', acknowledged: false, source: 'PTW-2024-0042'
  },
];

// ---- Timeline Events ----
export const timelineEvents: TimelineEvent[] = [
  { id: 'TL001', category: 'ai', title: 'AI Risk Alert Generated', description: 'Compound risk detected in Zone F: O₂ deficiency + active confined space permit + worker presence', timestamp: '10:23:50', severity: 'critical', zone: 'Zone F - Tank Farm', relatedId: 'ALT001' },
  { id: 'TL002', category: 'sensor', title: 'O₂ Sensor Critical Threshold', description: 'S007 oxygen level dropped below 19.5% safety threshold to 18.2%', timestamp: '10:23:45', severity: 'critical', zone: 'Zone F - Tank Farm', relatedId: 'S007' },
  { id: 'TL003', category: 'worker', title: 'PPE Violation Detected', description: 'Worker W004 (Suresh Kumar) entered confined space without full PPE compliance', timestamp: '10:21:12', severity: 'critical', zone: 'Zone F - Tank Farm', relatedId: 'W004' },
  { id: 'TL004', category: 'sensor', title: 'H₂S Level Rising', description: 'H₂S concentration increased from 6.1 to 8.4 ppm over 15 minutes', timestamp: '10:18:33', severity: 'warning', zone: 'Zone A - Blast Furnace', relatedId: 'S001' },
  { id: 'TL005', category: 'permit', title: 'Permit PTW-0043 Activated', description: 'Compressor C3 maintenance permit activated for worker Deepak Verma', timestamp: '10:15:00', severity: 'info', zone: 'Zone E - Compressor Station', relatedId: 'PTW-2024-0043' },
  { id: 'TL006', category: 'sensor', title: 'CO Level Warning', description: 'Carbon monoxide sensor S002 exceeded 20 ppm warning threshold', timestamp: '10:12:20', severity: 'warning', zone: 'Zone B - Converter', relatedId: 'S002' },
  { id: 'TL007', category: 'ai', title: 'AI Predictive Alert', description: 'Temperature trajectory analysis predicts Furnace A will exceed 1500°C within 45 minutes', timestamp: '10:08:15', severity: 'warning', zone: 'Zone A - Blast Furnace' },
  { id: 'TL008', category: 'equipment', title: 'Compressor Vibration Spike', description: 'Compressor C3 vibration peaked at 8.1 mm/s, auto-throttled, now at 7.8 mm/s', timestamp: '09:55:40', severity: 'warning', zone: 'Zone E - Compressor Station', relatedId: 'S006' },
  { id: 'TL009', category: 'permit', title: 'Permit PTW-0041 Activated', description: 'Blast Furnace tapping permit activated for worker Arjun Sharma', timestamp: '09:48:00', severity: 'info', zone: 'Zone A - Blast Furnace', relatedId: 'PTW-2024-0041' },
  { id: 'TL010', category: 'worker', title: 'Shift Handover Completed', description: '8 workers logged in. Morning shift operational. Briefing completed.', timestamp: '06:05:00', severity: 'info', zone: 'Gate Entry' },
  { id: 'TL011', category: 'system', title: 'Platform Initialized', description: 'ISIP system started. All 12 sensors online. Daily checks passed.', timestamp: '06:00:00', severity: 'info', zone: 'System' },
  { id: 'TL012', category: 'permit', title: 'Permit PTW-0038 Expired', description: 'Acid line maintenance permit expired at end of night shift. Area secured.', timestamp: '06:00:00', severity: 'info', zone: 'Zone G - Rolling Mill', relatedId: 'PTW-2024-0038' },
];

// ---- Compliance Data ----
export const complianceChecks = [
  { id: 'C001', rule: 'IS 13947 — Electrical Isolation', status: 'pass', evidence: 'All electrical isolations verified at 06:30', zone: 'Zone G' },
  { id: 'C002', rule: 'OISD-GDN-206 — Gas Detection', status: 'pass', evidence: '12/12 gas sensors operational', zone: 'All Zones' },
  { id: 'C003', rule: 'Factory Act 1948 — PPE Compliance', status: 'fail', evidence: 'Worker W004 non-compliant, W003 partial compliance', zone: 'Zone E, F', severity: 'critical' },
  { id: 'C004', rule: 'OISD-STD-105 — Permit to Work', status: 'fail', evidence: 'PTW-0042 compliance at 62% — below 80% threshold', zone: 'Zone F', severity: 'high' },
  { id: 'C005', rule: 'IS 15683 — Fire Protection', status: 'pass', evidence: 'All fire suppression systems active and charged', zone: 'All Zones' },
  { id: 'C006', rule: 'OISD-GDN-169 — Confined Space', status: 'warning', evidence: 'O₂ monitoring active but rescue team not on standby', zone: 'Zone F', severity: 'medium' },
  { id: 'C007', rule: 'EPA — Stack Emissions', status: 'pass', evidence: 'SO₂ at 4.2 mg/m³, well below 100 mg/m³ limit', zone: 'Zone D' },
  { id: 'C008', rule: 'PESO — Explosive Atmosphere', status: 'pass', evidence: 'All ATEX equipment certified and inspected', zone: 'Zone H, I' },
];

// ---- KPI Data ----
export const kpiData = {
  plantHealth: 76,
  riskScore: 68,
  activeWorkers: 8,
  sensorsOnline: 11,
  sensorsTotal: 12,
  activePermits: 5,
  criticalAlerts: 2,
  warningAlerts: 4,
  incidentFreeDays: 47,
  complianceScore: 73,
};

// ---- Trend Data (24h) ----
export const trendData24h = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  riskScore: 40 + Math.sin(i * 0.4) * 20 + (i > 16 ? 15 : 0) + Math.random() * 8,
  gasLevel: 3 + Math.sin(i * 0.3 + 1) * 2 + (i > 18 ? 3 : 0) + Math.random() * 1,
  temperature: 1380 + Math.sin(i * 0.5) * 80 + Math.random() * 30,
  workerCount: i >= 6 && i <= 22 ? 6 + Math.floor(Math.random() * 4) : 2,
  incidents: i === 10 ? 1 : i === 16 ? 2 : 0,
}));

// ---- Risk Factors ----
export const riskFactors = [
  { factor: 'Gas Concentration', score: 78, weight: 0.3, trend: 'up', color: '#EF4444' },
  { factor: 'Worker Exposure', score: 72, weight: 0.25, trend: 'up', color: '#F59E0B' },
  { factor: 'Equipment Health', score: 64, weight: 0.2, trend: 'stable', color: '#F59E0B' },
  { factor: 'Permit Risk', score: 85, weight: 0.15, trend: 'up', color: '#EF4444' },
  { factor: 'Environmental', score: 42, weight: 0.1, trend: 'down', color: '#22C55E' },
];

// ---- Report Types ----
export const reportTypes = [
  { id: 'R001', name: 'Daily Safety Report', description: 'Complete daily overview of all safety incidents, sensor data, and worker activity', frequency: 'Daily', lastGenerated: 'Today 06:00', icon: 'shield', color: '#3B82F6' },
  { id: 'R002', name: 'Incident Report', description: 'Detailed analysis of safety incidents, root cause, and corrective actions', frequency: 'On Demand', lastGenerated: 'Yesterday 14:32', icon: 'alert-triangle', color: '#EF4444' },
  { id: 'R003', name: 'Risk Analysis Report', description: 'AI-powered risk scoring, trend analysis, and predictive risk assessment', frequency: 'Weekly', lastGenerated: '3 days ago', icon: 'brain', color: '#8B5CF6' },
  { id: 'R004', name: 'Compliance Report', description: 'Regulatory compliance status, violations, and corrective actions for auditors', frequency: 'Monthly', lastGenerated: '28 days ago', icon: 'check-circle', color: '#22C55E' },
  { id: 'R005', name: 'Worker Safety Report', description: 'Individual worker risk profiles, PPE compliance, and exposure analysis', frequency: 'Weekly', lastGenerated: '5 days ago', icon: 'users', color: '#06B6D4' },
  { id: 'R006', name: 'Equipment Health Report', description: 'Sensor data, equipment performance, maintenance triggers, and downtime analysis', frequency: 'Weekly', lastGenerated: '6 days ago', icon: 'cpu', color: '#F59E0B' },
];
