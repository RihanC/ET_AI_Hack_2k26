// ============================================================
// ISIP — Database Seed Script (Lightweight Mock Data)
// Populates PostgreSQL with a fast, light dataset of 12 sensors.
// ============================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding (Lightweight)...');

  // 1. Clean existing data
  console.log('Cleaning existing database tables...');
  await prisma.workerMovement.deleteMany();
  await prisma.permitEquipment.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.permit.deleteMany();
  await prisma.sensor.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create 4 Users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('test@123', 12);
  
  const userSpecs = [
    { email: 'admin@isip.com', username: 'test', role: 'ADMIN', firstName: 'Priya', lastName: 'Singh' },
    { email: 'safety@isip.com', username: 'safety_officer', role: 'SAFETY_OFFICER', firstName: 'Ravi', lastName: 'Patel' },
    { email: 'operator1@isip.com', username: 'operator_arjun', role: 'OPERATOR', firstName: 'Arjun', lastName: 'Sharma' },
    { email: 'tech1@isip.com', username: 'tech_deepak', role: 'TECHNICIAN', firstName: 'Deepak', lastName: 'Verma' },
  ];

  const createdUsers = [];
  for (const userConfig of userSpecs) {
    const user = await prisma.user.create({
      data: {
        email: userConfig.email,
        username: userConfig.username,
        password: hashedPassword,
        firstName: userConfig.firstName,
        lastName: userConfig.lastName,
        role: userConfig.role,
        isActive: true,
      }
    });
    createdUsers.push(user);
  }
  const adminUser = createdUsers[0];
  const safetyOfficer = createdUsers[1];

  // 3. Create 3 Zones (matching plant map zones)
  console.log('Creating 3 zones...');
  const zoneNames = [
    { name: 'Zone A - Blast Furnace', code: 'ZONE-A', riskLevel: 'WARNING', lat: 12.9716, lng: 77.5946 },
    { name: 'Zone B - Converter Bay', code: 'ZONE-B', riskLevel: 'SAFE', lat: 12.9717, lng: 77.5947 },
    { name: 'Zone F - Tank Farm Area', code: 'ZONE-F', riskLevel: 'CRITICAL', lat: 12.9721, lng: 77.5951 },
  ];

  const createdZones = [];
  for (const z of zoneNames) {
    const zone = await prisma.zone.create({
      data: {
        name: z.name,
        code: z.code,
        riskLevel: z.riskLevel,
        latitude: z.lat,
        longitude: z.lng,
        isActive: true,
      }
    });
    createdZones.push(zone);
  }

  // 4. Create 4 Equipment Items
  console.log('Creating equipment...');
  const equipmentSpecs = [
    { name: 'Blast Furnace Unit 1', code: 'BF-1', type: 'FURNACE', status: 'OPERATIONAL', zoneIdx: 0 },
    { name: 'Converter Unit 1', code: 'CV-1', type: 'CONVERTER', status: 'OPERATIONAL', zoneIdx: 1 },
    { name: 'Compressor C3', code: 'C3', type: 'COMPRESSOR', status: 'OPERATIONAL', zoneIdx: 1 },
    { name: 'Tank T-14', code: 'T-14', type: 'TANK', status: 'OPERATIONAL', zoneIdx: 2 },
  ];

  const createdEquipment = [];
  for (const eq of equipmentSpecs) {
    const equipment = await prisma.equipment.create({
      data: {
        name: eq.name,
        code: eq.code,
        type: eq.type,
        status: eq.status,
        zoneId: createdZones[eq.zoneIdx].id
      }
    });
    createdEquipment.push(equipment);
  }

  // 5. Create EXACTLY 12 Sensors (4 per zone)
  console.log('Creating exactly 12 sensors...');
  const sensorSpecs = [
    // Zone A: Blast Furnace
    { id: 'SEN-1001', name: 'Temperature Sensor 1 — Zone A', type: 'TEMPERATURE', value: 1450, unit: '°C', min: 0, max: 2000, threshold: 1200, status: 'WARNING', trend: 'UP', zoneIdx: 0, eqIdx: 0 },
    { id: 'SEN-1002', name: 'Gas Sensor 2 (H₂S) — Zone A', type: 'GAS', value: 8.4, unit: 'ppm', min: 0, max: 100, threshold: 25, status: 'ONLINE', trend: 'STABLE', zoneIdx: 0, eqIdx: 0 },
    { id: 'SEN-1003', name: 'Vibration Sensor 3 — Zone A', type: 'VIBRATION', value: 4.2, unit: 'mm/s', min: 0, max: 20, threshold: 12, status: 'ONLINE', trend: 'STABLE', zoneIdx: 0, eqIdx: 0 },
    { id: 'SEN-1004', name: 'Pressure Sensor 4 — Zone A', type: 'PRESSURE', value: 24.5, unit: 'bar', min: 0, max: 50, threshold: 35, status: 'ONLINE', trend: 'STABLE', zoneIdx: 0, eqIdx: 0 },
    // Zone B: Converter Bay
    { id: 'SEN-1005', name: 'Temperature Sensor 5 — Zone B', type: 'TEMPERATURE', value: 1100, unit: '°C', min: 0, max: 2000, threshold: 1200, status: 'ONLINE', trend: 'STABLE', zoneIdx: 1, eqIdx: 1 },
    { id: 'SEN-1006', name: 'Gas Sensor 6 (CO) — Zone B', type: 'GAS', value: 12.1, unit: 'ppm', min: 0, max: 100, threshold: 25, status: 'ONLINE', trend: 'STABLE', zoneIdx: 1, eqIdx: 1 },
    { id: 'SEN-1007', name: 'Vibration Sensor 7 — Zone B', type: 'VIBRATION', value: 7.8, unit: 'mm/s', min: 0, max: 20, threshold: 12, status: 'WARNING', trend: 'UP', zoneIdx: 1, eqIdx: 2 },
    { id: 'SEN-1008', name: 'Pressure Sensor 8 — Zone B', type: 'PRESSURE', value: 18.2, unit: 'bar', min: 0, max: 50, threshold: 35, status: 'ONLINE', trend: 'STABLE', zoneIdx: 1, eqIdx: 1 },
    // Zone F: Tank Farm
    { id: 'SEN-1009', name: 'Oxygen Sensor 9 (O₂) — Zone F', type: 'GAS', value: 18.2, unit: '%', min: 0, max: 25, threshold: 19.5, status: 'CRITICAL', trend: 'DOWN', zoneIdx: 2, eqIdx: 3 },
    { id: 'SEN-1010', name: 'Gas Sensor 10 (Flammable) — Zone F', type: 'GAS', value: 1.5, unit: 'ppm', min: 0, max: 100, threshold: 25, status: 'ONLINE', trend: 'STABLE', zoneIdx: 2, eqIdx: 3 },
    { id: 'SEN-1011', name: 'Vibration Sensor 11 — Zone F', type: 'VIBRATION', value: 1.8, unit: 'mm/s', min: 0, max: 20, threshold: 12, status: 'ONLINE', trend: 'STABLE', zoneIdx: 2, eqIdx: 3 },
    { id: 'SEN-1012', name: 'Pressure Sensor 12 — Zone F', type: 'PRESSURE', value: 3.4, unit: 'bar', min: 0, max: 50, threshold: 35, status: 'ONLINE', trend: 'STABLE', zoneIdx: 2, eqIdx: 3 },
  ];

  for (const s of sensorSpecs) {
    await prisma.sensor.create({
      data: {
        id: s.id,
        name: s.name,
        type: s.type,
        value: s.value,
        unit: s.unit,
        min: s.min,
        max: s.max,
        threshold: s.threshold,
        status: s.status,
        trend: s.trend,
        zoneId: createdZones[s.zoneIdx].id,
        equipmentId: createdEquipment[s.eqIdx].id,
        lastReading: new Date(),
      }
    });
  }

  // 6. Create 5 Permits
  console.log('Creating 5 permits...');
  const permitSpecs = [
    { id: 'PTW-2026-1001', type: 'HOT_WORK', title: 'Welding & Cutting in Blast Furnace #1', status: 'ACTIVE', riskLevel: 'MEDIUM', compliance: 85, zoneIdx: 0 },
    { id: 'PTW-2026-1002', type: 'CONFINED_SPACE', title: 'Internal Tank Inspection Tank T-14', status: 'ACTIVE', riskLevel: 'CRITICAL', compliance: 62, zoneIdx: 2 },
    { id: 'PTW-2026-1003', type: 'ELECTRICAL', title: 'Substation Transformer Lockout', status: 'PENDING', riskLevel: 'HIGH', compliance: 90, zoneIdx: 0 },
    { id: 'PTW-2026-1004', type: 'WORKING_AT_HEIGHT', title: 'Exhaust Duct Gasket Replacement', status: 'EXPIRED', riskLevel: 'HIGH', compliance: 75, zoneIdx: 1 },
    { id: 'PTW-2026-1005', type: 'CHEMICAL', title: 'Acid Transloading operations', status: 'SUSPENDED', riskLevel: 'MEDIUM', compliance: 80, zoneIdx: 2 },
  ];

  const createdPermits = [];
  for (const p of permitSpecs) {
    const permit = await prisma.permit.create({
      data: {
        id: p.id,
        type: p.type,
        title: p.title,
        status: p.status,
        riskLevel: p.riskLevel,
        compliance: p.compliance,
        startTime: new Date(Date.now() - 3600000 * 24),
        endTime: new Date(Date.now() + 3600000 * 12),
        issuerId: adminUser.id,
        zoneId: createdZones[p.zoneIdx].id,
        aiRecommendation: `Enforce specialized PPE checks and double-verify ventilation protocols.`
      }
    });
    createdPermits.push(permit);
  }

  // Create PermitEquipment links
  await prisma.permitEquipment.create({
    data: { permitId: createdPermits[0].id, equipmentId: createdEquipment[0].id }
  });
  await prisma.permitEquipment.create({
    data: { permitId: createdPermits[1].id, equipmentId: createdEquipment[3].id }
  });

  // 7. Create 5 Workers
  console.log('Creating 5 workers...');
  const workerSpecs = [
    { id: 'W011', name: 'Arjun Sharma', role: 'Furnace Operator', badge: 'B-2001', shift: 'Morning', status: 'ACTIVE', ppeStatus: 'COMPLIANT', riskLevel: 'medium', heartRate: 94, gasExposure: 7.2, zoneIdx: 0, permitIdx: 0 },
    { id: 'W012', name: 'Ravi Patel', role: 'Safety Inspector', badge: 'B-2002', shift: 'Morning', status: 'ACTIVE', ppeStatus: 'COMPLIANT', riskLevel: 'low', heartRate: 72, gasExposure: 0.1, zoneIdx: 1, permitIdx: null },
    { id: 'W013', name: 'Deepak Verma', role: 'Maintenance Technician', badge: 'B-2003', shift: 'Morning', status: 'ACTIVE', ppeStatus: 'PARTIAL', riskLevel: 'high', heartRate: 85, gasExposure: 1.2, zoneIdx: 1, permitIdx: null },
    { id: 'W014', name: 'Suresh Kumar', role: 'Process Operator', badge: 'B-2004', shift: 'Morning', status: 'ACTIVE', ppeStatus: 'NON_COMPLIANT', riskLevel: 'critical', heartRate: 105, gasExposure: 14.5, zoneIdx: 2, permitIdx: 1 },
    { id: 'W015', name: 'Amit Joshi', role: 'Electrical Technician', badge: 'B-2005', shift: 'Afternoon', status: 'OFF_SHIFT', ppeStatus: 'COMPLIANT', riskLevel: 'low', heartRate: 70, gasExposure: 0.0, zoneIdx: 0, permitIdx: null },
  ];

  for (const w of workerSpecs) {
    await prisma.worker.create({
      data: {
        id: w.id,
        name: w.name,
        role: w.role,
        badge: w.badge,
        shift: w.shift,
        status: w.status,
        ppeStatus: w.ppeStatus,
        riskLevel: w.riskLevel.toUpperCase(),
        heartRate: w.heartRate,
        gasExposure: w.gasExposure,
        task: `Operations task assign for badge ${w.badge}`,
        zoneId: createdZones[w.zoneIdx].id,
        permitId: w.permitIdx !== null ? createdPermits[w.permitIdx].id : null,
        lastSeen: new Date()
      }
    });
  }

  // 8. Create 5 Alerts
  console.log('Creating 5 alerts...');
  const alertSpecs = [
    { id: 'ALT-1001', type: 'GAS', severity: 'CRITICAL', title: 'Low O₂ Concentration', description: 'Oxygen levels at 18.2% in Confined Space Zone F', source: 'SEN-1009', zoneIdx: 2, ack: false, res: false },
    { id: 'ALT-1002', type: 'TEMPERATURE', severity: 'WARNING', title: 'High Furnace Temp', description: 'Blast furnace temp at 1450°C exceeding standard limits', source: 'SEN-1001', zoneIdx: 0, ack: true, res: false },
    { id: 'ALT-1003', type: 'EQUIPMENT', severity: 'WARNING', title: 'Compressor C3 Vibration', description: 'Vibration level at 7.8 mm/s in Zone B', source: 'SEN-1007', zoneIdx: 1, ack: false, res: false },
    { id: 'ALT-1004', type: 'WORKER', severity: 'CRITICAL', title: 'PPE Violation', description: 'Worker Suresh Kumar (W014) is inside confined space without SCBA', source: 'W014', zoneIdx: 2, ack: false, res: false },
    { id: 'ALT-1005', type: 'SYSTEM', severity: 'INFO', title: 'Gas Network Connected', description: 'Calibration check successfully finalized on sensor arrays', source: 'SYSTEM', zoneIdx: 1, ack: true, res: true },
  ];

  for (const a of alertSpecs) {
    await prisma.alert.create({
      data: {
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        description: a.description,
        acknowledged: a.ack,
        resolved: a.res,
        source: a.source,
        zoneId: createdZones[a.zoneIdx].id,
        userId: a.ack ? adminUser.id : null,
        resolvedById: a.res ? safetyOfficer.id : null,
        resolvedAt: a.res ? new Date() : null,
        createdAt: new Date(Date.now() - 3600000)
      }
    });
  }

  // 9. Create 10 Timeline Events
  console.log('Creating 10 timeline events...');
  const timelineSpecs = [
    { category: 'SYSTEM', title: 'ISIP System Online', description: 'Safety telemetry network initialized', severity: 'INFO', zoneIdx: 1 },
    { category: 'PERMIT', title: 'PTW-2026-1001 Approved', description: 'Hot-work permit activated for Blast Furnace Area', severity: 'INFO', zoneIdx: 0 },
    { category: 'WORKER', title: 'Worker Entered Zone F', description: 'Suresh Kumar badge B-2004 entered Zone F', severity: 'INFO', zoneIdx: 2 },
    { category: 'SENSOR', title: 'Oxygen Level Drop Alarm', description: 'O₂ sensor SEN-1009 dropped to 18.2% in Zone F', severity: 'CRITICAL', zoneIdx: 2 },
    { category: 'AI', title: 'Compound Hazard Flags', description: 'AI identified PPE violation + Low O₂ + Confined Space active in Zone F', severity: 'CRITICAL', zoneIdx: 2 },
    { category: 'SENSOR', title: 'Blast Furnace Temp Elevated', description: 'Blast furnace temp warning (1450°C) on SEN-1001', severity: 'WARNING', zoneIdx: 0 },
    { category: 'EQUIPMENT', title: 'Compressor C3 Vibration warning', description: 'Vibrational metrics elevated on SEN-1007', severity: 'WARNING', zoneIdx: 1 },
    { category: 'PERMIT', title: 'PTW-2026-1005 Suspended', description: 'Chemical permit suspended due to safety alerts', severity: 'WARNING', zoneIdx: 2 },
    { category: 'WORKER', title: 'Worker Assigned', description: 'Arjun Sharma assigned to shift duties in Zone A', severity: 'INFO', zoneIdx: 0 },
    { category: 'SYSTEM', title: 'Automatic Ventilation Boost', description: 'System increased ventilation rate by 40% in Zone F', severity: 'INFO', zoneIdx: 2 },
  ];

  for (let i = 0; i < timelineSpecs.length; i++) {
    const t = timelineSpecs[i];
    await prisma.timelineEvent.create({
      data: {
        id: `TL-100${i + 1}`,
        category: t.category,
        title: t.title,
        description: t.description,
        severity: t.severity,
        timestamp: new Date(Date.now() - 300000 * (10 - i)),
        zoneId: createdZones[t.zoneIdx].id
      }
    });
  }

  // 10. Create 4 Reports
  console.log('Creating 4 reports...');
  const reportSpecs = [
    { id: 'REP-1001', name: 'Daily Safety handovers Report', type: 'DAILY_SAFETY' },
    { id: 'REP-1002', name: 'Confined Space incident audit', type: 'INCIDENT' },
    { id: 'REP-1003', name: 'Composite risk and mitigation report', type: 'RISK_ANALYSIS' },
    { id: 'REP-1004', name: 'PESO & Factory Act compliance review', type: 'COMPLIANCE' },
  ];

  for (const r of reportSpecs) {
    await prisma.report.create({
      data: {
        id: r.id,
        name: r.name,
        description: `Lightweight seed safety review report for ${r.type}`,
        type: r.type,
        frequency: 'DAILY',
        status: 'COMPLETED',
        generatedById: adminUser.id,
        generatedAt: new Date(),
        data: {
          complianceScore: 78,
          incidentCount: 1,
          durationMs: 14500,
        }
      }
    });
  }

  // 11. Create 10 Worker Movements
  console.log('Creating 10 worker movements...');
  for (let i = 1; i <= 10; i++) {
    const fromIdx = i % 3;
    const toIdx = (i + 1) % 3;
    await prisma.workerMovement.create({
      data: {
        id: `MOV-100${i}`,
        workerId: 'W014',
        fromZoneId: createdZones[fromIdx].id,
        toZoneId: createdZones[toIdx].id,
        timestamp: new Date(Date.now() - 120000 * (10 - i))
      }
    });
  }

  console.log('✅ Database seeded successfully with a lightweight dataset!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
