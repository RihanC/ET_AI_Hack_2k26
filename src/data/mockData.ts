export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type SensorStatus = 'online' | 'offline' | 'warning' | 'critical'
export type PermitStatus = 'active' | 'expired' | 'pending'

export interface PlantZone {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  risk: RiskLevel
  workers: number
  sensors: number
  type: 'boiler' | 'tank' | 'pipeline' | 'processing' | 'storage' | 'exit'
}

export interface Sensor {
  id: string
  name: string
  type: 'temperature' | 'gas' | 'pressure' | 'vibration' | 'flow'
  zone: string
  zoneId: string
  value: number
  unit: string
  status: SensorStatus
  threshold: number
  equipment: string
  history: { time: string; value: number }[]
}

export interface Worker {
  id: string
  name: string
  role: string
  zone: string
  zoneId: string
  task: string
  ppeStatus: 'compliant' | 'partial' | 'non-compliant'
  permitId?: string
  nearbyHazard: string
  risk: RiskLevel
  lastSeen: string
}

export interface Permit {
  id: string
  title: string
  type: string
  status: PermitStatus
  zone: string
  zoneId: string
  workers: string[]
  equipment: string[]
  startTime: string
  endTime: string
  risk: RiskLevel
  compliance: number
  aiRecommendation: string
}

export interface Alert {
  id: string
  title: string
  severity: RiskLevel
  zone: string
  zoneId: string
  time: string
  description: string
}

export interface TimelineEvent {
  id: string
  type: 'sensor' | 'worker' | 'permit' | 'equipment' | 'ai'
  title: string
  description: string
  time: string
  severity: RiskLevel
  targetPage: string
  targetId?: string
}

export interface Violation {
  id: string
  rule: string
  evidence: string
  severity: RiskLevel
  recommendation: string
  zone: string
}

export const PLANT_NAME = 'Tata Steel — Jamshedpur Unit 4'

export const plantZones: PlantZone[] = [
  { id: 'z1', name: 'Blast Furnace A', x: 40, y: 30, width: 180, height: 120, risk: 'critical', workers: 4, sensors: 12, type: 'boiler' },
  { id: 'z2', name: 'Coke Oven Battery', x: 260, y: 30, width: 160, height: 100, risk: 'high', workers: 6, sensors: 8, type: 'processing' },
  { id: 'z3', name: 'Gas Holder Tank', x: 460, y: 40, width: 100, height: 100, risk: 'critical', workers: 2, sensors: 6, type: 'tank' },
  { id: 'z4', name: 'Sinter Plant', x: 40, y: 180, width: 200, height: 140, risk: 'medium', workers: 8, sensors: 15, type: 'processing' },
  { id: 'z5', name: 'Pipeline Corridor', x: 280, y: 160, width: 280, height: 40, risk: 'high', workers: 1, sensors: 10, type: 'pipeline' },
  { id: 'z6', name: 'Raw Material Storage', x: 40, y: 350, width: 180, height: 100, risk: 'low', workers: 3, sensors: 5, type: 'storage' },
  { id: 'z7', name: 'BOF Converter', x: 280, y: 230, width: 140, height: 120, risk: 'high', workers: 5, sensors: 11, type: 'boiler' },
  { id: 'z8', name: 'Emergency Exit North', x: 600, y: 30, width: 60, height: 60, risk: 'low', workers: 0, sensors: 2, type: 'exit' },
]

