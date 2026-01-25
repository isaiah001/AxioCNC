# Reliable Machine State Detection Pattern

## Problem

When waiting for the machine to complete an operation (e.g., outline tracing, job completion, tool change), the frontend needs to detect when the operation is finished. Common symptoms:

- Button states lag by 10+ seconds after completion
- Fallback timeouts fire even though operations completed
- Polling-based solutions are unreliable or miss state changes
- Socket events don't fire when expected

## Root Cause

The issue typically stems from **backend event emission gaps**:

1. **State changes don't emit events**: When backend state changes (e.g., queue becomes empty, pending becomes false), the code may update state but forget to emit the corresponding event.
2. **Event emission is conditional**: Events only emit when certain conditions are met (e.g., `if (this.feeder.peek())`), but the condition may not be true when the state actually changes.
3. **Frontend uses polling instead of events**: Polling introduces delays and can miss rapid state changes.

## Solution Pattern

### Step 1: Fix Backend Event Emission

**Identify where state changes occur** and ensure events are emitted:

```javascript
// ❌ BAD: State changes but no event emitted
next() {
  // ... process queue ...
  if (this.state.queue.length === 0) {
    this.state.pending = false;  // State changed, but no event!
  }
  return this.state.pending;
}
```

```javascript
// ✅ GOOD: Emit event when state changes
next() {
  // ... process queue ...
  if (this.state.queue.length === 0) {
    const wasPending = this.state.pending;
    this.state.pending = false;
    // Emit change event when pending transitions from true to false
    if (wasPending) {
      this.emit('change');
    }
  }
  return this.state.pending;
}
```

**Key principles:**
- Emit events when state **transitions** (not just when state is set)
- Only emit if the state **actually changed** (check previous value)
- Emit events that downstream code (controllers) can listen to and forward via socket.io

### Step 2: Use Socket Events (Not Polling)

**Frontend should listen to real-time socket events**, not poll the API:

```typescript
// ❌ BAD: Polling introduces delays and can miss events
const { data: controllers } = useGetControllersQuery(undefined, {
  pollingInterval: isWaiting ? 500 : 0, // Poll every 500ms
})

useEffect(() => {
  // Check controllers data for state changes
  if (controllers?.feeder?.queue === 0) {
    // Completion detected (maybe)
  }
}, [controllers])
```

```typescript
// ✅ GOOD: Listen to real-time socket events
React.useEffect(() => {
  const handleFeederStatus = (...args: unknown[]) => {
    // Only process if we're actively waiting
    if (!isWaitingRef.current || !operationStartedRef.current) {
      return
    }

    const status = args[0] as {
      queue?: number
      pending?: boolean
      hold?: boolean
    }

    // Detect completion when conditions are met
    if (status.queue === 0 && !status.pending && !status.hold) {
      if (operationStartedRef.current) {
        // Clear any fallback timeouts
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current)
          fallbackTimeoutRef.current = null
        }
        
        // Update UI state
        setIsWaiting(false)
        operationStartedRef.current = false
        showNotification('Operation Complete', 'Operation finished')
      }
    }
  }

  socketService.on('feeder:status', handleFeederStatus)

  return () => {
    socketService.off('feeder:status', handleFeederStatus)
  }
}, [showNotification])
```

