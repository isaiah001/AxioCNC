/**
 * Joystick Orchestration Service (Backend)
 *
 * Main service that orchestrates all joystick inputs:
 * - Server gamepad (direct access via gamepad service)
 * - Client gamepad (via Socket.IO events from clients)
 * - Client jog controls (via Socket.IO events from clients)
 *
 * Reads inputs from all sources, maps them using JoystickMapper,
 * and routes mapped actions to handlers (jog loop, button handlers, etc.)
 */

const events = require('events');
const logger = require('../../lib/logger').default;
const JoystickMapper = require('./mapper');

const log = logger('service:joystick');
const CLIENT_JOG_INPUT_TIMEOUT_MS = 300;

function isNeutralJogInput(input) {
  return !input || (
    Math.abs(input.x || 0) < 0.01 &&
    Math.abs(input.y || 0) < 0.01 &&
    Math.abs(input.z || 0) < 0.01
  );
}

class JoystickService extends events.EventEmitter {
  constructor() {
    super();
    this.config = null;
    this.mapper = null;
    this.io = null;
    this.gamepadService = null;

    // State tracking
    this.enabled = false;
    this.clientGamepadInputs = new Map(); // socketId -> { axes, buttons, timestamp }
    this.clientJogControlInputs = new Map(); // socketId -> { x, y, z, timestamp }
    this.clientJogControlTimers = new Map(); // socketId -> stale-input timeout
    this.testModeSockets = new Set(); // socketId -> true (sockets in test mode)

    // Server gamepad listener
    this.serverGamepadListener = null;
  }

