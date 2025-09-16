#!/usr/bin/env node

const { execSync } = require('child_process');

const BUMP_TYPES = {
  major: 0,
  minor: 1,
  patch: 2,
  bugfix: 2 // alias for patch
};

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

function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }

  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    prerelease: match[4] || null
  };
}

function bumpVersion(currentVersion, bumpType) {
  const version = parseVersion(currentVersion);

  switch (bumpType) {
    case 'major':
      version.major++;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor++;
      version.patch = 0;
      break;
    case 'patch':
    case 'bugfix':
      version.patch++;
      break;
    default:
      throw new Error(`Invalid bump type: ${bumpType}`);
  }

  return `${version.major}.${version.minor}.${version.patch}`;
}

function createTag(newVersion) {
  try {
    console.log(`🏷️  Creating git tag v${newVersion}...`);
    execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
    console.log(`✅ Created git tag v${newVersion}`);
  } catch (error) {
    console.error('❌ Error creating tag:', error.message);
    process.exit(1);
  }
}

function pushTag(newVersion) {
  try {
    console.log(`📤 Pushing tag v${newVersion}...`);
    execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
    console.log(`✅ Pushed tag v${newVersion}`);
  } catch (error) {
    console.error('❌ Error pushing tag:', error.message);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const bumpType = args[0];

  if (!bumpType || !Object.prototype.hasOwnProperty.call(BUMP_TYPES, bumpType)) {
    console.error('❌ Usage: node scripts/bump.js <major|minor|patch|bugfix>');
    console.log('\nBump types:');
    console.log('  major   - 1.0.0 → 2.0.0 (breaking changes)');
    console.log('  minor   - 1.0.0 → 1.1.0 (new features)');
    console.log('  patch   - 1.0.0 → 1.0.1 (bug fixes)');
    console.log('  bugfix  - alias for patch');
    console.log('\nNote: This script only creates and pushes git tags.');
    console.log('It does not modify package.json or commit any code changes.');
    process.exit(1);
  }

  console.log(`🚀 Creating ${bumpType} version tag...`);

  // Get current version
  const currentVersion = getCurrentVersion();
  console.log(`📋 Current version: ${currentVersion}`);

  // Calculate new version
  const newVersion = bumpVersion(currentVersion, bumpType);
  console.log(`📈 New version: ${newVersion}`);

  // Create and push tag
  createTag(newVersion);
  pushTag(newVersion);

  console.log(`🎉 Successfully created and pushed tag v${newVersion}!`);
  console.log('🔗 GitHub Actions will now build and create the release automatically.');
  console.log(`📦 Release will be available at: https://github.com/serpentineegg/fictrail/releases/tag/v${newVersion}`);
}

if (require.main === module) {
  main();
}

module.exports = { bumpVersion, parseVersion };
