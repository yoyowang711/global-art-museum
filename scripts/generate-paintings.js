// 生成画作缩略图到 public/paintings/
// 用法: node scripts/generate-paintings.js

const { createCanvas } = require('canvas') || {}
const fs = require('fs')
const path = require('path')

// 如果没装 canvas，用纯色 SVG 代替
const paintings = [
  { id: 'starry-night', color: '#1a3a5c' },
  { id: 'mona-lisa', color: '#5c3a1a' },
  { id: 'the-scream', color: '#c44a20' },
  { id: 'great-wave', color: '#2a5a8c' },
  { id: 'pearl-earring', color: '#1a1a2e' },
  { id: 'guernica', color: '#3a3a3a' },
  { id: 'creation-adam', color: '#8c6a4a' },
  { id: 'school-athens', color: '#6a4a2a' },
  { id: 'venus-birth', color: '#c4a46a' },
  { id: 'melting-clocks', color: '#5a7a9a' },
  { id: 'last-supper', color: '#4a3a2a' },
  { id: 'the-kiss', color: '#c4a41a' },
  { id: 'night-watch', color: '#2a1a0a' },
  { id: 'liberty-leading', color: '#8a4a3a' },
  { id: 'sunflowers', color: '#c4a400' },
  { id: 'las-meninas', color: '#3a2a1a' },
  { id: 'wanderer-fog', color: '#4a5a6a' },
  { id: 'water-lilies', color: '#3a6a4a' },
  { id: 'goya-third', color: '#6a3a2a' },
  { id: 'gleaners', color: '#8a7a4a' },
  { id: 'arnolfini', color: '#2a3a2a' },
  { id: 'mondrian', color: '#cc0000' },
  { id: 'composition-7', color: '#3a4a8a' },
  { id: 'primavera', color: '#5a8a4a' },
  { id: 'night-cafe', color: '#8a4a1a' },
]

const dir = path.join(__dirname, '..', 'public', 'paintings')
fs.mkdirSync(dir, { recursive: true })

for (const p of paintings) {
  // 生成 320x320 纯色 PNG（1x1 像素拉伸最简单）
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">
    <rect width="320" height="320" fill="${p.color}"/>
  </svg>`
  fs.writeFileSync(path.join(dir, `${p.id}.svg`), svg)
  console.log(`Created ${p.id}.svg`)
}

console.log(`Done! ${paintings.length} images in ${dir}`)
