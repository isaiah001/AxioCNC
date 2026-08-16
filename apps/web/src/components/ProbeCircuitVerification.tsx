import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProbeInput } from '@axiocnc/shared/src/schemas/settings'
import { socketService } from '@/services/socket'
import { useGetSettingsQuery } from '@/services/api'
import { useMachineState } from '@/store/hooks'

const RESPONSE_WAIT_MS = 500
const POLL_DELAY_MS = 100
const RETRY_DELAY_MS = 1000
const MAX_FAST_RETRIES = 2

export interface ProbeCircuitTarget {
  id: string
  label?: string
  probeInput?: ProbeInput
}

interface ProbeCircuitVerificationProps {
  connectedPort: string | null
  targets: ProbeCircuitTarget[]
  fallbackProbeContact: boolean
}

type QueryStatus = 'checking' | 'ready' | 'unavailable' | 'disconnected'

interface ProbePollingSession {
  connectedPort: string
  probeInput: ProbeInput
  targetId: string
  lastObservedSequence: number
  freshObservationCount: number
  fastRetries: number
}

function getProbeInputLabel(probeInput: ProbeInput, t: (key: string) => string): string {
  const labels: Record<ProbeInput, string> = {
    0: t('Primary probe'),
    1: t('Toolsetter'),
    2: t('Secondary probe'),
  }

  return `P${probeInput} — ${labels[probeInput]}`
}

