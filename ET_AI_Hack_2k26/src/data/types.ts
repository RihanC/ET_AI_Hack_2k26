// ============================================================
// ISIP — Data Type Definitions
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
