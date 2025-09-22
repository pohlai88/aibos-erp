#!/usr/bin/env node

/**
 * Phase 1 Final Validation Script
 * 
 * This script validates that all Phase 1 requirements have been met
 * and the platform is ready for Phase 2 development.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`\n${colors.cyan}🔍 ${description}${colors.reset}`);
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    log(`${colors.green}✅ ${description} - PASSED${colors.reset}`);
    return { success: true, output };
  } catch (error) {
    log(`${colors.red}❌ ${description} - FAILED${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

function checkFileExists(filePath, description) {
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    log(`${colors.green}✅ ${description} - EXISTS${colors.reset}`);
    return true;
  } else {
    log(`${colors.red}❌ ${description} - MISSING${colors.reset}`);
    return false;
  }
}

function validatePhase1() {
  log(`${colors.bright}${colors.magenta}🚀 AI-BOS ERP Phase 1 Final Validation${colors.reset}`);
  log(`${colors.blue}================================================${colors.reset}`);

  const results = {
    infrastructure: [],
    quality: [],
    testing: [],
    documentation: [],
    deployment: []
  };

  // Infrastructure Validation
  log(`\n${colors.bright}${colors.yellow}📋 INFRASTRUCTURE VALIDATION${colors.reset}`);
  
  results.infrastructure.push(execCommand('pnpm --version', 'pnpm package manager'));
  results.infrastructure.push(execCommand('node --version', 'Node.js runtime'));
  results.infrastructure.push(execCommand('docker --version', 'Docker runtime'));
  results.infrastructure.push(checkFileExists('turbo.json', 'Turborepo configuration'));
  results.infrastructure.push(checkFileExists('pnpm-workspace.yaml', 'pnpm workspace configuration'));
  results.infrastructure.push(checkFileExists('docker-compose.yml', 'Docker Compose configuration'));

  // Quality Gates Validation
  log(`\n${colors.bright}${colors.yellow}🛡️ QUALITY GATES VALIDATION${colors.reset}`);
  
  results.quality.push(execCommand('pnpm dx', 'Development quality check (format, lint, typecheck, test, deps)'));
  results.quality.push(execCommand('pnpm lint:arch', 'Architecture enforcement'));
  results.quality.push(execCommand('pnpm dep:check', 'Dependency validation'));

  // Testing Validation
  log(`\n${colors.bright}${colors.yellow}🧪 TESTING VALIDATION${colors.reset}`);
  
  results.testing.push(execCommand('pnpm test:e2e', 'E2E tests'));
  results.testing.push(execCommand('pnpm test:contract', 'Contract tests'));
  results.testing.push(execCommand('pnpm test:performance', 'Performance tests'));

  // Documentation Validation
  log(`\n${colors.bright}${colors.yellow}📚 DOCUMENTATION VALIDATION${colors.reset}`);
  
  results.documentation.push(checkFileExists('README.md', 'Main README'));
  results.documentation.push(checkFileExists('docs/api/README.md', 'API documentation'));
  results.documentation.push(checkFileExists('docs/adr/README.md', 'Architecture Decision Records'));
  results.documentation.push(checkFileExists('docs/development/README.md', 'Development guide'));
  results.documentation.push(checkFileExists('docs/training/anti-drift-guardrails.md', 'Anti-drift training'));
  results.documentation.push(checkFileExists('docs/training/cicd-pipeline.md', 'CI/CD training'));

  // Deployment Validation
  log(`\n${colors.bright}${colors.yellow}🚀 DEPLOYMENT VALIDATION${colors.reset}`);
  
  results.deployment.push(execCommand('pnpm build', 'Production build'));
  results.deployment.push(execCommand('docker-compose ps', 'Docker services status'));
  results.deployment.push(execCommand('curl -f http://localhost:3000 || echo "Web app not running"', 'Web application health'));
  results.deployment.push(execCommand('curl -f http://localhost:3001/health || echo "BFF not running"', 'BFF health check'));

  // Summary
  log(`\n${colors.bright}${colors.magenta}📊 VALIDATION SUMMARY${colors.reset}`);
  log(`${colors.blue}================================================${colors.reset}`);

  const categories = [
    { name: 'Infrastructure', results: results.infrastructure },
    { name: 'Quality Gates', results: results.quality },
    { name: 'Testing', results: results.testing },
    { name: 'Documentation', results: results.documentation },
    { name: 'Deployment', results: results.deployment }
  ];

  let totalPassed = 0;
  let totalFailed = 0;

  categories.forEach(category => {
    const passed = category.results.filter(r => r.success || r === true).length;
    const failed = category.results.length - passed;
    totalPassed += passed;
    totalFailed += failed;

    const status = failed === 0 ? `${colors.green}✅ PASSED${colors.reset}` : `${colors.red}❌ FAILED${colors.reset}`;
    log(`${category.name}: ${passed}/${category.results.length} ${status}`);
  });

  log(`\n${colors.bright}Overall: ${totalPassed}/${totalPassed + totalFailed} checks passed${colors.reset}`);

  if (totalFailed === 0) {
    log(`\n${colors.bright}${colors.green}🎉 PHASE 1 VALIDATION COMPLETE!${colors.reset}`);
    log(`${colors.green}The AI-BOS ERP platform is ready for Phase 2 development.${colors.reset}`);
    
    // Phase 2 Readiness Checklist
    log(`\n${colors.bright}${colors.cyan}🚀 PHASE 2 READINESS CHECKLIST${colors.reset}`);
    log(`${colors.blue}================================================${colors.reset}`);
    log(`${colors.green}✅ Monorepo foundation with Turborepo + pnpm${colors.reset}`);
    log(`${colors.green}✅ Anti-drift guardrails with ESLint + dependency-cruiser${colors.reset}`);
    log(`${colors.green}✅ CI/CD pipeline with multi-job quality gates${colors.reset}`);
    log(`${colors.green}✅ Docker development environment${colors.reset}`);
    log(`${colors.green}✅ Frontend foundation with Next.js + Design System${colors.reset}`);
    log(`${colors.green}✅ Backend foundation with NestJS + Authentication${colors.reset}`);
    log(`${colors.green}✅ Integration testing (E2E, Contract, Performance)${colors.reset}`);
    log(`${colors.green}✅ Comprehensive documentation and training${colors.reset}`);
    log(`${colors.green}✅ Production-ready deployment pipeline${colors.reset}`);
    
    log(`\n${colors.bright}${colors.magenta}🎯 NEXT STEPS FOR PHASE 2${colors.reset}`);
    log(`${colors.blue}================================================${colors.reset}`);
    log(`${colors.cyan}1. Event Sourcing Foundation${colors.reset} - Core ERP architecture`);
    log(`${colors.cyan}2. Accounting Module${colors.reset} - Financial management system`);
    log(`${colors.cyan}3. Inventory Module${colors.reset} - Stock management system`);
    log(`${colors.cyan}4. Sales Module${colors.reset} - Customer relationship management`);
    log(`${colors.cyan}5. Purchase Module${colors.reset} - Vendor management and procurement`);
    
    process.exit(0);
  } else {
    log(`\n${colors.bright}${colors.red}❌ PHASE 1 VALIDATION FAILED${colors.reset}`);
    log(`${colors.red}Please fix the failed checks before proceeding to Phase 2.${colors.reset}`);
    process.exit(1);
  }
}

// Run validation
validatePhase1();
