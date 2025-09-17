#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Build configuration
const BUILD_CONFIG = {
  srcDir: './src',
  distDir: './dist',
  outputFile: './dist/fictrail.user.js',
  headerFile: './src/userscript-header.txt',
  modulesDir: 'modules',
  modules: [
    'constants.js',
    'utils.js',
    'styles.js',
    'scraper.js',
    'search.js',
    'ui.js',
    'core.js'
  ]
};

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    process.exit(1);
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Built userscript: ${filePath}`);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message);
    process.exit(1);
  }
}

function cleanAndEnsureDistDir() {
  // Remove existing dist directory if it exists
  if (fs.existsSync(BUILD_CONFIG.distDir)) {
    fs.rmSync(BUILD_CONFIG.distDir, { recursive: true, force: true });
    console.log(`🗑️  Cleaned existing dist directory: ${BUILD_CONFIG.distDir}`);
  }

  // Create fresh dist directory
  fs.mkdirSync(BUILD_CONFIG.distDir, { recursive: true });
  console.log(`📁 Created fresh dist directory: ${BUILD_CONFIG.distDir}`);
}


function buildUserscript() {
  console.log('🔨 Building FicTrail userscript...');

  // Clean and ensure dist directory exists
  cleanAndEnsureDistDir();

  // Read userscript header
  const userscriptHeader = readFile(BUILD_CONFIG.headerFile) + '\n\n';

  let combinedContent = '';

  // Read and combine all modules
  for (const moduleName of BUILD_CONFIG.modules) {
    const fullPath = path.join(BUILD_CONFIG.srcDir, BUILD_CONFIG.modulesDir, moduleName);
    console.log(`📦 Adding module: ${moduleName}`);

    if (fs.existsSync(fullPath)) {
      const moduleContent = readFile(fullPath);
      combinedContent += moduleContent + '\n\n';
    }
  }

  // Wrap in IIFE for userscript compatibility
  const wrappedContent = `${userscriptHeader}(function() {
'use strict';

${combinedContent}
})();`;

  // Write the final userscript
  writeFile(BUILD_CONFIG.outputFile, wrappedContent);

  // Copy script-info.md to dist
  const scriptInfoSourcePath = './script-info.md';
  const scriptInfoDistPath = './dist/script-info.md';

  if (fs.existsSync(scriptInfoSourcePath)) {
    const scriptInfoContent = readFile(scriptInfoSourcePath);
    writeFile(scriptInfoDistPath, scriptInfoContent);
    console.log(`📋 Copied script info: ${scriptInfoDistPath}`);
  } else {
    console.warn(`⚠️  Warning: ${scriptInfoSourcePath} not found, skipping script-info.md creation`);
  }

  console.log('🎉 Build completed successfully!');
  console.log(`📄 Output: ${BUILD_CONFIG.outputFile}`);

  // Show file size
  const stats = fs.statSync(BUILD_CONFIG.outputFile);
  console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
}

// Run the build
if (require.main === module) {
  buildUserscript();
}

module.exports = { buildUserscript };
