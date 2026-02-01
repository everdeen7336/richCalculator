'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { AIRPORT_COORDS, latLonToVec3, getArcPoints } from '@/lib/geo';
import type { FlightInfo } from '@/types/journey';

const GLOBE_RADIUS = 1.6;

/* ── 지구 텍스처 구체 ── */
function EarthSphere() {
  const texture = useLoader(THREE.TextureLoader, '/earth-texture.jpg');
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

/* ── 위도/경도 와이어프레임 라인 ── */
function GlobeWireframe() {
  const lines = useMemo(() => {
    const result: THREE.Vector3[][] = [];

    // 위도 라인 (15도 간격)
    for (let lat = -75; lat <= 75; lat += 15) {
      const pts: THREE.Vector3[] = [];
      for (let lon = -180; lon <= 180; lon += 5) {
        pts.push(latLonToVec3(lat, lon, GLOBE_RADIUS));
      }
      result.push(pts);
    }

    // 경도 라인 (30도 간격)
    for (let lon = -180; lon < 180; lon += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        pts.push(latLonToVec3(lat, lon, GLOBE_RADIUS));
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
          color="#E7E5E2"
          lineWidth={0.4}
          transparent
          opacity={0.15}
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
      // 항로가 있으면 느리게, 없으면 보통 속도
      ref.current.rotation.y += delta * (hasRoute ? 0.03 : 0.08);
    }
  });

  return <group ref={ref}>{children}</group>;
}

/* ── 항로 곡선 ── */
function FlightArc({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) {
  const startVec = latLonToVec3(from[0], from[1], GLOBE_RADIUS);
  const endVec = latLonToVec3(to[0], to[1], GLOBE_RADIUS);

  // 거리에 따라 arc 높이 조절
  const dist = startVec.distanceTo(endVec);
  const altitude = Math.min(0.5, dist * 0.15);
  const arcPoints = useMemo(
    () => getArcPoints(startVec, endVec, altitude, 64),
    [startVec, endVec, altitude],
  );

  return (
    <Line
      points={arcPoints}
      color="#5B8A7A"
      lineWidth={2}
      transparent
      opacity={0.85}
    />
  );
}

/* ── 공항 마커 ── */
function AirportMarker({
  coords,
  color,
}: {
  coords: [number, number];
  color: string;
}) {
  const pos = latLonToVec3(coords[0], coords[1], GLOBE_RADIUS);
  // 마커를 구체 표면 바로 위에
  const outerPos = pos.clone().normalize().multiplyScalar(GLOBE_RADIUS + 0.02);

  return (
    <mesh position={outerPos}>
      <sphereGeometry args={[0.035, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/* ── 마커에서 나오는 빛 기둥 ── */
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
      <sphereGeometry args={[0.055, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={0.25} />
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
  // 항로 계산
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

  // 모든 마커 좌표
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
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />

      <AutoRotate hasRoute={hasRoute}>
        {/* 지구본 (텍스처) */}
        <EarthSphere />

        {/* 와이어프레임 오버레이 */}
        <GlobeWireframe />

        {/* 항로 */}
        {routes.map((r, i) => (
          <FlightArc key={i} from={r.from} to={r.to} />
        ))}

        {/* 마커 */}
        {markers.map((m, i) => (
          <group key={i}>
            <AirportMarker
              coords={m.coords}
              color={m.type === 'dep' ? '#C49A6C' : '#5B8A7A'}
            />
            <MarkerPulse
              coords={m.coords}
              color={m.type === 'dep' ? '#C49A6C' : '#5B8A7A'}
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
