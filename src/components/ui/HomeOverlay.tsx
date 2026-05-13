'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function HomeOverlay() {
  const [dismissed, setDismissed] = useState(false)
  const [exiting, setExiting] = useState(false)

  const handleEnter = () => setExiting(true)

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={exiting ? { opacity: 0 } : { opacity: 1 }}
          transition={exiting ? { duration: 0.6, ease: 'easeInOut' } : { duration: 0.8, ease: 'easeOut' }}
          onAnimationComplete={() => { if (exiting) setDismissed(true) }}
        >
          {/* 遮罩 */}
          <motion.div
            className="absolute inset-0"
            style={{ background: '#000000' }}
            initial={{ opacity: 0 }}
            animate={exiting ? { opacity: 0 } : { opacity: 0.6 }}
            transition={exiting ? { duration: 0.6, ease: 'easeInOut' } : { duration: 0.8, ease: 'easeOut' }}
          />

          {/* 引导文字 */}
          <motion.div
            className="relative flex flex-col items-center gap-16 px-6 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={exiting ? { opacity: 0, scale: 0.8 } : { opacity: 1 }}
            transition={
              exiting
                ? { duration: 0.5, ease: 'easeInOut' }
                : { duration: 1.0, delay: 0.2, ease: 'easeOut' }
            }
          >
            <h1
              className="text-center tracking-[0.25em]"
              style={{
                fontFamily: 'Space Grotesk, Inter, sans-serif',
                fontSize: 'clamp(34px, 6vw, 56px)',
                color: '#ffffff',
                fontWeight: 600,
                lineHeight: 1.2,
                maxWidth: '90vw',
              }}
            >
              探索世界名画的奥秘
            </h1>

            {/* CTA 按钮 */}
            <motion.button
              className="pointer-events-auto cursor-pointer"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(14px, 1.8vw, 18px)',
                letterSpacing: '0.08em',
                color: '#1a1a1a',
                background: '#ffffff',
                border: 'none',
                borderRadius: 28,
                padding: '10px 32px',
                fontWeight: 500,
              }}
              whileHover={{
                background: 'rgba(255,255,255,0.85)',
              }}
              onClick={handleEnter}
            >
              开始探索 →
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
