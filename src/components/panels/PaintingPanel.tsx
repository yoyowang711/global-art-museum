'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PaintingNode } from '@/components/globe/Marker'
import PaintingImage from './PaintingImage'

interface Props {
  node: PaintingNode | null
  onClose: () => void
}

const EASE = [0.4, 0, 0.2, 1] as const

interface ArtworkData {
  title:string;artist:string;year:number;country:string;museum:string;
  thumbnail:string;image:string;historicalBackground:string;artisticTechnique:string;
  symbolism:string;museumContext:string;shortQuote:string;tags:string[];importance:string;comments:{u:string;r:string;t:string}[];
}

let artworkCache: ArtworkData[] | null = null;

export default function PaintingPanel({ node, onClose }: Props) {
  const [artworks, setArtworks] = useState<ArtworkData[] | null>(artworkCache);

  useEffect(() => { document.body.style.overflow = node ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [node]);
  useEffect(() => { if(!artworkCache){fetch('/artworks.json').then(r=>r.json()).then(d=>{artworkCache=d;setArtworks(d)})} }, []);

  const artwork = artworks?.find(a => a.title === node?.title);

  return (
    <AnimatePresence>
      {node && (
        <>
          <motion.div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.3)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE }} onClick={onClose}
          />

          <motion.aside className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-y-auto"
            style={{ background: '#FAF9F7', width: 'clamp(360px, 40vw, 560px)', maxWidth: '100vw' }}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <button onClick={onClose}
              style={{ position: 'absolute', top: 20, right: 24, zIndex: 10, fontFamily: 'Inter, sans-serif',
                fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8C7E6A',
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                borderBottom: '0.5px solid #8C7E6A' }}>
              Close
            </button>

            <div style={{ padding: '48px 40px 0', maxWidth: 500 }}>
              <motion.p
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.15, ease: EASE }}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: '#8C7E6A', margin: 0 }}>
                {node.artist}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
                style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 3.5vw, 42px)',
                  fontWeight: 400, color: '#1A1A1A', margin: '10px 0 0', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                {node.title}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.45, ease: EASE }}
                style={{ display: 'flex', gap: 16, marginTop: 14, fontFamily: 'Inter, sans-serif',
                  fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D6D3D1' }}>
                <span>{node.year}</span>
                <span style={{ width: '0.5px', background: '#D6D3D1' }} />
                <span>{artwork?.museum || node.country}</span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.35, ease: EASE }}
              style={{ padding: '0 40px', marginTop: 36 }}>
              <PaintingImage src={node.image || node.thumbnail} alt={node.title} title={node.title} artist={node.artist} year={node.year} />
            </motion.div>

            {/* shortQuote */}
            {artwork?.shortQuote ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.7, ease: EASE }}
                style={{ padding: '0 40px', marginTop: 36, fontFamily: 'Source Serif Pro, Georgia, serif', fontSize: 16, lineHeight: 1.5, color: '#8C7E6A', fontStyle: 'italic', letterSpacing: '0.01em' }}>
                "{artwork.shortQuote}"
              </motion.p>
            ) : null}

            <div style={{ padding: '0 40px 80px', maxWidth: 500, marginTop: 56 }}>
              <div style={{ width: '100%', height: '0.5px', background: '#D6D3D1', marginBottom: 56 }} />
              {artwork?.historicalBackground ? (
                <>
                  <div style={{ marginBottom: 44 }}><h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D6D3D1', margin: '0 0 12px' }}>历史背景</h3><p style={{ fontFamily: 'Source Serif Pro, Georgia, serif', fontSize: 13, lineHeight: 1.9, color: '#4A4A4A', margin: 0 }}>{artwork.historicalBackground}</p></div>
                  {artwork.artisticTechnique ? <div style={{ marginBottom: 44 }}><h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D6D3D1', margin: '0 0 12px' }}>技法分析</h3><p style={{ fontFamily: 'Source Serif Pro, Georgia, serif', fontSize: 13, lineHeight: 1.9, color: '#4A4A4A', margin: 0 }}>{artwork.artisticTechnique}</p></div> : null}
                  {artwork.symbolism ? <div style={{ marginBottom: 44 }}><h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D6D3D1', margin: '0 0 12px' }}>象征意义</h3><p style={{ fontFamily: 'Source Serif Pro, Georgia, serif', fontSize: 13, lineHeight: 1.9, color: '#4A4A4A', margin: 0 }}>{artwork.symbolism}</p></div> : null}
                  {artwork.museumContext ? <div style={{ marginBottom: 44 }}><h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D6D3D1', margin: '0 0 12px' }}>馆藏信息</h3><p style={{ fontFamily: 'Source Serif Pro, Georgia, serif', fontSize: 13, lineHeight: 1.9, color: '#4A4A4A', margin: 0 }}>{artwork.museumContext}</p></div> : null}
                  {artwork.comments?.length > 0 ? (
                    <div style={{ marginTop: 60 }}>
                      <div style={{ width: '100%', height: '0.5px', background: '#D6D3D1', marginBottom: 36 }} />
                      <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D6D3D1', margin: '0 0 28px' }}>Comments</h3>
                      {artwork.comments.map((c, i) => (
                        <div key={i} style={{ marginBottom: 28 }}><p style={{ fontFamily: 'Source Serif Pro, Georgia, serif', fontSize: 13, lineHeight: 1.75, color: '#1A1A1A', margin: 0 }}>{c.t}</p><p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D6D3D1', marginTop: 6 }}>{c.u}, {c.r}</p></div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p style={{ fontFamily: 'Source Serif Pro, Georgia, serif', fontSize: 13, lineHeight: 1.9, color: '#4A4A4A', margin: 0 }}>{node.artist} 创作于 {node.year} 年的作品《{node.title}》。</p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
