import util from 'util';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import winston from 'winston';
import settings from '../config/settings';

// https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
const getStackTrace = () => {
  const obj = {};
  Error.captureStackTrace(obj, getStackTrace);
  return (obj.stack || '').split('\n');
};

const VERBOSITY_MAX = 3; // -vvv

// Get home directory and set up log file path
const getUserHome = () => (process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']);
const homeDir = getUserHome();
const logDir = path.resolve(homeDir, '.axiocnc', 'logs');
const logFile = path.resolve(logDir, 'axiocnc.log');

// Ensure log directory exists
if (homeDir) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (err) {
    // If we can't create the directory, file transport will fail gracefully
    console.error(`Warning: Cannot create log directory ${logDir}: ${err.message}`);
  }
}

// Lazy-init logger so winston.format is accessed after any circular deps resolve
// (avoids "Cannot read properties of undefined (reading 'combine')" in packaged desktop)
let logger = null;
function ensureLogger() {
  if (logger) {
    return logger;
  }
  const fmt = winston.format;
  const transports = [
    new winston.transports.Console({
      format: fmt.combine(
        fmt.colorize(),
        fmt.timestamp(),
        fmt.printf(log => `${log.timestamp} - ${log.level} ${log.message}`)
      ),
      handleExceptions: true
    })
  ];
  if (homeDir && fs.existsSync(logDir)) {
    transports.push(
      new winston.transports.File({
        filename: logFile,
        format: fmt.combine(
          fmt.timestamp(),
          fmt.printf(log => `${log.timestamp} - ${log.level} ${log.message}`)
        ),
        handleExceptions: true
      })
    );
  }
  logger = winston.createLogger({
    exitOnError: false,
    level: settings.winston.level,
    silent: false,
    transports
  });
  return logger;
}

// https://github.com/winstonjs/winston/blob/master/README.md#logging-levels
// npm logging levels are prioritized from 0 to 5 (highest to lowest):
export const levels = [
  'error', // 0
  'warn', // 1
  'info', // 2
  'verbose', // 3
  'debug', // 4
  'silly', // 5
];

export const getLevel = () => ensureLogger().level;
export const setLevel = (level) => {
  ensureLogger().level = level;
};

export default (namespace = '') => {
  namespace = String(namespace);
  const log = ensureLogger();

  return levels.reduce((acc, level) => {
    acc[level] = function(...args) {
      if ((settings.verbosity >= VERBOSITY_MAX) && (level !== 'silly')) {
        args = args.concat(getStackTrace()[2]);
      }
      return (namespace.length > 0)
        ? log[level](chalk.cyan(namespace) + ' ' + util.format(...args))
        : log[level](util.format(...args));
    };
    return acc;
  }, {});
};
