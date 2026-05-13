'use client'

import { Line } from '@react-three/drei'
import { llToVec3, type LandData } from '@/utils/continentOutlines'

interface Props {
  radius: number
  data: LandData
}

export default function LandLayer({ radius, data }: Props) {
  const offset = radius + 0.5

  return (
    <group renderOrder={2}>
      {data.all.map((ring, i) => {
        const pts: [number, number, number][] = ring.ll.map(([lng, lat]) =>
          llToVec3(lng, lat, offset),
        )

        return (
          <group key={i}>
            {/* 外发光晕 */}
            <Line points={pts} color="#ffffff" transparent opacity={0.15} lineWidth={1.5} />
            {/* 主线条 */}
            <Line points={pts} color="#ffffff" transparent opacity={0.65} lineWidth={0.4} />
          </group>
        )
      })}
    </group>
  )
}
