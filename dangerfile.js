// Danger.js configuration for AI-BOS ERP
// Automated policy checks for pull requests

import { danger, warn, fail, message } from "danger";

// Check for large files
const largeFiles = danger.git.modified_files.filter((file) => {
  const size = danger.git.diffForFile(file);
  return size && size.length > 10000; // 10KB threshold
});

if (largeFiles.length > 0) {
  warn(`Large files detected: ${largeFiles.join(", ")}`);
}

// Check for console.log statements
const consoleLogs = danger.git.modified_files.filter((file) => {
  const content = danger.git.diffForFile(file);
  return content && content.includes("console.log");
});

if (consoleLogs.length > 0) {
  warn(`Console.log statements found in: ${consoleLogs.join(", ")}`);
}

// Check for TODO comments
const todos = danger.git.modified_files.filter((file) => {
  const content = danger.git.diffForFile(file);
  return content && content.includes("TODO");
});

if (todos.length > 0) {
  message(`TODO comments found in: ${todos.join(", ")}`);
}

// Check for secrets or sensitive data
const secrets = danger.git.modified_files.filter((file) => {
  const content = danger.git.diffForFile(file);
  if (!content) return false;

  const secretPatterns = [
    /password\s*[:=]\s*['"][^'"]+['"]/i,
    /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
    /secret\s*[:=]\s*['"][^'"]+['"]/i,
    /token\s*[:=]\s*['"][^'"]+['"]/i,
    /private[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
  ];

  return secretPatterns.some((pattern) => pattern.test(content));
});

if (secrets.length > 0) {
  fail(`Potential secrets detected in: ${secrets.join(", ")}`);
}

// Check for database migrations
const migrations = danger.git.modified_files.filter(
  (file) => file.includes("migrations/") && file.endsWith(".ts"),
);

if (migrations.length > 0) {
  message(`Database migrations detected: ${migrations.join(", ")}`);
  warn("Please ensure migrations are tested and reversible");
}

// Check for new dependencies
const packageJsonChanges = danger.git.modified_files.filter(
  (file) => file === "package.json" || file.endsWith("/package.json"),
);

if (packageJsonChanges.length > 0) {
  message("Package.json changes detected - please review new dependencies");
}

// Check for TypeScript errors
const tsFiles = danger.git.modified_files.filter(
  (file) => file.endsWith(".ts") || file.endsWith(".tsx"),
);

if (tsFiles.length > 0) {
  message(`TypeScript files modified: ${tsFiles.length} files`);
}

// Check for test files
const testFiles = danger.git.modified_files.filter(
  (file) =>
    file.includes(".test.") ||
    file.includes(".spec.") ||
    file.includes("__tests__"),
);

if (testFiles.length === 0 && danger.git.modified_files.length > 3) {
  warn("No test files modified - consider adding tests for new functionality");
}

// Check for documentation updates
const docFiles = danger.git.modified_files.filter(
  (file) => file.endsWith(".md") || file.includes("docs/"),
);

if (docFiles.length === 0 && danger.git.modified_files.length > 5) {
  message("Consider updating documentation for significant changes");
}

// Check for breaking changes
const breakingChanges = danger.git.commits.some(
  (commit) =>
    commit.message.includes("BREAKING CHANGE") || commit.message.includes("!"),
);

if (breakingChanges) {
  warn("Breaking changes detected - please ensure proper versioning");
}

// Check for commit message format
const invalidCommits = danger.git.commits.filter((commit) => {
  const message = commit.message;
  return !message.match(
    /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .+/,
  );
});

if (invalidCommits.length > 0) {
  warn(`Invalid commit message format: ${invalidCommits.length} commits`);
  message("Please use conventional commit format: type(scope): description");
}

// Check for PR size
const prSize = danger.git.modified_files.length;
if (prSize > 20) {
  warn(`Large PR detected: ${prSize} files modified`);
  message("Consider breaking this into smaller, focused PRs");
}

// Check for new environment variables
const envFiles = danger.git.modified_files.filter(
  (file) => file.includes(".env") || file.includes("env.example"),
);

if (envFiles.length > 0) {
  message("Environment files modified - please review security implications");
}

// Success message
if (danger.git.modified_files.length > 0) {
  message(
    `✅ Danger.js checks completed for ${danger.git.modified_files.length} modified files`,
  );
}