export const sensors: Sensor[] = [
  { id: 's1', name: 'BF-A Temp Sensor T-401', type: 'temperature', zone: 'Blast Furnace A', zoneId: 'z1', value: 847, unit: '°C', status: 'critical', threshold: 800, equipment: 'Blast Furnace A', history: genHistory(847, 40) },
  { id: 's2', name: 'BF-A Gas Detector G-102', type: 'gas', zone: 'Blast Furnace A', zoneId: 'z1', value: 342, unit: 'ppm', status: 'critical', threshold: 200, equipment: 'Blast Furnace A', history: genHistory(342, 60) },
  { id: 's3', name: 'CO Battery Pressure P-201', type: 'pressure', zone: 'Coke Oven Battery', zoneId: 'z2', value: 4.2, unit: 'bar', status: 'warning', threshold: 5.0, equipment: 'Coke Oven #3', history: genHistory(4.2, 0.5) },
  { id: 's4', name: 'Gas Holder Level L-301', type: 'flow', zone: 'Gas Holder Tank', zoneId: 'z3', value: 89, unit: '%', status: 'critical', threshold: 85, equipment: 'Gas Holder #2', history: genHistory(89, 5) },
  { id: 's5', name: 'Pipeline Flow F-501', type: 'flow', zone: 'Pipeline Corridor', zoneId: 'z5', value: 1240, unit: 'm³/h', status: 'online', threshold: 1500, equipment: 'Main Gas Pipeline', history: genHistory(1240, 100) },
  { id: 's6', name: 'Sinter Vibration V-601', type: 'vibration', zone: 'Sinter Plant', zoneId: 'z4', value: 2.1, unit: 'mm/s', status: 'online', threshold: 4.0, equipment: 'Sinter Machine', history: genHistory(2.1, 0.3) },
  { id: 's7', name: 'BOF Temp T-701', type: 'temperature', zone: 'BOF Converter', zoneId: 'z7', value: 1620, unit: '°C', status: 'warning', threshold: 1700, equipment: 'BOF Converter #1', history: genHistory(1620, 50) },
  { id: 's8', name: 'Storage Humidity H-801', type: 'gas', zone: 'Raw Material Storage', zoneId: 'z6', value: 45, unit: '%RH', status: 'online', threshold: 70, equipment: 'Storage Facility', history: genHistory(45, 5) },
  { id: 's9', name: 'BF-A Pressure P-103', type: 'pressure', zone: 'Blast Furnace A', zoneId: 'z1', value: 2.8, unit: 'bar', status: 'warning', threshold: 3.0, equipment: 'Blast Furnace A', history: genHistory(2.8, 0.2) },
  { id: 's10', name: 'Pipeline Gas G-502', type: 'gas', zone: 'Pipeline Corridor', zoneId: 'z5', value: 178, unit: 'ppm', status: 'warning', threshold: 150, equipment: 'Main Gas Pipeline', history: genHistory(178, 20) },
  { id: 's11', name: 'CO Battery Temp T-202', type: 'temperature', zone: 'Coke Oven Battery', zoneId: 'z2', value: 1120, unit: '°C', status: 'online', threshold: 1200, equipment: 'Coke Oven #3', history: genHistory(1120, 30) },
  { id: 's12', name: 'Gas Holder Pressure P-302', type: 'pressure', zone: 'Gas Holder Tank', zoneId: 'z3', value: 1.1, unit: 'bar', status: 'offline', threshold: 2.0, equipment: 'Gas Holder #2', history: genHistory(1.1, 0.1) },
]

export const workers: Worker[] = [
  { id: 'w1', name: 'Rajesh Kumar', role: 'Furnace Operator', zone: 'Blast Furnace A', zoneId: 'z1', task: 'Temperature monitoring', ppeStatus: 'compliant', permitId: 'ptw-001', nearbyHazard: 'Elevated gas levels', risk: 'critical', lastSeen: '2 min ago' },
  { id: 'w2', name: 'Suresh Patel', role: 'Maintenance Tech', zone: 'Blast Furnace A', zoneId: 'z1', task: 'Valve inspection', ppeStatus: 'partial', permitId: 'ptw-001', nearbyHazard: 'High temperature zone', risk: 'critical', lastSeen: '1 min ago' },
  { id: 'w3', name: 'Amit Singh', role: 'Control Room Op.', zone: 'Coke Oven Battery', zoneId: 'z2', task: 'Process oversight', ppeStatus: 'compliant', nearbyHazard: 'Pressure fluctuation', risk: 'high', lastSeen: '30 sec ago' },
  { id: 'w4', name: 'Vikram Reddy', role: 'Safety Officer', zone: 'Gas Holder Tank', zoneId: 'z3', task: 'Emergency assessment', ppeStatus: 'compliant', permitId: 'ptw-003', nearbyHazard: 'Gas leak potential', risk: 'critical', lastSeen: '45 sec ago' },
  { id: 'w5', name: 'Deepak Sharma', role: 'Pipeline Tech', zone: 'Pipeline Corridor', zoneId: 'z5', task: 'Leak detection patrol', ppeStatus: 'compliant', nearbyHazard: 'Gas concentration rising', risk: 'high', lastSeen: '3 min ago' },
  { id: 'w6', name: 'Ravi Iyer', role: 'Sinter Operator', zone: 'Sinter Plant', zoneId: 'z4', task: 'Feed rate adjustment', ppeStatus: 'compliant', nearbyHazard: 'None', risk: 'low', lastSeen: '1 min ago' },
  { id: 'w7', name: 'Kiran Nair', role: 'BOF Operator', zone: 'BOF Converter', zoneId: 'z7', task: 'Charge preparation', ppeStatus: 'compliant', permitId: 'ptw-002', nearbyHazard: 'Molten metal proximity', risk: 'high', lastSeen: '2 min ago' },
  { id: 'w8', name: 'Mohit Gupta', role: 'Warehouse Staff', zone: 'Raw Material Storage', zoneId: 'z6', task: 'Inventory check', ppeStatus: 'compliant', nearbyHazard: 'None', risk: 'low', lastSeen: '5 min ago' },
]

