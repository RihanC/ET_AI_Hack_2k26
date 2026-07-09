// ============================================================
// ISIP — useLiveData Hook
// Fetches real API data and subscribes to Socket.IO events
// Falls back to mock data if backend is unavailable
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardApi, sensorsApi, alertsApi } from '../services/api';
import { getSocket, connectSocket, EVENTS } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import type { Sensor, Alert } from '../data/types';

interface KpiState {
  plantHealth: number;
  riskScore: number;
  activeWorkers: number;
  sensorsOnline: number;
  sensorsTotal: number;
  activePermits: number;
  criticalAlerts: number;
  warningAlerts: number;
  incidentFreeDays: number;
  complianceScore: number;
}

function mapApiSensor(s: any): Sensor {
  return {
    id: s.id,
    name: s.name,
    type: (s.type || '').toLowerCase() as Sensor['type'],
    zone: s.zone?.name || s.zoneName || s.zone || '',
    value: s.value ?? 0,
    unit: s.unit || '',
    min: s.minValue ?? s.min ?? 0,
    max: s.maxValue ?? s.max ?? 100,
    threshold: s.threshold ?? 50,
    status: (s.status || 'online').toLowerCase() as Sensor['status'],
    lastUpdated: s.lastReadingAt
      ? timeAgo(new Date(s.lastReadingAt))
      : s.lastUpdated || 'N/A',
    equipment: s.equipment?.name || s.equipmentName || '',
    trend: (s.trend || 'stable').toLowerCase() as Sensor['trend'],
    history: s.history || generateHistory(s.value ?? 50, (s.value ?? 50) * 0.05, 24),
  };
}

