// scripts/codemods/fix-accounting-imports.js
const fs = require('fs');
const path = require('path');

const PKG = 'packages/accounting/src';

// Rewrite rules
const rewrites = [
  // A) Remove legacy single file 'domain-events'
  {
    from: /(.+)\/domain\/events\/domain-events(?:\.ts)?/g,
    to: '$1/events',
  },
  // B) Old service names -> new .service.ts
  {
    from: /(.+)\/services\/([a-z0-9-]+)-service/g,
    to: '$1/services/$2.service',
  },
  // C) kafka producer moved from infra -> services
  {
    from: /(.+)\/infrastructure\/messaging\/kafka-producer\.service/g,
    to: '$1/services/kafka-producer.service',
  },
];

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(filePath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Apply rewrite rules
  for (const rule of rewrites) {
    const newContent = content.replace(rule.from, rule.to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

// Start processing
walkDir(PKG);
console.log('Codemod complete.');
