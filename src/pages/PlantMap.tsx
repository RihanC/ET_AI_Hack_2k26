import React, { useState, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import {
  Layers, X, ChevronRight, AlertTriangle, Thermometer,
  Wind, Gauge, Users, FileText, Camera, Zap,
  MapPin, Activity, Brain, ChevronDown, Rotate3d
} from 'lucide-react';
import { sensors, workers, permits, alerts } from '../data/mockData';
import './PlantMap.css';

interface PlantMapProps {
  onNavigate: (page: string) => void;
}

type LayerKey = 'workers' | 'sensors' | 'temperature' | 'gas' | 'pressure' | 'permits' | 'equipment' | 'cctv';

const LAYERS: { key: LayerKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'workers', label: 'Workers', icon: <Users size={13} />, color: '#3B82F6' },
  { key: 'sensors', label: 'Sensors', icon: <Activity size={13} />, color: '#22C55E' },
  { key: 'temperature', label: 'Temperature', icon: <Thermometer size={13} />, color: '#EF4444' },
  { key: 'gas', label: 'Gas', icon: <Wind size={13} />, color: '#F59E0B' },
  { key: 'pressure', label: 'Pressure', icon: <Gauge size={13} />, color: '#8B5CF6' },
  { key: 'permits', label: 'Permits', icon: <FileText size={13} />, color: '#F59E0B' },
  { key: 'equipment', label: 'Equipment', icon: <Zap size={13} />, color: '#94A3B8' },
  { key: 'cctv', label: 'CCTV', icon: <Camera size={13} />, color: '#06B6D4' },
];

const ZONES = [
  { id: 'A', x: 40, y: 40, w: 160, h: 110, label: 'Zone A — Blast Furnace', risk: 'warning' as const, sensorIds: ['S001','S003','S010'], workers: ['W001'] },
  { id: 'B', x: 220, y: 40, w: 130, h: 90, label: 'Zone B — Converter', risk: 'warning' as const, sensorIds: ['S002'], workers: ['W002'] },
  { id: 'C', x: 370, y: 40, w: 110, h: 85, label: 'Zone C — Boiler Room', risk: 'safe' as const, sensorIds: ['S004'], workers: ['W008'] },
  { id: 'D', x: 500, y: 20, w: 70, h: 45, label: 'Chimney', risk: 'safe' as const, sensorIds: ['S005'], workers: [] },
  { id: 'E', x: 40, y: 170, w: 130, h: 95, label: 'Zone E — Compressor', risk: 'warning' as const, sensorIds: ['S006'], workers: ['W003'] },
  { id: 'F', x: 195, y: 155, w: 140, h: 110, label: 'Zone F — Tank Farm', risk: 'critical' as const, sensorIds: ['S007'], workers: ['W004'] },
  { id: 'G', x: 355, y: 145, w: 200, h: 120, label: 'Zone G — Rolling Mill', risk: 'safe' as const, sensorIds: ['S008','S011'], workers: ['W005','W007'] },
  { id: 'H', x: 40, y: 285, w: 115, h: 75, label: 'Zone H — Gas Plant', risk: 'safe' as const, sensorIds: ['S009'], workers: [] },
  { id: 'I', x: 175, y: 285, w: 110, h: 75, label: 'Zone I — Electrolyzer', risk: 'warning' as const, sensorIds: ['S012'], workers: [] },
  { id: 'CR', x: 355, y: 285, w: 155, h: 75, label: 'Control Room', risk: 'safe' as const, sensorIds: [], workers: ['W006'] },
];

const EQUIPMENT = [
  { x: 80, y: 80, label: 'BF-1', type: 'furnace' },
  { x: 250, y: 70, label: 'CV-2', type: 'converter' },
  { x: 400, y: 65, label: 'B3', type: 'boiler' },
  { x: 230, y: 200, label: 'T-14', type: 'tank' },
  { x: 260, y: 225, label: 'T-15', type: 'tank' },
  { x: 420, y: 195, label: 'RM-1', type: 'mill' },
];

const EXITS = [
  { x: 20, y: 360, label: 'E1' },
  { x: 580, y: 200, label: 'E2' },
  { x: 300, y: 375, label: 'E3' },
];

const riskColors: Record<string, string> = {
  safe: '#22C55E', warning: '#F59E0B', critical: '#EF4444'
};

const zoneHeights: Record<string, number> = {
  A: 2.0, B: 1.8, C: 1.6, D: 4.2, E: 1.4, F: 1.0, G: 1.5, H: 1.6, I: 1.7, CR: 1.2
};

// Coordinate mapping parameters
const scale = 0.085;
const svgWidth = 590;
const svgHeight = 375;

const to3DCoords = (x: number, y: number, height = 0): [number, number, number] => {
  const x3d = (x - svgWidth / 2) * scale;
  const z3d = (y - svgHeight / 2) * scale;
  return [x3d, height, z3d];
};

interface SelectedObject {
  type: 'zone' | 'sensor' | 'worker';
  id: string;
}

