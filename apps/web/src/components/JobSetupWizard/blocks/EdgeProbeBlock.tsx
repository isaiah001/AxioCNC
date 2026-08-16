import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, Loader2, Play, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProbeCircuitVerification } from '@/components/ProbeCircuitVerification'
import { cn } from '@/lib/utils'
import { buildEdgeProbeMacro, type EdgeProbeRoutine } from '@/utils/edgeProbe'
import { runGcodeBatch } from '@/utils/runGcodeBatch'
import { SetupBlockLayout } from './SetupBlockLayout'
import type { SetupBlockProps } from './types'
import type { EdgeProbeConfig } from '@/routes/Settings/sections/ZeroingMethodsSection'

interface RoutineOption {
  id: EdgeProbeRoutine
  label: string
  symbol: string
}

const EDGE_ROUTINES: RoutineOption[] = [
  { id: 'edge-x-positive', label: 'Probe X+', symbol: 'X+' },
  { id: 'edge-x-negative', label: 'Probe X−', symbol: 'X−' },
  { id: 'edge-y-positive', label: 'Probe Y+', symbol: 'Y+' },
  { id: 'edge-y-negative', label: 'Probe Y−', symbol: 'Y−' },
]

const Z_ROUTINE: RoutineOption = { id: 'edge-z-negative', label: 'Probe Z−', symbol: 'Z−' }

const INSIDE_CORNER_ROUTINES: RoutineOption[] = [
  { id: 'inside-top-left', label: 'Inside top-left', symbol: '↖' },
  { id: 'inside-top-right', label: 'Inside top-right', symbol: '↗' },
  { id: 'inside-bottom-left', label: 'Inside bottom-left', symbol: '↙' },
  { id: 'inside-bottom-right', label: 'Inside bottom-right', symbol: '↘' },
]

const OUTSIDE_CORNER_ROUTINES: RoutineOption[] = [
  { id: 'outside-top-left', label: 'Outside top-left', symbol: '↖' },
  { id: 'outside-top-right', label: 'Outside top-right', symbol: '↗' },
  { id: 'outside-bottom-left', label: 'Outside bottom-left', symbol: '↙' },
  { id: 'outside-bottom-right', label: 'Outside bottom-right', symbol: '↘' },
]

const CENTER_ROUTINES: RoutineOption[] = [
  { id: 'center-x', label: 'Find X center', symbol: '↔' },
  { id: 'center-y', label: 'Find Y center', symbol: '↕' },
  { id: 'center-xy', label: 'Find X/Y center', symbol: '✣' },
]