export const permits: Permit[] = [
  { id: 'ptw-001', title: 'Hot Work — Blast Furnace Valve Repair', type: 'Hot Work', status: 'active', zone: 'Blast Furnace A', zoneId: 'z1', workers: ['Rajesh Kumar', 'Suresh Patel'], equipment: ['Blast Furnace A', 'Valve Assembly V-12'], startTime: '06:00', endTime: '14:00', risk: 'critical', compliance: 72, aiRecommendation: 'Evacuate non-essential personnel. Increase ventilation to 80%. Post additional fire watch.' },
  { id: 'ptw-002', title: 'Confined Space — BOF Converter Inspection', type: 'Confined Space', status: 'active', zone: 'BOF Converter', zoneId: 'z7', workers: ['Kiran Nair'], equipment: ['BOF Converter #1'], startTime: '08:00', endTime: '12:00', risk: 'high', compliance: 85, aiRecommendation: 'Continuous gas monitoring required. Standby rescue team on alert.' },
  { id: 'ptw-003', title: 'Gas System — Holder Pressure Relief', type: 'Gas System', status: 'active', zone: 'Gas Holder Tank', zoneId: 'z3', workers: ['Vikram Reddy'], equipment: ['Gas Holder #2', 'PRV-302'], startTime: '09:30', endTime: '11:30', risk: 'critical', compliance: 68, aiRecommendation: 'Immediate pressure relief recommended. Establish 50m exclusion zone.' },
  { id: 'ptw-004', title: 'Electrical — Sinter Plant Panel Upgrade', type: 'Electrical', status: 'pending', zone: 'Sinter Plant', zoneId: 'z4', workers: [], equipment: ['Control Panel SP-04'], startTime: '14:00', endTime: '18:00', risk: 'medium', compliance: 0, aiRecommendation: 'Awaiting LOTO verification. Schedule during low-production window.' },
  { id: 'ptw-005', title: 'Height Work — Pipeline Inspection', type: 'Height Work', status: 'expired', zone: 'Pipeline Corridor', zoneId: 'z5', workers: ['Deepak Sharma'], equipment: ['Main Gas Pipeline'], startTime: '04:00', endTime: '08:00', risk: 'high', compliance: 45, aiRecommendation: 'Permit expired. Workers must evacuate zone immediately.' },
]

export const alerts: Alert[] = [
  { id: 'a1', title: 'Critical Gas Level — Blast Furnace A', severity: 'critical', zone: 'Blast Furnace A', zoneId: 'z1', time: '11:42', description: 'CO concentration exceeded 300ppm threshold' },
  { id: 'a2', title: 'Gas Holder Overfill Risk', severity: 'critical', zone: 'Gas Holder Tank', zoneId: 'z3', time: '11:38', description: 'Tank level at 89%, approaching critical capacity' },
  { id: 'a3', title: 'Pipeline Gas Detection Warning', severity: 'high', zone: 'Pipeline Corridor', zoneId: 'z5', time: '11:35', description: 'Methane levels at 178ppm near junction B-4' },
  { id: 'a4', title: 'Expired Permit — Pipeline Zone', severity: 'high', zone: 'Pipeline Corridor', zoneId: 'z5', time: '11:30', description: 'PTW-005 expired, worker still in zone' },
  { id: 'a5', title: 'PPE Non-Compliance Detected', severity: 'medium', zone: 'Blast Furnace A', zoneId: 'z1', time: '11:28', description: 'Suresh Patel missing heat-resistant gloves' },
]

export const timelineEvents: TimelineEvent[] = [
  { id: 'e1', type: 'sensor', title: 'Gas level critical — BF-A', description: 'G-102 detected 342ppm CO', time: '11:42', severity: 'critical', targetPage: '/sensors', targetId: 's2' },
  { id: 'e2', type: 'ai', title: 'AI Risk Escalation', description: 'Compound risk detected: Gas + Workers + Hot Work Permit', time: '11:41', severity: 'critical', targetPage: '/risk', targetId: 'z1' },
  { id: 'e3', type: 'worker', title: 'Worker entered critical zone', description: 'Suresh Patel entered Blast Furnace A', time: '11:38', severity: 'high', targetPage: '/workers', targetId: 'w2' },
  { id: 'e4', type: 'sensor', title: 'Gas Holder level warning', description: 'L-301 reading 89% capacity', time: '11:38', severity: 'critical', targetPage: '/sensors', targetId: 's4' },
  { id: 'e5', type: 'permit', title: 'Permit PTW-005 expired', description: 'Height Work permit in Pipeline Corridor', time: '11:30', severity: 'high', targetPage: '/permits', targetId: 'ptw-005' },
  { id: 'e6', type: 'equipment', title: 'PRV-302 malfunction detected', description: 'Pressure relief valve not responding', time: '11:25', severity: 'critical', targetPage: '/map', targetId: 'z3' },
  { id: 'e7', type: 'sensor', title: 'Pipeline gas rising', description: 'G-502 at 178ppm and climbing', time: '11:20', severity: 'high', targetPage: '/sensors', targetId: 's10' },
  { id: 'e8', type: 'ai', title: 'Predictive alert generated', description: 'Explosion probability increased to 34%', time: '11:15', severity: 'high', targetPage: '/risk', targetId: 'z1' },
  { id: 'e9', type: 'worker', title: 'PPE violation flagged', description: 'Suresh Patel — missing gloves', time: '11:10', severity: 'medium', targetPage: '/workers', targetId: 'w2' },
  { id: 'e10', type: 'permit', title: 'PTW-001 approved', description: 'Hot Work permit for Blast Furnace A', time: '05:45', severity: 'low', targetPage: '/permits', targetId: 'ptw-001' },
]

