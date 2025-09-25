#!/bin/bash

# AI-BOS ERP Accounting Top-Up Development Setup Script
# This script prepares the development environment for the accounting top-up implementation

set -e

echo "🚀 AI-BOS ERP Accounting Top-Up Development Setup"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages/accounting" ]; then
    print_error "Please run this script from the AI-BOS ERP root directory"
    exit 1
fi

print_status "Starting development environment setup..."

# 1. Install root dependencies
print_status "Installing root dependencies..."
pnpm install

# 2. Setup frontend dependencies (Phase 1)
print_status "Setting up frontend dependencies for Phase 1..."
cd apps/web

# Install required dependencies
pnpm add @tanstack/react-query@^5.0.0
pnpm add @tanstack/react-table@^8.0.0
pnpm add recharts@^2.8.0
pnpm add react-hook-form@^7.48.0
pnpm add zod@^3.22.0
pnpm add @hookform/resolvers@^3.3.0
pnpm add lucide-react@^0.294.0
pnpm add @headlessui/react@^1.7.0

# Install dev dependencies
pnpm add -D @testing-library/react@^14.0.0
pnpm add -D @testing-library/jest-dom@^6.0.0
pnpm add -D @testing-library/user-event@^14.0.0
pnpm add -D jest@^29.0.0
pnpm add -D jest-environment-jsdom@^29.0.0

print_success "Frontend dependencies installed"

# 3. Create file structure
print_status "Creating file structure..."
mkdir -p src/app/accounting/journal-entries
mkdir -p src/app/accounting/chart-of-accounts
mkdir -p src/app/accounting/reports
mkdir -p src/app/accounting/analytics
mkdir -p src/components/accounting/__tests__
mkdir -p src/hooks
mkdir -p src/lib

print_success "File structure created"

# 4. Create environment files
print_status "Creating environment files..."
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ACCOUNTING_API_URL=http://localhost:3001/api/v1/accounting
NEXT_PUBLIC_TENANT_ID=dev-tenant-001
EOF

print_success "Environment files created"

cd ../..

# 5. Setup backend dependencies (Phase 2)
print_status "Setting up backend dependencies for Phase 2..."
cd packages/accounting

# Install analytics dependencies
pnpm add d3@^7.8.0
pnpm add observable-plot@^0.6.0
pnpm add date-fns@^2.30.0
pnpm add lodash@^4.17.21
pnpm add @types/d3@^7.4.0
pnpm add @types/lodash@^4.14.0

print_success "Backend dependencies installed"

# 6. Create service structure
print_status "Creating service structure..."
mkdir -p src/services/analytics
mkdir -p src/projections/analytics
mkdir -p src/__tests__/integration/analytics

print_success "Service structure created"

# 7. Setup documentation dependencies (Phase 3)
print_status "Setting up documentation dependencies for Phase 3..."
pnpm add -D @nestjs/swagger@^7.1.0
pnpm add -D swagger-ui-express@^5.0.0
pnpm add -D compodoc@^1.1.0
pnpm add -D typedoc@^0.25.0

print_success "Documentation dependencies installed"

# 8. Create scripts and docs structure
print_status "Creating scripts and documentation structure..."
mkdir -p scripts
mkdir -p docs
mkdir -p src/api

print_success "Scripts and documentation structure created"

# 9. Create environment configuration
print_status "Creating environment configuration..."
cat > .env.development << EOF
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=accounting_user
DATABASE_PASSWORD=dev_password
DATABASE_NAME=accounting_dev
DATABASE_SSL=false

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=accounting-service-dev

EXCHANGE_RATE_API_KEY=your_api_key_here
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4

APP_NAME=aibos-accounting-dev
LOG_LEVEL=debug
EOF

print_success "Environment configuration created"

cd ../..

# 10. Create test configurations
print_status "Creating test configurations..."

# Vitest configuration for accounting package
cat > packages/accounting/vitest.config.ts << EOF
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
EOF

# Jest configuration for web app
cat > apps/web/jest.config.js << EOF
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = createJestConfig(customJestConfig);
EOF

print_success "Test configurations created"

# 11. Create development scripts
print_status "Creating development scripts..."

# Add scripts to package.json
cat > scripts/dev-accounting.sh << EOF
#!/bin/bash
echo "🚀 Starting AI-BOS ERP Accounting Development Environment"
echo "========================================================="

# Start database containers
echo "Starting database containers..."
docker run --name aibos-postgres -e POSTGRES_DB=accounting_dev -e POSTGRES_USER=accounting_user -e POSTGRES_PASSWORD=dev_password -p 5432:5432 -d postgres:15-alpine
docker run --name aibos-redis -p 6379:6379 -d redis:7-alpine

# Wait for databases to be ready
echo "Waiting for databases to be ready..."
sleep 10

# Start accounting service
echo "Starting accounting service..."
cd packages/accounting
pnpm dev &
ACCOUNTING_PID=\$!

# Start web application
echo "Starting web application..."
cd ../../apps/web
pnpm dev &
WEB_PID=\$!

echo "Development environment started!"
echo "Accounting Service: http://localhost:3001"
echo "Web Application: http://localhost:3000"
echo "API Documentation: http://localhost:3001/api/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait

# Cleanup
echo "Stopping services..."
kill \$ACCOUNTING_PID \$WEB_PID
docker stop aibos-postgres aibos-redis
docker rm aibos-postgres aibos-redis
EOF

chmod +x scripts/dev-accounting.sh

print_success "Development scripts created"

# 12. Create Docker Compose for development
print_status "Creating Docker Compose configuration..."
cat > docker-compose.dev.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: aibos-postgres-dev
    environment:
      POSTGRES_DB: accounting_dev
      POSTGRES_USER: accounting_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U accounting_user -d accounting_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: aibos-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  kafka:
    image: confluentinc/cp-kafka:latest
    container_name: aibos-kafka-dev
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    container_name: aibos-zookeeper-dev
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

volumes:
  postgres_data:
  redis_data:
EOF

print_success "Docker Compose configuration created"

# 13. Final validation
print_status "Running final validation..."

# Check if all dependencies are installed
if pnpm list --depth=0 > /dev/null 2>&1; then
    print_success "Dependencies validation passed"
else
    print_error "Dependencies validation failed"
    exit 1
fi

# Check if file structure is correct
if [ -d "apps/web/src/components/accounting" ] && [ -d "packages/accounting/src/services/analytics" ]; then
    print_success "File structure validation passed"
else
    print_error "File structure validation failed"
    exit 1
fi

print_success "Development environment setup completed successfully!"
echo ""
echo "🎉 Next Steps:"
echo "1. Start development environment: ./scripts/dev-accounting.sh"
echo "2. Or use Docker Compose: docker-compose -f docker-compose.dev.yml up"
echo "3. Begin Phase 1 implementation following the development plan"
echo "4. Run tests: pnpm test"
echo "5. Run linting: pnpm lint"
echo ""
echo "📚 Documentation:"
echo "- Development Plan: docs/development/accounting-top-up-development-plan-v2.md"
echo "- Technical Guide: docs/development/technical-implementation-guide.md"
echo "- Preparation Guide: docs/development/DEVELOPMENT_PREPARATION.md"
echo ""
echo "🚀 Ready to start development!"
