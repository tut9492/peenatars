import { Pattern } from './pattern'

export interface AsciiOptions {
  style?: string
}

// The full ASCII density ramp — dark to light
const RAMP = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'.'.split('')

// Pick characters from the ramp based on a hash value
const dense = (offset: number) => RAMP[offset % 12]           // dark chars: $@B%8&WM#*oa
const medium = (offset: number) => RAMP[12 + (offset % 16)]   // mid chars: hkbdpqwmZO0QLCJU
const light = (offset: number) => RAMP[40 + (offset % 15)]    // light chars: xrjft/\|()1{}[]

// Head bracket pairs from the ramp
const HEAD_PAIRS = [
  ['(', ')'], ['{', '}'], ['[', ']'], ['/', '\\'], ['(', ')'],
  ['<', '>'], ['|', '|'], ['!', '!'], ['(', ')'], ['{', '}'],
]

// Eye characters
const EYES = ['o', 'O', '0', '*', '@', '8', '#', 'Q', 'B', '%', 'W', '&', 'b', 'd', 'q', 'p']

// Mouth characters
const MOUTHS = ['~', '-', '_', 'v', 'w', 'u', 'o', 'c', 'J', 'U', 'n', 'z', '^']

// Ball characters
const BALLS = ['@', 'B', '8', '%', '&', 'W', 'M', '#', 'Q', 'O', '0', 'o', 'a', '*']

// Tip characters
const TIPS = ['^', '*', 'o', 'Y', 'T', 'A', 'V', 'W', 'M', '#']

// Border characters
const BORDER_H = ['-', '=', '~', '_', '+', '-', '~', '=']
const BORDER_V = ['|', '!', '|', ':', ';', '!', '|', ':']

/**
 * Render a pattern as ASCII art using only the standard ASCII density ramp
 */
export function renderAscii(pattern: Pattern, options: AsciiOptions = {}): string {
  const { cells, gridSize, hasFace, faceRow, faceCx, faceWidth } = pattern

  // Simple hash from cell data for character selection
  let ch = 0
  for (let y = 0; y < gridSize; y++)
    for (let x = 0; x < gridSize; x++)
      if (cells[y][x]) ch = (ch * 31 + y * gridSize + x) >>> 0

  const pick = (arr: any[], off: number) => arr[(ch + off) % arr.length]

  const headFill = dense(ch)
  const headFill2 = dense(ch + 3)
  const [headL, headR] = pick(HEAD_PAIRS, 0) as string[]
  const shaftEdge = pick(BORDER_V, 1) as string
  const shaftFill1 = medium(ch + 1)
  const shaftFill2 = medium(ch + 5)
  const shaftFill3 = medium(ch + 9)
  const ballChar = pick(BALLS, 2) as string
  const tipChar = pick(TIPS, 3) as string
  const eyeChar = pick(EYES, 4) as string
  const mouthChar = pick(MOUTHS, 5) as string
  const borderH = pick(BORDER_H, 6) as string
  const borderV = pick(BORDER_V, 7) as string

  // Find regions
  const headEnd = findHeadEnd(cells, gridSize)
  const ballStart = findBallStart(cells, gridSize, faceCx)

  const W = 5 // chars per cell
  const lines: string[] = []

  for (let y = 0; y < gridSize; y++) {
    let line = ''
    const isHead = y <= headEnd
    const isBall = y >= ballStart
    const isShaft = !isHead && !isBall

    for (let x = 0; x < gridSize; x++) {
      if (!cells[y][x]) {
        line += ' '.repeat(W)
        continue
      }

      // Face
      if (hasFace && faceWidth >= 2 && y === faceRow) {
        if (x === faceCx - 1) { line += '  ' + eyeChar + '  '; continue }
        if (x === faceCx + 1) { line += '  ' + eyeChar + '  '; continue }
        if (x === faceCx) { line += '  ' + mouthChar + '  '; continue }
      }

      // Tip
      if (y === 0 && isHead) {
        const filledInRow = cells[y].filter(Boolean).length
        if (filledInRow <= 1) { line += '  ' + tipChar + '  '; continue }
      }

      // Head
      if (isHead) {
        const leftEdge = (x === 0 || !cells[y][x - 1]) && cells[y][x]
        const rightEdge = cells[y][x] && (x + 1 >= gridSize || !cells[y][x + 1])
        if (leftEdge && !rightEdge) { line += headL + headFill + headFill2 + headFill + headFill2; continue }
        if (rightEdge && !leftEdge) { line += headFill2 + headFill + headFill2 + headFill + headR; continue }
        line += headFill + headFill2 + headFill + headFill2 + headFill
        continue
      }

      // Shaft
      if (isShaft) {
        const leftEdge = x === 0 || !cells[y][x - 1]
        const rightEdge = x + 1 >= gridSize || !cells[y][x + 1]
        const fills = [shaftFill1, shaftFill2, shaftFill3]
        const fi = (y + x) % 3
        if (leftEdge) { line += shaftEdge + fills[fi] + fills[(fi+1)%3] + fills[(fi+2)%3] + fills[fi]; continue }
        if (rightEdge) { line += fills[fi] + fills[(fi+1)%3] + fills[(fi+2)%3] + fills[fi] + shaftEdge; continue }
        line += fills[fi] + fills[(fi+1)%3] + fills[(fi+2)%3] + fills[fi] + fills[(fi+1)%3]
        continue
      }

      // Balls
      if (isBall) {
        if (x === faceCx) { line += ' '.repeat(W); continue }
        line += ballChar.repeat(W)
        continue
      }

      line += shaftFill1.repeat(W)
    }
    lines.push(line)
  }

  // Center all lines
  const maxLen = Math.max(...lines.map(l => l.length))
  const centered = lines.map(l => {
    const pad = Math.max(0, Math.floor((maxLen - l.length) / 2))
    return ' '.repeat(pad) + l
  })

  return centered.join('\n')
}

function findHeadEnd(cells: boolean[][], gridSize: number): number {
  let prevWidth = 0
  for (let y = 0; y < gridSize; y++) {
    let w = 0
    for (let x = 0; x < gridSize; x++) if (cells[y][x]) w++
    if (y > 0 && w < prevWidth && w > 0) return y - 1
    prevWidth = w
  }
  return 0
}

function findBallStart(cells: boolean[][], gridSize: number, cx: number): number {
  for (let y = gridSize - 1; y >= 0; y--) {
    if (!cells[y][cx] && cells[y].some(Boolean)) return y
  }
  return gridSize
}
