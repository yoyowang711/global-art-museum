'use client'

import { useMemo } from 'react'

interface Props {
  count?: number
  spread?: number
}

export default function StarsBackground({ count = 8000, spread = 8000 }: Props) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const half = spread / 2
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread
    }
    return pos
  }, [count, spread])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={2.5}
        sizeAttenuation
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </points>
  )
}
