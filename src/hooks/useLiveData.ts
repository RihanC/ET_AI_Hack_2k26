import { useState, useEffect, useCallback } from 'react';
import { sensors, workers, alerts, kpiData } from '../data/mockData';

// Simulates real-time updates to sensor values
export function useLiveData() {
  const [liveSensors, setLiveSensors] = useState(sensors);
  const [liveAlerts, setLiveAlerts] = useState(alerts);
  const [liveKPI, setLiveKPI] = useState(kpiData);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Tick every second for time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tick every 3s for sensor values
  useEffect(() => {
    const sensorTimer = setInterval(() => {
      setLiveSensors(prev => prev.map(sensor => {
        const noise = (Math.random() - 0.5) * 0.06 * sensor.value;
        const newValue = parseFloat(Math.max(sensor.min, Math.min(sensor.max * 1.1, sensor.value + noise)).toFixed(2));
        const ratio = newValue / sensor.threshold;
        let status: typeof sensor.status = 'online';
        if (ratio >= 1.0) status = 'critical';
        else if (ratio >= 0.8) status = 'warning';
        else if (sensor.status === 'offline') status = 'offline';
        return { ...sensor, value: newValue, status, lastUpdated: 'just now' };
      }));

      // Slightly vary KPI
      setLiveKPI(prev => ({
        ...prev,
        plantHealth: Math.max(60, Math.min(95, prev.plantHealth + (Math.random() - 0.5) * 1.5)),
        riskScore: Math.max(50, Math.min(90, prev.riskScore + (Math.random() - 0.5) * 2)),
      }));
    }, 3000);

    return () => clearInterval(sensorTimer);
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setLiveAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  return {
    liveSensors,
    liveAlerts,
    liveKPI,
    currentTime,
    workers,
    acknowledgeAlert,
  };
}