function RoutineGroup({
  title,
  description,
  options,
  selected,
  onSelect,
}: {
  title: string
  description: string
  options: RoutineOption[]
  selected: EdgeProbeRoutine | null
  onSelect: (routine: EdgeProbeRoutine) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <div>
        <h4 className="text-sm font-medium">{t(title)}</h4>
        <p className="text-xs text-muted-foreground">{t(description)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              'rounded-lg border p-3 text-left transition-colors hover:bg-accent',
              selected === option.id && 'border-primary bg-primary/10 ring-1 ring-primary'
            )}
          >
            <div className="text-lg font-semibold text-primary">{option.symbol}</div>
            <div className="mt-1 text-xs font-medium">{t(option.label)}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function getRoutineOption(routine: EdgeProbeRoutine | null): RoutineOption | undefined {
  return [
    ...EDGE_ROUTINES,
    Z_ROUTINE,
    ...INSIDE_CORNER_ROUTINES,
    ...OUTSIDE_CORNER_ROUTINES,
    ...CENTER_ROUTINES,
  ].find((option) => option.id === routine)
}

function isOutsideCorner(routine: EdgeProbeRoutine | null): boolean {
  return routine?.startsWith('outside-') ?? false
}

function isCenterRoutine(routine: EdgeProbeRoutine | null): boolean {
  return routine?.startsWith('center-') ?? false
}

/**
 * Calibrated 3D spindle-probe block.
 * XY offers face, inside/outside-corner, and pocket/slot-center routines.
 * Z performs a two-pass downward touch and applies the configured trigger offset.
 * The one-off XYZ block lets the operator choose exactly one of those routines.
 */
export function EdgeProbeBlock({
  methods,
  blockKind,
  context,
  onComplete,
  onError,
  debugAllowNext,
  footerLeftExtra,
  footerRightExtra,
}: SetupBlockProps) {
  const { t } = useTranslation()
  const method = methods[0] as EdgeProbeConfig | undefined
  const { connectedPort, currentWCS, probeContact = false } = context
  const isZ = blockKind === 'edgeprobe_z'
  const isXYZ = blockKind === 'edgeprobe_xyz'
  const showVerifyStep = method?.requireCheck !== false
  const stepIds = useMemo(
    () => [
      ...(showVerifyStep ? ['verify'] : []),
      ...(!isZ ? ['choose'] : []),
      'position',
      'run',
      'complete',
    ] as const,
    [isZ, showVerifyStep]
  )
  const [step, setStep] = useState(1)
  const [selectedRoutine, setSelectedRoutine] = useState<EdgeProbeRoutine | null>(null)
  const [status, setStatus] = useState<'idle' | 'probing' | 'complete' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const stepId = stepIds[step - 1]
  const selectedOption = getRoutineOption(selectedRoutine)
  const selectedIsZ = (isZ ? 'edge-z-negative' : selectedRoutine) === 'edge-z-negative'
  const faceRoutines = isXYZ ? [...EDGE_ROUTINES, Z_ROUTINE] : EDGE_ROUTINES

  const runProbe = useCallback(() => {
    if (!method || method.type !== 'edgeprobe' || !connectedPort) return
    const routine = isZ ? 'edge-z-negative' : selectedRoutine
    if (!routine) return

    if (
      method.tipDiameter <= 0
      || method.probeDistance <= 0
      || method.probeFeedrate <= 0
      || method.fineProbeFeedrate <= 0
      || method.retractDistance <= 0
      || method.cornerSweepDistance <= 0
    ) {
      const message = t('Edge Probe settings must use positive diameters, distances, and feedrates.')
      setStatus('error')
      setErrorMessage(message)
      onError(message)
      return
    }

    const gcode = buildEdgeProbeMacro({ routine, currentWCS, config: method })
    setStatus('probing')
    setErrorMessage(null)
    runGcodeBatch({ gcode, port: connectedPort, waitForIdle: true })
      .then(() => setStatus('complete'))
      .catch((error) => {
        const message = error?.message ?? t('Probe error')
        setStatus('error')
        setErrorMessage(message)
        onError(message)
      })
  }, [connectedPort, currentWCS, isZ, method, onError, selectedRoutine, t])

  if (!method || method.type !== 'edgeprobe') {
    return <p className="text-sm text-muted-foreground">{t('Invalid method')}</p>
  }

  const titleByStep: Record<string, string> = {
    verify: t('Verify Edge Probe'),
    choose: t('Choose Probe Routine'),
    position: t('Position Edge Probe'),
    run: t('Run Edge Probe'),
    complete: t('Edge Probe Complete'),
  }
  const canGoBack = step > 1 && status !== 'probing'
  const nextDisabled = stepId === 'choose' && selectedRoutine === null
  const nextButton = stepId === 'run'
    ? { onClick: () => setStep((value) => value + 1), disabled: status !== 'complete' }
    : stepId === 'complete'
      ? { onClick: onComplete, label: t('Done') }
      : { onClick: () => setStep((value) => value + 1), disabled: nextDisabled }

  return (
    <SetupBlockLayout
      title={titleByStep[stepId]}
      currentStep={step}
      totalSteps={stepIds.length}
      onBack={canGoBack ? () => setStep((value) => value - 1) : undefined}
      footerLeft={step === 1 ? footerLeftExtra : undefined}
      nextButton={nextButton}
      footerRight={(
        <>
          {footerRightExtra}
          {stepId === 'run' && status !== 'complete' && (
            <Button onClick={runProbe} disabled={status === 'probing' || (!isZ && !selectedRoutine)}>
              {status === 'probing' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {status === 'probing' ? t('Probing…') : t('Start Probe')}
            </Button>
          )}
          {debugAllowNext && stepId !== 'complete' && status !== 'probing' && (
            <Button variant="secondary" size="sm" onClick={() => setStep((value) => value + 1)}>
              {t('Next (debug)')}
            </Button>
          )}
        </>
      )}
    >
      {stepId === 'verify' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('With the spindle stopped, press and release the probe stylus. The selected input must change before any automatic move is allowed.')}
          </p>
          <ProbeCircuitVerification
            connectedPort={connectedPort}
            targets={[{ id: method.id, label: method.name, probeInput: method.probeInput }]}
            fallbackProbeContact={probeContact}
          />
        </div>
      )}

      {stepId === 'choose' && (
        <div className="space-y-6">
          <RoutineGroup
            title="Single Face"
            description={isXYZ
              ? 'Probe one X, Y, or Z face and set that axis to zero.'
              : 'Probe one X or Y face and set that axis to zero.'}
            options={faceRoutines}
            selected={selectedRoutine}
            onSelect={setSelectedRoutine}
          />
          <RoutineGroup
            title="Inside Corners"
            description="Start inside a concave corner with both faces directly reachable."
            options={INSIDE_CORNER_ROUTINES}
            selected={selectedRoutine}
            onSelect={setSelectedRoutine}
          />
          <RoutineGroup
            title="Outside Corners"
            description="Start diagonally outside a rectangular corner. The probe moves around the corner to reach both faces."
            options={OUTSIDE_CORNER_ROUTINES}
            selected={selectedRoutine}
            onSelect={setSelectedRoutine}
          />
          <RoutineGroup
            title="Pocket and Slot Centers"
            description="Probe opposite walls from inside a pocket or slot, then move to and zero the midpoint."
            options={CENTER_ROUTINES}
            selected={selectedRoutine}
            onSelect={setSelectedRoutine}
          />
        </div>
      )}

      {stepId === 'position' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Target className="w-5 h-5 text-primary" />
            <div>
              <div className="text-sm font-medium">
                {selectedIsZ ? t('Probe Z−') : t(selectedOption?.label ?? 'Choose Probe Routine')}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('Active work coordinate system: {{wcs}}', { wcs: currentWCS })}
              </div>
            </div>
          </div>

          {selectedIsZ ? (
            <p className="text-sm text-muted-foreground">
              {t('Jog the stylus directly above the Z datum surface, no farther away than {{distance}} mm. The probe will move downward twice and then retract.', { distance: method.probeDistance })}
            </p>
          ) : isOutsideCorner(selectedRoutine) ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('Jog the probe below the top of the workpiece and diagonally outside the selected corner. Keep both the X and Y gap smaller than {{distance}} mm.', { distance: method.cornerSweepDistance })}
              </p>
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  {t('The outside-corner sweep uses normal positioning moves in open space. Confirm the complete route is clear and that each adjacent face is longer than the sweep distance.')}
                </p>
              </div>
            </div>
          ) : isCenterRoutine(selectedRoutine) ? (
            <p className="text-sm text-muted-foreground">
              {t('Jog the probe inside the pocket or slot near its center. Every wall used by this routine must be within {{distance}} mm of the starting point.', { distance: method.probeDistance })}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('Jog the probe below the top of the feature with every selected face within {{distance}} mm. Confirm each probing direction matches the selected diagram.', { distance: method.probeDistance })}
            </p>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>{t('Effective tip diameter: {{diameter}} mm', { diameter: method.tipDiameter })}</p>
            <p>{t('Rough / fine feed: {{rough}} / {{fine}} mm/min', { rough: method.probeFeedrate, fine: method.fineProbeFeedrate })}</p>
          </div>
        </div>
      )}

      {stepId === 'run' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('Keep a hand near the emergency stop and watch the entire motion. A missing contact raises a controller probe alarm and stops the routine.')}
          </p>
          {status === 'error' && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}
          {status === 'complete' && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-4 h-4" />
              <p className="text-sm">{t('Probe routine completed successfully.')}</p>
            </div>
          )}
        </div>
      )}

      {stepId === 'complete' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-sm font-medium">{t('The selected work zero has been updated.')}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('Retract to a safe height before removing the probe or changing tools.')}
          </p>
        </div>
      )}
    </SetupBlockLayout>
  )
}
