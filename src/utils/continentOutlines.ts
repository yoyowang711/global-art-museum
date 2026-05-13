/**
 * 从 public/land.geojson 加载真实世界地图数据，
 * 转换为 3D 球面坐标用于边界线和粒子判定。
 */
export interface RingData {
  /** 3D 坐标（单位球面） */
  d3: Float32Array
  /** 经纬度坐标 */
  ll: [number, number][]
  /** 包围盒 */
  bbox: { minLng: number; maxLng: number; minLat: number; maxLat: number }
  /** 是否为大型多边形（用于粒子判定） */
  large: boolean
}

export interface LandData {
  all: RingData[]
  /** 仅大型多边形环，用于快速粒子判定 */
  largeLL: [number, number][][]
}

let cached: LandData | null = null

/** 经纬度 → 3D 球面坐标 */
export function llToVec3(lng: number, lat: number, radius: number): [number, number, number] {
  const phi = (lat * Math.PI) / 180
  const theta = (lng * Math.PI) / 180
  return [
    radius * Math.cos(phi) * Math.cos(theta),
    radius * Math.sin(phi),
    -radius * Math.cos(phi) * Math.sin(theta),
  ]
}

const MIN_AREA = 15 // 度²，小于此面积的多边形忽略（小岛屿不参与粒子判定）

/** 加载并解析 GeoJSON */
export async function loadLandData(): Promise<LandData> {
  if (cached) return cached

  const res = await fetch('/land.geojson')
  const geojson = await res.json()

  const all: RingData[] = []
  const largeLL: [number, number][][] = []

  for (const feature of geojson.features) {
    const { type, coordinates } = feature.geometry as {
      type: 'Polygon' | 'MultiPolygon'
      coordinates: number[][][] | number[][][][]
    }

    const polys: number[][][] = type === 'Polygon'
      ? [coordinates[0]]
      : coordinates.map((c: number[][][]) => c[0])

    for (const ring of polys) {
      if (ring.length < 3) continue

      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
      const arr3D = new Float32Array(ring.length * 3)
      const arrLL: [number, number][] = []

      for (let i = 0; i < ring.length; i++) {
        const [lng, lat] = ring[i]
        const [x, y, z] = llToVec3(lng, lat, 1)
        arr3D[i * 3] = x
        arr3D[i * 3 + 1] = y
        arr3D[i * 3 + 2] = z
        arrLL.push([lng, lat])
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      }

      const bbox = { minLng, maxLng, minLat, maxLat }
      const area = (maxLng - minLng) * (maxLat - minLat)
      const large = area >= MIN_AREA

      all.push({ d3: arr3D, ll: arrLL, bbox, large })
      if (large) largeLL.push(arrLL)
    }
  }

  cached = { all, largeLL }
  return cached
}

/** 射线法判断点是否在给定多边形环内 */
function pointInRing(lat: number, lng: number, ring: [number, number][]): boolean {
  const n = ring.length
  let inside = false
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/** 判断 (lat, lng) 是否在陆地内部（仅检查大型多边形） */
export function isOverLand(lat: number, lng: number, data: LandData): boolean {
  for (const ring of data.largeLL) {
    if (pointInRing(lat, lng, ring)) return true
  }
  return false
}

/** 直接在陆地多边形内部生成粒子坐标（3D 球面），100% 保证落在陆地内 */
export function generateLandParticles(
  data: LandData,
  radius: number,
  count: number,
): { positions: Float32Array; sizes: Float32Array } {
  const large = data.all.filter((r) => r.large)
  if (large.length === 0) {
    return { positions: new Float32Array(0), sizes: new Float32Array(0) }
  }

  // 计算每个多边形的相对面积权重
  const areas = large.map((r) => {
    const w = r.bbox.maxLng - r.bbox.minLng
    const h = r.bbox.maxLat - r.bbox.minLat
    return w * h
  })
  const totalArea = areas.reduce((a, b) => a + b, 0)

  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  let generated = 0

  while (generated < count) {
    // 按面积加权随机选多边形
    let r = Math.random() * totalArea
    let polyIdx = 0
    for (let i = 0; i < areas.length; i++) {
      r -= areas[i]
      if (r <= 0) { polyIdx = i; break }
    }

    const ring = large[polyIdx]
    const { minLng, maxLng, minLat, maxLat } = ring.bbox

    // 在包围盒内随机采样，直到命中多边形内部
    let attempts = 0
    while (attempts < 50) {
      const lng = minLng + Math.random() * (maxLng - minLng)
      const lat = minLat + Math.random() * (maxLat - minLat)
      if (pointInRing(lat, lng, ring.ll)) {
        const [x, y, z] = llToVec3(lng, lat, radius)
        positions[generated * 3] = x
        positions[generated * 3 + 1] = y
        positions[generated * 3 + 2] = z
        sizes[generated] = 0.5 + Math.random() * 0.5
        generated++
        break
      }
      attempts++
    }
  }

  return { positions, sizes }
}
