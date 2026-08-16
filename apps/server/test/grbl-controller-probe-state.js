import { test } from 'tap';
import GrblController from '../src/controllers/Grbl/GrblController';
import {
  WORKFLOW_STATE_PAUSED,
  WORKFLOW_STATE_RUNNING
} from '../src/lib/Workflow';
import jobHistory from '../src/services/jobhistory';

function createController() {
  const controller = new GrblController({}, {
    port: 'TEST',
    baudrate: 115200,
    rtscts: false
  });
  const writes = [];

  controller.connection = {
    isOpen: true,
    write: (data) => writes.push(data)
  };
  controller.ready = true;
  if (controller.queryTimer) {
    clearInterval(controller.queryTimer);
    controller.queryTimer = null;
  }

  return { controller, writes };
}

test('GrblController serializes probe state queries with auxiliary line ownership', (t) => {
  const { controller, writes } = createController();
  let senderAcks = 0;
  controller.sender.ack = () => {
    senderAcks += 1;
  };

  controller.enqueueProbeStateQuery(0);
  controller.enqueueProbeStateQuery(1);

  t.same(writes, ['$#=_probe_state\n'], 'only the first query should reach the connection');
  t.same(controller.auxiliaryLineOwners, ['probe-state'], 'the first line should be owned by the probe query');
  t.same(controller.probeStateQueryQueue, [1], 'the second query should wait in the probe queue');

  controller.runner.parse('[PARAM:_probe_state=0]');
  controller.runner.parse('ok');

  t.same(writes, ['$#=_probe_state\n', '$#=_toolsetter_state\n'], 'the next query should start after the first terminator');
  t.same(controller.auxiliaryLineOwners, ['probe-state'], 'ownership should transfer to the second query');
  t.equal(controller.probeStateQueryPending.input, 1, 'P1 should now be pending');
  t.equal(senderAcks, 0, 'probe acknowledgements must not acknowledge sender lines');

  controller.runner.parse('[PARAM:_toolsetter_state=1]');
  controller.runner.parse('ok');

  t.equal(controller.probeStateQueryPending, null, 'the second query should finish on its own ok');
  t.same(controller.auxiliaryLineOwners, [], 'all auxiliary owners should be drained');
  t.equal(senderAcks, 0, 'all probe acknowledgements should remain isolated');
  t.same(controller.runner.state.status.probeInputs[0], {
    available: true,
    triggered: false,
    sequence: 1
  }, 'P0 should retain the parsed response');
  t.same(controller.runner.state.status.probeInputs[1], {
    available: true,
    triggered: true,
    sequence: 2
  }, 'P1 should retain the parsed response');

  controller.destroy();
  t.end();
});

test('GrblController keeps timed-out probe ownership until a late response drains', async (t) => {
  const { controller, writes } = createController();
  let senderAcks = 0;
  controller.sender.ack = () => {
    senderAcks += 1;
  };

  controller.enqueueProbeStateQuery(0);
  await new Promise(resolve => {
    setTimeout(resolve, 2100);
  });

  t.same(controller.probeStateQueryPending, {
    input: 0,
    timedOut: true
  }, 'timeout should enter draining state without releasing response ownership');
  t.same(controller.auxiliaryLineOwners, ['probe-state'], 'the late terminator should still belong to the probe query');

  controller.enqueueProbeStateQuery(0);
  controller.enqueueProbeStateQuery(1);
  t.same(writes, ['$#=_probe_state\n'], 'same-input and different-input retries should be rejected while draining');
  t.same(controller.probeStateQueryQueue, [], 'draining retries should not accumulate in the queue');

  controller.command('gcode', 'G0 X1');
  t.same(writes, ['$#=_probe_state\n'], 'manual feeder work should wait behind the draining probe line');
  t.equal(controller.feeder.size(), 1, 'the deferred manual line should remain queued');

  controller.runner.parse('[PARAM:_probe_state=1]');
  controller.runner.parse('ok');

  t.equal(senderAcks, 0, 'a late probe ok must not acknowledge a sender line');
  t.equal(controller.probeStateQueryPending, null, 'the late terminator should finish draining');
  t.same(writes, ['$#=_probe_state\n', 'G0 X1\n'], 'deferred feeder work should start only after probe draining completes');
  t.same(controller.auxiliaryLineOwners, ['feeder'], 'the late probe ok must leave the new feeder line separately owned');
  controller.runner.parse('ok');
  t.same(controller.auxiliaryLineOwners, [], 'the feeder owner should drain on its own ok');

  controller.destroy();
});