// Subcomponents for 3D digital twin visualization
const Ground3D: React.FC = () => {
  return (
    <group>
      <gridHelper args={[62, 62, '#1E293B', '#111827']} position={[0, -0.01, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[65, 48]} />
        <meshStandardMaterial color="#070913" roughness={0.7} metalness={0.7} />
      </mesh>
    </group>
  );
};

const Pipeline3D: React.FC<{ start: [number, number]; end: [number, number]; dashed?: boolean; active: boolean }> = ({ start, end, dashed, active }) => {
  const [sx, _, sz] = to3DCoords(start[0], start[1]);
  const [ex, __, ez] = to3DCoords(end[0], end[1]);
  const lineRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (lineRef.current && (dashed || active)) {
      lineRef.current.material.dashOffset = -clock.getElapsedTime() * 1.2;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={[[sx, 0.05, sz], [ex, 0.05, ez]]}
      color={active ? '#3B82F6' : '#374151'}
      lineWidth={active ? 2.5 : 1.5}
      dashed={dashed || active}
      dashSize={0.4}
      gapSize={0.2}
      dashScale={active || dashed ? 1.0 : undefined}
    />
  );
};

const GasCloud3D: React.FC<{ position: [number, number, number]; size: [number, number, number]; color: string }> = ({ position, size, color }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 30;

  const particlePositions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * size[0];
      pos[i * 3 + 1] = (Math.random() - 0.5) * size[1];
      pos[i * 3 + 2] = (Math.random() - 0.5) * size[2];
    }
    return pos;
  }, [size]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.12;
      pointsRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.04;
    }
  });

  return (
    <points ref={pointsRef} position={[position[0], position[1], position[2]]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particlePositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.16}
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

const ThermalHeatwave3D: React.FC<{ position: [number, number, number]; radius: number; height: number; color: string }> = ({ position, radius, height, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      meshRef.current.rotation.y = t * 0.5;
      const s = 1.0 + Math.sin(t * 3.0) * 0.04;
      meshRef.current.scale.set(s, 1.0 + Math.cos(t * 1.5) * 0.03, s);
    }
  });

  return (
    <mesh ref={meshRef} position={[position[0], position[1] + height / 2, position[2]]}>
      <cylinderGeometry args={[radius, radius * 1.15, height, 16, 2, true]} />
      <meshBasicMaterial
        color={color}
        wireframe
        transparent
        opacity={0.06}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const WORKER_TRAILS: Record<string, [number, number][]> = {
  W001: [[80, 80], [120, 95], [150, 60], [250, 70]],
  W002: [[220, 80], [260, 60], [285, 85]],
  W003: [[40, 170], [80, 200], [105, 217.5]],
  W004: [[40, 170], [195, 155], [250, 220], [265, 210]],
  W005: [[355, 145], [420, 195], [455, 205]],
  W006: [[355, 285], [432.5, 322.5]],
  W007: [[370, 40], [355, 145], [455, 205]],
  W008: [[370, 40], [425, 82.5]],
};

const WorkerTrail3D: React.FC<{ workerId: string }> = ({ workerId }) => {
  const trail = WORKER_TRAILS[workerId];
  if (!trail) return null;

  const points3d = trail.map(([x, y]) => {
    const [x3d, _, z3d] = to3DCoords(x, y);
    return [x3d, 0.02, z3d] as [number, number, number];
  });

  return (
    <group>
      <Line
        points={points3d}
        color="#3B82F6"
        lineWidth={1.5}
        dashed
        dashSize={0.2}
        gapSize={0.1}
      />
      {points3d.map((pt, i) => (
        <mesh key={i} position={pt}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 8]} />
          <meshBasicMaterial color="#3B82F6" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
};

const CameraController: React.FC<{ selected: SelectedObject | null; controlsRef: React.RefObject<any> }> = ({ selected, controlsRef }) => {
  const { camera } = useThree();
  const defaultPos = useMemo(() => new THREE.Vector3(0, 24, 21), []);
  const defaultTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const activeTargetPos = useRef<THREE.Vector3 | null>(null);
  const activeTargetLook = useRef<THREE.Vector3 | null>(null);

  React.useEffect(() => {
    let tPos = defaultPos.clone();
    let tTarget = defaultTarget.clone();

    if (selected) {
      if (selected.type === 'zone') {
        const zone = ZONES.find(z => z.id === selected.id);
        if (zone) {
          const height3d = zoneHeights[zone.id] || 1.5;
          const [cx, _, cz] = to3DCoords(zone.x + zone.w / 2, zone.y + zone.h / 2);
          tTarget.set(cx, height3d / 2, cz);
          tPos.set(cx + 6, height3d + 10, cz + 10);
        }
      } else if (selected.type === 'worker') {
        const worker = workers.find(w => w.id === selected.id);
        const zone = ZONES.find(z => z.workers.includes(selected.id));
        if (worker && zone) {
          const idx = zone.workers.indexOf(worker.id);
          const wx = zone.x + 18 + (idx % 3) * 22;
          const wy = zone.y + 35 + Math.floor(idx / 3) * 22;
          const [wx3d, _, wy3d] = to3DCoords(wx, wy);
          tTarget.set(wx3d, 0.35, wy3d);
          tPos.set(wx3d + 4, 6, wy3d + 6);
        }
      } else if (selected.type === 'sensor') {
        const s = sensors.find(x => x.id === selected.id);
        if (s) {
          const zone = ZONES.find(z => z.sensorIds.includes(s.id));
          if (zone) {
            const idx = zone.sensorIds.indexOf(s.id);
            const sx = zone.x + 18 + idx * 32;
            const sy = zone.y + zone.h - 16;
            const [sx3d, _, sy3d] = to3DCoords(sx, sy);
            tTarget.set(sx3d, 0.35, sy3d);
            tPos.set(sx3d + 3, 5, sy3d + 5);
          }
        }
      }
    }

    activeTargetPos.current = tPos;
    activeTargetLook.current = tTarget;
  }, [selected, defaultPos, defaultTarget]);

  useFrame(() => {
    if (!activeTargetPos.current || !activeTargetLook.current) return;

    camera.position.lerp(activeTargetPos.current, 0.05);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(activeTargetLook.current, 0.05);
      controlsRef.current.update();
    }

    const distPos = camera.position.distanceTo(activeTargetPos.current);
    let distLook = 0;
    if (controlsRef.current) {
      distLook = controlsRef.current.target.distanceTo(activeTargetLook.current);
    }

    if (distPos < 0.05 && distLook < 0.05) {
      activeTargetPos.current = null;
      activeTargetLook.current = null;
    }
  });

  return null;
};

interface Zone3DProps {
  zone: typeof ZONES[0];
  isSelected: boolean;
  activeLayers: Set<LayerKey>;
  onClick: () => void;
}

const Zone3D: React.FC<Zone3DProps> = ({ zone, isSelected, activeLayers, onClick }) => {
  const color = riskColors[zone.risk];
  const height3d = zoneHeights[zone.id] || 1.5;
  
  const w3d = zone.w * scale;
  const h3d = zone.h * scale; // Y is mapped to depth Z
  const [cx, _, cz] = to3DCoords(zone.x + zone.w / 2, zone.y + zone.h / 2);
  const cy = height3d / 2;

  const [hovered, setHovered] = useState(false);

  return (
    <group position={[cx, 0, cz]}>
      {/* Extruded box for building zone */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          setHovered(false);
        }}
      >
        <boxGeometry args={[w3d, height3d, h3d]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.28 : hovered ? 0.18 : 0.06}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Wireframe glowing lines */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w3d, height3d, h3d)]} />
        <lineBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.95 : hovered ? 0.65 : 0.35}
        />
      </lineSegments>

      {/* Pulsing gas heat wave warning indicator */}
      {zone.risk !== 'safe' && activeLayers.has('gas') && (
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[w3d * 0.96, height3d * 1.01, h3d * 0.96]} />
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={0.06 + Math.sin(Date.now() * 0.003) * 0.03}
          />
        </mesh>
      )}

      {/* HTML tag billboard */}
      <Html
        position={[0, height3d + 0.3, 0]}
        center
        distanceFactor={18}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex flex-col items-center gap-1" style={{ userSelect: 'none' }}>
          <div
            className="px-1.5 py-0.5 rounded text-[8px] font-bold text-center border whitespace-nowrap transition-all duration-300"
            style={{
              background: 'rgba(7, 9, 19, 0.88)',
              borderColor: isSelected ? color : `${color}60`,
              color: color,
              boxShadow: isSelected ? `0 0 12px ${color}` : `0 0 6px ${color}20`,
            }}
          >
            {zone.label}
          </div>
          
          {/* Worker Count indicator */}
          {activeLayers.has('workers') && zone.workers.length > 0 && (
            <div
              className="text-[7px] font-extrabold px-1 rounded-full bg-blue-500/20 border border-blue-500 text-blue-400 mt-0.5"
              style={{ padding: '1px 4px', fontSize: '7px' }}
            >
              {zone.workers.length} WORKER{zone.workers.length > 1 ? 'S' : ''}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

const Equipment3D: React.FC<{ eq: typeof EQUIPMENT[0] }> = ({ eq }) => {
  const [ex, _, ez] = to3DCoords(eq.x, eq.y);

  if (eq.type === 'furnace') {
    return (
      <group position={[ex, 0, ez]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.45, 0.65, 1.8, 16]} />
          <meshStandardMaterial color="#4b5563" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.9, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.45, 1.2, 16]} />
          <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.25, 0.6, 12]} />
          <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.7} />
        </mesh>
        <Html position={[0, 2.9, 0]} center distanceFactor={18}>
          <span className="px-1 py-0.5 rounded text-[7px] bg-slate-900/80 border border-slate-700 text-slate-400 font-bold font-mono">
            {eq.label}
          </span>
        </Html>
      </group>
    );
  }

  if (eq.type === 'converter') {
    return (
      <group position={[ex, 0.4, ez]} rotation={[0, 0, 0.2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.8, 16]} />
          <meshStandardMaterial color="#52525b" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.45, 0.3, 16]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.4} metalness={0.7} />
        </mesh>
        <Html position={[0, 0.8, 0]} center distanceFactor={18}>
          <span className="px-1 py-0.5 rounded text-[7px] bg-slate-900/80 border border-slate-700 text-slate-400 font-bold font-mono">
            {eq.label}
          </span>
        </Html>
      </group>
    );
  }

  if (eq.type === 'boiler') {
    return (
      <group position={[ex, 0, ez]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshStandardMaterial color="#4b5563" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.7, 0.2, 0.7]} />
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
        <Html position={[0, 1.1, 0]} center distanceFactor={18}>
          <span className="px-1 py-0.5 rounded text-[7px] bg-slate-900/80 border border-slate-700 text-slate-400 font-bold font-mono">
            {eq.label}
          </span>
        </Html>
      </group>
    );
  }

  if (eq.type === 'tank') {
    return (
      <group position={[ex, 0.35, ez]} rotation={[0, Math.PI / 2, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.9, 16]} />
          <meshStandardMaterial color="#4b5563" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.45]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#4b5563" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0, -0.45]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#4b5563" roughness={0.4} metalness={0.7} />
        </mesh>
        <Html position={[0, 0.6, 0]} center distanceFactor={18}>
          <span className="px-1 py-0.5 rounded text-[7px] bg-slate-900/80 border border-slate-700 text-slate-400 font-bold font-mono">
            {eq.label}
          </span>
        </Html>
      </group>
    );
  }

  return (
    <group position={[ex, 0.3, ez]}>
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#4b5563" roughness={0.4} metalness={0.7} />
      </mesh>
      <Html position={[0, 0.5, 0]} center distanceFactor={18}>
        <span className="px-1 py-0.5 rounded text-[7px] bg-slate-900/80 border border-slate-700 text-slate-400 font-bold font-mono">
          {eq.label}
        </span>
      </Html>
    </group>
  );
};

