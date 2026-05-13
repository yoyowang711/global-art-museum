'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  src: string
  alt: string
  title?: string
  artist?: string
  year?: number
}

const EASE = [0.4, 0, 0.2, 1] as const
const MAX_SCALE = 6
const MIN_SCALE = 1
const ZOOM_STEP = 0.4
const LERP = 0.1

export default function PaintingImage({ src, alt, title, artist, year }: Props) {
  const [fullscreen, setFullscreen] = useState(false)
  const scaleRef = useRef(1)
  const offsetRef = useRef({ x: 0, y: 0 })
  const targetRef = useRef({ scale: 1, x: 0, y: 0 })
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startOffX: 0, startOffY: 0 })
  const imgRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)

  const animate = useCallback(() => {
    const scale = scaleRef.current
    const target = targetRef.current
    const off = offsetRef.current
    scaleRef.current += (target.scale - scale) * LERP
    off.x += (target.x - off.x) * LERP
    off.y += (target.y - off.y) * LERP
    if (imgRef.current) {
      imgRef.current.style.transform = `translate(${off.x}px, ${off.y}px) scale(${scaleRef.current})`
    }
    if (Math.abs(target.scale - scale) > 0.001 || Math.abs(target.x - off.x) > 0.01 || Math.abs(target.y - off.y) > 0.01) {
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [])

  const startAnim = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)
  }, [animate])

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!fullscreen) return
    e.preventDefault()
    const rect = imgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left - rect.width / 2
    const my = e.clientY - rect.top - rect.height / 2
    const dir = e.deltaY < 0 ? 1 : -1
    const cs = targetRef.current.scale
    const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, cs + dir * ZOOM_STEP))
    const ratio = ns / cs
    targetRef.current.scale = ns
    targetRef.current.x = targetRef.current.x * ratio - mx * (ratio - 1)
    targetRef.current.y = targetRef.current.y * ratio - my * (ratio - 1)
    startAnim()
  }, [fullscreen, startAnim])

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!fullscreen) { setFullscreen(true); return }
    const cs = targetRef.current.scale
    if (cs > 1.5) { targetRef.current.scale = 1; targetRef.current.x = 0; targetRef.current.y = 0 }
    else { targetRef.current.scale = 3 }
    startAnim()
  }, [fullscreen, startAnim])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!fullscreen || targetRef.current.scale <= 1) return
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startOffX: targetRef.current.x, startOffY: targetRef.current.y }
  }, [fullscreen])

  useEffect(() => {
    if (!fullscreen) return
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return
      targetRef.current.x = dragRef.current.startOffX + (e.clientX - dragRef.current.startX)
      targetRef.current.y = dragRef.current.startOffY + (e.clientY - dragRef.current.startY)
      startAnim()
    }
    const onUp = () => { dragRef.current.active = false }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeFullscreen() }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('keydown', onKey)
    }
  }, [fullscreen, startAnim])

  const closeFullscreen = useCallback(() => {
    setFullscreen(false)
    targetRef.current = { scale: 1, x: 0, y: 0 }
    scaleRef.current = 1
    offsetRef.current = { x: 0, y: 0 }
    cancelAnimationFrame(rafRef.current)
    if (imgRef.current) imgRef.current.style.transform = ''
  }, [])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  return (
    <>
      {/* ======== 面板内缩略图 ======== */}
      {!fullscreen && (
        <div
          style={{ width: '100%', overflow: 'hidden', background: '#EDECEA', marginBottom: 28, cursor: 'zoom-in',
            display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          onClick={() => setFullscreen(true)}
        >
          <img src={src} alt={alt}
            style={{ width: '100%', height: 'auto', maxHeight: '60vh', objectFit: 'contain', display: 'block' }} />
        </div>
      )}

      {/* ======== Fullscreen Museum Mode ======== */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
            style={{ background: '#FAF9F7', cursor: targetRef.current.scale > 1 ? 'grab' : 'default' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: EASE }}
            onClick={(e) => { if (e.target === e.currentTarget && targetRef.current.scale <= 1) closeFullscreen() }}
            onWheel={onWheel}
          >
            {/* Close */}
            <motion.button
              onClick={closeFullscreen}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
              style={{ position: 'absolute', top: 24, right: 28, zIndex: 1, fontFamily: 'Inter, sans-serif',
                fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8C7E6A',
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                borderBottom: '0.5px solid #8C7E6A' }}>
              Close
            </motion.button>

            {/* Artwork image — cinematic expand */}
            <motion.div
              ref={imgRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.2, ease: EASE }}
              style={{ width: '88vw', maxWidth: 1400, maxHeight: '78vh', transformOrigin: 'center center', willChange: 'transform' }}
              onDoubleClick={onDoubleClick}
              onMouseDown={onMouseDown}
            >
              <img src={src} alt={alt} draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
            </motion.div>

            {/* Artwork info — minimal, delayed */}
            {(title || artist) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.0, delay: 0.5, ease: EASE }}
                style={{ marginTop: 28, textAlign: 'center', maxWidth: 500, padding: '0 24px' }}
              >
                {artist && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#8C7E6A', margin: 0 }}>{artist}</p>
                )}
                {title && (
                  <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(20px, 2.5vw, 32px)',
                    fontWeight: 400, color: '#1A1A1A', margin: '4px 0 0', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                    {title}
                    {year ? <span style={{ color: '#D6D3D1', marginLeft: 10 }}>{year}</span> : null}
                  </h2>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