test('GrblController prevents external raw lines from crossing a probe query', (t) => {
  const { controller, writes } = createController();

  t.equal(controller.writeln('$#=_probe_state'), true, 'an external raw line should be accepted while idle');
  t.same(writes, ['$#=_probe_state\n'], 'the external query should use the real connection write path');
  t.same(controller.auxiliaryLineOwners, ['client'], 'the external query should own the first response');

  controller.enqueueProbeStateQuery(0);
  t.same(writes, ['$#=_probe_state\n'], 'an internal query must not start behind an outstanding external line');
  t.equal(controller.probeStateQueryPending, null, 'no internal query should be pending yet');

  controller.runner.parse('[PARAM:_probe_state=0]');
  controller.runner.parse('ok');
  t.same(controller.auxiliaryLineOwners, [], 'the external response should drain only its client owner');

  controller.enqueueProbeStateQuery(0);
  t.same(writes, ['$#=_probe_state\n', '$#=_probe_state\n'], 'the internal query should start after the external line drains');
  t.same(controller.auxiliaryLineOwners, ['probe-state'], 'the internal line should now own the response');

  t.equal(controller.writeln('$#=_toolsetter_state'), false, 'external raw lines should be rejected during a probe query');
  t.same(writes, ['$#=_probe_state\n', '$#=_probe_state\n'], 'a rejected external line must not reach the connection');
  t.same(controller.auxiliaryLineOwners, ['probe-state'], 'a rejected line must not alter owner order');

  controller.runner.parse('[PARAM:_probe_state=1]');
  controller.runner.parse('ok');
  t.equal(controller.probeStateQueryPending, null, 'the internal query should complete normally');
  t.same(controller.auxiliaryLineOwners, [], 'the internal response should fully drain ownership');

  controller.destroy();
  t.end();
});

test('GrblController waits for feeder wire ownership before probing', (t) => {
  const { controller, writes } = createController();

  controller.command('gcode', 'G0 X1');
  t.same(writes, ['G0 X1\n'], 'the manual line should be written through the real feeder path');
  t.same(controller.auxiliaryLineOwners, ['feeder'], 'the unacknowledged manual line should retain wire ownership');

  controller.enqueueProbeStateQuery(1);
  t.same(writes, ['G0 X1\n'], 'probe query should be rejected while a feeder line is unacknowledged');
  t.equal(controller.probeStateQueryPending, null, 'no probe query should be pending during feeder ownership');

  controller.runner.parse('ok');
  t.same(controller.auxiliaryLineOwners, [], 'the manual ok should drain feeder ownership');

  controller.enqueueProbeStateQuery(1);
  t.same(writes, ['G0 X1\n', '$#=_toolsetter_state\n'], 'probe query should start after the feeder line drains');
  controller.runner.parse('[PARAM:_toolsetter_state=0]');
  controller.runner.parse('ok');
  t.same(controller.auxiliaryLineOwners, [], 'the probe response should drain separately');

  controller.destroy();
  t.end();
});

test('GrblController advances every line in a multi-line feeder batch', (t) => {
  const { controller, writes } = createController();

  controller.command('gcode', ['G0 X1', 'G0 X2']);
  t.same(writes, ['G0 X1\n'], 'only the first line should be in flight initially');
  t.same(controller.auxiliaryLineOwners, ['feeder'], 'the first line should own its response');

  controller.runner.parse('ok');
  t.same(writes, ['G0 X1\n', 'G0 X2\n'], 'the first acknowledgement should advance the batch');
  t.same(controller.auxiliaryLineOwners, ['feeder'], 'ownership should transfer to the second line');

  controller.runner.parse('ok');
  t.same(controller.auxiliaryLineOwners, [], 'the final response should drain feeder ownership');
  t.equal(controller.feeder.size(), 0, 'the complete batch should leave no queued lines');

  controller.destroy();
  t.end();
});