  /**
   * Initialize the service
   */
  initialize(io, gamepadService, config) {
    this.io = io;
    this.gamepadService = gamepadService;

    // Get initial config from settings
    if (config) {
      const joystickConfig = config.get('settings.joystick', {});
      this.updateConfig(joystickConfig);

      // Listen for config changes
      config.on('change', () => {
        const updatedConfig = config.get('settings.joystick', {});
        this.updateConfig(updatedConfig);
      });
    }

    // Listen to server gamepad state changes
    if (this.gamepadService) {
      this.serverGamepadListener = (state) => {
        if (!this.enabled || !this.config || !this.mapper) {
          return;
        }

        // Only process if connectionLocation is 'server'
        if (this.config.connectionLocation !== 'server') {
          return;
        }

        // Only process if this is the selected gamepad
        if (this.gamepadService.getSelected() !== this.config.selectedGamepad) {
          return;
        }

        // Log input from server gamepad
        const pressedButtons = state.buttons.map((b, i) => (b ? i : null)).filter(i => i !== null);
        log.debug(`[server-gamepad] axes: [${state.axes.map(a => a.toFixed(3)).join(', ')}], buttons: [${pressedButtons.join(', ')}]`);

        // Map to actions
        const actions = this.mapper.mapGamepad(state.axes, state.buttons);

        // Route to handlers (emit event for translation layer)
        // Skip if locked or any client is in test mode (prevents commands during testing/locking)
        const isLocked = this.config?.locked ?? false;
        if (actions.length > 0 && !isLocked && this.testModeSockets.size === 0) {
          // Log actions that will be dispatched
          const actionStrings = actions.map(action => {
            if (action.type === 'analog') {
              return `analog(x=${action.x.toFixed(3)}, y=${action.y.toFixed(3)}, z=${action.z.toFixed(3)})`;
            } else if (action.type === 'button') {
              return `button(${action.buttonId}=${action.action}, pressed=${action.pressed})`;
            }
            return JSON.stringify(action);
          });
          log.debug(`[server-gamepad] mapped to ${actions.length} action(s): ${actionStrings.join(', ')}`);
          this.emit('actions', actions, 'server-gamepad');
        } else if (actions.length > 0) {
          if (isLocked) {
            log.debug(`[server-gamepad] ignoring ${actions.length} action(s) - joystick locked`);
          } else if (this.testModeSockets.size > 0) {
            log.debug(`[server-gamepad] ignoring ${actions.length} action(s) - test mode active`);
          }
        }
      };

      this.gamepadService.on('state', this.serverGamepadListener);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config) {
    this.config = config || {};

    if (!this.mapper && this.config && Object.keys(this.config).length > 0) {
      this.mapper = new JoystickMapper(this.config);
    } else if (this.mapper && this.config && Object.keys(this.config).length > 0) {
      this.mapper.updateConfig(this.config);
    }

    this.enabled = this.config?.enabled ?? false;

    // If disabled, clear all inputs
    if (!this.enabled) {
      this.stopAllClientJogControls('joystick-disabled');
      this.clientGamepadInputs.clear();
      this.clientJogControlInputs.clear();
    }
  }

  clearClientJogControlTimer(socketId) {
    const timer = this.clientJogControlTimers.get(socketId);
    if (timer) {
      clearTimeout(timer);
      this.clientJogControlTimers.delete(socketId);
    }
  }

  armClientJogControlTimer(socketId) {
    this.clearClientJogControlTimer(socketId);

    const timer = setTimeout(() => {
      this.clientJogControlTimers.delete(socketId);
      this.stopClientJogControl(socketId, 'input-timeout');
    }, CLIENT_JOG_INPUT_TIMEOUT_MS);

    this.clientJogControlTimers.set(socketId, timer);
  }

  /**
   * Force a browser jog source to neutral. This intentionally bypasses test
   * mode and joystick lock checks because stopping motion is always allowed.
   */
  stopClientJogControl(socketId, reason) {
    this.clearClientJogControlTimer(socketId);

    const previousInput = this.clientJogControlInputs.get(socketId);
    if (isNeutralJogInput(previousInput)) {
      return;
    }

    log.warn(`[client-jog:${socketId}] forcing neutral input (${reason})`);
    this.clientJogControlInputs.set(socketId, {
      x: 0,
      y: 0,
      z: 0,
      timestamp: Date.now(),
    });

    if (this.mapper) {
      const action = this.mapper.mapJogControl(0, 0, 0);
      if (action) {
        this.emit('actions', [action], `client-jog-${socketId}-${reason}`);
      }
    }
  }

  stopAllClientJogControls(reason) {
    Array.from(this.clientJogControlInputs.keys()).forEach((socketId) => {
      this.stopClientJogControl(socketId, reason);
    });

    this.clientJogControlTimers.forEach((timer) => clearTimeout(timer));
    this.clientJogControlTimers.clear();
  }

  /**
   * Handle client gamepad input
   * Called from Socket.IO event handler
   */
  handleClientGamepadInput(socketId, axes, buttons, timestamp) {
    if (!this.enabled || !this.config || !this.mapper) {
      return;
    }

    // Only process if connectionLocation is 'client'
    if (this.config.connectionLocation !== 'client') {
      return;
    }

    // Store input from this client
    this.clientGamepadInputs.set(socketId, {
      axes: axes || [],
      buttons: buttons || [],
      timestamp: timestamp || Date.now(),
    });

    // Map to actions (use latest input from this client)
    const actions = this.mapper.mapGamepad(axes || [], buttons || []);

    // Route to handlers
    // Skip if locked or this client is in test mode (prevents commands during testing/locking)
    const isLocked = this.config?.locked ?? false;
    if (actions.length > 0 && !isLocked && !this.testModeSockets.has(socketId)) {
      this.emit('actions', actions, `client-gamepad-${socketId}`);
    }
  }

  /**
   * Handle client jog control input
   * Called from Socket.IO event handler
   *
   * Note: Jog controls work independently of joystick/gamepad hardware support.
   * They use joystick settings (sensitivity, inversion) if available, but should
   * function even when joystick is disabled.
   */
  handleClientJogControlInput(socketId, x, y, z, timestamp) {
    // Require config and mapper for settings (sensitivity, inversion), but not enabled flag
    // Jog controls work independently of joystick hardware support
    if (!this.config || !this.mapper) {
      log.debug(`[client-jog:${socketId}] ignoring input: config or mapper not available`);
      return;
    }

    // Jog controls work for both server and client gamepads (browser controls)
    // They're always from the client (mouse/touch)

    const safeX = Number.isFinite(x) ? x : 0;
    const safeY = Number.isFinite(y) ? y : 0;
    const safeZ = Number.isFinite(z) ? z : 0;

    // Log input from client jog controls
    log.debug(`[client-jog:${socketId}] x: ${safeX.toFixed(3)}, y: ${safeY.toFixed(3)}, z: ${safeZ.toFixed(3)}`);

    // Store input from this client
    this.clientJogControlInputs.set(socketId, {
      x: safeX,
      y: safeY,
      z: safeZ,
      timestamp: timestamp || Date.now(),
    });

    const isNeutral = isNeutralJogInput({ x: safeX, y: safeY, z: safeZ });
    if (isNeutral) {
      this.clearClientJogControlTimer(socketId);
    } else {
      this.armClientJogControlTimer(socketId);
    }

    // Map to actions
    const action = this.mapper.mapJogControl(safeX, safeY, safeZ);

    // Route to handlers
    // Skip motion if this client is in test mode, but always allow neutral
    // input through so a safety stop can never be blocked.
    // Note: Browser jog controls are NOT blocked by lock - only physical gamepads are locked
    if (action && (isNeutral || !this.testModeSockets.has(socketId))) {
      log.debug(`[client-jog:${socketId}] mapped to action: analog(x=${action.x.toFixed(3)}, y=${action.y.toFixed(3)}, z=${action.z.toFixed(3)})`);
      this.emit('actions', [action], `client-jog-${socketId}`);
    } else if (action) {
      log.debug(`[client-jog:${socketId}] ignoring action - test mode active`);
    }
  }

  /**
   * Set test mode for a socket (prevents commands from being sent)
   */
  setTestMode(socketId, enabled) {
    if (enabled) {
      this.stopClientJogControl(socketId, 'test-mode-enabled');
      this.testModeSockets.add(socketId);
      log.debug(`[joystick] Test mode enabled for socket ${socketId}`);
    } else {
      this.testModeSockets.delete(socketId);
      log.debug(`[joystick] Test mode disabled for socket ${socketId}`);
    }
  }

  /**
   * Remove client inputs when client disconnects
   */
  removeClient(socketId) {
    this.stopClientJogControl(socketId, 'disconnect');
    this.clientGamepadInputs.delete(socketId);
    this.clientJogControlInputs.delete(socketId);
    this.clearClientJogControlTimer(socketId);
    this.testModeSockets.delete(socketId);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopAllClientJogControls('service-destroyed');

    if (this.gamepadService && this.serverGamepadListener) {
      this.gamepadService.off('state', this.serverGamepadListener);
      this.serverGamepadListener = null;
    }

    this.config = null;
    this.mapper = null;
    this.io = null;
    this.gamepadService = null;
    this.enabled = false;
    this.clientGamepadInputs.clear();
    this.clientJogControlInputs.clear();
    this.clientJogControlTimers.clear();
    this.testModeSockets.clear();
  }
}

// Singleton instance
const joystickService = new JoystickService();

module.exports = joystickService;
module.exports.JoystickService = JoystickService;
module.exports.CLIENT_JOG_INPUT_TIMEOUT_MS = CLIENT_JOG_INPUT_TIMEOUT_MS;
