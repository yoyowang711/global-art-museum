'use client'

import { motion } from 'framer-motion'

interface Region {
  id: string
  label: string
  center: { lat: number; lng: number }
}

const REGIONS: Region[] = [
  { id: 'asia', label: 'ASIA', center: { lat: 40, lng: 90 } },
  { id: 'europe', label: 'EUROPE', center: { lat: 50, lng: 10 } },
  { id: 'africa', label: 'AFRICA', center: { lat: 5, lng: 25 } },
  { id: 'north_america', label: 'NORTH AMERICA', center: { lat: 45, lng: -100 } },
  { id: 'south_america', label: 'SOUTH AMERICA', center: { lat: -15, lng: -60 } },
  { id: 'oceania', label: 'OCEANIA', center: { lat: -25, lng: 135 } },
]

interface Props {
  activeRegion: string | null
  onSelect: (region: Region | null) => void
}

const EASE = [0.4, 0, 0.2, 1] as const

export default function CivilizationRail({ activeRegion, onSelect }: Props) {
  return (
    <motion.div
      className="fixed left-0 top-1/2 z-50"
      style={{ transform: 'translateY(-50%)' }}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.2, delay: 1.4, ease: EASE }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 0 0 24px' }}>
        {/* GLOBAL 按钮 */}
        <motion.button
          onClick={() => onSelect(null)}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 9,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: activeRegion === null ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 8px',
            textAlign: 'left',
            transition: 'color 0.6s ease',
          }}
          whileHover={{ color: 'rgba(255,255,255,0.75)' }}
        >
          GLOBAL
        </motion.button>

        {/* 分隔线 */}
        <div style={{ width: 16, height: '0.5px', background: 'rgba(255,255,255,0.12)', margin: '4px 8px' }} />

        {/* 洲列表 */}
        {REGIONS.map((region) => (
          <motion.button
            key={region.id}
            onClick={() => onSelect(activeRegion === region.id ? null : region)}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: activeRegion === region.id ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 8px',
              textAlign: 'left',
              position: 'relative',
            }}
            whileHover={{ color: 'rgba(255,255,255,0.6)' }}
          >
            {region.label}
            {/* 激活指示器 */}
            {activeRegion === region.id && (
              <motion.div
                layoutId="active-indicator"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'rgba(255,255,255,0.5)',
                }}
                transition={{ duration: 0.6, ease: EASE }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
