/**
 * Packaged app: node_modules live in extraResources (resources/axiocnc/node_modules).
 * Make the main process resolve electron-store, chalk, etc. from that path.
 */
const { app } = require('electron');
const path = require('path');
const Module = require('module');

if (app.isPackaged) {
  const extraNodeModules = path.join(process.resourcesPath, 'axiocnc', 'node_modules');
  const origResolveFilename = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (
      !request.startsWith('.') &&
      !request.startsWith('/') &&
      !path.isAbsolute(request)
    ) {
      const fakeParent = { paths: [extraNodeModules].concat(parent && parent.paths ? parent.paths : []) };
      try {
        return origResolveFilename.call(this, request, fakeParent, isMain, options);
      } catch (_) {
        // fall back to default resolution
      }
    }
    return origResolveFilename.call(this, request, parent, isMain, options);
  };
}

require('./main');
