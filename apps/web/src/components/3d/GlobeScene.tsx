'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { AIRPORT_COORDS, latLonToVec3, getArcPoints } from '@/lib/geo';
import type { FlightInfo } from '@/types/journey';

const GLOBE_RADIUS = 1.6;

/* ── 지구 텍스처 구체 (밝게 보정) ── */
function EarthSphere() {
  const texture = useLoader(THREE.TextureLoader, '/earth-texture.jpg');
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.85}
        metalness={0}
        emissive="#8B9E94"
        emissiveIntensity={0.35}
      />
    </mesh>
  );
}

/* ── 위도/경도 와이어프레임 라인 ── */
function GlobeWireframe() {
  const lines = useMemo(() => {
    const result: THREE.Vector3[][] = [];

    for (let lat = -75; lat <= 75; lat += 15) {
      const pts: THREE.Vector3[] = [];
      for (let lon = -180; lon <= 180; lon += 5) {
        pts.push(latLonToVec3(lat, lon, GLOBE_RADIUS + 0.003));
      }
      result.push(pts);
    }

    for (let lon = -180; lon < 180; lon += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        pts.push(latLonToVec3(lat, lon, GLOBE_RADIUS + 0.003));
      }
      result.push(pts);
    }

    return result;
  }, []);

  return (
    <>
      {lines.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#F0EFEC"
          lineWidth={0.5}
          transparent
          opacity={0.3}
        />
      ))}
    </>
  );
}

/* ── 자동 회전 그룹 ── */
function AutoRotate({
  children,
  hasRoute,
}: {
  children: React.ReactNode;
  hasRoute: boolean;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * (hasRoute ? 0.03 : 0.08);
    }
  });

  return <group ref={ref}>{children}</group>;
}

/* ── 항로 곡선 (밝고 눈에 띄게) ── */
function FlightArc({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) {
  const startVec = latLonToVec3(from[0], from[1], GLOBE_RADIUS);
  const endVec = latLonToVec3(to[0], to[1], GLOBE_RADIUS);

  const dist = startVec.distanceTo(endVec);
  const altitude = Math.min(0.5, dist * 0.15);
  const arcPoints = useMemo(
    () => getArcPoints(startVec, endVec, altitude, 64),
    [startVec, endVec, altitude],
  );

  return (
    <Line
      points={arcPoints}
      color="#F2C78C"
      lineWidth={2.5}
      transparent
      opacity={0.95}
    />
  );
}

/* ── 공항 마커 (크게) ── */
function AirportMarker({
  coords,
  color,
}: {
  coords: [number, number];
  color: string;
}) {
  const pos = latLonToVec3(coords[0], coords[1], GLOBE_RADIUS);
  const outerPos = pos.clone().normalize().multiplyScalar(GLOBE_RADIUS + 0.025);

  return (
    <mesh position={outerPos}>
      <sphereGeometry args={[0.045, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/* ── 마커 글로우 링 ── */
function MarkerPulse({
  coords,
  color,
}: {
  coords: [number, number];
  color: string;
}) {
  const pos = latLonToVec3(coords[0], coords[1], GLOBE_RADIUS);
  const dir = pos.clone().normalize();
  const outerPos = dir.clone().multiplyScalar(GLOBE_RADIUS + 0.06);

  return (
    <mesh position={outerPos}>
      <sphereGeometry args={[0.075, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} />
    </mesh>
  );
}

/* ── 메인 씬 ── */
interface GlobeSceneProps {
  departureFlight: FlightInfo | null;
  returnFlight: FlightInfo | null;
}

function resolveCoords(airport?: string): [number, number] | null {
  if (!airport) return null;
  return AIRPORT_COORDS[airport] || null;
}

export default function GlobeScene({
  departureFlight,
  returnFlight,
}: GlobeSceneProps) {
  const routes = useMemo(() => {
    const result: { from: [number, number]; to: [number, number] }[] = [];

    if (departureFlight) {
      const from = resolveCoords(departureFlight.departure.airport);
      const to = resolveCoords(departureFlight.arrival.airport);
      if (from && to) result.push({ from, to });
    }

    if (returnFlight) {
      const from = resolveCoords(returnFlight.departure.airport);
      const to = resolveCoords(returnFlight.arrival.airport);
      if (from && to) result.push({ from, to });
    }

    return result;
  }, [departureFlight, returnFlight]);

  const markers = useMemo(() => {
    const m: { coords: [number, number]; type: 'dep' | 'arr' }[] = [];
    const seen = new Set<string>();

    const add = (airport: string | undefined, type: 'dep' | 'arr') => {
      const c = resolveCoords(airport);
      if (c && !seen.has(airport!)) {
        seen.add(airport!);
        m.push({ coords: c, type });
      }
    };

    if (departureFlight) {
      add(departureFlight.departure.airport, 'dep');
      add(departureFlight.arrival.airport, 'arr');
    }
    if (returnFlight) {
      add(returnFlight.departure.airport, 'dep');
      add(returnFlight.arrival.airport, 'arr');
    }

    return m;
  }, [departureFlight, returnFlight]);

  const hasRoute = routes.length > 0;

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.5], fov: 40 }}
      style={{ background: 'transparent' }}
    >
      {/* 밝은 조명 — 어두운 면도 밝게 */}
      <ambientLight intensity={1.8} />
      <directionalLight position={[5, 3, 5]} intensity={0.6} />
      <directionalLight position={[-3, -1, 3]} intensity={0.3} />

      <AutoRotate hasRoute={hasRoute}>
        <EarthSphere />
        <GlobeWireframe />

        {routes.map((r, i) => (
          <FlightArc key={i} from={r.from} to={r.to} />
        ))}

        {markers.map((m, i) => (
          <group key={i}>
            <AirportMarker
              coords={m.coords}
              color={m.type === 'dep' ? '#F2C78C' : '#8BB5A5'}
            />
            <MarkerPulse
              coords={m.coords}
              color={m.type === 'dep' ? '#F2C78C' : '#8BB5A5'}
            />
          </group>
        ))}
      </AutoRotate>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.5}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.75}
      />
    </Canvas>
  );
}
