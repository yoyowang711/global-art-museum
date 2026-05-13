'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'

export interface PaintingNode {
  title: string
  artist: string
  year: number
  country: string
  thumbnail: string
  image: string
  priority: 'high' | 'medium' | 'low'
  position: { lat: number; lng: number }
}

interface MarkerProps {
  node: PaintingNode
  worldPos: [number, number, number]
  distance: number
  onHover?: (node: PaintingNode | null) => void
  onClick?: (node: PaintingNode) => void
  searchQuery?: string
  regionFilter?: string[] | null
}

function getVisible(_priority: string, _distance: number): boolean {
  return true
}

/** 从画作标题生成唯一色相 */
function colorFromTitle(title: string): string {
  let h = 0
  for (let i = 0; i < title.length; i++) h = title.charCodeAt(i) + ((h << 5) - h)
  return `hsl(${Math.abs(h) % 360}, 55%, 42%)`
}

export default function Marker({ node, worldPos, distance, onHover, onClick, searchQuery, regionFilter }: MarkerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [loadedTexture, setLoadedTexture] = useState<THREE.Texture | null>(null)

  // 始终可用的 Canvas 纹理（加载失败或加载中用）
  const fallbackTex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 200
    const ctx = c.getContext('2d')!
    const bg = colorFromTitle(node.title)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 200, 200)
    const g = ctx.createRadialGradient(100, 100, 0, 100, 100, 140)
    g.addColorStop(0, 'rgba(255,255,255,0.15)')
    g.addColorStop(1, 'rgba(0,0,0,0.3)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 200, 200)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [node.title])

  useEffect(() => {
    setLoadedTexture(null)
    if (!node.thumbnail) return
    let cancelled = false
    const loader = new THREE.TextureLoader()
    // 每次都清 Three.js 缓存，避免纹理跨实例复用
    THREE.Cache.remove(node.thumbnail)
    loader.load(
      node.thumbnail,
      (t) => {
        if (!cancelled) {
          t.colorSpace = THREE.SRGBColorSpace
          setLoadedTexture(t)
        }
      },
      undefined,
      () => {},
    )
    return () => { cancelled = true }
  }, [node.thumbnail])

  const texture = loadedTexture || fallbackTex
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ffffff', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false,
  }), [])
  const circleMat = useMemo(() => new THREE.MeshBasicMaterial({
    map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false,
  }), [texture])

  // 同步 hover 透明度
  ringMat.opacity = hovered ? 0.65 : 0.35

  const visible = getVisible(node.priority, distance)

  const matched = !searchQuery || searchQuery.length < 2 ||
    node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.country.toLowerCase().includes(searchQuery.toLowerCase())

  // 搜索时：不匹配节点保留但环淡化为几乎不可见
  const searchOpacity = !searchQuery || searchQuery.length < 2 ? 1 : (matched ? 1 : 0.08)
  // 洲际过滤
  const regionMatch = !regionFilter || regionFilter.includes(node.country)
  const filterOpacity = !regionFilter ? 1 : (regionMatch ? 1 : 0.04)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.visible = visible
    const t = Math.sin(clock.elapsedTime * 1.5) * 0.01
    const target = hovered ? 1.6 : 1.0
    const distScale = Math.min(1, distance / 260)
    const s = target * (1 + t) * 2.0 * distScale * searchOpacity * filterOpacity
    groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1)
  })

  return (
    <group ref={groupRef} position={worldPos}>
      <Billboard>
        <mesh
          onPointerEnter={() => { setHovered(true); onHover?.(node) }}
          onPointerLeave={() => { setHovered(false); onHover?.(null) }}
          onClick={(e) => { e.stopPropagation(); onClick?.(node) }}
          renderOrder={10}
        >
          <ringGeometry args={[1.3, 1.55, 64]} />
          <primitive object={ringMat} attach="material" />
        </mesh>
        <mesh
          onPointerEnter={() => { setHovered(true); onHover?.(node) }}
          onPointerLeave={() => { setHovered(false); onHover?.(null) }}
          onClick={(e) => { e.stopPropagation(); onClick?.(node) }}
          renderOrder={10}
        >
          <circleGeometry args={[1.0, 64]} />
          <primitive object={circleMat} attach="material" />
        </mesh>
      </Billboard>
    </group>
  )
}
