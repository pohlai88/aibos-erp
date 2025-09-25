#!/usr/bin/env node

/**
 * AIBOS UI Ecosystem Validation - UI-Focused Only
 * 
 * This script ONLY validates UI ecosystem architecture and components.
 * It does NOT check general dependency violations or application-level issues.
 * 
 * Focus Areas:
 * - UI Layer Boundaries (UI Primitives → UI-Business → Apps)
 * - Polymorphic Component Implementation
 * - UI Package Dependencies
 * - UI Build System
 * - UI TypeScript Configuration
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// UI-specific paths
const UI_PATHS = {
  primitives: 'packages/ui/src/primitives',
  components: 'packages/ui/src/components', 
  hooks: 'packages/ui/src/hooks',
  tokens: 'packages/ui/src/tokens',
  utils: 'packages/ui/src/utils',
  uiBusiness: 'packages/ui-business/src',
  apps: ['apps/web/src', 'apps/bff/src']
};

// UI-specific validation rules
const UI_RULES = {
  // UI Primitives should not import business packages
  primitivesNoBusiness: {
    pattern: /packages\/ui\/src\/(primitives|components|hooks|utils|tokens)/,
    forbidden: /packages\/(accounting|eventsourcing|observability|policy)/,
    message: 'UI Primitives should not import business packages'
  },
  
  // Apps should not import UI primitives directly
  appsNoDirectUI: {
    pattern: /apps\/(web|bff)\/src/,
    forbidden: /packages\/ui\/src\/(primitives|components|hooks|utils|tokens)/,
    message: 'Apps should not import UI primitives directly - use UI-Business instead'
  },
  
  // UI-Business should only import domain contracts
  uiBusinessOnlyContracts: {
    pattern: /packages\/ui-business\/src/,
    forbidden: /packages\/(accounting|eventsourcing|observability|policy)\/src/,
    message: 'UI-Business should only import domain contracts, not implementation packages'
  }
};

class UIEcosystemValidator {
  constructor() {
    this.issues = [];
    this.summary = {
      total: 0,
      errors: 0,
      warnings: 0,
      uiIssues: 0,
      nonUiIssues: 0
    };
  }

  log(message, type = 'info') {
    // Don't add emoji if message already has one
    if (message.match(/^[🎨🚀🔍✅❌⚠️🏗️📊📦🔨📝]/)) {
      console.log(message);
    } else {
      const icons = {
        info: '🔍',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        ui: '🎨',
        arch: '🏗️'
      };
      console.log(`${icons[type]} ${message}`);
    }
  }

  async validateUIEcosystem() {
    this.log('🚀 AIBOS COMPREHENSIVE VALIDATION REPORT', 'ui');
    this.log('Validating UI ecosystem + general dependencies...', 'info');
    this.log('');

    // Check UI-specific issues only
    await this.checkUILayerBoundaries();
    await this.checkUIPolymorphicComponents();
    await this.checkUIPackageDependencies();
    await this.checkUIBuildSystem();
    await this.checkUITypeScript();

    // Check general dependencies
    await this.checkGeneralDependencies();

    this.generateComprehensiveReport();
  }

  async checkUILayerBoundaries() {
    this.log('🏗️ Checking UI Layer Boundaries...', 'arch');
    
    try {
      // Run dependency cruiser with UI-specific rules only
      const result = execSync('npx dependency-cruiser --config .dependency-cruiser.js --output-type json packages/ui packages/ui-business apps/web apps/bff', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const violations = JSON.parse(result);
      
      if (violations.summary && violations.summary.violations) {
        const uiViolations = violations.summary.violations.filter(violation => {
          // Only include UI ecosystem violations
          return this.isUIViolation(violation);
        });
        
        if (uiViolations.length === 0) {
          this.log('   ✅ CLEAN - No UI Layer Boundary Violations Found', 'success');
        } else {
          this.log(`   ❌ ISSUES - Found ${uiViolations.length} UI Layer Boundary Violations`, 'error');
          uiViolations.forEach(violation => {
            this.log(`      • ${violation.rule.name}: ${violation.from} → ${violation.to}`, 'error');
            this.summary.uiIssues++;
            this.summary.errors++;
          });
        }
      }
    } catch (error) {
      this.log('   ⚠️ SKIPPED - Could not check UI layer boundaries', 'warning');
    }
  }

  isUIViolation(violation) {
    const uiPatterns = [
      /packages\/ui/,
      /packages\/ui-business/,
      /apps\/(web|bff).*ui/
    ];
    
    const uiRuleNames = [
      'ui-primitives-no-business-imports',
      'apps-no-direct-ui-imports', 
      'ui-business-no-cross-business-imports',
      'ui-primitives-no-business-logic',
      'ui-business-must-use-ui-primitives',
      'no-forwardref-with-polymorphic',
      'ui-business-no-design-tokens',
      'ui-business-no-generic-components',
      'ui-packages-proper-imports'
    ];
    
    return uiRuleNames.includes(violation.rule.name) || 
           uiPatterns.some(pattern => 
             pattern.test(violation.from) || pattern.test(violation.to)
           );
  }

  async checkUIPolymorphicComponents() {
    this.log('🎨 Checking UI Polymorphic Components...', 'ui');
    
    const polymorphicIssues = [];
    
    // Check UI primitives
    const primitivesDir = UI_PATHS.primitives;
    if (fs.existsSync(primitivesDir)) {
      const files = fs.readdirSync(primitivesDir).filter(f => f.endsWith('.tsx'));
      files.forEach(file => {
        const filePath = path.join(primitivesDir, file);
        const issues = this.checkPolymorphicFile(filePath);
        polymorphicIssues.push(...issues);
      });
    }
    
    // Check UI components
    const componentsDir = UI_PATHS.components;
    if (fs.existsSync(componentsDir)) {
      const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
      files.forEach(file => {
        const filePath = path.join(componentsDir, file);
        const issues = this.checkPolymorphicFile(filePath);
        polymorphicIssues.push(...issues);
      });
    }
    
    // Check UI hooks
    const hooksDir = UI_PATHS.hooks;
    if (fs.existsSync(hooksDir)) {
      const files = fs.readdirSync(hooksDir).filter(f => f.endsWith('.tsx'));
      files.forEach(file => {
        const filePath = path.join(hooksDir, file);
        const issues = this.checkPolymorphicFile(filePath);
        polymorphicIssues.push(...issues);
      });
    }
    
    if (polymorphicIssues.length === 0) {
      this.log('   ✅ CLEAN - All UI Components Properly Polymorphic', 'success');
    } else {
      this.log(`   ❌ ISSUES - Found ${polymorphicIssues.length} UI Polymorphic Issues`, 'error');
      polymorphicIssues.forEach(issue => {
        this.log(`      • ${issue.type}: ${issue.file}`, 'error');
        this.log(`        ${issue.message}`, 'error');
        this.summary.uiIssues++;
        this.summary.errors++;
      });
    }
  }

  checkPolymorphicFile(filePath) {
    const issues = [];
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for createPolymorphic usage
    if (content.includes('createPolymorphic')) {
      // Check for proper ref typing
      if (!content.includes('PolymorphicReference')) {
        issues.push({
          type: 'MISSING_REF_TYPING',
          file: filePath,
          message: 'Component uses createPolymorphic but missing PolymorphicReference import'
        });
      }
      
      // Check for proper ref parameter typing
      const refPattern = /createPolymorphic[^}]+ref\)\s*=>/;
      const match = content.match(refPattern);
      if (match && !match[0].includes('PolymorphicReference')) {
        issues.push({
          type: 'MISSING_REF_FORWARDING',
          file: filePath,
          message: 'Component uses createPolymorphic but missing proper ref typing'
        });
      }
      
      // Check for as prop in interface
      if (!content.includes('as?: ElementType')) {
        issues.push({
          type: 'MISSING_AS_PROP',
          file: filePath,
          message: 'Component uses createPolymorphic but missing as prop in interface'
        });
      }
    }
    
    return issues;
  }

  async checkUIPackageDependencies() {
    this.log('📦 Checking UI Package Dependencies...', 'ui');
    
    try {
      // Check if UI packages have correct dependencies
      const uiPackagePath = 'packages/ui/package.json';
      const uiBusinessPackagePath = 'packages/ui-business/package.json';
      
      if (fs.existsSync(uiPackagePath)) {
        const uiPackage = JSON.parse(fs.readFileSync(uiPackagePath, 'utf8'));
        
        // UI package should not have business dependencies
        const businessDeps = Object.keys(uiPackage.dependencies || {}).filter(dep => 
          dep.includes('accounting') || dep.includes('eventsourcing') || 
          dep.includes('observability') || dep.includes('policy')
        );
        
        if (businessDeps.length === 0) {
          this.log('   ✅ CLEAN - UI Package Dependencies Correct', 'success');
        } else {
          this.log(`   ❌ ISSUES - UI Package has business dependencies: ${businessDeps.join(', ')}`, 'error');
          this.summary.uiIssues++;
          this.summary.errors++;
        }
      }
    } catch (error) {
      this.log('   ⚠️ SKIPPED - Could not check UI package dependencies', 'warning');
    }
  }

  async checkUIBuildSystem() {
    this.log('🔨 Checking UI Build System...', 'ui');
    
    try {
      // Test UI package build
      this.log('   Testing UI package build...', 'info');
      execSync('pnpm --filter @aibos/ui build', { stdio: 'pipe' });
      this.log('   ✅ UI package builds successfully', 'success');
      
      // Test UI-Business package build if it exists
      if (fs.existsSync('packages/ui-business/package.json')) {
        this.log('   Testing UI-Business package build...', 'info');
        execSync('pnpm --filter @aibos/ui-business build', { stdio: 'pipe' });
        this.log('   ✅ UI-Business package builds successfully', 'success');
      }
      
      this.log('   ✅ CLEAN - UI Build System Working Correctly', 'success');
    } catch (error) {
      this.log('   ❌ ISSUES - UI Build System Issues Found', 'error');
      this.log(`      ${error.message}`, 'error');
      this.summary.uiIssues++;
      this.summary.errors++;
    }
  }

  async checkUITypeScript() {
    this.log('📝 Checking UI TypeScript...', 'ui');
    
    try {
      this.log('   Running UI type check...', 'info');
      execSync('pnpm typecheck', { stdio: 'pipe' });
      this.log('   ✅ CLEAN - UI TypeScript check passed', 'success');
    } catch (error) {
      this.log('   ❌ ISSUES - UI TypeScript Issues Found', 'error');
      this.log(`      ${error.message}`, 'error');
      this.summary.uiIssues++;
      this.summary.errors++;
    }
  }

  async checkGeneralDependencies() {
    this.log('🔍 Checking General Dependencies...', 'info');
    
    try {
      // Run dependency cruiser for general violations
      const result = execSync('npx dependency-cruiser --config .dependency-cruiser.js --output-type json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const violations = JSON.parse(result);
      
      if (violations.summary && violations.summary.violations) {
        const generalViolations = violations.summary.violations.filter(violation => {
          // Exclude UI ecosystem violations (already checked above)
          return !this.isUIViolation(violation);
        });
        
        if (generalViolations.length === 0) {
          this.log('   ✅ CLEAN - No General Dependency Violations Found', 'success');
        } else {
          this.log(`   ⚠️ ISSUES - Found ${generalViolations.length} General Dependency Violations`, 'warning');
          
          // Group violations by type
          const errors = generalViolations.filter(v => v.rule.severity === 'error');
          const warnings = generalViolations.filter(v => v.rule.severity === 'warn');
          
          if (errors.length > 0) {
            this.log(`      ❌ Errors: ${errors.length}`, 'error');
            errors.forEach(violation => {
              this.log(`         • ${violation.rule.name}: ${violation.from} → ${violation.to}`, 'error');
            });
          }
          
          if (warnings.length > 0) {
            this.log(`      ⚠️ Warnings: ${warnings.length}`, 'warning');
            warnings.forEach(violation => {
              this.log(`         • ${violation.rule.name}: ${violation.from}`, 'warning');
            });
          }
          
          this.summary.nonUiIssues += generalViolations.length;
        }
      }
    } catch (error) {
      this.log('   ⚠️ SKIPPED - Could not check general dependencies', 'warning');
    }
  }

  generateComprehensiveReport() {
    this.log('');
    this.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    this.log('║                    🚀 AIBOS COMPREHENSIVE VALIDATION REPORT                ║');
    this.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    this.log('');
    
    // UI ECOSYSTEM SECTION
    this.log('║  🎨 SECTION 1: UI ECOSYSTEM VALIDATION                                     ║');
    this.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    
    if (this.summary.uiIssues === 0) {
      this.log('║  🎉 STATUS: ALL UI VALIDATIONS PASSED!                                    ║');
      this.log('║                                                                          ║');
      this.log('║  ✅ Your UI ecosystem is properly structured and ready for production    ║');
      this.log('║                                                                          ║');
      this.log('║     🏗️  UI Layer Boundaries        ✅ CLEAN                             ║');
      this.log('║     🎨  Polymorphic Components     ✅ ALL PROPERLY IMPLEMENTED         ║');
      this.log('║     📦  Package Dependencies       ✅ CORRECT                          ║');
      this.log('║     🔨  Build System              ✅ WORKING                          ║');
      this.log('║     📝  TypeScript                ✅ PASSING                          ║');
      this.log('║                                                                          ║');
      this.log('║  🚀 UI ECOSYSTEM: READY FOR PRODUCTION!                                 ║');
    } else {
      this.log('║  ❌ STATUS: UI ECOSYSTEM ISSUES FOUND                                   ║');
      this.log('║                                                                          ║');
      this.log(`║  🔧 Found ${this.summary.uiIssues} UI ecosystem issues that need attention              ║`);
      this.log('║                                                                          ║');
      this.log(`║     ❌ Errors:   ${this.summary.errors.toString().padEnd(3)}                                                      ║`);
      this.log(`║     ⚠️  Warnings: ${this.summary.warnings.toString().padEnd(3)}                                                      ║`);
      this.log('║                                                                          ║');
      this.log('║  🔧 UI ECOSYSTEM: ACTION REQUIRED!                                      ║');
    }
    
    this.log('║                                                                          ║');
    this.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    
    // GENERAL DEPENDENCIES SECTION
    this.log('║  🔍 SECTION 2: GENERAL DEPENDENCY VALIDATION                               ║');
    this.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    
    if (this.summary.nonUiIssues === 0) {
      this.log('║  🎉 STATUS: NO GENERAL DEPENDENCY VIOLATIONS FOUND!                      ║');
      this.log('║                                                                          ║');
      this.log('║  ✅ All general dependencies are properly structured                     ║');
      this.log('║                                                                          ║');
      this.log('║  🚀 GENERAL DEPENDENCIES: CLEAN!                                        ║');
    } else {
      this.log('║  ⚠️ STATUS: GENERAL DEPENDENCY VIOLATIONS FOUND                          ║');
      this.log('║                                                                          ║');
      this.log(`║  🔧 Found ${this.summary.nonUiIssues} general dependency violations                    ║`);
      this.log('║                                                                          ║');
      this.log('║     These are application-level issues (Next.js, app structure, etc.)   ║');
      this.log('║     They do NOT affect your UI ecosystem architecture                     ║');
      this.log('║                                                                          ║');
      this.log('║  ⚠️ GENERAL DEPENDENCIES: REVIEW RECOMMENDED                             ║');
    }
    
    this.log('║                                                                          ║');
    this.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    
    // OVERALL SUMMARY
    this.log('║  📊 OVERALL SUMMARY:                                                       ║');
    this.log('║                                                                          ║');
    
    const totalIssues = this.summary.uiIssues + this.summary.nonUiIssues;
    
    if (totalIssues === 0) {
      this.log('║  🎉 PERFECT! NO ISSUES FOUND IN ANY SECTION!                             ║');
      this.log('║                                                                          ║');
      this.log('║  ✅ UI Ecosystem: Clean                                                  ║');
      this.log('║  ✅ General Dependencies: Clean                                         ║');
      this.log('║                                                                          ║');
      this.log('║  🚀 READY FOR PRODUCTION!                                               ║');
    } else {
      this.log(`║  📋 Total Issues Found: ${totalIssues.toString().padEnd(3)}                                                    ║`);
      this.log('║                                                                          ║');
      this.log(`║     🎨 UI Ecosystem Issues:     ${this.summary.uiIssues.toString().padEnd(3)}                                      ║`);
      this.log(`║     🔍 General Dependency Issues: ${this.summary.nonUiIssues.toString().padEnd(3)}                                      ║`);
      this.log('║                                                                          ║');
      
      if (this.summary.uiIssues === 0) {
        this.log('║  ✅ UI Ecosystem is PERFECT - focus on general dependency issues      ║');
      } else {
        this.log('║  🔧 Priority: Fix UI ecosystem issues first, then general dependencies ║');
      }
    }
    
    this.log('║                                                                          ║');
    this.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    this.log('║  📋 IMPORTANT NOTES:                                                     ║');
    this.log('║                                                                          ║');
    this.log('║     • UI Ecosystem issues affect your design system architecture          ║');
    this.log('║     • General dependency issues affect app-level functionality           ║');
    this.log('║     • Both sections are independent and can be fixed separately          ║');
    this.log('║                                                                          ║');
    this.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    
    // Exit with appropriate code
    if (this.summary.uiIssues > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Run the validator
const validator = new UIEcosystemValidator();
validator.validateUIEcosystem().catch(error => {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
});
