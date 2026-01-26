const path = require('path');

const bundleDir = process.env.AXIOCNC_BUNDLE_DIR;
const outputDir = process.env.AXIOCNC_OUTPUT_DIR;
if (!bundleDir) {
  throw new Error('AXIOCNC_BUNDLE_DIR is required for desktop packaging');
}
if (!outputDir) {
  throw new Error('AXIOCNC_OUTPUT_DIR is required for desktop packaging');
}

// build-resources (icons, etc.) live next to this config; projectDir may be app staging.
const buildResourcesDir = path.join(__dirname, 'build-resources');

module.exports = {
  appId: 'org.axiocnc',
  productName: 'AxioCNC',
  extraMetadata: {
    name: 'axiocnc',
  },
  directories: {
    buildResources: buildResourcesDir,
    output: outputDir,
  },
  extraResources: [
    {
      from: path.join(bundleDir, 'node_modules'),
      to: 'axiocnc/node_modules',
    },
    {
      from: path.join(bundleDir, 'package.json'),
      to: 'axiocnc/package.json',
    },
  ],
  files: [
    'dist/**/*',
    'package.json',
    // FileSet avoids getMainFileMatchers adding !**/node_modules/** (which excludes
    // node_modules from main matcher). We skip the collector, so we must pack it ourselves.
    { from: 'node_modules', to: 'node_modules', filter: ['**/*'] },
  ],
  beforeBuild: async () => {
    // Skip install/rebuild and electron-builder's pnpm collector. We pack existing
    // node_modules from app staging (pnpm deploy). See ai/docs/electron-builder-pnpm-root-cause.md.
    return false;
  },
  asar: true,
  publish: [],
  artifactName: 'axiocnc-desktop_${version}_${arch}.${ext}',
  mac: {
    category: 'public.app-category.productivity',
    target: [
      'dmg',
    ],
    icon: 'icon.icns',
  },
  dmg: {
    background: 'background.png',
    icon: 'icon.icns',
    iconSize: 80,
    iconTextSize: 12,
    contents: [
      {
        x: 448,
        y: 344,
        type: 'link',
        path: '/Applications',
      },
      {
        x: 192,
        y: 344,
        type: 'file',
      },
    ],
  },
  win: {
    target: [
      'nsis',
    ],
    icon: 'icon.ico',
  },
  linux: {
    category: 'Utility',
    target: [
      'deb',
    ],
  },
};
