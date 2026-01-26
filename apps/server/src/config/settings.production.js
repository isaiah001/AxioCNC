import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import pkg from '../../package.json';
import urljoin from '../lib/urljoin';

const publicPath = ((payload) => {
  const algorithm = 'sha1';
  const buf = String(payload);
  const hash = crypto.createHash(algorithm).update(buf).digest('hex');
  return '/' + hash.substring(0, 8) + '/'; // 8 digits
})(pkg.version);

const maxAge = (365 * 24 * 60 * 60 * 1000); // one year

// Detect web dist path based on deployment context
// - Headless/server package: web is a dependency at node_modules/@axiocnc/web/dist
//   From dist/config: .. -> dist, .. -> /opt/axiocnc, then node_modules/@axiocnc/web/dist
// - Desktop package: web is a peer at ../../../../web/dist (from dist/config)
// - Development: web is at ../../../web/dist (from dist/config)
const findWebDistPath = () => {
  const baseDir = __dirname; // dist/config
  const candidates = [
    // Headless/server package: web is a dependency (from dist/config up 2 levels to root, then node_modules/@axiocnc/web/dist)
    path.resolve(baseDir, '..', '..', 'node_modules', '@axiocnc', 'web', 'dist'),
    // Desktop package: web is a peer (from dist/config up to node_modules/@axiocnc, then to web)
    path.resolve(baseDir, '..', '..', '..', '..', 'web', 'dist'),
    // Development fallback
    path.resolve(baseDir, '..', '..', '..', 'web', 'dist'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback to development path if none found
  return candidates[2];
};

export default {
  route: '/', // with trailing slash
  assets: {
    app: {
      routes: [ // with trailing slash
        urljoin(publicPath, '/'),
        '/' // fallback
      ],
      path: findWebDistPath(),
      maxAge: maxAge
    }
  },
  backend: {
    enable: false, // disable backend service in production
    host: 'localhost',
    port: 80,
    route: 'api/'
  },
  cluster: {
    // note. node-inspector cannot debug child (forked) process
    enable: false,
    maxWorkers: os.cpus().length || 1
  },
  winston: {
    // https://github.com/winstonjs/winston#logging-levels
    level: 'info'
  }
};
