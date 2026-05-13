'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { llToVec3 } from '@/utils/continentOutlines'

interface Country {
  name: string; nameEn: string
  rings: [number, number][][]
  center: { lat: number; lng: number }
}

interface Props {
  radius: number
  focusedCountry: string | null
  onHoverCountry: (name: string | null) => void
  onClickCountry: (nameEn: string, center: { lat: number; lng: number }) => void
}

let cache: Country[] | null = null

async function loadCountries(): Promise<Country[]> {
  if (cache) return cache
  const res = await fetch('/countries.geojson')
  const json = await res.json()
  cache = json.features.map((f: any) => {
    const nameEn = (f.properties.NAME || '').replace(/\0/g, '')
    const name = (f.properties.NAME_ZH || nameEn).replace(/\0/g, '')
    const coords = f.geometry.type === 'MultiPolygon'
      ? f.geometry.coordinates.map((c: any) => c[0])
      : [f.geometry.coordinates[0]]
    const rings: [number, number][][] = coords.map((ring: any) =>
      ring.map(([lng, lat]: number[]) => [lng, lat] as [number, number]),
    )
    let sumLat = 0, sumLng = 0, count = 0
    for (const r of rings) for (const [lng, lat] of r) { sumLat += lat; sumLng += lng; count++ }
    return { name, nameEn, rings, center: { lat: sumLat / count, lng: sumLng / count } }
  })
  return cache as Country[]
}

/** hover + 点击检测填充面 */
function HitFill({ rings, radius, onHover, onClick }: {
  rings: [number, number][][]; radius: number
  onHover: (v: boolean) => void; onClick: () => void
}) {
  const offset = radius + 0.4
  const geo = useMemo(() => {
    const v: number[] = []
    for (const ring of rings) {
      if (ring.length < 3) continue
      let cx = 0, cy = 0, cz = 0
      const pts: [number, number, number][] = ring.map(([lng, lat]) => llToVec3(lng, lat, offset))
      for (const p of pts) { cx += p[0]; cy += p[1]; cz += p[2] }
      const l = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1
      cx = (cx / l) * offset; cy = (cy / l) * offset; cz = (cz / l) * offset
      for (let i = 0; i < pts.length - 1; i++) v.push(cx, cy, cz, ...pts[i], ...pts[i + 1])
    }
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
  }, [rings, offset])

  return (
    <mesh geometry={geo}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      onClick={onClick}
    >
      <meshBasicMaterial transparent opacity={0} depthTest={true} side={THREE.DoubleSide} />
    </mesh>
  )
}

export default function CountryLayer({ radius, focusedCountry, onHoverCountry, onClickCountry }: Props) {
  const [countries, setCountries] = useState<Country[]>([])
  const [borderGroup] = useState(() => new THREE.Group())
  const matMapRef = useRef<Map<string, THREE.LineBasicMaterial[]>>(new Map())
  const hoverRef = useRef<string | null>(null)
  const rainbowRef = useRef(new THREE.Color())
  const timeRef = useRef(0)

  useEffect(() => { loadCountries().then(setCountries) }, [])

  const offset = radius + 0.4

  useEffect(() => {
    if (countries.length === 0) return
    while (borderGroup.children.length > 0) borderGroup.remove(borderGroup.children[0])
    matMapRef.current.clear()
    for (const c of countries) {
      const mats: THREE.LineBasicMaterial[] = []
      for (const ring of c.rings) {
        const pts = ring.map(([lng, lat]) => new THREE.Vector3(...llToVec3(lng, lat, offset)))
        pts.push(pts[0])
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        const mat = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.2 })
        borderGroup.add(new THREE.Line(geo, mat))
        mats.push(mat)
      }
      matMapRef.current.set(c.nameEn, mats)
    }
  }, [countries, offset, borderGroup])

  useFrame((_, delta) => {
    const active = focusedCountry || hoverRef.current
    if (!active) { timeRef.current = 0; return }
    timeRef.current += delta * 80
    rainbowRef.current.setHSL((timeRef.current % 360) / 360, 0.8, 0.7)
    const activeMats = matMapRef.current.get(active)
    for (const mats of matMapRef.current.values()) {
      for (const mat of mats) { mat.color.set('#ffffff'); mat.opacity = 0.2 }
    }
    if (activeMats) {
      for (const mat of activeMats) { mat.color.copy(rainbowRef.current); mat.opacity = 0.7 }
    }
  })

  if (countries.length === 0) return null

  return (
    <group>
      <primitive object={borderGroup} />
      {countries.map((c) => (
        <HitFill key={c.nameEn} rings={c.rings} radius={radius}
          onHover={(enter) => {
            hoverRef.current = enter ? c.nameEn : null
            onHoverCountry(enter ? c.name : null)
          }}
          onClick={() => onClickCountry(c.nameEn, c.center)}
        />
      ))}
    </group>
  )
}
