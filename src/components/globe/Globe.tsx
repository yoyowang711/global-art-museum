'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import Marker, { type PaintingNode } from './Marker'
import LandLayer from './LandLayer'
import CountryLayer from './CountryLayer'
import StarsBackground from './StarsBackground'
import { latLngToVec3, dedupeNodes } from '@/utils/geo'
import { loadLandData, generateLandParticles, type LandData } from '@/utils/continentOutlines'
import paintings from '@/data/paintings.json'

const SPHERE_RADIUS = 100
const PARTICLE_COUNT = 12000

const NODES = dedupeNodes(paintings as PaintingNode[], 3)

/* ==================== 洲际聚焦相机 ==================== */
function RegionFocusCamera({ target }: { target: { lat: number; lng: number } | null | undefined }) {
  const { camera } = useThree()
  const prevRef = useRef('')

  useEffect(() => {
    if (!target) return
    const key = `${target.lat},${target.lng}`
    if (key === prevRef.current) return
    prevRef.current = key

    const [tx, ty, tz] = latLngToVec3(target.lat, target.lng, SPHERE_RADIUS)
    const dir = new THREE.Vector3(tx, ty, tz).normalize()
    const dist = camera.position.length()
    const targetPos = dir.multiplyScalar(dist)

    const start = camera.position.clone()
    const startTime = performance.now()
    const dur = 1500

    function animate() {
      const t = Math.min((performance.now() - startTime) / dur, 1)
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      camera.position.lerpVectors(start, targetPos, ease)
      if (t < 1) requestAnimationFrame(animate)
    }
    animate()
  }, [target, camera])

  return null
}

/* ==================== 相机追踪 ==================== */
function CameraTracker({ onDistance }: { onDistance: (d: number) => void }) {
  const { camera } = useThree()
  const lastRef = useRef(0)
  useFrame(() => {
    const d = Math.round(camera.position.length())
    if (d !== lastRef.current) { lastRef.current = d; onDistance(d) }
  })
  return null
}

function useCameraDistance() {
  const [d, setD] = useState(300)
  return { distance: d, setDistance: setD }
}

/* ==================== 相机飞向国家 ==================== */
function CameraFlyTo({ target, controlsRef }: {
  target: { lat: number; lng: number } | null
  controlsRef: React.RefObject<any>
}) {
  const { camera } = useThree()
  const prevRef = useRef('')

  useEffect(() => {
    if (!target) { prevRef.current = ''; return }
    const key = `${target.lat},${target.lng}`
    if (key === prevRef.current) return
    prevRef.current = key

    const [tx, ty, tz] = latLngToVec3(target.lat, target.lng, SPHERE_RADIUS)
    const dir = new THREE.Vector3(tx, ty, tz).normalize()
    const p = dir.multiplyScalar(SPHERE_RADIUS + 60)

    // 三阶段动画：先拉远 → 旋转 → 推近
    const dur = 1.5
    const start = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    const startTime = performance.now()

    function animate() {
      const t = Math.min((performance.now() - startTime) / (dur * 1000), 1)
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      camera.position.set(
        start.x + (p.x - start.x) * ease,
        start.y + (p.y - start.y) * ease,
        start.z + (p.z - start.z) * ease,
      )
      if (t < 1) requestAnimationFrame(animate)
    }
    animate()
  }, [target, camera])

  return null
}

/* ==================== Tooltip ==================== */
function Tooltip({ node, pos }: { node: PaintingNode | null; pos: { x: number; y: number } }) {
  if (!node) return null
  return (
    <div style={{ position: 'absolute', left: pos.x + 16, top: pos.y - 8, pointerEvents: 'none', zIndex: 100,
      background: 'rgba(0,0,0,0.85)', border: '0.5px solid rgba(255,255,255,0.2)',
      borderRadius: 4, padding: '6px 10px', maxWidth: 180 }}>
      <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{node.title}</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: 2 }}>{node.artist}, {node.year}</div>
    </div>
  )
}

/* ==================== 底部国家名 ==================== */
function CountryLabel({ name }: { name: string | null }) {
  if (!name) return null
  return (
    <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 100,
      background: 'rgba(0,0,0,0.75)', border: '0.5px solid rgba(255,255,255,0.25)',
      borderRadius: 4, padding: '4px 16px' }}>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{name}</span>
    </div>
  )
}

