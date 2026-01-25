#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '../../..');
const desktopDist = path.join(repoRoot, 'apps/desktop/dist');

// Helper to get pnpm command (handles Windows .cmd extension)
const getPnpmCommand = () => {
  if (process.platform === 'win32') {
    return 'pnpm.cmd';
  }
  return 'pnpm';
};

const run = (cmd, args, options = {}) => {
  // On Windows, use shell: true to find commands in PATH
  const spawnOptions = {
    stdio: 'inherit',
    ...options,
  };
  if (process.platform === 'win32' && !path.isAbsolute(cmd) && !cmd.includes(path.sep)) {
    spawnOptions.shell = true;
  }

  const result = spawnSync(cmd, args, spawnOptions);
  if (result.error) {
    console.error(`❌ Failed to run ${cmd}:`, result.error.message || result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

const assertExists = (targetPath, label) => {
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ Missing ${label} at ${targetPath}`);
    process.exit(1);
  }
};

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

// Parse platform and arch arguments
const platformFlagIndex = process.argv.indexOf('--platform');
const archFlagIndex = process.argv.indexOf('--arch');
const platform = platformFlagIndex >= 0 ? process.argv[platformFlagIndex + 1] : null;
const arch = archFlagIndex >= 0 ? process.argv[archFlagIndex + 1] : null;

if (!platform || !arch) {
  console.error('❌ Missing required --platform and --arch arguments');
  console.error('   Usage: node prepare-desktop-app.js --platform <win|linux|mac> --arch <x64|arm64|armv7l>');
  process.exit(1);
}

// Construct bundle directory path from platform/arch
const outputRoot = path.join(repoRoot, 'build', `${platform}-${arch}`, 'axiocnc');

// Map platform/arch to mediamtx platform format
// mediamtx uses: windows-amd64, linux-amd64, linux-arm64, linux-armv7, darwin-amd64, darwin-arm64
const getMediamtxPlatform = (platform, arch) => {
  if (platform === 'win') {
    return 'windows-amd64'; // Windows only supports amd64
  } else if (platform === 'linux') {
    if (arch === 'amd64' || arch === 'x64') {
      return 'linux-amd64';
    } else if (arch === 'arm64') {
      return 'linux-arm64';
    } else if (arch === 'armv7l') {
      return 'linux-armv7';
    }
  } else if (platform === 'mac') {
    if (arch === 'amd64' || arch === 'x64') {
      return 'darwin-amd64';
    } else if (arch === 'arm64') {
      return 'darwin-arm64';
    }
  }
  return null;
};

const mediamtxPlatform = getMediamtxPlatform(platform, arch);

assertExists(desktopDist, 'desktop runtime build output');

// Clean output directory
console.log(`🧹 Cleaning ${outputRoot}...`);
if (fs.existsSync(outputRoot)) {
  fs.rmSync(outputRoot, { recursive: true, force: true });
}
ensureDir(outputRoot);

// Deploy server package - this creates dist/, node_modules/, and package.json
console.log('📦 Deploying server package with pnpm deploy...');
// pnpm deploy needs to run from the repo root and deploy to the output directory
// We need to temporarily modify package.json to remove @axiocnc/shared dependency
// since we'll link it manually
const pkgPath = path.join(outputRoot, 'package.json');
let originalSharedDep = null;

try {
  // Deploy to outputRoot - creates outputRoot/dist/, outputRoot/node_modules/, outputRoot/package.json
  // --legacy flag needed for compatibility with older pnpm versions
  run(getPnpmCommand(), ['deploy', '--prod', '--filter', '@axiocnc/server', '--legacy', outputRoot], {
    cwd: repoRoot,
    env: {
      ...process.env,
    },
  });

  // Temporarily remove @axiocnc/shared from package.json since we'll handle it separately
  // (pnpm deploy will include it as a dependency, but we want to link it from shared/)
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    originalSharedDep = pkg.dependencies && pkg.dependencies['@axiocnc/shared'];
    if (pkg.dependencies && pkg.dependencies['@axiocnc/shared']) {
      delete pkg.dependencies['@axiocnc/shared'];
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    }
  }
} finally {
  // Restore @axiocnc/shared dependency if it was removed
  if (originalSharedDep && fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.dependencies['@axiocnc/shared'] = originalSharedDep;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

// Copy web app and shared code (these aren't deployed, just built)
console.log('📦 Copying web app and shared code...');
const webDist = path.join(repoRoot, 'apps/web/dist');
const sharedDist = path.join(repoRoot, 'apps/shared/dist');

assertExists(webDist, 'web build output');
assertExists(sharedDist, 'shared build output');

const copyDir = (from, to) => {
  fs.cpSync(from, to, { recursive: true, dereference: true });
};

copyDir(webDist, path.join(outputRoot, 'app'));
copyDir(sharedDist, path.join(outputRoot, 'shared'));

// Copy shared library into node_modules so server code can import it
console.log('📦 Copying shared library into node_modules...');
const sharedNodeModulesPath = path.join(outputRoot, 'node_modules', '@axiocnc');
const sharedLinkPath = path.join(sharedNodeModulesPath, 'shared');
const sharedDistPath = path.join(outputRoot, 'shared');

if (fs.existsSync(sharedDistPath)) {
  ensureDir(sharedNodeModulesPath);
  if (fs.existsSync(sharedLinkPath)) {
    fs.rmSync(sharedLinkPath, { recursive: true, force: true });
  }
  copyDir(sharedDistPath, sharedLinkPath);
  
  // Update package.json in the copied location with corrected main path
  const sharedPkgPath = path.join(repoRoot, 'apps/shared/package.json');
  const sharedPkg = JSON.parse(fs.readFileSync(sharedPkgPath, 'utf8'));
  sharedPkg.main = 'index.js';
  sharedPkg.types = 'index.d.ts';
  fs.writeFileSync(path.join(sharedLinkPath, 'package.json'), JSON.stringify(sharedPkg, null, 2) + '\n');
  console.log(`✅ Copied shared library to ${sharedLinkPath}`);
} else {
  console.error(`❌ Shared dist not found at ${sharedDistPath}`);
  process.exit(1);
}

// Filter vendor/mediamtx to only include the target platform
console.log('🔍 Filtering vendor/mediamtx to target platform...');
const vendorMediamtxPath = path.join(outputRoot, 'dist', 'vendor', 'mediamtx');
if (fs.existsSync(vendorMediamtxPath) && mediamtxPlatform) {
  console.log(`   Target platform: ${mediamtxPlatform}`);
  // List all platform directories
  const entries = fs.readdirSync(vendorMediamtxPath, { withFileTypes: true });
  const platformDirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

  // Remove all platform directories except the target one
  for (const dir of platformDirs) {
    if (dir !== mediamtxPlatform) {
      const dirPath = path.join(vendorMediamtxPath, dir);
      console.log(`   Removing ${dir}...`);
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }
  console.log(`✅ Filtered vendor/mediamtx to ${mediamtxPlatform} only`);
} else if (fs.existsSync(vendorMediamtxPath)) {
  console.warn(`⚠️  Could not determine mediamtx platform for ${platform}-${arch}`);
  console.warn(`   Keeping all platform directories in vendor/mediamtx`);
} else {
  console.log('   No vendor/mediamtx directory found, skipping filter');
}

// Rebuild native modules for Electron
console.log('🔧 Rebuilding native modules for Electron...');
const desktopPkg = require(path.join(repoRoot, 'apps/desktop/package.json'));
const electronVersion = desktopPkg.devDependencies?.electron;
if (!electronVersion) {
  console.error('❌ Could not read Electron version from apps/desktop/package.json');
  process.exit(1);
}
run('npx', ['@electron/rebuild', '--version', electronVersion, '--module-dir', outputRoot, '--force'], {
  cwd: repoRoot,
});
console.log('✅ Native modules rebuilt for Electron');


console.log('✅ Verifying bundle layout...');
assertExists(path.join(outputRoot, 'dist', 'cli.js'), 'server cli.js');
assertExists(path.join(outputRoot, 'app'), 'web app directory');
assertExists(path.join(outputRoot, 'node_modules'), 'node_modules');

console.log(`✅ Bundle ready at ${outputRoot}`);
