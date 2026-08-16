import type { ProbeInput } from '@axiocnc/shared/src/schemas/settings'
import { buildSetZeroCommand, buildSetZeroWithOffsetCommand } from './gcode'
import { appendProbeInput } from './probeInput'

export type EdgeProbeXYRoutine =
  | 'edge-x-positive'
  | 'edge-x-negative'
  | 'edge-y-positive'
  | 'edge-y-negative'
  | 'inside-bottom-left'
  | 'inside-bottom-right'
  | 'inside-top-left'
  | 'inside-top-right'
  | 'outside-bottom-left'
  | 'outside-bottom-right'
  | 'outside-top-left'
  | 'outside-top-right'
  | 'center-x'
  | 'center-y'
  | 'center-xy'

export type EdgeProbeRoutine = EdgeProbeXYRoutine | 'edge-z-negative'

export interface EdgeProbeMotionConfig {
  probeInput?: ProbeInput
  tipDiameter: number
  probeFeedrate: number
  fineProbeFeedrate: number
  probeDistance: number
  retractDistance: number
  cornerSweepDistance: number
  zOffset: number
}

interface BuildEdgeProbeMacroOptions {
  routine: EdgeProbeRoutine
  currentWCS: string
  config: EdgeProbeMotionConfig
}

type Axis = 'X' | 'Y' | 'Z'
type Direction = -1 | 1

function signed(value: number, direction: Direction): string {
  const magnitude = Math.abs(value)
  return `${direction < 0 ? '-' : ''}${magnitude}`
}

function setAxisAtContact(
  currentWCS: string,
  axis: Axis,
  direction: Direction,
  tipRadius: number,
  zOffset: number
): string {
  if (axis === 'Z') {
    return buildSetZeroWithOffsetCommand(currentWCS, 'Z', zOffset)
  }

  // At contact the probe center is one radius away from the surface.
  // +axis probing leaves the center on the negative side of the datum and vice versa.
  return buildSetZeroWithOffsetCommand(currentWCS, axis, -direction * tipRadius)
}

function doubleTouchLines(
  axis: Axis,
  direction: Direction,
  config: EdgeProbeMotionConfig
): string[] {
  const fineTravel = config.retractDistance + Math.max(1, config.retractDistance)

  return [
    appendProbeInput(
      `G38.2 ${axis}${signed(config.probeDistance, direction)} F${config.probeFeedrate}`,
      config.probeInput
    ),
    `G0 ${axis}${signed(config.retractDistance, direction === 1 ? -1 : 1)}`,
    appendProbeInput(
      `G38.2 ${axis}${signed(fineTravel, direction)} F${config.fineProbeFeedrate}`,
      config.probeInput
    ),
  ]
}

function faceLines(
  axis: Axis,
  direction: Direction,
  currentWCS: string,
  config: EdgeProbeMotionConfig
): string[] {
  const tipRadius = config.tipDiameter / 2
  return [
    'G91',
    ...doubleTouchLines(axis, direction, config),
    'G90',
    setAxisAtContact(currentWCS, axis, direction, tipRadius, config.zOffset),
    'G91',
    `G0 ${axis}${signed(config.retractDistance, direction === 1 ? -1 : 1)}`,
  ]
}

function insideCornerLines(
  xDirection: Direction,
  yDirection: Direction,
  currentWCS: string,
  config: EdgeProbeMotionConfig
): string[] {
  return [
    '; Probe the two directly visible faces of an inside corner',
    ...faceLines('X', xDirection, currentWCS, config),
    ...faceLines('Y', yDirection, currentWCS, config),
  ]
}

function outsideCornerLines(
  materialXDirection: Direction,
  materialYDirection: Direction,
  currentWCS: string,
  config: EdgeProbeMotionConfig
): string[] {
  const tipRadius = config.tipDiameter / 2
  const oppositeX: Direction = materialXDirection === 1 ? -1 : 1
  const oppositeY: Direction = materialYDirection === 1 ? -1 : 1

  return [
    '; Start diagonally outside the corner. Move into the Y span while X remains clear.',
    'G91',
    `G0 Y${signed(config.cornerSweepDistance, materialYDirection)}`,
    ...doubleTouchLines('X', materialXDirection, config),
    'G90',
    setAxisAtContact(currentWCS, 'X', materialXDirection, tipRadius, config.zOffset),
    'G91',
    `G0 X${signed(config.retractDistance, oppositeX)}`,
    `G0 Y${signed(config.cornerSweepDistance, oppositeY)}`,
    '; Move into the X span while Y remains clear.',
    `G0 X${signed(config.cornerSweepDistance, materialXDirection)}`,
    ...doubleTouchLines('Y', materialYDirection, config),
    'G90',
    setAxisAtContact(currentWCS, 'Y', materialYDirection, tipRadius, config.zOffset),
    'G91',
    `G0 Y${signed(config.retractDistance, oppositeY)}`,
    `G0 X${signed(config.cornerSweepDistance, oppositeX)}`,
  ]
}

