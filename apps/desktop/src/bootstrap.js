/**
 * Packaged app: node_modules live in extraResources (resources/axiocnc/node_modules).
 * Add that path so the main process can resolve electron-store, chalk, etc. before loading main.js.
 */
const { app } = require('electron');
const path = require('path');
const Module = require('module');

if (app.isPackaged) {
  const nodeModules = path.join(process.resourcesPath, 'axiocnc', 'node_modules');
  Module.globalPaths.unshift(nodeModules);
}

require('./main.js');