/* ==================== Earth ==================== */
interface EarthProps {
  landData: LandData; distance: number
  onHover: (node: PaintingNode | null) => void
  onClickNode?: (node: PaintingNode) => void
  focusedCountry: string | null
  onHoverCountry: (name: string | null) => void
  onClickCountry: (nameEn: string, center: { lat: number; lng: number }) => void
  searchQuery?: string
  regionFilter?: string[] | null
}

function Earth({ landData, distance, onHover, onClickNode, focusedCountry, onHoverCountry, onClickCountry, searchQuery, regionFilter }: EarthProps) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const startTime = useRef(0)

  const { positions, sizes } = useMemo(() => generateLandParticles(landData, SPHERE_RADIUS + 0.5, PARTICLE_COUNT), [landData])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    if (!startTime.current) startTime.current = clock.elapsedTime
    const elapsed = clock.elapsedTime - startTime.current
    if (materialRef.current) { materialRef.current.opacity = 0.55 * Math.min(elapsed / 5, 1) * (0.7 + 0.3 * Math.sin(clock.elapsedTime * 0.02)) }
    groupRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 0.3) * 0.002)
  })

  // 聚焦时只显示该国家画作
  const visibleNodes = focusedCountry ? NODES.filter((n) => n.country === focusedCountry) : NODES

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS, 64, 64]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.15} />
      </mesh>
      <LandLayer radius={SPHERE_RADIUS} data={landData} />
      <CountryLayer radius={SPHERE_RADIUS} focusedCountry={focusedCountry} onHoverCountry={onHoverCountry} onClickCountry={onClickCountry} />
      <points renderOrder={2}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial ref={materialRef} color="#ffffff" size={0.6} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
      </points>
      {visibleNodes.map((node) => {
        const wp = latLngToVec3(node.position.lat, node.position.lng, SPHERE_RADIUS + 5)
        return <Marker key={node.title + node.country} node={node} worldPos={wp} distance={distance} onHover={onHover} onClick={onClickNode} searchQuery={searchQuery} regionFilter={regionFilter} />
      })}
    </group>
  )
}

/* ==================== Globe ==================== */
export default function Globe({ onClickNode, searchQuery, regionFilter, regionFocus }: { onClickNode?: (node: PaintingNode) => void; searchQuery?: string; regionFilter?: string[] | null; regionFocus?: { lat: number; lng: number } | null }) {
  const [landData, setLandData] = useState<LandData | null>(null)
  const [hovered, setHovered] = useState<PaintingNode | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const { distance, setDistance } = useCameraDistance()
  const [focusedCountry, setFocusedCountry] = useState<string | null>(null)
  const [focusedLabel, setFocusedLabel] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null)
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => setTooltipPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
  useEffect(() => { loadLandData().then(setLandData) }, [])

  const resetFocus = () => { setFocusedCountry(null); setFocusedLabel(null); setFlyTarget(null) }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      <Tooltip node={hovered} pos={tooltipPos} />
      <CountryLabel name={hoveredCountry || focusedLabel} />
      {focusedCountry && (
        <button onClick={resetFocus} style={{
          position: 'absolute', top: 20, right: 20, zIndex: 100,
          background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.25)',
          borderRadius: 6, color: 'rgba(255,255,255,0.7)', padding: '10px 24px',
          fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
        }}>返回全球</button>
      )}
      <Canvas camera={{ position: [0, 0, 300], fov: 50, near: 0.1, far: 20000 }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1} gl={{ antialias: false }}>
        <CameraTracker onDistance={setDistance} />
        <CameraFlyTo target={flyTarget} controlsRef={controlsRef} />
        <RegionFocusCamera target={regionFocus} />
        <StarsBackground />
        <ambientLight intensity={0.3} />
        <directionalLight position={[500, 500, 500]} intensity={1} />
        <OrbitControls ref={controlsRef} enablePan={false} autoRotate={false} minDistance={150} maxDistance={900} dampingFactor={0.05} enableDamping />
        {landData && (
          <Earth landData={landData} distance={distance} onHover={setHovered} onClickNode={onClickNode} searchQuery={searchQuery} regionFilter={regionFilter}
            focusedCountry={focusedCountry}
            onHoverCountry={setHoveredCountry}
            onClickCountry={(nameEn, center) => {
              if (focusedCountry === nameEn) resetFocus()
              else { setFocusedCountry(nameEn); setFlyTarget(center) }
            }}
          />
        )}
        <EffectComposer multisampling={8}>
          <Bloom intensity={2.2} luminanceThreshold={0.15} luminanceSmoothing={0.9} radius={0.5} />
          <Vignette offset={0.3} darkness={0.3} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
