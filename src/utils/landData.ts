/**
 * 获取世界地图陆地数据，转换为 3D 球面坐标。
 * 使用 world-atlas 110m 分辨率 TopoJSON。
 */
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'

const ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@1.1.4/land-110m.json'

export interface LandGeometry {
  /** 3D 多边形环（单位球面） */
  rings3D: Float32Array[]
  /** 原始经纬度环（用于射线法判断） */
  ringsLL: [number, number][][]
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number }
}

let cached: LandGeometry[] | null = null

/** 经纬度 → 3D 球面坐标 */
export function geoToVec3(lng: number, lat: number, radius: number): [number, number, number] {
  const phi = (lat * Math.PI) / 180
  const theta = (lng * Math.PI) / 180
  return [
    radius * Math.cos(phi) * Math.cos(theta),
    radius * Math.sin(phi),
    -radius * Math.cos(phi) * Math.sin(theta),
  ]
}

/** 获取并缓存世界陆地数据 */
export async function fetchLandData(): Promise<LandGeometry[]> {
  if (cached) return cached
  const res = await fetch(ATLAS_URL)
  const topology = (await res.json()) as Topology<{ land: GeometryCollection }>
  const geojson = feature(topology, topology.objects.land)

  cached = geojson.features.map((f) => {
    const coords = (f.geometry as any).type === 'MultiPolygon'
      ? (f.geometry as any).coordinates.flat()
      : (f.geometry as any).coordinates
    const rings3D: Float32Array[] = []
    const ringsLL: [number, number][][] = []
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity

    for (const ring of coords) {
      const arr3D = new Float32Array(ring.length * 3)
      const arrLL: [number, number][] = []
      for (let i = 0; i < ring.length; i++) {
        const [lng, lat] = ring[i]
        const [x, y, z] = geoToVec3(lng, lat, 1)
        arr3D[i * 3] = x; arr3D[i * 3 + 1] = y; arr3D[i * 3 + 2] = z
        arrLL.push([lng, lat])
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      }
      rings3D.push(arr3D)
      ringsLL.push(arrLL)
    }
    return { rings3D, ringsLL, bounds: { minLng, maxLng, minLat, maxLat } }
  })
  return cached
}

/** 射线法判断 (lat, lng) 是否在陆地多边形内 */
export function isOverLand(lat: number, lng: number, lands: LandGeometry[]): boolean {
  for (const land of lands) {
    const { minLng, maxLng, minLat, maxLat } = land.bounds
    if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue
    for (const ring of land.ringsLL) {
      const n = ring.length
      let inside = false
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const [xi, yi] = ring[i]
        const [xj, yj] = ring[j]
        if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
          inside = !inside
        }
      }
      if (inside) return true
    }
  }
  return false
}
