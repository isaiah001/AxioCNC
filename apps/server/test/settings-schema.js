import { test } from 'tap';
import {
  getDefaultSettings,
  validatePartialSettings,
  parseSettings,
  ZeroingMethodSchema,
} from '@axiocnc/shared/src/schemas/settings';

const probeMethodFixtures = [
  {
    id: 'bitsetter',
    type: 'bitsetter',
    name: 'BitSetter',
    enabled: true,
    axes: 'z',
  },
  {
    id: 'bitzero',
    type: 'bitzero',
    name: 'BitZero',
    enabled: true,
    axes: 'xyz',
  },
  {
    id: 'touchplate',
    type: 'touchplate',
    name: 'Touch Plate',
    enabled: true,
    axes: 'xyz',
  },
];

test('Settings Schema Functions', (t) => {
  t.test('getDefaultSettings - returns complete settings with all defaults applied', (subt) => {
    const defaults = getDefaultSettings();

    subt.ok(defaults, 'should return settings object');
    subt.equal(typeof defaults, 'object', 'should be an object');

    // Check that all top-level sections exist
    subt.ok(defaults.machine, 'should have machine settings');
    subt.ok(defaults.connection, 'should have connection settings');
    subt.ok(defaults.camera, 'should have camera settings');
    subt.ok(defaults.zeroingMethods, 'should have zeroing methods');
    subt.ok(defaults.zeroingStrategies, 'should have zeroing strategies');
    subt.same(defaults.zeroingStrategies.workXYZero, ['ask'], 'zeroingStrategies.workXYZero default');
    subt.same(defaults.zeroingStrategies.workZZero, ['ask'], 'zeroingStrategies.workZZero default');
    subt.equal(defaults.zeroingStrategies.toolChangePolicy, 'ask', 'zeroingStrategies.toolChangePolicy default');
    subt.ok(defaults.joystick, 'should have joystick settings');
    subt.ok(defaults.appearance, 'should have appearance settings');

    // Check some specific defaults
    subt.equal(defaults.lang, 'en', 'should have default language');
    subt.equal(defaults.checkForUpdates, true, 'should have default update check');
    subt.equal(defaults.connection.baudRate, 115200, 'should have default baud rate');
    subt.equal(defaults.machine.name, 'My CNC Machine', 'should have default machine name');

    subt.end();
  });

  t.test('validatePartialSettings - validates partial settings successfully', (subt) => {
    const partialData = {
      lang: 'fr',
      machine: {
        name: 'Test Machine'
      }
    };

    const result = validatePartialSettings(partialData);

    subt.ok(result.success, 'should succeed for valid partial data');
    subt.ok(result.data, 'should return validated data');
    subt.equal(result.data.lang, 'fr', 'should preserve provided lang');
    subt.equal(result.data.machine.name, 'Test Machine', 'should preserve provided machine name');
    subt.notOk(result.error, 'should not have error');

    subt.end();
  });

  t.test('validatePartialSettings - rejects invalid partial settings', (subt) => {
    const invalidData = {
      lang: 123, // should be string
      connection: {
        baudRate: 'invalid' // should be number
      }
    };

    const result = validatePartialSettings(invalidData);

    subt.notOk(result.success, 'should fail for invalid data');
    subt.ok(result.error, 'should have error details');
    subt.ok(Array.isArray(result.error.issues), 'error should have issues array');

    subt.end();
  });

  t.test('validatePartialSettings - handles empty object', (subt) => {
    const result = validatePartialSettings({});

    subt.ok(result.success, 'should succeed for empty object');
    subt.ok(result.data, 'should return data object');
    subt.equal(typeof result.data, 'object', 'should be an object');

    subt.end();
  });

  t.test('parseSettings - parses valid settings successfully', (subt) => {
    const validSettings = {
      lang: 'de',
      machine: {
        name: 'German Machine'
      },
      connection: {
        baudRate: 9600
      }
    };

    const result = parseSettings(validSettings);

    subt.ok(result, 'should return parsed settings');
    subt.equal(result.lang, 'de', 'should preserve custom lang');
    subt.equal(result.machine.name, 'German Machine', 'should preserve custom machine name');
    subt.equal(result.connection.baudRate, 9600, 'should preserve custom baud rate');

    // Should have defaults applied for missing fields
    subt.equal(result.checkForUpdates, true, 'should apply defaults for missing fields');

    subt.end();
  });

  t.test('parseSettings - throws on invalid settings', (subt) => {
    const invalidSettings = {
      lang: 456, // should be string
      machine: {
        limits: {
          xmin: 'invalid' // should be number
        }
      }
    };

    try {
      parseSettings(invalidSettings);
      subt.fail('should throw on invalid settings');
    } catch (error) {
      subt.ok(error, 'should throw validation error');
      subt.ok(error.issues, 'error should have issues');
    }

    subt.end();
  });

  t.test('parseSettings - applies all defaults for empty object', (subt) => {
    const result = parseSettings({});

    subt.ok(result, 'should return settings with defaults');
    subt.equal(result.lang, 'en', 'should apply lang default');
    subt.equal(result.checkForUpdates, true, 'should apply checkForUpdates default');
    subt.ok(result.connection, 'should have connection object');
    // Note: nested defaults like baudRate are not applied by parseSettings
    // Use getDefaultSettings() for fully defaulted settings

    subt.end();
  });

  t.test('integration - getDefaultSettings produces valid settings', (subt) => {
    const defaults = getDefaultSettings();

    // Should not throw when parsed again
    const reParsed = parseSettings(defaults);
    subt.same(reParsed, defaults, 'getDefaultSettings should produce valid settings');

    subt.end();
  });

  t.test('probe methods accept P0, P1, and P2 probe inputs', (subt) => {
    probeMethodFixtures.forEach((method) => {
      [0, 1, 2].forEach((probeInput) => {
        const result = ZeroingMethodSchema.safeParse({ ...method, probeInput });

        subt.ok(result.success, `${method.type} should accept P${probeInput}`);
        subt.equal(result.data?.probeInput, probeInput, `${method.type} should preserve P${probeInput}`);
      });
    });

    subt.end();
  });

  t.test('legacy probe methods remain valid without a probe input', (subt) => {
    probeMethodFixtures.forEach((method) => {
      const result = ZeroingMethodSchema.safeParse(method);

      subt.ok(result.success, `${method.type} should accept an omitted probeInput`);
      subt.notOk(Object.prototype.hasOwnProperty.call(result.data, 'probeInput'), `${method.type} should keep probeInput omitted`);
    });

    subt.end();
  });

  t.test('probe methods reject invalid probe inputs', (subt) => {
    const invalidProbeInputs = [-1, 3, 1.5, '1'];

    probeMethodFixtures.forEach((method) => {
      invalidProbeInputs.forEach((probeInput) => {
        const result = ZeroingMethodSchema.safeParse({ ...method, probeInput });

        subt.notOk(result.success, `${method.type} should reject probeInput ${JSON.stringify(probeInput)}`);
      });
    });

    subt.end();
  });

  t.end();
});