function ProbeCircuitStatusRow({
  connectedPort,
  target,
  fallbackProbeContact,
}: {
  connectedPort: string | null
  target: ProbeCircuitTarget
  fallbackProbeContact: boolean
}) {
  const { t } = useTranslation()
  const { data: settings } = useGetSettingsQuery()
  const machineState = useMachineState()
  const probeInput = target.probeInput
  const backendStatus = machineState.backendStatus
  const configuredPort = settings?.connection?.port ?? null
  const verificationPort = connectedPort === configuredPort ? connectedPort : null
  const statusMatchesPort = verificationPort !== null
    && backendStatus?.connected === true
    && backendStatus.port === verificationPort
  const controllerState = statusMatchesPort ? backendStatus.controllerState : undefined
  const report = probeInput === undefined
    ? undefined
    : controllerState?.probeInputs?.[probeInput]
  const reportSequence = report?.sequence
  const reportRef = useRef(report)
  const pollingSessionRef = useRef<ProbePollingSession | null>(null)
  const [hasFreshReport, setHasFreshReport] = useState(false)
  const [freshObservationCount, setFreshObservationCount] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [sawReleased, setSawReleased] = useState(false)
  const [verified, setVerified] = useState(false)

  reportRef.current = report

  useEffect(() => {
    setSawReleased(false)
    setVerified(false)
  }, [probeInput, target.id, verificationPort])

  useEffect(() => {
    if (probeInput === undefined || !verificationPort || !statusMatchesPort) {
      pollingSessionRef.current = null
      setHasFreshReport(probeInput === undefined && statusMatchesPort)
      setFreshObservationCount(0)
      setTimedOut(false)
      return
    }

    const session: ProbePollingSession = {
      connectedPort: verificationPort,
      probeInput,
      targetId: target.id,
      lastObservedSequence: reportRef.current?.sequence ?? 0,
      freshObservationCount: 0,
      fastRetries: 0,
    }
    pollingSessionRef.current = session
    let cancelled = false
    let nextPollTimer: number | undefined
    let responseTimer: number | undefined
    setHasFreshReport(false)
    setFreshObservationCount(0)
    setTimedOut(false)

    const isCurrentSession = () => !cancelled && pollingSessionRef.current === session

    const poll = () => {
      if (!isCurrentSession()) return

      const sequenceBefore = reportRef.current?.sequence ?? 0
      socketService.command(verificationPort, 'probe:state', probeInput)

      responseTimer = window.setTimeout(() => {
        if (!isCurrentSession()) return

        const currentReport = reportRef.current
        const received = currentReport !== undefined && currentReport.sequence !== sequenceBefore

        if (received) {
          session.fastRetries = 0
          setHasFreshReport(true)
          setTimedOut(false)

          // A remount can inherit one response from the previous session. Keep
          // polling until a second observation confirms an unavailable input.
          if (!currentReport.available && session.freshObservationCount >= 2) return

          nextPollTimer = window.setTimeout(poll, POLL_DELAY_MS)
          return
        }

        session.fastRetries += 1
        if (session.fastRetries >= MAX_FAST_RETRIES) {
          setTimedOut(true)
          nextPollTimer = window.setTimeout(poll, RETRY_DELAY_MS)
        } else {
          nextPollTimer = window.setTimeout(poll, 0)
        }
      }, RESPONSE_WAIT_MS)
    }

    // Defer the first query so React Strict Mode cleanup can cancel its probe safely.
    nextPollTimer = window.setTimeout(poll, 0)

    return () => {
      cancelled = true
      if (pollingSessionRef.current === session) pollingSessionRef.current = null
      if (nextPollTimer !== undefined) window.clearTimeout(nextPollTimer)
      if (responseTimer !== undefined) window.clearTimeout(responseTimer)
    }
  }, [probeInput, statusMatchesPort, target.id, verificationPort])

  useEffect(() => {
    if (probeInput === undefined || !verificationPort || !statusMatchesPort || reportSequence === undefined) return

    const session = pollingSessionRef.current
    if (!session
      || session.connectedPort !== verificationPort
      || session.probeInput !== probeInput
      || session.targetId !== target.id
      || session.lastObservedSequence === reportSequence) {
      return
    }

    // Sequence changes are the authoritative response signal. Observe them
    // outside the 500 ms timer so a late reply immediately clears stale state.
    session.lastObservedSequence = reportSequence
    session.freshObservationCount += 1
    session.fastRetries = 0
    setFreshObservationCount(session.freshObservationCount)
    setHasFreshReport(true)
    setTimedOut(false)
  }, [probeInput, reportSequence, statusMatchesPort, target.id, verificationPort])

  const status: QueryStatus = !statusMatchesPort
    ? 'disconnected'
    : probeInput === undefined
      ? 'ready'
      : timedOut
        ? 'unavailable'
        : hasFreshReport && report?.available
          ? 'ready'
          : hasFreshReport && report && !report.available
            ? 'unavailable'
            : 'checking'
  const fallbackContact = statusMatchesPort
    ? controllerState?.pinState?.includes('P') ?? fallbackProbeContact
    : false
  const triggered = status === 'ready'
    && (probeInput === undefined ? fallbackContact : report?.triggered === true)
  // The server can still have one query in flight when a verification row remounts.
  // Show that first response immediately, but require one current-session follow-up
  // before its state is allowed to arm the release -> trigger verification latch.
  const canArmVerification = probeInput === undefined || freshObservationCount >= 2

  useEffect(() => {
    if (status !== 'ready' || !canArmVerification) {
      setSawReleased(false)
      setVerified(false)
      return
    }

    if (!triggered) {
      setSawReleased(true)
    } else if (sawReleased) {
      setVerified(true)
    }
  }, [canArmVerification, sawReleased, status, triggered])

  const probeLabel = probeInput === undefined
    ? t('Controller default')
    : getProbeInputLabel(probeInput, t)
  const displayLabel = target.label ? `${target.label}: ${probeLabel}` : probeLabel
  const unavailable = status === 'unavailable' || status === 'disconnected'
  const cardClass = unavailable
    ? 'bg-destructive/10 border-destructive/30'
    : verified
      ? 'bg-green-500/10 border-green-500/30'
      : triggered
        ? 'bg-yellow-500/10 border-yellow-500/30'
      : status === 'checking'
        ? 'bg-blue-500/10 border-blue-500/30'
        : 'bg-muted/50 border-border'
  const dotClass = unavailable
    ? 'bg-destructive'
    : verified
      ? 'bg-green-500'
      : triggered
        ? 'bg-yellow-500'
      : status === 'checking'
        ? 'bg-blue-500 animate-pulse'
        : 'bg-muted'

  return (
    <div className={`p-3 rounded-lg border ${cardClass}`}>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dotClass}`} />
        <div className="min-w-0">
          <div className="text-sm font-medium">
            {t('Probe Status')}:{' '}
            {status === 'checking'
              ? t('Reading selected probe input…')
              : status === 'disconnected'
                ? t('Disconnected')
                : unavailable
                ? t('Unavailable')
                : triggered
                  ? t('Contact Detected')
                  : t('No Contact')}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{displayLabel}</div>
        </div>
      </div>

      {unavailable && (
        <p className="text-xs text-destructive mt-2 ml-5">
          {status === 'disconnected'
            ? t('Machine not connected')
            : t('The selected probe input could not be read. Check that the input exists and that the controller firmware supports probe state parameters.')}
        </p>
      )}
      {status === 'ready' && triggered && !sawReleased && (
        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 ml-5">
          {t('The probe is already active. Release it, then trigger it again to verify the circuit.')}
        </p>
      )}
      {verified && status === 'ready' && (
        <p className="text-xs text-green-900 dark:text-green-100 mt-2 ml-5">
          {t('The probe circuit is working correctly. You can proceed to the next step.')}
        </p>
      )}
    </div>
  )
}

export function ProbeCircuitVerification({
  connectedPort,
  targets,
  fallbackProbeContact,
}: ProbeCircuitVerificationProps) {
  const uniqueTargets = useMemo(() => {
    const seen = new Set<string>()

    return targets.filter((target) => {
      const key = target.probeInput === undefined ? 'default' : String(target.probeInput)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [targets])

  return (
    <div className="space-y-2">
      {uniqueTargets.map((target) => (
        <ProbeCircuitStatusRow
          key={`${target.id}-${target.probeInput ?? 'default'}`}
          connectedPort={connectedPort}
          target={target}
          fallbackProbeContact={fallbackProbeContact}
        />
      ))}
    </div>
  )
}
