import { test } from 'tap';

const {
  JoystickService,
  CLIENT_JOG_INPUT_TIMEOUT_MS,
} = require('../src/services/joystick');

const joystickConfig = {
  enabled: true,
};

function createService() {
  const service = new JoystickService();
  service.updateConfig(joystickConfig);
  return service;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

test('browser jog input is forced neutral when the client disconnects', (t) => {
  const service = createService();
  const received = [];
  service.on('actions', actions => received.push(...actions));

  service.handleClientJogControlInput('touch-client', 0.75, -0.25, 0, Date.now());
  t.equal(received.length, 1, 'non-neutral input is dispatched');
  t.same(received[0], { type: 'analog', x: 0.75, y: -0.25, z: 0 });

  service.removeClient('touch-client');
  t.equal(received.length, 2, 'disconnect dispatches a stop action');
  t.same(received[1], { type: 'analog', x: 0, y: 0, z: 0 });
  t.notOk(service.clientJogControlInputs.has('touch-client'), 'client input is removed');
  t.notOk(service.clientJogControlTimers.has('touch-client'), 'watchdog is removed');

  service.destroy();
  t.end();
});

test('browser jog input watchdog stops stale motion', async (t) => {
  const service = createService();
  const received = [];
  service.on('actions', actions => received.push(...actions));

  service.handleClientJogControlInput('stale-client', 1, 0, 0, Date.now());
  await wait(CLIENT_JOG_INPUT_TIMEOUT_MS + 75);

  t.equal(received.length, 2, 'watchdog dispatches one additional action');
  t.same(received[0], { type: 'analog', x: 1, y: 0, z: 0 });
  t.same(received[1], { type: 'analog', x: 0, y: 0, z: 0 });
  t.notOk(service.clientJogControlTimers.has('stale-client'), 'expired watchdog is removed');

  service.destroy();
});

test('browser jog heartbeat refreshes the watchdog', async (t) => {
  const service = createService();
  const received = [];
  service.on('actions', actions => received.push(...actions));

  service.handleClientJogControlInput('heartbeat-client', 0.4, 0, 0, Date.now());
  await wait(CLIENT_JOG_INPUT_TIMEOUT_MS - 100);
  service.handleClientJogControlInput('heartbeat-client', 0.4, 0, 0, Date.now());
  await wait(150);

  t.equal(received.length, 2, 'the original timeout did not stop refreshed input');
  t.equal(received[1].x, 0.4, 'the refreshed input remains active');

  await wait(CLIENT_JOG_INPUT_TIMEOUT_MS - 100);
  t.equal(received.length, 3, 'motion stops after the refreshed timeout expires');
  t.same(received[2], { type: 'analog', x: 0, y: 0, z: 0 });

  service.destroy();
});

test('neutral browser input disarms the watchdog', async (t) => {
  const service = createService();
  const received = [];
  service.on('actions', actions => received.push(...actions));

  service.handleClientJogControlInput('released-client', 0, 0.5, 0, Date.now());
  service.handleClientJogControlInput('released-client', 0, 0, 0, Date.now());
  await wait(CLIENT_JOG_INPUT_TIMEOUT_MS + 75);

  t.equal(received.length, 2, 'no duplicate stop is emitted after a normal release');
  t.same(received[1], { type: 'analog', x: 0, y: 0, z: 0 });
  t.notOk(service.clientJogControlTimers.has('released-client'), 'watchdog remains disarmed');

  service.destroy();
});

test('enabling test mode stops existing browser jog input', (t) => {
  const service = createService();
  const received = [];
  service.on('actions', actions => received.push(...actions));

  service.handleClientJogControlInput('test-client', 0, 0, -0.5, Date.now());
  service.setTestMode('test-client', true);

  t.equal(received.length, 2, 'test mode dispatches a stop action');
  t.same(received[1], { type: 'analog', x: 0, y: 0, z: 0 });
  t.notOk(service.clientJogControlTimers.has('test-client'), 'watchdog is removed');

  service.destroy();
  t.end();
});
