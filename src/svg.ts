import { Pattern } from './pattern'

export interface SVGOptions {
  size?: number
  foreground?: string
  background?: string
  padding?: number
}

function sanitizeColor(c: string): string {
  if (/^#[0-9A-Fa-f]{3,8}$/.test(c)) return c
  if (/^(rgb|hsl)a?\([^)]+\)$/.test(c)) return c
  return '#000000'
}

/**
 * Render a smiley face on the head (eyes + smile)
 */
function renderFace(pattern: Pattern, cellSize: number, offsetX: number, bgColor: string, offsetY?: number, faceRow?: number): string {
  if (!pattern.hasFace || pattern.faceWidth < 2) return ''

  const cx = pattern.faceCx
  const row = faceRow ?? pattern.faceRow
  const oX = offsetX
  const oY = offsetY ?? offsetX
  const eyeSize = cellSize * 0.3
  const eyeY = oY + row * cellSize + cellSize * 0.35

  const leftEyeX = oX + (cx - 1) * cellSize + cellSize * 0.5
  const rightEyeX = oX + (cx + 1) * cellSize + cellSize * 0.5

  const smileY = eyeY + cellSize * 0.5
  const smileCx = oX + cx * cellSize + cellSize * 0.5
  const smileR = cellSize * 0.6

  return `<circle cx="${leftEyeX}" cy="${eyeY}" r="${eyeSize}" fill="${bgColor}"/>` +
    `<circle cx="${rightEyeX}" cy="${eyeY}" r="${eyeSize}" fill="${bgColor}"/>` +
    `<path d="M${smileCx - smileR},${smileY} Q${smileCx},${smileY + smileR * 0.8} ${smileCx + smileR},${smileY}" stroke="${bgColor}" stroke-width="${eyeSize * 0.7}" fill="none" stroke-linecap="round"/>`
}

/**
 * Find bounding box of filled cells
 */
function findBounds(cells: boolean[][], gridSize: number) {
  let minX = gridSize, maxX = 0, minY = gridSize, maxY = 0
  for (let y = 0; y < gridSize; y++)
    for (let x = 0; x < gridSize; x++)
      if (cells[y][x]) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
  return { minX, maxX, minY, maxY }
}

/**
 * Render a pattern as an SVG string — centered in frame
 */
export function renderSVG(pattern: Pattern, options: SVGOptions = {}): string {
  const {
    size = 100,
    foreground: rawFg = '#000000',
    background: rawBg = '#ffffff',
    padding = 0.15,
  } = options
  const foreground = sanitizeColor(rawFg)
  const background = sanitizeColor(rawBg)

  const { cells, gridSize } = pattern
  const paddingPx = size * padding
  const innerSize = size - paddingPx * 2

  // Find bounds and center the art
  const { minX, maxX, minY, maxY } = findBounds(cells, gridSize)
  const artW = maxX - minX + 1
  const artH = maxY - minY + 1
  const maxDim = Math.max(artW, artH)
  const cellSize = innerSize / maxDim
  const offsetX = paddingPx + (innerSize - artW * cellSize) / 2 - minX * cellSize
  const offsetY = paddingPx + (innerSize - artH * cellSize) / 2 - minY * cellSize

  let rects = ''

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (cells[y][x]) {
        const px = offsetX + x * cellSize
        const py = offsetY + y * cellSize
        rects += `<rect x="${px}" y="${py}" width="${cellSize}" height="${cellSize}" fill="${foreground}"/>`
      }
    }
  }

  const face = renderFace(pattern, cellSize, offsetX, background, offsetY, pattern.faceRow)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
<rect width="${size}" height="${size}" fill="${background}"/>
${rects}
${face}
</svg>`
}

/**
 * Render pattern as a minimal path-based SVG (smaller file size)
 */
export function renderSVGPath(pattern: Pattern, options: SVGOptions = {}): string {
  const {
    size = 100,
    foreground: rawFg = '#000000',
    background: rawBg = '#ffffff',
    padding = 0.15,
  } = options
  const foreground = sanitizeColor(rawFg)
  const background = sanitizeColor(rawBg)

  const { cells, gridSize } = pattern
  const paddingPx = size * padding
  const innerSize = size - paddingPx * 2

  const { minX, maxX, minY, maxY } = findBounds(cells, gridSize)
  const artW = maxX - minX + 1
  const artH = maxY - minY + 1
  const maxDim = Math.max(artW, artH)
  const cellSize = innerSize / maxDim
  const offsetX = paddingPx + (innerSize - artW * cellSize) / 2 - minX * cellSize
  const offsetY = paddingPx + (innerSize - artH * cellSize) / 2 - minY * cellSize

  let path = ''

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (cells[y][x]) {
        const px = offsetX + x * cellSize
        const py = offsetY + y * cellSize
        path += `M${px},${py}h${cellSize}v${cellSize}h-${cellSize}z`
      }
    }
  }

  const face = renderFace(pattern, cellSize, offsetX, background, offsetY, pattern.faceRow)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${background}"/><path d="${path}" fill="${foreground}"/>${face}</svg>`
}