interface Worker3DProps {
  worker: typeof workers[0];
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

const Worker3D: React.FC<Worker3DProps> = ({ worker, index, isSelected, onClick }) => {
  const zone = ZONES.find(z => z.workers.includes(worker.id));
  if (!zone) return null;

  // Render spaced out inside their active zone
  const wx = zone.x + 18 + (index % 3) * 22;
  const wy = zone.y + 35 + Math.floor(index / 3) * 22;
  const [wx3d, _, wy3d] = to3DCoords(wx, wy);

  const wc = worker.riskLevel === 'critical' ? '#EF4444' : worker.riskLevel === 'high' ? '#F59E0B' : '#3B82F6';
  const initials = worker.name.split(' ').map(n => n[0]).join('');

  return (
    <group position={[wx3d, 0.35, wy3d]}>
      {/* 3D Pin Head */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        castShadow
      >
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color={wc} />
      </mesh>

      {/* Pin stem */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
        <meshBasicMaterial color={wc} />
      </mesh>

      {/* Pulsing hazard ring */}
      {worker.riskLevel === 'critical' && (
        <mesh position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.38, 16]} />
          <meshBasicMaterial
            color={wc}
            transparent
            opacity={0.35 + Math.sin(Date.now() * 0.009) * 0.3}
          />
        </mesh>
      )}

      {/* Billboarding HTML badge */}
      <Html position={[0, 0.3, 0]} center distanceFactor={18}>
        <button
          className="flex items-center justify-center rounded-full font-bold shadow-lg transition-all duration-300"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          style={{
            width: '13px',
            height: '13px',
            background: isSelected ? wc : 'rgba(7, 9, 19, 0.95)',
            border: `1.5px solid ${wc}`,
            color: isSelected ? '#ffffff' : wc,
            fontSize: '7px',
            fontWeight: 800,
            cursor: 'pointer',
            padding: 0,
            boxShadow: isSelected ? `0 0 10px ${wc}` : 'none'
          }}
        >
          {initials}
        </button>
      </Html>
    </group>
  );
};

interface Sensor3DProps {
  sensorId: string;
  zone: typeof ZONES[0];
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

const Sensor3D: React.FC<Sensor3DProps> = ({ sensorId, zone, index, isSelected, onClick }) => {
  const s = sensors.find(x => x.id === sensorId);
  if (!s) return null;

  const sx = zone.x + 18 + index * 32;
  const sy = zone.y + zone.h - 16;
  const [sx3d, _, sy3d] = to3DCoords(sx, sy);

  const sc = s.status === 'critical' ? '#EF4444' : s.status === 'warning' ? '#F59E0B' : '#22C55E';
  const label = s.type === 'gas' ? 'GAS' : s.type === 'temperature' ? 'TEMP' : s.type === 'pressure' ? 'PRES' : s.type.slice(0, 4).toUpperCase();

  return (
    <group position={[sx3d, 0.35, sy3d]}>
      {/* Node mesh */}
      <mesh
        rotation={[0, Math.PI / 4, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <octahedronGeometry args={[0.13]} />
        <meshBasicMaterial color={sc} />
      </mesh>

      {/* Signal pulse ring */}
      <mesh position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.22, 16]} />
        <meshBasicMaterial color={sc} transparent opacity={0.25} />
      </mesh>

      {/* Mini display badge */}
      <Html position={[0, 0.28, 0]} center distanceFactor={18}>
        <button
          className="px-1 py-0.5 rounded flex items-center gap-1 border font-bold"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          style={{
            background: 'rgba(7, 9, 19, 0.9)',
            borderColor: isSelected ? sc : 'rgba(255, 255, 255, 0.15)',
            color: sc,
            cursor: 'pointer',
            fontSize: '6.5px',
          }}
        >
          <span>{label}</span>
          <span style={{ opacity: 0.85, color: '#ffffff' }}>{s.value}</span>
        </button>
      </Html>
    </group>
  );
};

const CCTV3D: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => {
  const [x3d, _, z3d] = to3DCoords(cx, cy);

  return (
    <group position={[x3d, 1.6, z3d]}>
      {/* Camera body */}
      <mesh castShadow>
        <boxGeometry args={[0.12, 0.12, 0.24]} />
        <meshStandardMaterial color="#06B6D4" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Small lens */}
      <mesh position={[0, 0, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.04, 8]} />
        <meshBasicMaterial color="#020617" />
      </mesh>
      {/* Pivot mount */}
      <mesh position={[0, -0.12, -0.06]}>
        <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* Field of View Cone Visualizer */}
      <mesh position={[0, -0.3, 0.5]} rotation={[0.3 + Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.22, 1.0, 4, 1, true]} />
        <meshBasicMaterial color="#06B6D4" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[0, 0.25, 0]} center distanceFactor={18}>
        <span style={{ fontSize: '8px', pointerEvents: 'none', userSelect: 'none' }}>📷</span>
      </Html>
    </group>
  );
};