function centerAxisLines(
  axis: 'X' | 'Y',
  currentWCS: string,
  config: EdgeProbeMotionConfig
): string[] {
  const startVar = `${axis}_START`
  const positiveVar = `${axis}_POSITIVE`
  const negativeVar = `${axis}_NEGATIVE`
  const centerVar = `${axis}_CENTER`

  return [
    'G90',
    `%${startVar}=pos${axis.toLowerCase()}`,
    'G91',
    ...doubleTouchLines(axis, 1, config),
    '%wait',
    'G90',
    `%${positiveVar}=pos${axis.toLowerCase()}`,
    `G0 ${axis}[${startVar}]`,
    'G91',
    ...doubleTouchLines(axis, -1, config),
    '%wait',
    'G90',
    `%${negativeVar}=pos${axis.toLowerCase()}`,
    `%${centerVar}=(${positiveVar}+${negativeVar})/2`,
    `G0 ${axis}[${centerVar}]`,
    '%wait',
    buildSetZeroCommand(currentWCS, axis.toLowerCase() as 'x' | 'y'),
  ]
}

function centerLines(
  axes: 'x' | 'y' | 'xy',
  currentWCS: string,
  config: EdgeProbeMotionConfig
): string[] {
  const lines: string[] = ['; Probe opposite faces and move to their midpoint']
  if (axes.includes('x')) lines.push(...centerAxisLines('X', currentWCS, config))
  if (axes.includes('y')) lines.push(...centerAxisLines('Y', currentWCS, config))
  return lines
}

function routineLines(
  routine: EdgeProbeRoutine,
  currentWCS: string,
  config: EdgeProbeMotionConfig
): string[] {
  switch (routine) {
    case 'edge-x-positive': return faceLines('X', 1, currentWCS, config)
    case 'edge-x-negative': return faceLines('X', -1, currentWCS, config)
    case 'edge-y-positive': return faceLines('Y', 1, currentWCS, config)
    case 'edge-y-negative': return faceLines('Y', -1, currentWCS, config)
    case 'edge-z-negative': return faceLines('Z', -1, currentWCS, config)
    case 'inside-bottom-left': return insideCornerLines(-1, -1, currentWCS, config)
    case 'inside-bottom-right': return insideCornerLines(1, -1, currentWCS, config)
    case 'inside-top-left': return insideCornerLines(-1, 1, currentWCS, config)
    case 'inside-top-right': return insideCornerLines(1, 1, currentWCS, config)
    case 'outside-bottom-left': return outsideCornerLines(1, 1, currentWCS, config)
    case 'outside-bottom-right': return outsideCornerLines(-1, 1, currentWCS, config)
    case 'outside-top-left': return outsideCornerLines(1, -1, currentWCS, config)
    case 'outside-top-right': return outsideCornerLines(-1, -1, currentWCS, config)
    case 'center-x': return centerLines('x', currentWCS, config)
    case 'center-y': return centerLines('y', currentWCS, config)
    case 'center-xy': return centerLines('xy', currentWCS, config)
  }
}

function finalizeMacro(lines: string[]): string {
  return lines
    .map((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('%') && !trimmed.match(/^%msg\b/i) && !trimmed.match(/^%wait\b/i)) {
        return trimmed.replace(/;.*$/, '').trim()
      }
      return trimmed
    })
    .filter(Boolean)
    .join('\n')
}

export function buildEdgeProbeMacro({
  routine,
  currentWCS,
  config,
}: BuildEdgeProbeMacroOptions): string {
  return finalizeMacro([
    '%wait',
    '%UNITS=modal.units',
    '%DISTANCE=modal.distance',
    '%FEEDRATE=modal.feedrate',
    '%MOTION=modal.motion',
    'G21',
    'M5',
    ...routineLines(routine, currentWCS, config),
    'G90',
    '%wait',
    // Deliberately leave the spindle stopped. A probe routine must never
    // restart a spindle while the touch probe is installed.
    '[UNITS] [DISTANCE] [FEEDRATE] [MOTION]',
    '%wait',
  ])
}
