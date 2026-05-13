/** 经纬度（度）→ 3D 球面坐标 */
export function latLngToVec3(
  lat: number,
  lng: number,
  radius = 1.05,
): [number, number, number] {
  const phi = (lat * Math.PI) / 180
  const theta = (lng * Math.PI) / 180
  const x = radius * Math.cos(phi) * Math.cos(theta)
  const y = radius * Math.sin(phi)
  const z = -radius * Math.cos(phi) * Math.sin(theta)
  return [x, y, z]
}

/** 大圆距离（度） */
function greatCircleDist(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const a = Math.sin(toRad(lat1)) * Math.sin(toRad(lat2))
  const b = Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1))
  return (Math.acos(Math.min(1, a + b)) * 180) / Math.PI
}

/**
 * 位置太近的节点不做删除，而是微移坐标避免视觉重叠。
 * threshold 单位：度。
 */
export function dedupeNodes<
  T extends { position: { lat: number; lng: number }; priority: string },
>(nodes: T[], threshold = 3): T[] {
  const result: T[] = []
  for (const node of nodes) {
    let { lat, lng } = node.position
    // 找到所有太近的已加入节点，把当前位置推开
    for (let attempt = 0; attempt < 20; attempt++) {
      const tooClose = result.filter(
        (r) => greatCircleDist(r.position.lat, r.position.lng, lat, lng) < threshold,
      )
      if (tooClose.length === 0) break
      // 计算推开方向：远离所有冲突节点的平均方向
      let dx = 0, dy = 0
      for (const c of tooClose) {
        const a = lat - c.position.lat
        const b = (lng - c.position.lng) * Math.cos((lat * Math.PI) / 180)
        const dist = Math.sqrt(a * a + b * b) || 1
        dx += (a / dist) * threshold
        dy += (b / dist) * threshold
      }
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      lat += (dx / len) * threshold * 0.5
      lng += (dy / len) * threshold * 0.5 / Math.cos((lat * Math.PI) / 180)
    }
    result.push({ ...node, position: { lat, lng } })
  }
  return result
}