**Key principles:**
- **Keep listener always active** (don't conditionally set it up based on state)
- **Use refs in handlers** to avoid stale closures (`isWaitingRef.current` instead of `isWaiting`)
- **Check refs inside handler** to determine if we should process the event
- **Clean up listeners** in useEffect cleanup function

### Step 3: Use Refs for Event Handlers

**Avoid stale closures** by using refs instead of state in event handlers:

```typescript
// ❌ BAD: Stale closure - handler captures old isWaiting value
const [isWaiting, setIsWaiting] = useState(false)

useEffect(() => {
  const handler = () => {
    if (!isWaiting) return // This might be stale!
    // ...
  }
  socketService.on('event', handler)
}, [isWaiting]) // Re-creates handler when isWaiting changes
```

```typescript
// ✅ GOOD: Use refs to always access current value
const isWaitingRef = useRef(false)
const [isWaiting, setIsWaiting] = useState(false)

// Sync ref with state
useEffect(() => {
  isWaitingRef.current = isWaiting
}, [isWaiting])

// Keep listener always active
useEffect(() => {
  const handler = () => {
    if (!isWaitingRef.current) return // Always current!
    // ...
  }
  socketService.on('event', handler)
  return () => socketService.off('event', handler)
}, []) // Set up once, handler uses refs
```

### Step 4: Verify Event Flow

**Trace the event path** from backend to frontend:

1. **Backend state change** → Emits internal event (e.g., `this.emit('change')`)
2. **Controller listens** → Checks if state changed (e.g., `if (this.feeder.peek())`)
3. **Controller forwards** → Emits socket event (e.g., `this.emit('feeder:status', ...)`)
4. **Socket.io forwards** → Sends to all connected clients
5. **Frontend receives** → Handler processes event

**Common issues:**
- Step 1 missing: State changes but no internal event emitted
- Step 2 failing: `peek()` returns false even though state changed (because `changed` flag wasn't set)
- Step 3 conditional: Only emits if `peek()` is true, but `peek()` might have been called already

## Example: Feeder Status Detection

### Backend Fix (`apps/server/src/lib/Feeder.js`)

```javascript
next() {
  while (!this.state.hold && this.state.queue.length > 0) {
    // ... process queue item ...
    this.state.pending = true;
    this.emit('data', command, context);
    this.emit('change');
    break;
  }

  // Clear pending state when the feeder queue is empty
  if (this.state.queue.length === 0) {
    const wasPending = this.state.pending;
    this.state.pending = false;
    // Emit change event when queue becomes empty and pending changes
    // This ensures feeder:status events are emitted when commands complete
    if (wasPending) {
      this.emit('change');
    }
  }

  return this.state.pending;
}
```

### Frontend Fix (`apps/web/src/routes/Setup/panels/FilePanel.tsx`)

```typescript
const isOutliningRef = useRef(false)
const outliningStartedRef = useRef(false)

// Sync ref with state
React.useEffect(() => {
  isOutliningRef.current = isOutlining
}, [isOutlining])

// Listen to feeder:status events (always active)
React.useEffect(() => {
  const handleFeederStatus = (...args: unknown[]) => {
    // Only process if we're actively outlining (use ref to avoid stale closure)
    if (!isOutliningRef.current || !outliningStartedRef.current) {
      return
    }

    const feederData = args[0] as {
      queue?: number
      pending?: boolean
      hold?: boolean
    }

    // Outline complete when queue is empty and not pending and not on hold
    if (feederData.queue === 0 && !feederData.pending && !feederData.hold) {
      if (outliningStartedRef.current) {
        // Clear fallback timeout
        if (outlineFallbackTimeoutRef.current) {
          clearTimeout(outlineFallbackTimeoutRef.current)
          outlineFallbackTimeoutRef.current = null
        }
        
        setIsOutlining(false)
        outliningStartedRef.current = false
        showInfoNotification('Outline Complete', 'Outline tracing finished')
      }
    }
  }

  socketService.on('feeder:status', handleFeederStatus)

  return () => {
    socketService.off('feeder:status', handleFeederStatus)
  }
}, [showInfoNotification])
```

## Checklist for Applying This Pattern

When fixing similar issues:

- [ ] **Identify backend state change location** - Where does the state that indicates completion change?
- [ ] **Check if event is emitted** - Does the backend emit an event when state changes?
- [ ] **Verify event forwarding** - Does the controller forward the event via socket.io?
- [ ] **Replace polling with events** - Remove API polling, use socket event listeners
- [ ] **Use refs in handlers** - Avoid stale closures by using refs instead of state
- [ ] **Keep listeners always active** - Don't conditionally set up listeners based on state
- [ ] **Test timing** - Verify completion is detected immediately (within ~500ms) not after timeout

## Related Files

- Backend: `apps/server/src/lib/Feeder.js` - Event emission fix
- Frontend: `apps/web/src/routes/Setup/panels/FilePanel.tsx` - Socket event listener pattern
- Socket Service: `apps/web/src/services/socket.ts` - Socket.IO client wrapper
- Controller: `apps/server/src/controllers/Grbl/GrblController.js` - Event forwarding logic
