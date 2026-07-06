// ============================================================
// ISIP — Dashboard Service
// ============================================================

import prisma from '../../config/database.js';

class DashboardService {
  async getKPIs() {
    const [
      totalWorkers,
      activeWorkers,
      totalSensors,
      onlineSensors,
      activePermits,
      criticalAlerts,
      warningAlerts,
      zones,
    ] = await Promise.all([
      prisma.worker.count(),
      prisma.worker.count({ where: { status: 'ACTIVE' } }),
      prisma.sensor.count(),
      prisma.sensor.count({ where: { status: 'ONLINE' } }),
      prisma.permit.count({ where: { status: 'ACTIVE' } }),
      prisma.alert.count({ where: { severity: 'CRITICAL', acknowledged: false } }),
      prisma.alert.count({ where: { severity: 'WARNING', acknowledged: false } }),
      prisma.zone.findMany({
        select: { id: true, name: true, riskLevel: true },
      }),
    ]);

    // Calculate composite scores
    const sensorHealthRatio = totalSensors > 0 ? onlineSensors / totalSensors : 1;
    const alertPenalty = (criticalAlerts * 5 + warningAlerts * 2);
    const plantHealth = Math.max(0, Math.min(100, Math.round(sensorHealthRatio * 100 - alertPenalty)));
    const riskScore = Math.min(100, criticalAlerts * 15 + warningAlerts * 8);

    return {
      plantHealth,
      riskScore,
      activeWorkers,
      totalWorkers,
      sensorsOnline: onlineSensors,
      sensorsTotal: totalSensors,
      activePermits,
      criticalAlerts,
      warningAlerts,
      zones,
    };
  }

  async getOverview() {
    const [
      totalZones,
      totalEquipment,
      equipmentMaintenance,
      totalPermits,
      pendingPermits,
      activePermits,
      totalAlerts,
      unresolvedAlerts,
      recentTimeline,
    ] = await Promise.all([
      prisma.zone.count({ where: { isActive: true } }),
      prisma.equipment.count(),
      prisma.equipment.count({ where: { status: 'MAINTENANCE' } }),
      prisma.permit.count(),
      prisma.permit.count({ where: { status: 'PENDING' } }),
      prisma.permit.count({ where: { status: 'ACTIVE' } }),
      prisma.alert.count(),
      prisma.alert.count({ where: { resolved: false } }),
      prisma.timelineEvent.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { zone: { select: { id: true, name: true } } },
      }),
    ]);

    return {
      totalZones,
      totalEquipment,
      equipmentMaintenance,
      totalPermits,
      pendingPermits,
      activePermits,
      totalAlerts,
      unresolvedAlerts,
      recentTimeline,
    };
  }

  async getStatistics() {
    // Worker statistics by status
    const workersByStatus = await prisma.worker.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Sensor statistics by status
    const sensorsByStatus = await prisma.sensor.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Sensor statistics by type
    const sensorsByType = await prisma.sensor.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    // Alert statistics by severity
    const alertsBySeverity = await prisma.alert.groupBy({
      by: ['severity'],
      _count: { id: true },
    });

    // Alert statistics by type
    const alertsByType = await prisma.alert.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    // Permit statistics by status
    const permitsByStatus = await prisma.permit.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Permit statistics by type
    const permitsByType = await prisma.permit.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    // Zone risk distribution
    const zonesByRisk = await prisma.zone.groupBy({
      by: ['riskLevel'],
      _count: { id: true },
    });

    // PPE compliance
    const workersByPPE = await prisma.worker.groupBy({
      by: ['ppeStatus'],
      _count: { id: true },
    });

    return {
      workersByStatus: this._formatGroupBy(workersByStatus),
      sensorsByStatus: this._formatGroupBy(sensorsByStatus),
      sensorsByType: this._formatGroupBy(sensorsByType),
      alertsBySeverity: this._formatGroupBy(alertsBySeverity),
      alertsByType: this._formatGroupBy(alertsByType),
      permitsByStatus: this._formatGroupBy(permitsByStatus),
      permitsByType: this._formatGroupBy(permitsByType),
      zonesByRisk: this._formatGroupBy(zonesByRisk),
      workersByPPE: this._formatGroupBy(workersByPPE),
    };
  }

  async getCharts() {
    // Alerts over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAlerts = await prisma.alert.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { severity: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group alerts by date
    const alertsByDay = {};
    recentAlerts.forEach((alert) => {
      const day = alert.createdAt.toISOString().split('T')[0];
      if (!alertsByDay[day]) alertsByDay[day] = { date: day, CRITICAL: 0, WARNING: 0, INFO: 0 };
      alertsByDay[day][alert.severity]++;
    });

    // Sensor readings — current values grouped by type
    const sensorReadings = await prisma.sensor.findMany({
      where: { status: { not: 'OFFLINE' } },
      select: {
        name: true,
        type: true,
        value: true,
        threshold: true,
        unit: true,
        status: true,
        zone: { select: { name: true } },
      },
      orderBy: { type: 'asc' },
    });

    // Zone risk heat map data
    const zoneHeatMap = await prisma.zone.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        riskLevel: true,
        _count: {
          select: { workers: true, sensors: true, alerts: true },
        },
      },
    });

    // Worker risk distribution
    const workerRisk = await prisma.worker.groupBy({
      by: ['riskLevel'],
      _count: { id: true },
    });

    return {
      alertsTrend: Object.values(alertsByDay),
      sensorReadings,
      zoneHeatMap,
      workerRisk: this._formatGroupBy(workerRisk),
    };
  }

  /**
   * Transform Prisma groupBy results into { label: count } format.
   */
  _formatGroupBy(results) {
    const formatted = {};
    results.forEach((item) => {
      const key = Object.keys(item).find((k) => k !== '_count');
      formatted[item[key]] = item._count.id;
    });
    return formatted;
  }
}

export default new DashboardService();