const Permit3D: React.FC<{ permit: typeof permits[0] }> = ({ permit }) => {
  const zone = ZONES.find(z => z.label.includes(permit.zone.split(' — ')[0]?.trim() || '')) ||
               ZONES.find(z => permit.zone.includes(z.id));
  if (!zone) return null;

  const [zx3d, _, zy3d] = to3DCoords(zone.x + zone.w - 12, zone.y + 20);
  const pc = permit.riskLevel === 'critical' ? '#EF4444' : '#F59E0B';

  return (
    <group position={[zx3d, 1.4, zy3d]}>
      {/* Shield/Doc shape */}
      <mesh>
        <boxGeometry args={[0.18, 0.22, 0.02]} />
        <meshStandardMaterial color={pc} emissive={pc} emissiveIntensity={0.2} />
      </mesh>
      <Html position={[0, 0, 0]} center distanceFactor={18}>
        <span style={{ color: '#070913', fontWeight: 900, fontSize: '7px', pointerEvents: 'none', userSelect: 'none' }}>P</span>
      </Html>
    </group>
  );
};

const Exit3D: React.FC<{ exit: typeof EXITS[0] }> = ({ exit }) => {
  const [ex3d, _, ey3d] = to3DCoords(exit.x, exit.y);

  return (
    <group position={[ex3d, 0, ey3d]}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.4, 0.7, 0.04]} />
        <meshStandardMaterial color="#22C55E" transparent opacity={0.16} />
      </mesh>
      <Html position={[0, 0.85, 0]} center distanceFactor={18}>
        <span
          className="px-1 rounded font-bold text-[6px] border border-green-500 text-green-400 bg-emerald-950/80"
          style={{ fontSize: '6px' }}
        >
          EXIT {exit.label}
        </span>
      </Html>
    </group>
  );
};

