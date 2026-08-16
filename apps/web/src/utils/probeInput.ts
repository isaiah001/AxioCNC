import type { ProbeInput } from '@axiocnc/shared/src/schemas/settings'

/** Append an explicit grblHAL probe-input selector while preserving legacy commands by default. */
export function appendProbeInput(command: string, probeInput?: ProbeInput): string {
  return probeInput === undefined ? command : `${command} P${probeInput}`
}
