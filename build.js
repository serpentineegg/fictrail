#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Build configuration
const BUILD_CONFIG = {
  srcDir: './src',
  distDir: './dist',
  outputFile: './dist/fictrail.user.js',
  headerFile: './src/userscript-header.txt',
  modulesDir: 'modules',
  templatesDir: 'templates',
  modules: [
    'constants.js',
    'utils.js',
    'styles.js',
    'scraper.js',
    'search.js',
    'ui.js',
    'core.js'
  ],
  templates: [
    'fictrail-overlay.html',
    'fictrail-styles.css'
  ]
};

function copyToClipboard(content) {
  return new Promise((resolve, reject) => {
    // Determine the platform and use appropriate command
    const platform = process.platform;
    let command;

    if (platform === 'darwin') {
      // macOS
      command = 'pbcopy';
    } else if (platform === 'win32') {
      // Windows
      command = 'clip';
    } else {
      // Linux - try xclip first, fallback to xsel
      command = 'xclip -selection clipboard 2>/dev/null || xsel --clipboard --input';
    }

    const child = exec(command, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });

    child.stdin.write(content);
    child.stdin.end();
  });
}

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
    console.log(`🗑️ Cleaned existing dist directory: ${BUILD_CONFIG.distDir}`);
  }

  // Create fresh dist directory
  fs.mkdirSync(BUILD_CONFIG.distDir, { recursive: true });
  console.log(`📁 Created fresh dist directory: ${BUILD_CONFIG.distDir}`);
}

function buildUserscript(options = {}) {
  console.log('🔨 Building FicTrail userscript...');

  // Clean and create dist directory
  cleanAndEnsureDistDir();

  // Read userscript header
  const userscriptHeader = readFile(BUILD_CONFIG.headerFile) + '\n\n';
  let combinedContent = '';

  // Read templates
  const templates = {};
  BUILD_CONFIG.templates.forEach(templateName => {
    const fullPath = path.join(BUILD_CONFIG.srcDir, BUILD_CONFIG.templatesDir, templateName);
    console.log(`📄 Reading template: ${templateName}`);

    if (fs.existsSync(fullPath)) {
      const templateContent = readFile(fullPath);
      templates[templateName] = templateContent;
    }
  });

  // Read and combine all modules
  BUILD_CONFIG.modules.forEach(moduleName => {
    const fullPath = path.join(BUILD_CONFIG.srcDir, BUILD_CONFIG.modulesDir, moduleName);
    console.log(`📦 Adding module: ${moduleName}`);

    if (fs.existsSync(fullPath)) {
      let moduleContent = readFile(fullPath);

      // Inject templates into modules
      if (moduleName === 'ui.js' && templates['fictrail-overlay.html']) {
        const templateContent = templates['fictrail-overlay.html'];
        moduleContent = moduleContent.replace(
          /fictrailDiv\.innerHTML = `.*?`;/s,
          `fictrailDiv.innerHTML = \`${templateContent}\`;`
        );
      }

      if (moduleName === 'styles.js' && templates['fictrail-styles.css']) {
        const cssContent = templates['fictrail-styles.css'];
        moduleContent = moduleContent.replace(
          /const css = `[\s\S]*?`;/,
          `const css = \`${cssContent}\`;`
        );
      }

      combinedContent += moduleContent + '\n\n';
    }
  });

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
    console.warn(`⚠️ Warning: ${scriptInfoSourcePath} not found, skipping script-info.md creation`);
  }

  console.log('🎉 Build completed successfully!');
  console.log(`📄 Output: ${BUILD_CONFIG.outputFile}`);
  console.log(`📄 Templates processed: ${BUILD_CONFIG.templates.length}`);

  // Show file size
  const stats = fs.statSync(BUILD_CONFIG.outputFile);
  console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);

  // Copy to clipboard if flag is enabled
  if (options.clipboard) {
    copyToClipboard(wrappedContent)
      .then(() => {
        console.log('📋 Copied to clipboard!');
      })
      .catch((error) => {
        console.warn(`⚠️ Could not copy to clipboard: ${error.message}`);
        console.log('💡 You can manually copy from:', BUILD_CONFIG.outputFile);
      });
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    clipboard: false
  };

  args.forEach(arg => {
    if (arg === '--clipboard' || arg === '-c') {
      options.clipboard = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('FicTrail Build Script');
      console.log('');
      console.log('Usage: node build.js [options]');
      console.log('');
      console.log('Options:');
      console.log('  --clipboard, -c    Copy built userscript to clipboard');
      console.log('  --help, -h         Show this help message');
      process.exit(0);
    }
  });

  return options;
}

// Run the build
if (require.main === module) {
  const options = parseArgs();
  buildUserscript(options);
}

module.exports = { buildUserscript };
