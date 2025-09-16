#!/usr/bin/env node

const { execSync } = require('child_process');

function getCurrentVersion() {
  try {
    // Get the latest tag from git
    const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    // Remove 'v' prefix if present
    return latestTag.startsWith('v') ? latestTag.slice(1) : latestTag;
  } catch (error) {
    // If no tags exist, return a default version
    console.error('❌ No git tags found. Use "git tag v0.1.0" to create the first tag.');
    process.exit(1);
  }
}

function main() {
  const version = getCurrentVersion();
  console.log(version);
}

if (require.main === module) {
  main();
}

module.exports = { getCurrentVersion };