test('GrblController owns unsupported probe errors and resumes deferred feeder work', (t) => {
  const { controller, writes } = createController();
  let senderAcks = 0;
  controller.sender.ack = () => {
    senderAcks += 1;
  };

  controller.enqueueProbeStateQuery(2);
  controller.enqueueProbeStateQuery(1);
  controller.command('gcode', 'G0 X2');
  t.same(writes, ['$#=_probe2_state\n'], 'queued probe and feeder work should remain behind P2');

  controller.runner.parse('error:3');

  t.equal(controller.probeStateQueryPending, null, 'the probe error should clear pending state');
  t.same(controller.probeStateQueryQueue, [], 'queued probe requests should be discarded after an error');
  t.equal(senderAcks, 0, 'the probe error must not acknowledge sender work');
  t.same(writes, ['$#=_probe2_state\n', 'G0 X2\n'], 'deferred feeder work should start after the owned probe error');
  t.same(controller.auxiliaryLineOwners, ['feeder'], 'only the deferred feeder line should remain owned');
  t.same(controller.runner.state.status.probeInputs[2], {
    available: false,
    triggered: false,
    sequence: 1
  }, 'an unsupported probe error should publish an unavailable P2 result');

  controller.runner.parse('ok');
  t.same(controller.auxiliaryLineOwners, [], 'the deferred feeder ok should drain its own owner');

  controller.destroy();
  t.end();
});

test('GrblController reset clears probe ownership, queues, timer, and deferred feeder work', (t) => {
  const { controller, writes } = createController();

  controller.enqueueProbeStateQuery(0);
  controller.enqueueProbeStateQuery(1);
  controller.command('gcode', 'G0 X3');
  t.same(controller.auxiliaryLineOwners, ['probe-state'], 'the active probe should own the serial line before reset');
  t.equal(controller.feeder.size(), 1, 'manual work should be deferred before reset');

  controller.command('reset');

  t.same(writes, ['$#=_probe_state\n', '\x18'], 'reset should send realtime reset after the active query');
  t.equal(controller.probeStateQueryPending, null, 'reset should clear pending probe state');
  t.same(controller.probeStateQueryQueue, [], 'reset should clear queued probe requests');
  t.equal(controller.probeStateQueryTimer, null, 'reset should clear the probe timeout');
  t.same(controller.auxiliaryLineOwners, [], 'reset should clear all line ownership');
  t.equal(controller.feeder.size(), 0, 'reset should discard deferred feeder work');

  controller.destroy();
  t.end();
});

test('GrblController raw realtime reset uses the controller reset boundary', (t) => {
  for (const method of ['writeFromClient', 'writeln']) {
    const { controller, writes } = createController();
    controller.enqueueProbeStateQuery(0);
    controller.command('gcode', 'G0 X9');

    t.equal(controller[method]('\x18'), true, `${method} should accept Ctrl-X`);
    t.same(writes, ['$#=_probe_state\n', '\x18'], `${method} should send Ctrl-X after the active query`);
    t.equal(controller.ready, false, `${method} should wait for a new startup boundary`);
    t.equal(controller.probeStateQueryPending, null, `${method} should cancel the active probe query`);
    t.same(controller.auxiliaryLineOwners, [], `${method} should discard stale line owners`);
    t.equal(controller.feeder.size(), 0, `${method} should discard deferred feeder work`);

    controller.destroy();
  }

  t.end();
});

test('GrblController treats alarm as a command-buffer boundary', (t) => {
  const { controller, writes } = createController();

  controller.enqueueProbeStateQuery(1);
  controller.command('gcode', 'G0 X4');
  t.same(controller.auxiliaryLineOwners, ['probe-state'], 'probe query should own the active line before alarm');
  t.equal(controller.feeder.size(), 1, 'manual work should be deferred before alarm');

  controller.runner.parse('ALARM:1');

  t.equal(controller.probeStateQueryPending, null, 'alarm should cancel the active probe query');
  t.same(controller.probeStateQueryQueue, [], 'alarm should discard queued probe queries');
  t.same(controller.auxiliaryLineOwners, [], 'alarm should discard owners whose terminators were aborted');
  t.equal(controller.feeder.size(), 0, 'alarm should discard deferred feeder work');

  t.equal(controller.writeln('$X'), true, 'unlock should be accepted after alarm cleanup');
  t.same(controller.auxiliaryLineOwners, ['client'], 'unlock should own only its own response');
  controller.runner.parse('ok');
  t.same(controller.auxiliaryLineOwners, [], 'unlock ok should drain without inheriting stale ownership');
  t.same(writes, ['$#=_toolsetter_state\n', '$X\n'], 'no deferred motion should be written after the alarm');

  controller.destroy();
  t.end();
});

