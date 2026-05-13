export interface ArtworkComment {
  user: string
  role: string
  content: string
}

export type Importance = 'legendary' | 'masterpiece' | 'major'

export interface Artwork {
  id: string
  title: string
  artist: string
  year: number
  country: string
  museum: string

  thumbnail: string
  image: string

  position: { lat: number; lng: number }

  historicalBackground: string
  artisticTechnique: string
  symbolism: string
  museumContext: string

  shortQuote: string

  tags: string[]

  importance?: Importance

  comments?: ArtworkComment[]
}

/** 用于 Marker 节点的精简版 */
export interface ArtworkNode {
  id: string
  title: string
  artist: string
  year: number
  country: string
  thumbnail: string
  image: string
  position: { lat: number; lng: number }
  importance: Importance
  shortQuote: string
}
