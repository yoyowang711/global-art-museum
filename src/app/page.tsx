'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Globe from '@/components/globe/Globe'
import HomeOverlay from '@/components/ui/HomeOverlay'
import PaintingPanel from '@/components/panels/PaintingPanel'
import GlobeSearchBar from '@/components/search/GlobeSearchBar'
import SearchResultsOverlay from '@/components/search/SearchResultsOverlay'
import CivilizationRail from '@/components/search/CivilizationRail'
import type { PaintingNode } from '@/components/globe/Marker'

const EASE = [0.4, 0, 0.2, 1] as const

const REGION_COUNTRIES: Record<string, string[]> = {
  asia: ['China', 'Japan', 'South Korea', 'India', 'Iran', 'Turkey', 'Thailand', 'Vietnam', 'Mongolia', 'Nepal', 'Indonesia', 'Philippines', 'Russia'],
  europe: ['France', 'Italy', 'Spain', 'Netherlands', 'Norway', 'United Kingdom', 'Austria', 'Germany'],
  africa: ['Egypt', 'Ethiopia', 'South Africa', 'Tanzania'],
  north_america: ['United States of America', 'Canada', 'Mexico'],
  south_america: ['Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Uruguay', 'Ecuador'],
  oceania: ['Australia'],
}

function getRegionCountryFilter(regionId: string | null): string[] | null {
  if (!regionId) return null
  return REGION_COUNTRIES[regionId] || null
}

const REGION_CENTERS: Record<string, { lat: number; lng: number }> = {
  asia: { lat: 40, lng: 90 },
  europe: { lat: 50, lng: 10 },
  africa: { lat: 5, lng: 25 },
  north_america: { lat: 45, lng: -100 },
  south_america: { lat: -15, lng: -60 },
  oceania: { lat: -25, lng: 135 },
}

export default function Home() {
  const [selected, setSelected] = useState<PaintingNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeRegion, setActiveRegion] = useState<string | null>(null)
  const [regionFocus, setRegionFocus] = useState<{ lat: number; lng: number } | null>(null)

  const regionCountries = useMemo(() => getRegionCountryFilter(activeRegion), [activeRegion])

  const handleRegionSelect = (region: { id: string; label: string; center: { lat: number; lng: number } } | null) => {
    if (!region) { setActiveRegion(null); setRegionFocus(null); return }
    setActiveRegion(activeRegion === region.id ? null : region.id)
    setRegionFocus(activeRegion === region.id ? null : region.center)
  }

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      <motion.div
        className="w-full h-full"
        animate={{
          x: selected ? '-18%' : '0%',
          scale: selected ? 1.15 : 1,
        }}
        transition={{ duration: 1.0, ease: EASE }}
        style={{ transformOrigin: 'center center' }}
      >
        <Globe
          onClickNode={setSelected}
          searchQuery={searchQuery}
          regionFilter={regionCountries}
          regionFocus={regionFocus}
        />
      </motion.div>

      <CivilizationRail
        activeRegion={activeRegion}
        onSelect={handleRegionSelect}
      />
      <GlobeSearchBar onSearch={setSearchQuery} />
      <SearchResultsOverlay query={searchQuery} onSelect={(node) => { setSelected(node); setSearchQuery('') }} />
      <HomeOverlay />
      <PaintingPanel node={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