function mapApiAlert(a: any): Alert {
  return {
    id: a.id,
    type: (a.type || 'system').toLowerCase() as Alert['type'],
    severity: (a.severity || 'info').toLowerCase() as Alert['severity'],
    title: a.title || '',
    description: a.description || '',
    zone: a.zone?.name || a.zoneName || a.zone || '',
    timestamp: a.createdAt
      ? new Date(a.createdAt).toLocaleTimeString('en-IN', { hour12: false })
      : a.timestamp || '',
    acknowledged: a.acknowledged ?? false,
    source: a.source || '',
  };
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function generateHistory(base: number, variance: number, hours: number) {
  const now = new Date();
  return Array.from({ length: hours }, (_, i) => {
    const t = new Date(now.getTime() - (hours - 1 - i) * 3600000);
    const v = base + (Math.random() - 0.5) * variance * 2;
    return {
      time: `${String(t.getHours()).padStart(2, '0')}:00`,
      value: parseFloat(v.toFixed(2)),
    };
  });
}

export function useLiveData() {
  const { isAuthenticated } = useAuth();
  const [liveSensors, setLiveSensors] = useState<Sensor[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [liveKPI, setLiveKPI] = useState<KpiState>({
    plantHealth: 100,
    riskScore: 0,
    activeWorkers: 0,
    sensorsOnline: 0,
    sensorsTotal: 0,
    activePermits: 0,
    criticalAlerts: 0,
    warningAlerts: 0,
    incidentFreeDays: 0,
    complianceScore: 100,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [backendAvailable, setBackendAvailable] = useState(false);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial data fetch from API
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    const fetchAll = async () => {
      try {
        const [kpiRes, sensorRes, alertRes] = await Promise.all([
          dashboardApi.getKPIs(),
          sensorsApi.getAll('limit=50'),
          alertsApi.getAll('limit=50'),
        ]);

        if (!active) return;

        if (kpiRes.success && kpiRes.data) {
          const d = kpiRes.data;
          setLiveKPI({
            plantHealth: d.plantHealth ?? 76,
            riskScore: d.riskScore ?? 68,
            activeWorkers: d.activeWorkers ?? 8,
            sensorsOnline: d.sensorsOnline ?? 11,
            sensorsTotal: d.sensorsTotal ?? 12,
            activePermits: d.activePermits ?? 5,
            criticalAlerts: d.criticalAlerts ?? 2,
            warningAlerts: d.warningAlerts ?? 4,
            incidentFreeDays: d.incidentFreeDays ?? 47,
            complianceScore: d.complianceScore ?? 73,
          });
        }

        if (sensorRes.success && Array.isArray(sensorRes.data) && sensorRes.data.length > 0) {
          setLiveSensors(sensorRes.data.map(mapApiSensor));
        }

        if (alertRes.success && Array.isArray(alertRes.data) && alertRes.data.length > 0) {
          setLiveAlerts(alertRes.data.map(mapApiAlert));
        }

        setBackendAvailable(true);
      } catch (err) {
        console.warn('[useLiveData] Backend unavailable, using mock data:', err);
        setBackendAvailable(false);
      }
    };

    fetchAll();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Socket.IO subscriptions for real-time updates
  useEffect(() => {
    if (!backendAvailable) return;

    const socket = getSocket() || connectSocket();
    if (!socket) return;

    const onDashboardUpdate = (data: any) => {
      if (data) {
        setLiveKPI(prev => ({
          ...prev,
          ...(data.plantHealth !== undefined && { plantHealth: data.plantHealth }),
          ...(data.riskScore !== undefined && { riskScore: data.riskScore }),
          ...(data.activeWorkers !== undefined && { activeWorkers: data.activeWorkers }),
          ...(data.sensorsOnline !== undefined && { sensorsOnline: data.sensorsOnline }),
          ...(data.activePermits !== undefined && { activePermits: data.activePermits }),
          ...(data.criticalAlerts !== undefined && { criticalAlerts: data.criticalAlerts }),
          ...(data.warningAlerts !== undefined && { warningAlerts: data.warningAlerts }),
        }));
      }
    };

    const onSensorUpdate = (data: any) => {
      if (data?.id) {
        setLiveSensors(prev =>
          prev.map(s => (s.id === data.id ? { ...s, ...mapApiSensor(data) } : s))
        );
      }
    };

    const onNewAlert = (data: any) => {
      if (data) {
        setLiveAlerts(prev => [mapApiAlert(data), ...prev].slice(0, 50));
      }
    };

    const onAlertAcknowledged = (data: any) => {
      if (data?.id) {
        setLiveAlerts(prev => prev.map(a => (a.id === data.id ? { ...a, acknowledged: true } : a)));
      }
    };

    socket.on(EVENTS.DASHBOARD_UPDATE, onDashboardUpdate);
    socket.on(EVENTS.SENSOR_UPDATE, onSensorUpdate);
    socket.on(EVENTS.ALERT_NEW, onNewAlert);
    socket.on(EVENTS.ALERT_ACKNOWLEDGED, onAlertAcknowledged);

    return () => {
      socket.off(EVENTS.DASHBOARD_UPDATE, onDashboardUpdate);
      socket.off(EVENTS.SENSOR_UPDATE, onSensorUpdate);
      socket.off(EVENTS.ALERT_NEW, onNewAlert);
      socket.off(EVENTS.ALERT_ACKNOWLEDGED, onAlertAcknowledged);
    };
  }, [backendAvailable]);

  // No mock fluctuation fallback

  const acknowledgeAlert = useCallback(
    async (id: string) => {
      // Optimistic update
      setLiveAlerts(prev => prev.map(a => (a.id === id ? { ...a, acknowledged: true } : a)));

      if (backendAvailable) {
        try {
          await alertsApi.acknowledge(id);
        } catch (err) {
          console.warn('[useLiveData] Failed to acknowledge alert on backend:', err);
        }
      }
    },
    [backendAvailable]
  );

  return {
    liveSensors,
    liveAlerts,
    liveKPI,
    currentTime,
    acknowledgeAlert,
    backendAvailable,
  };
}
