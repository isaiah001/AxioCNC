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
 *    - .github/ISSUE_TEMPLATE/bug_report.yml (version dropdown)
 *    - .github/ISSUE_TEMPLATE/enhancement.yml (version dropdown)
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

// Pattern to find the version dropdown options block in GitHub issue template YAML.
// Captures prefix up to "options:\n", then first option line (with indent), middle options, and "Older version" line.
const versionOptionsBlockRegex = /(id: version\s+attributes:\s+label: AxioCNC Version\s+description:[^\n]+\s+options:\n)(\s+- "\d+\.\d+\.\d+"\n)((?:\s+- "\d+\.\d+\.\d+"\n)*)(\s+- "Older version")/;

function updateIssueTemplateVersion(filePath, description) {
  try {
    let content = readFileSync(filePath, 'utf8');
    const match = content.match(versionOptionsBlockRegex);
    if (!match) {
      console.error(`⚠️ Could not find version options block in ${description}`);
      return 0;
    }
    const [, prefix, firstOptionLine, middleOptions, olderLine] = match;
    const currentFirst = firstOptionLine.match(/- "(\d+\.\d+\.\d+)"/)?.[1];
    if (currentFirst === version) {
      return 0; // Already up to date
    }
    const newFirstLine = firstOptionLine.replace(/\d+\.\d+\.\d+/, version);
    const newBlock = `${prefix}${newFirstLine}${firstOptionLine}${middleOptions}${olderLine}`;
    content = content.replace(versionOptionsBlockRegex, newBlock);
    writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated version dropdown in ${description}`);
    return 1;
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

// Update GitHub issue template version dropdowns
const bugReportPath = join(rootDir, '.github/ISSUE_TEMPLATE/bug_report.yml');
const enhancementPath = join(rootDir, '.github/ISSUE_TEMPLATE/enhancement.yml');
totalUpdates += updateIssueTemplateVersion(bugReportPath, '.github/ISSUE_TEMPLATE/bug_report.yml');
totalUpdates += updateIssueTemplateVersion(enhancementPath, '.github/ISSUE_TEMPLATE/enhancement.yml');

console.log(`\n✨ Updated ${totalUpdates} version reference(s) total`);
console.log(`   Version: ${versionWithV}`);