test('GrblController defers feeder work until the sender is safely drained', (t) => {
  const { controller, writes } = createController();

  controller.workflow.state = WORKFLOW_STATE_RUNNING;
  controller.command('gcode', 'G0 X5');
  t.same(writes, [], 'feeder work must not interleave with a running sender');
  t.equal(controller.feeder.size(), 1, 'running workflow should retain the feeder command in its queue');

  controller.workflow.state = WORKFLOW_STATE_PAUSED;
  controller.sender.state.gcode = 'G1 X1';
  controller.sender.state.lines = ['G1 X1'];
  controller.sender.state.sent = 1;
  controller.sender.state.received = 0;
  controller.sender.state.hold = true;
  controller.runner.parse('ok');

  t.equal(controller.sender.state.received, 1, 'the outstanding sender line should receive its own acknowledgement');
  t.same(writes, ['G0 X5\n'], 'deferred feeder work should start only after sender drain');
  t.same(controller.auxiliaryLineOwners, ['feeder'], 'the deferred feeder line should own the next response');
  controller.runner.parse('ok');
  t.same(controller.auxiliaryLineOwners, [], 'the feeder response should drain independently');

  controller.destroy();
  t.end();
});

test('GrblController raw client writes are realtime-only and cannot spoof owners', (t) => {
  const { controller, writes } = createController();

  t.equal(controller.writeFromClient('G0 X6\n'), false, 'raw line commands should be rejected');
  t.equal(controller.writeFromClient('?'), true, 'realtime status queries should remain available');
  t.same(writes, ['?'], 'only the realtime byte should reach the connection');

  t.equal(controller.writeln('G0 X1\nG0 X2'), false, 'multi-line writeln requests should be rejected');
  t.equal(controller.writeln(`G0 X1${String.fromCharCode(0x85)}`), false, 'mixed extended realtime data should not bypass line ownership');
  t.same(controller.auxiliaryLineOwners, [], 'rejected writes must not create response owners');

  t.equal(controller.writeln('$#=_probe_state', { lineOwner: 'probe-state' }), true, 'line command should use the owner-aware path');
  t.same(controller.auxiliaryLineOwners, ['client'], 'socket context must not spoof the internal probe owner');
  controller.runner.parse('[PARAM:_probe_state=0]');
  controller.runner.parse('ok');
  t.same(controller.auxiliaryLineOwners, [], 'the client-owned response should drain normally');

  controller.destroy();
  t.end();
});

test('GrblController drains stopped sender responses before probing', (t) => {
  const { controller, writes } = createController();
  const addJobFromController = jobHistory.addJobFromController;
  jobHistory.addJobFromController = () => {};
  t.teardown(() => {
    jobHistory.addJobFromController = addJobFromController;
  });

  controller.workflow.state = WORKFLOW_STATE_RUNNING;
  controller.sender.state.gcode = 'G1 X1\nG1 X2';
  controller.sender.state.lines = ['G1 X1', 'G1 X2'];
  controller.sender.state.total = 2;
  controller.sender.state.sent = 2;
  controller.sender.state.received = 0;

  controller.command('gcode:stop');

  t.equal(controller.senderResponsesToDrain, 2, 'stop should retain the count of sender replies still on the wire');
  t.equal(controller.sender.state.sent, 0, 'sender bookkeeping may rewind after the drain count is captured');

  controller.enqueueProbeStateQuery(1);
  controller.command('gcode', 'G0 X7');
  t.same(writes, [], 'probe and feeder lines must wait behind stopped sender replies');

  controller.runner.parse('ok');
  t.equal(controller.senderResponsesToDrain, 1, 'the first late sender ok should only reduce the drain count');
  t.same(writes, [], 'no new line should start with one sender response outstanding');

  controller.runner.parse('error:3');
  t.equal(controller.senderResponsesToDrain, 0, 'sender errors should also terminate one stopped line');
  t.same(writes, ['G0 X7\n'], 'deferred feeder work should start only after the sender boundary is restored');
  t.same(controller.auxiliaryLineOwners, ['feeder'], 'the deferred feeder line should own its own response');

  controller.runner.parse('ok');
  controller.enqueueProbeStateQuery(1);
  t.same(writes, ['G0 X7\n', '$#=_toolsetter_state\n'], 'probe query should start after the stopped sender and feeder both drain');
  controller.runner.parse('[PARAM:_toolsetter_state=0]');
  controller.runner.parse('ok');
  t.equal(controller.probeStateQueryPending, null, 'probe query should complete on its own response');

  controller.destroy();
  t.end();
});
