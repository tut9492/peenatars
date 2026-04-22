import { hashSeed, getHashBool, getHashInt } from './hash'

export type PatternType = 'normal' | 'thick' | 'chode' | 'rocket'

export interface PatternOptions {
  seed: string
  size?: number
  gridSize?: number
  symmetric?: boolean
}

export interface Pattern {
  cells: boolean[][]
  type: PatternType
  gridSize: number
  hasFace: boolean
  faceRow: number
  faceCx: number
  faceWidth: number
}

/**
 * Generate a phallic pattern from a seed.
 * Traits derived from hash: shaft length, shaft width, ball size, head size, smiley face.
 */
export function generatePattern(options: PatternOptions): Pattern {
  const { seed, gridSize = 9 } = options
  const hash = hashSeed(seed)

  const types: PatternType[] = ['normal', 'thick', 'chode', 'rocket']
  const type = types[getHashInt(hash, 0, 0, types.length - 1)]

  const cells: boolean[][] = []
  for (let y = 0; y < gridSize; y++) cells.push(new Array(gridSize).fill(false))

  const cx = Math.floor(gridSize / 2)

  // --- Traits from hash ---
  const headSize = getHashInt(hash, 1, 1, 3)       // head width from center: 1-3
  const headRows = getHashInt(hash, 2, 1, 3)        // head height: 1-3 rows
  const shaftWidth = type === 'chode'
    ? headSize                                        // chode = same width as head
    : getHashInt(hash, 3, 1, Math.max(1, headSize - 1)) // thinner than head
  const shaftLength = getHashInt(hash, 4, 2, gridSize - headRows - 2) // 2 to remaining space
  const ballSize = getHashInt(hash, 5, 0, 2)         // 0=small, 1=medium, 2=big
  const hasFace = getHashBool(hash, 6, 0.4)          // 40% chance of smiley

  // --- Head (top) ---
  for (let r = 0; r < headRows; r++) {
    // First row slightly narrower for rounded look (unless rocket)
    let w = headSize
    if (type === 'rocket') {
      // Pointed: narrows toward top
      w = Math.max(1, headSize - (headRows - 1 - r))
    } else if (r === 0 && headRows > 1) {
      w = Math.max(1, headSize - 1)
    }
    for (let dx = -w; dx <= w; dx++) {
      const x = cx + dx
      if (x >= 0 && x < gridSize) cells[r][x] = true
    }
  }

  // --- Shaft ---
  const shaftStart = headRows
  const shaftEnd = Math.min(shaftStart + shaftLength, gridSize - 2)
  for (let y = shaftStart; y < shaftEnd; y++) {
    for (let dx = -shaftWidth; dx <= shaftWidth; dx++) {
      const x = cx + dx
      if (x >= 0 && x < gridSize) cells[y][x] = true
    }
  }

  // --- Balls (bottom) ---
  const ballTop = shaftEnd
  const ballSpread = Math.max(shaftWidth + 1, 2)
  const ballRows = ballSize === 0 ? 1 : ballSize === 1 ? 2 : Math.min(3, gridSize - ballTop)

  for (let r = 0; r < ballRows; r++) {
    const y = ballTop + r
    if (y >= gridSize) break

    // Left ball
    for (let dx = -ballSpread; dx <= -1; dx++) {
      const x = cx + dx
      if (x >= 0 && x < gridSize) cells[y][x] = true
    }
    // Right ball
    for (let dx = 1; dx <= ballSpread; dx++) {
      const x = cx + dx
      if (x >= 0 && x < gridSize) cells[y][x] = true
    }
    // Gap between balls
    cells[y][cx] = false
  }

  // Find the face row (middle of head)
  const faceRow = Math.floor(headRows / 2)

  return { cells, type, gridSize, hasFace, faceRow, faceCx: cx, faceWidth: headSize }
}
