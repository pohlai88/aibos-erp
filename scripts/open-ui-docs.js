#!/usr/bin/env node

/**
 * Open UI Ecosystem Documentation
 * 
 * Opens the existing HTML documentation in the default browser
 * Useful for quick access without regenerating
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function openDocumentation() {
  log('🌐 Opening UI Ecosystem Documentation...', 'blue');
  
  const indexPath = path.resolve('docs/ui-ecosystem/index.html');
  
  // Check if documentation exists
  if (!fs.existsSync(indexPath)) {
    log('❌ Documentation not found!', 'red');
    log('💡 Run: pnpm generate:docs', 'cyan');
    process.exit(1);
  }
  
  try {
    // Try different methods to open the file based on platform
    if (process.platform === 'win32') {
      // Windows
      execSync(`start "" "${indexPath}"`, { stdio: 'pipe' });
      log('✅ Opening in Windows default browser...', 'green');
    } else if (process.platform === 'darwin') {
      // macOS
      execSync(`open "${indexPath}"`, { stdio: 'pipe' });
      log('✅ Opening in macOS default browser...', 'green');
    } else {
      // Linux and others
      execSync(`xdg-open "${indexPath}"`, { stdio: 'pipe' });
      log('✅ Opening in Linux default browser...', 'green');
    }
    
    log(`📍 URL: file://${indexPath.replace(/\\/g, '/')}`, 'cyan');
    log('🎉 Documentation opened successfully!', 'green');
    
  } catch (error) {
    log('⚠️  Could not auto-open browser', 'yellow');
    log('📁 Manual access: docs/ui-ecosystem/index.html', 'cyan');
    log(`💡 Error: ${error.message}`, 'red');
    
    // Provide alternative instructions
    log('\n🔧 Alternative Methods:', 'cyan');
    log('1. Double-click docs/ui-ecosystem/index.html in File Explorer', 'white');
    log('2. Right-click → "Open with" → "Browser"', 'white');
    log('3. Drag the file into your browser window', 'white');
  }
}

function main() {
  log('🎨 AIBOS UI Ecosystem Documentation Opener', 'blue');
  openDocumentation();
}

main();
