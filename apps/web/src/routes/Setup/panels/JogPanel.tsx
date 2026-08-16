import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { MachineActionButton } from '@/components/MachineActionButton'
import { MachineActionWrapper } from '@/components/MachineActionWrapper'
import { ActionRequirements, canPerformAction } from '@/utils/machineState'
import { DiagonalArrowUpLeft, DiagonalArrowUpRight, DiagonalArrowDownLeft, DiagonalArrowDownRight } from '@/components/icons/DiagonalArrows'
import { useGcodeCommand, useAnalogJog, sendJogControlInput } from '@/hooks'
import { buildGoToZeroCommand } from '@/utils/gcode'
import { normalizeToCircle } from '@/utils/analogNormalize'
import { useGetExtensionsQuery } from '@/services/api'
import { trackFeatureUsed } from '@/services/analytics'
import type { PanelProps } from '../types'

const ANALOG_JOG_HEARTBEAT_MS = 100

export function JogPanel({ isConnected, connectedPort, machineStatus, onFlashStatus }: PanelProps) {
  const { t } = useTranslation()
  // Load mode from localStorage or use default
  const [mode, setMode] = useState<'steps' | 'analog'>(() => {
    const stored = localStorage.getItem('axiocnc-setup-jog-mode')
    if (stored === 'steps' || stored === 'analog') {
      return stored
    }
    return 'steps'
  })
  const [distanceIndex, setDistanceIndex] = useState(9) // Default to 10mm (index 9 in new array)
  const distances = [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 25, 50, 100, 250, 500] as const
  const currentDistance = distances[distanceIndex]
  
  // Check debug mode from extensions
  const { data: advancedConfig } = useGetExtensionsQuery({ key: 'advanced' })
  const debugMode = (advancedConfig && typeof advancedConfig === 'object' && 'debugMode' in advancedConfig)
    ? (advancedConfig as { debugMode?: boolean }).debugMode ?? false
    : false
  
  // G-code command hook
  const { sendGcode } = useGcodeCommand(connectedPort)
  
  // Handle jog command
  const handleJog = useCallback((x: number, y: number, z: number) => {
    const distance = currentDistance

    // Build the movement command
    const parts: string[] = []
    if (x !== 0) parts.push(`X${x * distance}`)
    if (y !== 0) parts.push(`Y${y * distance}`)
    if (z !== 0) parts.push(`Z${z * distance}`)
    
    if (parts.length === 0) return
    
    const command = parts.join(' ')
    
    // Track feature usage
    const axis = x !== 0 ? 'x' : y !== 0 ? 'y' : 'z'
    trackFeatureUsed('jog', 'JogPanel', `jog_${axis}`, distance)
    
    // Send jog commands: G91 (relative), G0 (rapid move), G90 (absolute)
    sendGcode('G91') // relative mode
    sendGcode(`G0 ${command}`) // rapid move
    sendGcode('G90') // absolute mode
  }, [currentDistance, sendGcode])
  
  // Handle go to zero for XY axes
  const handleGoToZeroXY = useCallback(() => {
    trackFeatureUsed('jog', 'JogPanel', 'go_to_zero_xy')
    const gcode = buildGoToZeroCommand('XY')
    if (gcode) {
      sendGcode(gcode)
    }
  }, [sendGcode])
  
  // Handle go to zero for Z axis
  const handleGoToZeroZ = useCallback(() => {
    trackFeatureUsed('jog', 'JogPanel', 'go_to_zero_z')
    const gcode = buildGoToZeroCommand('Z')
    if (gcode) {
      sendGcode(gcode)
    }
  }, [sendGcode])
  
  // Analog joystick state
  // joystickPos: visual position (clamped to circle, follows mouse cursor)
  // jogValues: normalized values for jogging (directionally normalized)
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 })
  const [jogValues, setJogValues] = useState({ x: 0, y: 0 })
  const [zLevel, setZLevel] = useState(50) // 0-100, 50 = center/stopped
  const [isDraggingXY, setIsDraggingXY] = useState(false)
  const [isDraggingZ, setIsDraggingZ] = useState(false)
  const xyJoystickRef = useRef<HTMLDivElement>(null)
  const zLeverRef = useRef<HTMLDivElement>(null)
  const xyPointerIdRef = useRef<number | null>(null)
  const zPointerIdRef = useRef<number | null>(null)
  
  // Poll analog controls when in analog mode
  // Use jogValues (normalized) for actual jogging
  const analogValues = useAnalogJog(
    {
      x: jogValues.x,
      y: jogValues.y,
      z: zLevel,
    },
    mode === 'analog', // enabled when in analog mode
    0.05 // 5% deadzone
  )
  const analogValuesRef = useRef(analogValues)
  analogValuesRef.current = analogValues
  
  // Send jog control inputs to server when in analog mode
  // Note: Analog jog controls work independently of joystick/gamepad hardware support
  useEffect(() => {
    if (mode === 'analog') {
      sendJogControlInput(analogValues.x, analogValues.y, analogValues.z)
    }
  }, [mode, analogValues.x, analogValues.y, analogValues.z])

  // Repeat active input so the server can stop the machine if this browser
  // disappears without delivering a pointer-up/cancel event.
  useEffect(() => {
    if (mode !== 'analog' || (!isDraggingXY && !isDraggingZ)) return

    const heartbeat = window.setInterval(() => {
      const current = analogValuesRef.current
      sendJogControlInput(current.x, current.y, current.z)
    }, ANALOG_JOG_HEARTBEAT_MS)

    return () => window.clearInterval(heartbeat)
  }, [mode, isDraggingXY, isDraggingZ])
  
  // Calculate joystick values from pointer position
  const updateJoystickFromPointer = useCallback((clientX: number, clientY: number) => {
    const element = xyJoystickRef.current
    if (!element) return
    
    const rect = element.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const xRaw = ((clientX - rect.left) - centerX) / centerX
    const yRaw = ((clientY - rect.top) - centerY) / centerY
    
    // Calculate magnitude
    const mag = Math.sqrt(xRaw * xRaw + yRaw * yRaw)
    
    // Clamp visual position to circle (for drag target)
    if (mag > 1) {
      setJoystickPos({ x: xRaw / mag, y: yRaw / mag })
    } else {
      setJoystickPos({ x: xRaw, y: yRaw })
    }
    
    // Normalize for circular input (for jog values)
    const normalized = normalizeToCircle(xRaw, yRaw)
    // Invert Y axis for browser-based analog jog controls (Setup page only)
    // Server-side gamepad uses settings.joystick.invertY instead
    setJogValues({ x: normalized.x, y: -normalized.y })
  }, [])

  const stopXYJog = useCallback((pointerId?: number) => {
    if (pointerId !== undefined && xyPointerIdRef.current !== pointerId) return
    if (xyPointerIdRef.current === null) return

    xyPointerIdRef.current = null
    setIsDraggingXY(false)
    setJoystickPos({ x: 0, y: 0 })
    setJogValues({ x: 0, y: 0 })

    const z = zPointerIdRef.current === null ? 0 : analogValuesRef.current.z
    sendJogControlInput(0, 0, z)
  }, [])

  const stopZJog = useCallback((pointerId?: number) => {
    if (pointerId !== undefined && zPointerIdRef.current !== pointerId) return
    if (zPointerIdRef.current === null) return

    zPointerIdRef.current = null
    setIsDraggingZ(false)
    setZLevel(50)

    const current = analogValuesRef.current
    const x = xyPointerIdRef.current === null ? 0 : current.x
    const y = xyPointerIdRef.current === null ? 0 : current.y
    sendJogControlInput(x, y, 0)
  }, [])

  const stopAllJogging = useCallback(() => {
    const wasActive = xyPointerIdRef.current !== null || zPointerIdRef.current !== null

    xyPointerIdRef.current = null
    zPointerIdRef.current = null
    setIsDraggingXY(false)
    setIsDraggingZ(false)
    setJoystickPos({ x: 0, y: 0 })
    setJogValues({ x: 0, y: 0 })
    setZLevel(50)

    if (wasActive) {
      sendJogControlInput(0, 0, 0)
    }
  }, [])

  // Handle XY joystick pointer down (mouse, touch, or pen)
  const handleXYPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return

    const canJog = canPerformAction(isConnected, connectedPort, machineStatus, false, ActionRequirements.jog)
    if (!canJog) {
      e.preventDefault()
      e.stopPropagation()
      onFlashStatus()
      return
    }

    if (xyPointerIdRef.current !== null || zPointerIdRef.current !== null) return

    e.preventDefault()
    e.stopPropagation()
    xyPointerIdRef.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDraggingXY(true)
    updateJoystickFromPointer(e.clientX, e.clientY)
  }, [isConnected, connectedPort, machineStatus, onFlashStatus, updateJoystickFromPointer])

  const handleXYPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (xyPointerIdRef.current !== e.pointerId) return
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      stopXYJog(e.pointerId)
      return
    }

    e.preventDefault()
    updateJoystickFromPointer(e.clientX, e.clientY)
  }, [stopXYJog, updateJoystickFromPointer])

  // Calculate Z level from pointer position
  const updateZFromPointer = useCallback((clientY: number) => {
    const element = zLeverRef.current
    if (!element) return
    
    const rect = element.getBoundingClientRect()
    const y = (clientY - rect.top) / rect.height
    // Clamp to 0-100, inverted (top = 100, bottom = 0)
    setZLevel(Math.max(0, Math.min(100, (1 - y) * 100)))
  }, [])

  // Handle Z lever pointer down (mouse, touch, or pen)
  const handleZPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return

    const canJog = canPerformAction(isConnected, connectedPort, machineStatus, false, ActionRequirements.jog)
    if (!canJog) {
      e.preventDefault()
      e.stopPropagation()
      onFlashStatus()
      return
    }

    if (xyPointerIdRef.current !== null || zPointerIdRef.current !== null) return

    e.preventDefault()
    e.stopPropagation()
    zPointerIdRef.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDraggingZ(true)
    updateZFromPointer(e.clientY)
  }, [isConnected, connectedPort, machineStatus, onFlashStatus, updateZFromPointer])

  const handleZPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (zPointerIdRef.current !== e.pointerId) return
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      stopZJog(e.pointerId)
      return
    }

    e.preventDefault()
    updateZFromPointer(e.clientY)
  }, [stopZJog, updateZFromPointer])

  // Mobile browsers can still open their long-press callout/context menu even
  // with touch-action: none. Keep those native gestures out of the analog
  // controls so a held low-speed jog remains an uninterrupted pointer gesture.
  const suppressNativeAnalogGesture = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // Any interruption of an active browser gesture must explicitly neutralize
  // the server input. Pointer capture covers leaving the control bounds; these
  // handlers cover app switching, navigation, and connection loss.
  useEffect(() => {
    const handleWindowBlur = () => stopAllJogging()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stopAllJogging()
    }

    window.addEventListener('blur', handleWindowBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('blur', handleWindowBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (xyPointerIdRef.current !== null || zPointerIdRef.current !== null) {
        xyPointerIdRef.current = null
        zPointerIdRef.current = null
        sendJogControlInput(0, 0, 0)
      }
    }
  }, [stopAllJogging])

  useEffect(() => {
    if (!isConnected) stopAllJogging()
  }, [isConnected, stopAllJogging])

  return (
    <div className="p-3 flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <Button 
          variant={mode === 'steps' ? 'default' : 'ghost'} 
          size="sm" 
          className="flex-1 h-7 text-xs"
          onClick={() => {
            stopAllJogging()
            setMode('steps')
            localStorage.setItem('axiocnc-setup-jog-mode', 'steps')
            trackFeatureUsed('jog', 'JogPanel', 'mode_change', 'steps')
          }}
        >
          {t('Steps')}
        </Button>
        <Button 
          variant={mode === 'analog' ? 'default' : 'ghost'} 
          size="sm" 
          className="flex-1 h-7 text-xs"
          onClick={() => {
            setMode('analog')
            localStorage.setItem('axiocnc-setup-jog-mode', 'analog')
            trackFeatureUsed('jog', 'JogPanel', 'mode_change', 'analog')
          }}
        >
          {t('Analog')}
        </Button>
      </div>
      
      {mode === 'steps' ? (
        <>
          {/* XY and Z Controls side by side */}
          <div className="flex items-center justify-center gap-24">
            {/* XY Pad - 3x3 with diagonals */}
            <div className="grid grid-cols-3 gap-1" style={{ width: '140px' }}>
              <MachineActionButton
                isConnected={isConnected}
                connectedPort={connectedPort}
                machineStatus={machineStatus}
                onFlashStatus={onFlashStatus}
                onAction={() => handleJog(-1, 1, 0)}
                requirements={ActionRequirements.jog}
                variant="secondary"
                className="aspect-square p-0"
              >
                <DiagonalArrowUpLeft />
              </MachineActionButton>
              <MachineActionButton
                isConnected={isConnected}
                connectedPort={connectedPort}
                machineStatus={machineStatus}
                onFlashStatus={onFlashStatus}
                onAction={() => handleJog(0, 1, 0)}
                requirements={ActionRequirements.jog}
                variant="secondary"
                className="aspect-square p-0"
              >
                <ChevronUp className="w-5 h-5" />
              </MachineActionButton>
              <MachineActionButton
                isConnected={isConnected}
                connectedPort={connectedPort}
                machineStatus={machineStatus}
                onFlashStatus={onFlashStatus}
                onAction={() => handleJog(1, 1, 0)}
                requirements={ActionRequirements.jog}
                variant="secondary"
                className="aspect-square p-0"
              >
                <DiagonalArrowUpRight />
              </MachineActionButton>
              
              <MachineActionButton
                isConnected={isConnected}
                connectedPort={connectedPort}
                machineStatus={machineStatus}
                onFlashStatus={onFlashStatus}
                onAction={() => handleJog(-1, 0, 0)}
                requirements={ActionRequirements.jog}
                variant="secondary"
                className="aspect-square p-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </MachineActionButton>
              <MachineActionButton
                isConnected={isConnected}
                connectedPort={connectedPort}
                machineStatus={machineStatus}
                onFlashStatus={onFlashStatus}
                onAction={handleGoToZeroXY}
                requirements={ActionRequirements.jog}
                variant="outline"
                className="aspect-square p-0 text-xs font-bold"
                title={t('Go to XY zero')}
              >
                XY 0
              </MachineActionButton>
              <MachineActionButton
                isConnected={isConnected}
                connectedPort={connectedPort}
                machineStatus={machineStatus}
                onFlashStatus={onFlashStatus}
                onAction={() => handleJog(1, 0, 0)}
                requirements={ActionRequirements.jog}
                variant="secondary"
                className="aspect-square p-0"
              >
                <ChevronRight className="w-5 h-5" />
              </MachineActionButton>
              
              <MachineActionButton
                isConnected={isConnected}
                connectedPort={connectedPort}
                machineStatus={machineStatus}
                onFlashStatus={onFlashStatus}
                onAction={() => handleJog(-1, -1, 0)}
                requirements={ActionRequirements.jog}
                variant="secondary"
                className="aspect-square p-0"
              >
                <DiagonalArrowDownLeft />
              </MachineActionButton>
              <MachineActionButton
                isConnected={isConnected}
                connectedPort={connectedPort}
                machineStatus={machineStatus}
                onFlashStatus={onFlashStatus}
                onAction={() => handleJog(0, -1, 0)}
                requirements={ActionRequirements.jog}
                variant="secondary"
                className="aspect-square p-0"
              >
                <ChevronDown className="w-5 h-5" />
              </MachineActionButton>
              <MachineActionButton
                isConnected={isConnected}
                connectedPort={connectedPort}
                machineStatus={machineStatus}
                onFlashStatus={onFlashStatus}
                onAction={() => handleJog(1, -1, 0)}
                requirements={ActionRequirements.jog}
                variant="secondary"
                className="aspect-square p-0"
              >
                <DiagonalArrowDownRight />
              </MachineActionButton>
            </div>
            
            {/* Z Controls - vertically stacked */}
            <div className="flex flex-col gap-1" style={{ width: '56px' }}>
              <MachineActionButton
                isConnected={isConnected}
                connectedPort={connectedPort}
                machineStatus={machineStatus}
                onFlashStatus={onFlashStatus}
                onAction={() => handleJog(0, 0, 1)}
                requirements={ActionRequirements.jog}
                variant="secondary"
                className="aspect-square p-0"
              >
                <ChevronUp className="w-5 h-5 text-blue-500" />
              </MachineActionButton>
              <MachineActionButton
                isConnected={isConnected}
                connectedPort={connectedPort}
                machineStatus={machineStatus}
                onFlashStatus={onFlashStatus}
                onAction={handleGoToZeroZ}
                requirements={ActionRequirements.jog}
                variant="outline"
                className="aspect-square p-0 text-xs font-bold text-blue-500"
                title={t('Go to Z zero')}
              >
                Z 0
              </MachineActionButton>
              <MachineActionButton
                isConnected={isConnected}
                connectedPort={connectedPort}
                machineStatus={machineStatus}
                onFlashStatus={onFlashStatus}
                onAction={() => handleJog(0, 0, -1)}
                requirements={ActionRequirements.jog}
                variant="secondary"
                className="aspect-square p-0"
              >
                <ChevronDown className="w-5 h-5 text-blue-500" />
              </MachineActionButton>
            </div>
          </div>
          
          {/* Distance selector */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>{t('Distance')}</span>
              <span className="font-mono font-medium">
                {currentDistance} {t('mm')}
              </span>
            </div>
            <MachineActionWrapper
              isDisabled={!canPerformAction(isConnected, connectedPort, machineStatus, false, ActionRequirements.jog)}
              onFlashStatus={onFlashStatus}
            >
              <Slider 
                value={[distanceIndex]} 
                onValueChange={(v) => setDistanceIndex(v[0])}
                max={distances.length - 1} 
                step={1}
                disabled={!canPerformAction(isConnected, connectedPort, machineStatus, false, ActionRequirements.jog)}
              />
            </MachineActionWrapper>
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>0.01</span>
              <span>0.1</span>
              <span>1</span>
              <span>10</span>
              <span>100</span>
              <span>500</span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Analog mode */}
          <div className="flex items-center justify-center gap-12">
            {/* XY Joystick */}
            <div 
              ref={xyJoystickRef}
              className="relative w-36 h-36 rounded-full bg-muted border-2 border-border cursor-crosshair touch-none select-none"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
              draggable={false}
              onPointerDown={handleXYPointerDown}
              onPointerMove={handleXYPointerMove}
              onPointerUp={(e) => stopXYJog(e.pointerId)}
              onPointerCancel={(e) => stopXYJog(e.pointerId)}
              onLostPointerCapture={(e) => stopXYJog(e.pointerId)}
              onContextMenu={suppressNativeAnalogGesture}
              onDragStart={suppressNativeAnalogGesture}
            >
              {/* Crosshairs */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-full h-px bg-border" />
                <div className="absolute h-full w-px bg-border" />
              </div>
              {/* Axis labels */}
              <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-green-500 font-bold">Y+</span>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-green-500 font-bold">Y-</span>
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-red-500 font-bold">X-</span>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-red-500 font-bold">X+</span>
              {/* Joystick thumb */}
              <div 
                className="absolute w-8 h-8 rounded-full bg-primary shadow-lg border-2 border-primary-foreground transition-transform"
                style={{
                  left: `calc(50% + ${joystickPos.x * 50}% - 16px)`,
                  top: `calc(50% + ${joystickPos.y * 50}% - 16px)`,
                }}
              />
            </div>
            
            {/* Z Lever */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-blue-500 font-bold">Z+</span>
              <div 
                ref={zLeverRef}
                className="relative h-32 w-10 rounded-full bg-muted border-2 border-border cursor-ns-resize touch-none select-none"
                style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                draggable={false}
                onPointerDown={handleZPointerDown}
                onPointerMove={handleZPointerMove}
                onPointerUp={(e) => stopZJog(e.pointerId)}
                onPointerCancel={(e) => stopZJog(e.pointerId)}
                onLostPointerCapture={(e) => stopZJog(e.pointerId)}
                onContextMenu={suppressNativeAnalogGesture}
                onDragStart={suppressNativeAnalogGesture}
              >
                {/* Center line */}
                <div className="absolute top-1/2 left-2 right-2 h-px bg-border" />
                {/* Visual thumb */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-blue-500 shadow-lg border-2 border-white pointer-events-none"
                  style={{ top: `calc(${100 - zLevel}% - 14px)` }}
                />
              </div>
              <span className="text-[10px] text-blue-500 font-bold">Z-</span>
            </div>
          </div>
          
          {/* Debug panel - shows normalized XYZ values when debug mode is enabled */}
          {debugMode && (
            <div className="mt-2 p-2 bg-muted/50 rounded border border-border/50">
              <div className="text-[10px] text-muted-foreground mb-1 font-medium">{t('Debug: Normalized Values')}</div>
              <div className="flex gap-4 text-xs font-mono">
                <div className="flex items-center gap-1">
                  <span className="text-red-500 font-bold">X:</span>
                  <span className="text-foreground">{analogValues.x.toFixed(3)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-500 font-bold">Y:</span>
                  <span className="text-foreground">{analogValues.y.toFixed(3)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-blue-500 font-bold">Z:</span>
                  <span className="text-foreground">{analogValues.z.toFixed(3)}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