const PlantMap: React.FC<PlantMapProps> = ({ onNavigate }) => {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(
    new Set(['workers', 'sensors', 'gas', 'permits', 'equipment'])
  );
  const [selected, setSelected] = useState<SelectedObject | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const controlsRef = useRef<any>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleLayer = (key: LayerKey) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectedZone = selected?.type === 'zone' ? ZONES.find(z => z.id === selected.id) : null;
  const selectedSensor = selected?.type === 'sensor' ? sensors.find(s => s.id === selected.id) : null;
  const selectedWorker = selected?.type === 'worker' ? workers.find(w => w.id === selected.id) : null;

  const liveEvents = [
    { time: '10:24:01', text: 'S007: O₂ level 18.1% — CRITICAL', sev: 'critical' },
    { time: '10:23:48', text: 'W004: Movement detected in Zone F confined space', sev: 'critical' },
    { time: '10:23:15', text: 'S001: H₂S trending up — 8.6 ppm', sev: 'warning' },
    { time: '10:22:50', text: 'S006: Compressor C3 vibration spike 7.9 mm/s', sev: 'warning' },
    { time: '10:22:10', text: 'AI: Compound risk escalation detected — Zone F', sev: 'critical' },
    { time: '10:21:30', text: 'PTW-0043: Worker W003 partial PPE alert', sev: 'warning' },
    { time: '10:20:05', text: 'S002: CO level stabilizing at 22.8 ppm', sev: 'info' },
    { time: '10:19:42', text: 'System: All CCTV feeds nominal', sev: 'info' },
  ];

  return (
    <div className="plant-map-layout">
      {/* Main Map Area */}
      <div className="plant-map-main">
        {/* Top Bar */}
        <div className="plant-map-toolbar">
          <div className="flex items-center gap-3">
            <h1 className="page-title" style={{ fontSize: 16 }}>Live Plant Map</h1>
            <div className="badge badge-success">
              <span className="pulse-dot success" style={{ width: 5, height: 5 }} />
              LIVE
            </div>
            
            {/* 3D vs 2D Toggle Switch */}
            <div className="view-mode-toggle ml-2">
              <button
                className={`view-mode-btn ${viewMode === '3d' ? 'active' : ''}`}
                onClick={() => setViewMode('3d')}
              >
                <Rotate3d size={11} className="inline mr-1 -mt-0.5" />
                3D Twin
              </button>
              <button
                className={`view-mode-btn ${viewMode === '2d' ? 'active' : ''}`}
                onClick={() => setViewMode('2d')}
              >
                2D Map
              </button>
            </div>
          </div>
          
          <div className="layer-controls">
            <span className="label">Layers:</span>
            {LAYERS.map(layer => (
              <button
                key={layer.key}
                className={`layer-btn ${activeLayers.has(layer.key) ? 'active' : ''}`}
                style={{ '--layer-color': layer.color } as React.CSSProperties}
                onClick={() => toggleLayer(layer.key)}
                id={`layer-${layer.key}`}
              >
                <span style={{ color: activeLayers.has(layer.key) ? layer.color : 'var(--text-muted)' }}>
                  {layer.icon}
                </span>
                {layer.label}
              </button>
            ))}
          </div>
          
          {viewMode === '2d' && (
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>+</button>
              <span className="text-sm text-secondary">{Math.round(zoom * 100)}%</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.max(z - 0.2, 0.6))}>−</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setZoom(1)}>Reset</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Center</button>
            </div>
          )}
          {viewMode === '3d' && (
            <div className="text-xs text-secondary flex items-center gap-2" style={{ userSelect: 'none' }}>
              <Rotate3d size={12} color="var(--text-muted)" />
              <span>Orbit: Left Click + Drag · Pan: Right Click + Drag · Zoom: Scroll</span>
            </div>
          )}
        </div>

        {/* Digital Twin Canvas */}
        <div
          className={`plant-map-canvas ${viewMode === '3d' ? 'mode-3d' : ''} ${viewMode === '2d' && isDragging ? 'dragging' : ''}`}
          onClick={() => selected && setSelected(null)}
          onMouseDown={viewMode === '2d' ? handleMouseDown : undefined}
          onMouseMove={viewMode === '2d' ? handleMouseMove : undefined}
          onMouseUp={viewMode === '2d' ? handleMouseUp : undefined}
          onMouseLeave={viewMode === '2d' ? handleMouseUp : undefined}
        >
          {viewMode === '3d' ? (
            <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, outline: 'none' }}>
              <Canvas
                camera={{ position: [0, 24, 21], fov: 42 }}
                style={{ background: '#070913', outline: 'none' }}
              >
                <ambientLight intensity={0.65} color="#1e293b" />
                <directionalLight
                  position={[15, 25, 10]}
                  intensity={1.3}
                  castShadow
                  shadow-mapSize-width={1024}
                  shadow-mapSize-height={1024}
                />
                <pointLight position={[-15, 15, -15]} intensity={0.5} />
                
                <CameraController selected={selected} controlsRef={controlsRef} />
                
                <Ground3D />

                {/* Pipelines in 3D */}
                <Pipeline3D start={[200, 95]} end={[220, 85]} active={activeLayers.has('equipment')} />
                <Pipeline3D start={[350, 85]} end={[370, 75]} active={activeLayers.has('equipment')} />
                <Pipeline3D start={[170, 215]} end={[195, 205]} dashed active={activeLayers.has('equipment')} />
                <Pipeline3D start={[335, 210]} end={[355, 195]} active={activeLayers.has('equipment')} />
                <Pipeline3D start={[100, 280]} end={[100, 285]} active={activeLayers.has('equipment')} />
                <Pipeline3D start={[285, 280]} end={[285, 285]} active={activeLayers.has('equipment')} />
                <Pipeline3D start={[480, 55]} end={[500, 42]} active={activeLayers.has('equipment')} />

                {/* Zones */}
                {ZONES.map(zone => (
                  <Zone3D
                    key={zone.id}
                    zone={zone}
                    isSelected={selected?.type === 'zone' && selected.id === zone.id}
                    activeLayers={activeLayers}
                    onClick={() => setSelected({ type: 'zone', id: zone.id })}
                  />
                ))}

                {/* Volumetric Gas clouds inside warning/critical zones */}
                {activeLayers.has('gas') && ZONES.map(zone => {
                  if (zone.risk === 'safe') return null;
                  const height3d = zoneHeights[zone.id] || 1.5;
                  const [cx, _, cz] = to3DCoords(zone.x + zone.w / 2, zone.y + zone.h / 2);
                  return (
                    <GasCloud3D
                      key={`gas-${zone.id}`}
                      position={[cx, height3d / 2, cz]}
                      size={[zone.w * scale * 0.9, height3d * 0.8, zone.h * scale * 0.9]}
                      color={riskColors[zone.risk]}
                    />
                  );
                })}

                {/* Thermal heat shimmers above hot zones */}
                {activeLayers.has('temperature') && ZONES.map(zone => {
                  if (zone.id !== 'A' && zone.id !== 'C') return null;
                  const height3d = zoneHeights[zone.id] || 1.5;
                  const [cx, _, cz] = to3DCoords(zone.x + zone.w / 2, zone.y + zone.h / 2);
                  const radius = Math.min(zone.w, zone.h) * scale * 0.45;
                  return (
                    <ThermalHeatwave3D
                      key={`heat-${zone.id}`}
                      position={[cx, height3d, cz]}
                      radius={radius}
                      height={1.6}
                      color="#EF4444"
                    />
                  );
                })}

                {/* Selected Worker breadcrumb trail */}
                {selected?.type === 'worker' && <WorkerTrail3D workerId={selected.id} />}

                {/* Equipment */}
                {activeLayers.has('equipment') && EQUIPMENT.map(eq => (
                  <Equipment3D key={eq.label} eq={eq} />
                ))}

                {/* Workers */}
                {activeLayers.has('workers') && workers.map((w, i) => (
                  <Worker3D
                    key={w.id}
                    worker={w}
                    index={i}
                    isSelected={selected?.type === 'worker' && selected.id === w.id}
                    onClick={() => setSelected({ type: 'worker', id: w.id })}
                  />
                ))}

                {/* Sensors */}
                {activeLayers.has('sensors') && ZONES.map(zone =>
                  zone.sensorIds.slice(0, 2).map((sid, idx) => (
                    <Sensor3D
                      key={sid}
                      sensorId={sid}
                      zone={zone}
                      index={idx}
                      isSelected={selected?.type === 'sensor' && selected.id === sid}
                      onClick={() => setSelected({ type: 'sensor', id: sid })}
                    />
                  ))
                )}

                {/* CCTV Cameras */}
                {activeLayers.has('cctv') && [[50,165],[350,140],[190,150],[480,280]].map(([cx, cy], i) => (
                  <CCTV3D key={i} cx={cx} cy={cy} />
                ))}

                {/* Permits */}
                {activeLayers.has('permits') && permits.filter(p => p.status === 'active').map(permit => (
                  <Permit3D key={permit.id} permit={permit} />
                ))}

                {/* Emergency exits */}
                {EXITS.map(exit => (
                  <Exit3D key={exit.label} exit={exit} />
                ))}

                <OrbitControls
                  ref={controlsRef}
                  enableDamping
                  dampingFactor={0.05}
                  maxPolarAngle={Math.PI / 2 - 0.05} // Constrain camera from going underground
                  minDistance={8}
                  maxDistance={35}
                />
              </Canvas>
            </div>
          ) : (
            <svg
              viewBox="0 0 590 375"
              className="plant-map-svg"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.3s ease'
              }}
            >
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#12182B" strokeWidth="0.5"/>
                </pattern>
                <filter id="glow-critical">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <rect width="590" height="375" fill="#070913"/>
              <rect width="590" height="375" fill="url(#grid)"/>

              {/* Pipelines */}
              <g opacity="0.6">
                <path d="M 200 95 L 220 85" stroke="#374151" strokeWidth="3" fill="none"/>
                <path d="M 350 85 L 370 75" stroke="#374151" strokeWidth="3" fill="none"/>
                <path d="M 170 215 L 195 205" stroke="#374151" strokeWidth="3" fill="none" strokeDasharray="5 3"/>
                <path d="M 335 210 L 355 195" stroke="#374151" strokeWidth="3" fill="none"/>
                <path d="M 100 280 L 100 285" stroke="#374151" strokeWidth="3" fill="none"/>
                <path d="M 285 280 L 285 285" stroke="#374151" strokeWidth="3" fill="none"/>
                <path d="M 480 55 L 500 42" stroke="#374151" strokeWidth="2" fill="none"/>
              </g>

              {/* Emergency Exit markers */}
              {EXITS.map(exit => (
                <g key={exit.label}>
                  <rect x={exit.x - 12} y={exit.y - 10} width={24} height={20} rx="3" fill="#22C55E" opacity="0.15" stroke="#22C55E" strokeWidth="1"/>
                  <text x={exit.x} y={exit.y + 4} textAnchor="middle" fill="#22C55E" fontSize="7" fontWeight="700">EXIT {exit.label}</text>
                </g>
              ))}

              {/* Zones */}
              {ZONES.map(zone => {
                const isSelected = selected?.type === 'zone' && selected.id === zone.id;
                const color = riskColors[zone.risk];
                return (
                  <g key={zone.id} onClick={(e) => { e.stopPropagation(); setSelected({ type: 'zone', id: zone.id }); }}>
                    {/* Risk zone heatmap overlay */}
                    {zone.risk !== 'safe' && activeLayers.has('gas') && (
                      <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="8"
                        fill={color} opacity="0.05">
                        <animate attributeName="opacity" values="0.04;0.1;0.04" dur="2s" repeatCount="indefinite"/>
                      </rect>
                    )}

                    <rect
                      x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="8"
                      fill={`${color}0D`}
                      stroke={isSelected ? color : `${color}60`}
                      strokeWidth={isSelected ? 2 : 1}
                      filter={zone.risk === 'critical' ? 'url(#glow-critical)' : undefined}
                      style={{ cursor: 'pointer', transition: 'stroke 0.2s' }}
                    />

                    {/* Pulsing border for critical */}
                    {zone.risk === 'critical' && (
                      <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="8"
                        fill="none" stroke={color} strokeWidth="1.5">
                        <animate attributeName="stroke-opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite"/>
                      </rect>
                    )}

                    <text x={zone.x + 8} y={zone.y + 14} fill={color} fontSize="8" fontWeight="700" opacity="0.9">
                      {zone.label}
                    </text>

                    {/* Risk badge */}
                    <rect x={zone.x + zone.w - 36} y={zone.y + 6} width={30} height={14} rx="3"
                      fill={`${color}25`}/>
                    <text x={zone.x + zone.w - 21} y={zone.y + 16} textAnchor="middle" fill={color} fontSize="7" fontWeight="800">
                      {zone.risk.toUpperCase()}
                    </text>

                    {/* Worker count dot */}
                    {activeLayers.has('workers') && zone.workers.length > 0 && (
                      <g>
                        <circle cx={zone.x + 10} cy={zone.y + zone.h - 10} r="8" fill="#3B82F640" stroke="#3B82F6" strokeWidth="1"/>
                        <text x={zone.x + 10} y={zone.y + zone.h - 6} textAnchor="middle" fill="#3B82F6" fontSize="7" fontWeight="700">
                          {zone.workers.length}W
                        </text>
                      </g>
                    )}

                    {/* Sensor indicators */}
                    {activeLayers.has('sensors') && zone.sensorIds.slice(0, 2).map((sid, si) => {
                      const s = sensors.find(x => x.id === sid);
                      if (!s) return null;
                      const sc = s.status === 'critical' ? '#EF4444' : s.status === 'warning' ? '#F59E0B' : '#22C55E';
                      return (
                        <g key={sid} onClick={(e) => { e.stopPropagation(); setSelected({ type: 'sensor', id: sid }); }}>
                          <rect
                            x={zone.x + 8 + si * 36} y={zone.y + zone.h - 28}
                            width={32} height={16} rx="3"
                            fill={`${sc}20`} stroke={sc} strokeWidth="0.8"
                            style={{ cursor: 'pointer' }}
                          />
                          <text x={zone.x + 24 + si * 36} y={zone.y + zone.h - 17} textAnchor="middle" fill={sc} fontSize="7" fontWeight="600">
                            {s.type === 'gas' ? 'GAS' : s.type === 'temperature' ? 'TEMP' : s.type === 'pressure' ? 'PRES' : s.type.slice(0,4).toUpperCase()}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Equipment */}
              {activeLayers.has('equipment') && EQUIPMENT.map(eq => (
                <g key={eq.label}>
                  <rect x={eq.x - 14} y={eq.y - 14} width={28} height={28} rx="4"
                    fill="#94A3B820" stroke="#94A3B860" strokeWidth="1"/>
                  <text x={eq.x} y={eq.y + 4} textAnchor="middle" fill="#94A3B8" fontSize="7" fontWeight="700">{eq.label}</text>
                </g>
              ))}

              {/* Workers */}
              {activeLayers.has('workers') && workers.map((w, i) => {
                const zone = ZONES.find(z => z.workers.includes(w.id));
                if (!zone) return null;
                const wx = zone.x + 20 + (i % 3) * 20;
                const wy = zone.y + 35 + Math.floor(i / 3) * 20;
                const wc = w.riskLevel === 'critical' ? '#EF4444' : w.riskLevel === 'high' ? '#F59E0B' : '#3B82F6';
                return (
                  <g key={w.id} onClick={(e) => { e.stopPropagation(); setSelected({ type: 'worker', id: w.id }); }}
                     style={{ cursor: 'pointer' }}>
                    <circle cx={wx} cy={wy} r="7" fill={`${wc}25`} stroke={wc} strokeWidth="1.5"/>
                    <text x={wx} y={wy+4} textAnchor="middle" fill={wc} fontSize="7" fontWeight="700">
                      {w.name.split(' ').map(n => n[0]).join('')}
                    </text>
                    {w.riskLevel === 'critical' && (
                      <circle cx={wx} cy={wy} r="7" fill="none" stroke={wc} strokeWidth="1.5">
                        <animate attributeName="r" values="7;10;7" dur="1s" repeatCount="indefinite"/>
                        <animate attributeName="stroke-opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* CCTV cameras */}
              {activeLayers.has('cctv') && [[50,165],[350,140],[190,150],[480,280]].map(([cx,cy], i) => (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="5" fill="#06B6D420" stroke="#06B6D4" strokeWidth="1"/>
                  <text x={cx} y={cy+3} textAnchor="middle" fill="#06B6D4" fontSize="5">📷</text>
                </g>
              ))}

              {/* Permit zone overlays */}
              {activeLayers.has('permits') && permits.filter(p => p.status === 'active').map(permit => {
                const zone = ZONES.find(z => z.label.includes(permit.zone.split(' — ')[0]?.trim() || '')) ||
                             ZONES.find(z => permit.zone.includes(z.id));
                if (!zone) return null;
                return (
                  <g key={permit.id}>
                    <rect x={zone.x + zone.w - 16} y={zone.y + 22} width={12} height={10} rx="2"
                      fill={permit.riskLevel === 'critical' ? '#EF444430' : '#F59E0B30'}
                      stroke={permit.riskLevel === 'critical' ? '#EF4444' : '#F59E0B'}
                      strokeWidth="0.8"/>
                    <text x={zone.x + zone.w - 10} y={zone.y + 30} textAnchor="middle"
                      fill={permit.riskLevel === 'critical' ? '#EF4444' : '#F59E0B'} fontSize="5" fontWeight="800">P</text>
                  </g>
                );
              })}

              {/* Legend */}
              <g transform="translate(8, 355)">
                {[['#EF4444','Critical'],['#F59E0B','Warning'],['#22C55E','Safe'],['#3B82F6','Workers']].map(([c,l],i) => (
                  <g key={l} transform={`translate(${i*80}, 0)`}>
                    <circle cx="5" cy="4" r="4" fill={c} opacity="0.7"/>
                    <text x="12" y="7" fill="#4B5563" fontSize="7">{l}</text>
                  </g>
                ))}
              </g>
            </svg>
          )}
        </div>

        {/* Bottom Event Feed */}
        <div className="event-feed">
          <div className="event-feed-header">
            <Activity size={12} color="var(--blue)" />
            <span>Live Event Feed</span>
            <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>STREAMING</span>
          </div>
          <div className="event-feed-scroll">
            {liveEvents.map((evt, i) => (
              <div key={i} className={`event-feed-item ${evt.sev}`}>
                <span className="event-time">{evt.time}</span>
                <span className={`event-dot ${evt.sev}`} />
                <span className="event-text">{evt.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className={`plant-map-panel ${selected ? 'open' : ''}`}>
        {selected && (
          <>
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  {selectedZone?.label || selectedSensor?.name || selectedWorker?.name}
                </div>
                <div className="panel-subtitle">
                  {selected.type === 'zone' ? 'Zone Details' :
                    selected.type === 'sensor' ? 'Sensor Details' : 'Worker Profile'}
                </div>
              </div>
              <button className="btn-icon-header" onClick={() => setSelected(null)}>
                <X size={14} />
              </button>
            </div>

            <div className="panel-content">
              {selectedZone && (
                <ZonePanel zone={selectedZone} sensors={sensors} workers={workers} permits={permits} onNavigate={onNavigate} />
              )}
              {selectedSensor && (
                <SensorPanel sensor={selectedSensor} onNavigate={onNavigate} />
              )}
              {selectedWorker && (
                <WorkerPanel worker={selectedWorker} onNavigate={onNavigate} />
              )}
            </div>
          </>
        )}
        {!selected && (
          <div className="panel-empty">
            <MapPin size={32} color="var(--text-muted)" />
            <p>Click any zone, sensor, or worker on the map to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ZonePanel: React.FC<any> = ({ zone, sensors: allSensors, workers: allWorkers, permits: allPermits, onNavigate }) => {
  const zoneSensors = allSensors.filter((s: any) => zone.sensorIds.includes(s.id));
  const zoneWorkers = allWorkers.filter((w: any) => zone.workers.includes(w.id));

  return (
    <div className="panel-sections">
      <div className="panel-section">
        <div className="panel-kv">
          <span>Risk Level</span>
          <span className={`badge badge-${zone.risk === 'critical' ? 'critical' : zone.risk === 'warning' ? 'warning' : 'success'}`}>
            {zone.risk.toUpperCase()}
          </span>
        </div>
        <div className="panel-kv">
          <span>Workers</span><strong>{zone.workers.length} active</strong>
        </div>
        <div className="panel-kv">
          <span>Sensors</span><strong>{zone.sensorIds.length} monitoring</strong>
        </div>
      </div>

      {zoneSensors.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title">Live Sensors</div>
          {zoneSensors.map((s: any) => {
            const ratio = s.value / s.threshold;
            const sc = ratio >= 1 ? '#EF4444' : ratio >= 0.8 ? '#F59E0B' : '#22C55E';
            return (
              <div key={s.id} className="panel-sensor-row" onClick={() => onNavigate('sensors')}>
                <div>
                  <div className="panel-sensor-name">{s.name.split(' — ')[0]}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.equipment}</div>
                </div>
                <div className="text-right">
                  <div style={{ color: sc, fontWeight: 700, fontSize: 14 }}>{s.value} {s.unit}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Threshold: {s.threshold}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {zoneWorkers.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title">Workers in Zone</div>
          {zoneWorkers.map((w: any) => (
            <div key={w.id} className="panel-worker-row" onClick={() => onNavigate('workers')}>
              <div className="worker-avatar-sm">{w.name.split(' ').map((n: string) => n[0]).join('')}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{w.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{w.role} · {w.task}</div>
              </div>
              <span className={`badge badge-${w.riskLevel === 'critical' ? 'critical' : w.riskLevel === 'high' ? 'warning' : 'muted'}`}>
                {w.riskLevel.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="panel-section">
        <div className="panel-ai-box">
          <div className="panel-ai-title"><Brain size={11} /> AI Analysis</div>
          <p>
            {zone.risk === 'critical'
              ? 'CRITICAL: Compound hazard detected. O₂ deficiency combined with confined space worker presence requires immediate evacuation. Permit PTW-0042 should be suspended.'
              : zone.risk === 'warning'
              ? 'This zone shows elevated readings trending toward warning thresholds. Increased monitoring frequency recommended. Ensure all PPE is compliant.'
              : 'Zone operating within normal parameters. Continue standard monitoring protocols.'}
          </p>
        </div>
        <button className="btn btn-primary w-full mt-3" style={{ justifyContent: 'center' }}
          onClick={() => onNavigate('ai-risk')}>
          <Brain size={13} /> View Full AI Risk Analysis
        </button>
      </div>
    </div>
  );
};

const SensorPanel: React.FC<any> = ({ sensor, onNavigate }) => {
  const ratio = sensor.value / sensor.threshold;
  const sc = ratio >= 1 ? '#EF4444' : ratio >= 0.8 ? '#F59E0B' : '#22C55E';
  return (
    <div className="panel-sections">
      <div className="panel-section">
        <div className="panel-kv"><span>Type</span><strong className="capitalize">{sensor.type}</strong></div>
        <div className="panel-kv"><span>Zone</span><strong>{sensor.zone}</strong></div>
        <div className="panel-kv"><span>Equipment</span><strong>{sensor.equipment}</strong></div>
        <div className="panel-kv"><span>Status</span>
          <span className={`badge badge-${sensor.status === 'critical' ? 'critical' : sensor.status === 'warning' ? 'warning' : 'success'}`}>
            {sensor.status.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="panel-section">
        <div className="current-reading" style={{ borderColor: `${sc}40` }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: sc, letterSpacing: '-0.03em' }}>{sensor.value}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{sensor.unit}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Threshold: {sensor.threshold} {sensor.unit}</div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${Math.min((sensor.value / sensor.max) * 100, 100)}%`, background: sc }} />
          </div>
        </div>
      </div>
      <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => onNavigate('sensors')}>
        View Full Sensor History
      </button>
    </div>
  );
};

const WorkerPanel: React.FC<any> = ({ worker, onNavigate }) => {
  return (
    <div className="panel-sections">
      <div className="panel-section">
        <div className="panel-kv"><span>Role</span><strong>{worker.role}</strong></div>
        <div className="panel-kv"><span>Zone</span><strong>{worker.zone}</strong></div>
        <div className="panel-kv"><span>Task</span><strong>{worker.task}</strong></div>
        <div className="panel-kv"><span>PPE</span>
          <span className={`badge badge-${worker.ppeStatus === 'compliant' ? 'success' : worker.ppeStatus === 'partial' ? 'warning' : 'critical'}`}>
            {worker.ppeStatus.toUpperCase()}
          </span>
        </div>
        <div className="panel-kv"><span>Heart Rate</span><strong style={{ color: worker.heartRate > 100 ? '#EF4444' : 'var(--text-primary)' }}>{worker.heartRate} bpm</strong></div>
        <div className="panel-kv"><span>Gas Exposure</span><strong>{worker.gasExposure} ppm</strong></div>
        <div className="panel-kv"><span>Risk Level</span>
          <span className={`badge badge-${worker.riskLevel === 'critical' ? 'critical' : worker.riskLevel === 'high' ? 'warning' : 'muted'}`}>
            {worker.riskLevel.toUpperCase()}
          </span>
        </div>
      </div>
      {worker.nearbyHazards.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title">Nearby Hazards</div>
          {worker.nearbyHazards.map((h: string) => (
            <div key={h} className="hazard-tag"><AlertTriangle size={10} /> {h}</div>
          ))}
        </div>
      )}
      <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => onNavigate('workers')}>
        View Worker Profile
      </button>
    </div>
  );
};

export default PlantMap;
