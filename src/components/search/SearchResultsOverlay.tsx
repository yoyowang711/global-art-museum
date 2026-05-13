'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import paintings from '@/data/paintings.json'
import type { PaintingNode } from '@/components/globe/Marker'

interface Props {
  query: string
  onSelect: (node: PaintingNode) => void
}

const EASE = [0.4, 0, 0.2, 1] as const

export default function SearchResultsOverlay({ query, onSelect }: Props) {
  const results = useMemo(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return (paintings as PaintingNode[])
      .filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.artist.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [query])

  if (results.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-50"
        style={{ top: 80, left: '50%', width: 'clamp(380px, 66vw, 860px)' }}
        animate={{ opacity: 1, x: '-50%', y: 0 }}
        initial={{ opacity: 0, x: '-50%', y: 8 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div
          style={{
            background: 'rgba(250,249,247,0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '0.5px solid rgba(140,126,106,0.15)',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          {results.map((p, i) => (
            <motion.button
              key={p.title + p.country}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
              onClick={() => onSelect(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '12px 16px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '0.5px solid rgba(140,126,106,0.08)' : 'none',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(140,126,106,0.04)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 3, overflow: 'hidden', flexShrink: 0, background: '#EDECEA' }}>
                <img src={p.thumbnail} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: 'Source Serif Pro, Georgia, serif', fontSize: 13, color: '#1A1A1A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.title}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8C7E6A', margin: '2px 0 0' }}>
                  {p.artist}, {p.year} · {p.country}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
