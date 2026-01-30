/* eslint-disable no-console */
/* eslint no-console: 0 */
// Load .env.local for local development (before anything else)
// Try multiple possible locations for .env.local
const path = require('path');
const fs = require('fs');

// Find project root by looking for package.json or .git
const findProjectRoot = () => {
  let currentDir = __dirname;
  while (currentDir !== path.dirname(currentDir)) {
    const packageJson = path.join(currentDir, 'package.json');
    const gitDir = path.join(currentDir, '.git');
    if (fs.existsSync(packageJson) || fs.existsSync(gitDir)) {
      // Check if this looks like the project root (has apps/ directory)
      if (fs.existsSync(path.join(currentDir, 'apps'))) {
        return currentDir;
      }
    }
    currentDir = path.dirname(currentDir);
  }
  // Fallback: assume we're in apps/server/src, go up 3 levels
  return path.resolve(__dirname, '../../..');
};

const projectRoot = findProjectRoot();
const envLocalPath = path.join(projectRoot, '.env.local');
if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
}

// Polyfills removed - Node.js 18+ (minimum required) and Electron 40 (bundles Node.js 20)
// have native support for all ECMAScript features and async/await
const isElectron = require('is-electron');
const program = require('commander');
// In dev/prod builds, package.json is one level up from cli.js
// - Development: apps/server/src/cli.js -> ../package.json -> apps/server/package.json
// - Production: dist/cli.js -> ../package.json -> package.json (at install root)
// eslint-disable-next-line import/no-unresolved
const pkg = require('../package.json');

// Defaults to 'production'
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const increaseVerbosityLevel = (val, total) => {
  return total + 1;
};

const parseMountPoint = (val, acc) => {
  val = val || '';

  const mount = {
    route: '/',
    target: val
  };

  if (val.indexOf(':') >= 0) {
    const r = val.match(/(?:([^:]*)(?::(.*)))/);
    mount.route = r[1];
    mount.target = r[2];
  }

  // mount.route is interpreted by cncjs code that uses posix syntax
  // where the separator is / , so we perform this join in posix mode
  // mode to avoid introducing \ separators when running on Windows.
  mount.route = path.posix.join('/', mount.route || '').trim(); // path.join('/', 'pendant') => '/pendant'
  mount.target = (mount.target || '').trim();

  acc.push(mount);

  return acc;
};

const parseController = (val) => {
  val = val ? (val + '').toLowerCase() : '';

  if (['grbl', 'marlin', 'smoothie', 'tinyg', 'g2core'].includes(val)) {
    return val;
  } else {
    return '';
  }
};

const defaultHost = isElectron() ? '127.0.0.1' : '0.0.0.0';
const defaultPort = isElectron() ? 0 : 8000;

program
  .version(pkg.version, '--version', 'output the current version')
  .usage('[options]')
  .option('-p, --port <port>', `Set listen port (default: ${defaultPort})`, defaultPort)
  .option('-H, --host <host>', `Set listen address or hostname (default: ${defaultHost})`, defaultHost)
  .option('-b, --backlog <backlog>', 'Set listen backlog (default: 511)', 511)
  .option('-c, --config <filename>', 'Set config file (default: ~/.axiocnc/config.json)')
  .option('-v, --verbose', 'Increase the verbosity level (-v, -vv, -vvv)', increaseVerbosityLevel, 0)
  .option('-m, --mount <route-path>:<target>', 'Add a mount point for serving static files', parseMountPoint, [])
  .option('-w, --watch-directory <path>', 'Watch a directory for changes')
  .option('--access-token-lifetime <lifetime>', 'Access token lifetime in seconds or a time span string (default: 30d)')
  .option('--allow-remote-access', 'Allow remote access to the server (default: false)')
  .option('--controller <type>', 'Specify CNC controller: Grbl|Marlin|Smoothie|TinyG|g2core (default: \'\')', parseController, '');

program.on('--help', () => {
  console.log('');
  console.log('  Examples:');
  console.log('');
  console.log('    $ cncjs -vv');
  console.log('    $ cncjs --mount /pendant:/home/pi/tinyweb');
  console.log('    $ cncjs --mount /widget:~+/widget --mount /pendant:~/pendant');
  console.log('    $ cncjs --mount /widget:https://cncjs.github.io/cncjs-widget-boilerplate/v1/');
  console.log('    $ cncjs --watch-directory /home/pi/watch');
  console.log('    $ cncjs --access-token-lifetime 60d  # e.g. 3600, 30m, 12h, 30d');
  console.log('    $ cncjs --allow-remote-access');
  console.log('    $ cncjs --controller Grbl');
  console.log('');
});

// Commander assumes that the first two values in argv are 'node' and appname, and then followed by the args.
// This is not the case when running from a packaged Electron app. Here you have the first value appname and then args.
const normalizedArgv = ('' + process.argv[0]).indexOf(pkg.name) >= 0
  ? ['node', pkg.name, ...process.argv.slice(1)]
  : process.argv;
if (normalizedArgv.length > 1) {
  program.parse(normalizedArgv);
}

const options = program.opts();

const launchServer = () => new Promise((resolve, reject) => {
  // Server code location depends on build structure:
  // - In Electron packaged deployment: cli.js is in dist/, server code is at ./index (same dir)
  // - In production: cli.js is in dist/, server code is at ./index (same dir)
  // - In dev build: cli.js is in src/, server code is at ./index (same dir)
  // Detect location by checking file structure
  const isInSourceDir = __filename.includes('/src/cli.js') || __filename.includes('\\src\\cli.js');
  const isInDistDir = __filename.includes('/dist/cli.js') || __filename.includes('\\dist\\cli.js');
  const hasDistIndex = require('fs').existsSync('./dist/index.js');
  let serverIndexPath;
  if (isInDistDir) {
    serverIndexPath = './index'; // Electron packaged deployment - cli.js is in dist/, index.js is in same dir
  } else if (isInSourceDir) {
    serverIndexPath = './index'; // dev build
  } else if (hasDistIndex) {
    serverIndexPath = './dist/index'; // legacy production build
  } else {
    serverIndexPath = './server/index'; // production build
  }
  // eslint-disable-next-line import/no-dynamic-require, import/no-unresolved
  require(serverIndexPath).createServer({
    port: options.port,
    host: options.host,
    backlog: options.backlog,
    configFile: options.config,
    verbosity: options.verbose,
    mountPoints: options.mount,
    watchDirectory: options.watchDirectory,
    accessTokenLifetime: options.accessTokenLifetime,
    allowRemoteAccess: !!options.allowRemoteAccess,
    controller: options.controller
  }, (err, data) => {
    if (err) {
      reject(err);
      return;
    }

    // When run as child of Electron desktop, notify parent of address/port for loadURL
    if (typeof process.send === 'function') {
      process.send({ type: 'server-started', ...data });
    }
    resolve(data);
  });
});

module.exports = launchServer;

// If this file is run directly (not required as a module), execute the server
if (require.main === module) {
  launchServer().catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
  });
}
