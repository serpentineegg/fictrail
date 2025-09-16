#!/usr/bin/env node

const fs = require('fs');
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

function updatePackageJson(newVersion) {
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`📦 Updated package.json to v${newVersion}`);
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message);
    process.exit(1);
  }
}

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ Error during ${description.toLowerCase()}:`, error.message);
    process.exit(1);
  }
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.error('❌ Working directory is not clean. Please commit or stash changes first.');
      console.log('\nUncommitted changes:');
      console.log(status);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error checking git status:', error.message);
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
    process.exit(1);
  }

  console.log(`🚀 Starting ${bumpType} version bump...`);

  // Check git status
  checkGitStatus();

  // Get current version
  const currentVersion = getCurrentVersion();
  console.log(`📋 Current version: ${currentVersion}`);

  // Calculate new version
  const newVersion = bumpVersion(currentVersion, bumpType);
  console.log(`📈 New version: ${newVersion}`);

  // Update package.json
  updatePackageJson(newVersion);

  // Build the project
  runCommand('npm run build', 'Building project');

  // Commit changes
  runCommand('git add package.json dist/', 'Staging files');
  runCommand(`git commit -m "chore: bump version to v${newVersion}"`, 'Committing version bump');

  // Create and push tag
  runCommand(`git tag v${newVersion}`, 'Creating git tag');
  runCommand('git push origin main', 'Pushing to main branch');
  runCommand(`git push origin v${newVersion}`, 'Pushing tag');

  console.log(`🎉 Successfully released v${newVersion}!`);
  console.log('🔗 GitHub Actions will now build and create the release automatically.');
  console.log(`📦 Release will be available at: https://github.com/serpentineegg/fictrail/releases/tag/v${newVersion}`);
}

if (require.main === module) {
  main();
}

module.exports = { bumpVersion, parseVersion };
