#!/usr/bin/env node
/**
 * Update download links and version references across the website to the latest release version
 *
 * Usage: node developers/scripts/update-web-links.js
 *
 * This script:
 * 1. Reads the version from package.json
 * 2. Updates all version references in:
 *    - website/static/index.html (download URLs)
 *    - website/static/install-*.sh files (install scripts)
 *    - website/docs/user/docs/installation/*.md (documentation)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '../..');
const packageJsonPath = join(rootDir, 'package.json');

// Read version from package.json
let version;
try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  version = packageJson.version;
  if (!version) {
    console.error('❌ Error: No version found in package.json');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error: Failed to read package.json');
  console.error(error.message);
  process.exit(1);
}

// Format version with 'v' prefix for URLs
const versionWithV = `v${version}`;

console.log(`📝 Updating version references to ${versionWithV}...\n`);

// Pattern to match version in GitHub release URLs
// Matches: https://github.com/rsteckler/AxioCNC/releases/download/v0.0.86/...
const urlVersionPattern = /(https:\/\/github\.com\/rsteckler\/AxioCNC\/releases\/download\/)v\d+\.\d+\.\d+(\/[^"'\s\n]+)/g;

// Pattern to match version in package filenames (e.g., axiocnc-headless_0.0.86_amd64.deb)
const filenameVersionPattern = /(axiocnc(?:-headless|-desktop)?_)\d+\.\d+\.\d+(_[^"'\s\n]+)/g;

// Function to update version references in a file
function updateFile(filePath, description) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let updated = false;
    let matchCount = 0;

    // Update URLs with version
    const urlMatches = [...content.matchAll(urlVersionPattern)];
    if (urlMatches.length > 0) {
      content = content.replace(urlVersionPattern, (match, prefix, suffix) => {
        matchCount++;
        return `${prefix}${versionWithV}${suffix}`;
      });
      updated = true;
    }

    // Update filenames with version
    const filenameMatches = [...content.matchAll(filenameVersionPattern)];
    if (filenameMatches.length > 0) {
      content = content.replace(filenameVersionPattern, (match, prefix, suffix) => {
        if (!updated) matchCount++;
        return `${prefix}${version}${suffix}`;
      });
      updated = true;
    }

    if (updated) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${matchCount} reference(s) in ${description}`);
      return matchCount;
    }
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${description}:`, error.message);
    return 0;
  }
}

let totalUpdates = 0;

// Update index.html
const indexHtmlPath = join(rootDir, 'website/static/index.html');
totalUpdates += updateFile(indexHtmlPath, 'website/static/index.html');

// Update install scripts
const staticDir = join(rootDir, 'website/static');
try {
  const files = readdirSync(staticDir);
  for (const file of files) {
    if (file.startsWith('install-') && !file.includes('.')) {
      const filePath = join(staticDir, file);
      const stats = statSync(filePath);
      if (stats.isFile()) {
        totalUpdates += updateFile(filePath, `website/static/${file}`);
      }
    }
  }
} catch (error) {
  console.error('❌ Error reading static directory:', error.message);
}

// Update installation documentation
const installationDocsDir = join(rootDir, 'website/docs/user/docs/installation');
try {
  const files = readdirSync(installationDocsDir);
  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = join(installationDocsDir, file);
      totalUpdates += updateFile(filePath, `website/docs/user/docs/installation/${file}`);
    }
  }
} catch (error) {
  console.error('❌ Error reading installation docs directory:', error.message);
}

console.log(`\n✨ Updated ${totalUpdates} version reference(s) total`);
console.log(`   Version: ${versionWithV}`);
