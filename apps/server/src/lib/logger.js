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

const { combine, colorize, timestamp, printf } = winston.format;

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

// https://github.com/winstonjs/winston/blob/master/README.md#creating-your-own-logger
const transports = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp(),
      printf(log => `${log.timestamp} - ${log.level} ${log.message}`)
    ),
    handleExceptions: true
  })
];

// Add file transport if log directory is accessible
if (homeDir && fs.existsSync(logDir)) {
  transports.push(
    new winston.transports.File({
      filename: logFile,
      format: combine(
        timestamp(),
        printf(log => `${log.timestamp} - ${log.level} ${log.message}`)
      ),
      handleExceptions: true
    })
  );
}

const logger = winston.createLogger({
  exitOnError: false,
  level: settings.winston.level,
  silent: false,
  transports: transports
});

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

export const getLevel = () => logger.level;
export const setLevel = (level) => {
  logger.level = level;
};

export default (namespace = '') => {
  namespace = String(namespace);

  return levels.reduce((acc, level) => {
    acc[level] = function(...args) {
      if ((settings.verbosity >= VERBOSITY_MAX) && (level !== 'silly')) {
        args = args.concat(getStackTrace()[2]);
      }
      return (namespace.length > 0)
        ? logger[level](chalk.cyan(namespace) + ' ' + util.format(...args))
        : logger[level](util.format(...args));
    };
    return acc;
  }, {});
};
