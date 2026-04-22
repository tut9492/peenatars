import { Pattern } from './pattern'

export interface SVGOptions {
  size?: number
  foreground?: string
  background?: string
  padding?: number
}

/**
 * Render a smiley face on the head (eyes + smile)
 */
function renderFace(pattern: Pattern, cellSize: number, paddingPx: number, bgColor: string): string {
  if (!pattern.hasFace || pattern.faceWidth < 2) return ''

  const cx = pattern.faceCx
  const row = pattern.faceRow
  const eyeSize = cellSize * 0.3
  const eyeY = paddingPx + row * cellSize + cellSize * 0.35

  // Eyes
  const leftEyeX = paddingPx + (cx - 1) * cellSize + cellSize * 0.5
  const rightEyeX = paddingPx + (cx + 1) * cellSize + cellSize * 0.5

  // Smile (arc below eyes)
  const smileY = eyeY + cellSize * 0.5
  const smileCx = paddingPx + cx * cellSize + cellSize * 0.5
  const smileR = cellSize * 0.6

  return `<circle cx="${leftEyeX}" cy="${eyeY}" r="${eyeSize}" fill="${bgColor}"/>` +
    `<circle cx="${rightEyeX}" cy="${eyeY}" r="${eyeSize}" fill="${bgColor}"/>` +
    `<path d="M${smileCx - smileR},${smileY} Q${smileCx},${smileY + smileR * 0.8} ${smileCx + smileR},${smileY}" stroke="${bgColor}" stroke-width="${eyeSize * 0.7}" fill="none" stroke-linecap="round"/>`
}

/**
 * Render a pattern as an SVG string
 */
export function renderSVG(pattern: Pattern, options: SVGOptions = {}): string {
  const {
    size = 100,
    foreground = '#000000',
    background = '#ffffff',
    padding = 0.15,
  } = options

  const { cells, gridSize } = pattern
  const paddingPx = size * padding
  const innerSize = size - paddingPx * 2
  const cellSize = innerSize / gridSize

  let rects = ''

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (cells[y][x]) {
        const px = paddingPx + x * cellSize
        const py = paddingPx + y * cellSize
        rects += `<rect x="${px}" y="${py}" width="${cellSize}" height="${cellSize}" fill="${foreground}"/>`
      }
    }
  }

  const face = renderFace(pattern, cellSize, paddingPx, background)

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
    foreground = '#000000',
    background = '#ffffff',
    padding = 0.15,
  } = options

  const { cells, gridSize } = pattern
  const paddingPx = size * padding
  const innerSize = size - paddingPx * 2
  const cellSize = innerSize / gridSize

  let path = ''

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (cells[y][x]) {
        const px = paddingPx + x * cellSize
        const py = paddingPx + y * cellSize
        path += `M${px},${py}h${cellSize}v${cellSize}h-${cellSize}z`
      }
    }
  }

  const face = renderFace(pattern, cellSize, paddingPx, background)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${background}"/><path d="${path}" fill="${foreground}"/>${face}</svg>`
}