export const violations: Violation[] = [
  { id: 'v1', rule: 'OSHA 1910.146 — Confined Space Entry', evidence: 'Worker in Blast Furnace A without continuous atmospheric monitoring log', severity: 'critical', recommendation: 'Deploy continuous gas monitor and log readings every 15 minutes', zone: 'Blast Furnace A' },
  { id: 'v2', rule: 'IS 14489 — Hot Work Safety', evidence: 'Fire watch not posted at designated station during active hot work', severity: 'high', recommendation: 'Assign dedicated fire watch with extinguisher at Zone A entry', zone: 'Blast Furnace A' },
  { id: 'v3', rule: 'Factory Act Sec. 40B — Pressure Vessel', evidence: 'Gas Holder #2 exceeding 85% design capacity without relief action', severity: 'critical', recommendation: 'Activate PRV-302 or initiate controlled venting procedure', zone: 'Gas Holder Tank' },
  { id: 'v4', rule: 'PTW Policy — Permit Validity', evidence: 'PTW-005 expired at 08:00, worker Deepak Sharma still in zone', severity: 'high', recommendation: 'Immediate evacuation and permit renewal or closure', zone: 'Pipeline Corridor' },
  { id: 'v5', rule: 'PPE Standard — Heat Protection', evidence: 'Suresh Patel detected without heat-resistant gloves in hot zone', severity: 'medium', recommendation: 'Issue corrective PPE and brief worker before re-entry', zone: 'Blast Furnace A' },
]

function genHistory(base: number, variance: number) {
  const points = []
  for (let i = 23; i >= 0; i--) {
    const h = String(23 - i).padStart(2, '0')
    points.push({ time: `${h}:00`, value: Math.round((base + (Math.random() - 0.3) * variance) * 10) / 10 })
  }
  return points
}

export const riskFactors = [
  { factor: 'Gas ↑', value: '342 ppm CO', impact: 'high', icon: 'gas' },
  { factor: 'Workers Present', value: '4 personnel', impact: 'high', icon: 'workers' },
  { factor: 'Permit Active', value: 'PTW-001 Hot Work', impact: 'critical', icon: 'permit' },
  { factor: 'Ventilation Low', value: '42% capacity', impact: 'high', icon: 'ventilation' },
]

export const riskPredictions = {
  explosionProbability: 34,
  timeBeforeCritical: '18 min',
  confidence: 87,
  score: 78,
}

export const complianceData = {
  score: 76,
  status: 'At Risk' as const,
  nextAudit: '2026-07-15',
  checklist: [
    { item: 'Fire suppression systems operational', done: true },
    { item: 'Emergency exits unobstructed', done: true },
    { item: 'Gas detection systems calibrated', done: false },
    { item: 'PPE inventory adequate', done: true },
    { item: 'Permit-to-work system compliant', done: false },
    { item: 'Pressure vessel inspections current', done: false },
    { item: 'Worker safety training up to date', done: true },
    { item: 'Environmental monitoring active', done: true },
  ],
}

export const trendData = [
  { time: '06:00', risk: 22, incidents: 0, sensors: 98 },
  { time: '07:00', risk: 28, incidents: 0, sensors: 97 },
  { time: '08:00', risk: 35, incidents: 1, sensors: 96 },
  { time: '09:00', risk: 42, incidents: 1, sensors: 95 },
  { time: '10:00', risk: 55, incidents: 2, sensors: 94 },
  { time: '11:00', risk: 68, incidents: 3, sensors: 92 },
  { time: 'Now', risk: 78, incidents: 5, sensors: 91 },
]

export const dailySummary = `Plant safety status is ELEVATED. Two critical zones require immediate attention: Blast Furnace A (compound risk from elevated gas levels, active hot work permit, and 4 workers on-site) and Gas Holder Tank (approaching overfill at 89%). AI models predict 34% explosion probability in Blast Furnace A within 18 minutes if conditions persist. Recommend immediate ventilation increase, worker evacuation from non-essential roles, and pressure relief on Gas Holder #2.`
