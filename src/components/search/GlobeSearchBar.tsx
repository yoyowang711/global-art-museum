'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onSearch: (query: string) => void
}

const EASE = [0.4, 0, 0.2, 1] as const

export default function GlobeSearchBar({ onSearch }: Props) {
  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !focused && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focused])

  const handleChange = (v: string) => {
    setValue(v)
    onSearch(v)
  }

  const handleClear = () => {
    setValue('')
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <motion.div
      className="fixed top-0 left-1/2 z-50"
      style={{ transform: 'translateX(-50%)', width: 'clamp(380px, 66vw, 860px)', marginTop: 10 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 1.2, ease: EASE }}
    >
      <motion.div
        className="flex items-center"
        animate={{
          borderColor: focused
            ? 'rgba(255,255,255,0.35)'
            : 'rgba(255,255,255,0.15)',
          boxShadow: focused
            ? '0 0 20px rgba(255,255,255,0.06), 0 0 2px rgba(255,255,255,0.10), inset 0 0 20px rgba(255,255,255,0.02)'
            : '0 0 12px rgba(255,255,255,0.03), 0 0 1px rgba(255,255,255,0.06), inset 0 0 12px rgba(255,255,255,0.01)',
        }}
        style={{
          border: '0.5px solid',
          borderRadius: 28,
          padding: '14px 22px',
          width: '100%',
          background: 'transparent',
          gap: 12,
        }}
      >
        {/* 放大镜图标 */}
        <svg
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.45)" strokeWidth="1.2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, opacity: focused ? 0.65 : 0.45 }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search artworks, artists, civilizations..."
          style={{
            fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
            fontWeight: 400,
            fontSize: 13,
            letterSpacing: '0.02em',
            color: 'rgba(255,255,255,0.85)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            width: '100%',
            padding: 0,
            lineHeight: 1,
          }}
        />

        {/* 清除按钮 */}
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClear}
              style={{
                flexShrink: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18" /><path d="M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
