import * as THREE from 'three';

/** 공항 IATA 코드 → 위경도 */
export const AIRPORT_COORDS: Record<string, [number, number]> = {
  // 한국
  ICN: [37.4602, 126.4407], GMP: [37.5583, 126.7906],
  PUS: [35.1796, 128.9382], CJU: [33.5104, 126.4914], TAE: [35.894, 128.6586],
  // 일본
  NRT: [35.7647, 140.3864], HND: [35.5494, 139.7798],
  KIX: [34.4347, 135.2441], FUK: [33.5859, 130.4508],
  CTS: [42.7752, 141.6924], OKA: [26.1958, 127.6459],
  // 동남아
  BKK: [13.6900, 100.7501], HKT: [8.1132, 98.3169], CNX: [18.7668, 98.9626],
  SIN: [1.3644, 103.9915], KUL: [2.7456, 101.7099],
  SGN: [10.8188, 106.6520], HAN: [21.2187, 105.8072], DAD: [16.0439, 108.1992],
  DPS: [-8.7482, 115.1672], CGK: [-6.1256, 106.6559],
  CEB: [10.3074, 123.9794], MNL: [14.5086, 121.0197],
  // 중화권
  HKG: [22.3080, 113.9185], TPE: [25.0797, 121.2342],
  PVG: [31.1443, 121.8083], PEK: [40.0799, 116.6031],
  // 유럽
  CDG: [49.0097, 2.5479], LHR: [51.4700, -0.4543],
  FCO: [41.8003, 12.2389], IST: [41.2753, 28.7519],
  FRA: [50.0333, 8.5706], AMS: [52.3086, 4.7639], BCN: [41.2971, 2.0785],
  // 미주
  JFK: [40.6413, -73.7781], LAX: [33.9425, -118.4081],
  SFO: [37.6213, -122.3790], HNL: [21.3245, -157.9251],
  // 오세아니아/태평양
  GUM: [13.4834, 144.7960], SPN: [15.1190, 145.7295],
  SYD: [-33.9461, 151.1772], MEL: [-37.6690, 144.8410],
  // 중동
  DXB: [25.2532, 55.3657], DOH: [25.2731, 51.6081],
};

/** 위경도 → 3D 구체 좌표 (Three.js Vector3) */
export function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/** 두 지점 사이 곡선의 중간점 (구체 바깥으로 올려줌) */
export function getArcPoints(
  start: THREE.Vector3,
  end: THREE.Vector3,
  altitude: number = 0.4,
  segments: number = 64,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // 구면 선형 보간 (slerp)
    const point = new THREE.Vector3().copy(start).lerp(end, t);
    // 중간일수록 높이 올림 (포물선)
    const lift = 1 + altitude * Math.sin(t * Math.PI);
    point.normalize().multiplyScalar(start.length() * lift);
    points.push(point);
  }
  return points;
}
