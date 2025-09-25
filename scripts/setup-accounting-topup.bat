@echo off
REM AI-BOS ERP Accounting Top-Up Development Setup Script (Windows)
REM This script prepares the development environment for the accounting top-up implementation

echo 🚀 AI-BOS ERP Accounting Top-Up Development Setup
echo ================================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the AI-BOS ERP root directory
    exit /b 1
)

if not exist "packages\accounting" (
    echo [ERROR] Please run this script from the AI-BOS ERP root directory
    exit /b 1
)

echo [INFO] Starting development environment setup...

REM 1. Install root dependencies
echo [INFO] Installing root dependencies...
call pnpm install
if errorlevel 1 (
    echo [ERROR] Failed to install root dependencies
    exit /b 1
)

REM 2. Setup frontend dependencies (Phase 1)
echo [INFO] Setting up frontend dependencies for Phase 1...
cd apps\web

REM Install required dependencies
call pnpm add @tanstack/react-query@^5.0.0
call pnpm add @tanstack/react-table@^8.0.0
call pnpm add recharts@^2.8.0
call pnpm add react-hook-form@^7.48.0
call pnpm add zod@^3.22.0
call pnpm add @hookform/resolvers@^3.3.0
call pnpm add lucide-react@^0.294.0
call pnpm add @headlessui/react@^1.7.0

REM Install dev dependencies
call pnpm add -D @testing-library/react@^14.0.0
call pnpm add -D @testing-library/jest-dom@^6.0.0
call pnpm add -D @testing-library/user-event@^14.0.0
call pnpm add -D jest@^29.0.0
call pnpm add -D jest-environment-jsdom@^29.0.0

echo [SUCCESS] Frontend dependencies installed

REM 3. Create file structure
echo [INFO] Creating file structure...
if not exist "src\app\accounting\journal-entries" mkdir "src\app\accounting\journal-entries"
if not exist "src\app\accounting\chart-of-accounts" mkdir "src\app\accounting\chart-of-accounts"
if not exist "src\app\accounting\reports" mkdir "src\app\accounting\reports"
if not exist "src\app\accounting\analytics" mkdir "src\app\accounting\analytics"
if not exist "src\components\accounting\__tests__" mkdir "src\components\accounting\__tests__"
if not exist "src\hooks" mkdir "src\hooks"
if not exist "src\lib" mkdir "src\lib"

echo [SUCCESS] File structure created

REM 4. Create environment files
echo [INFO] Creating environment files...
(
echo NEXT_PUBLIC_API_URL=http://localhost:3001
echo NEXT_PUBLIC_ACCOUNTING_API_URL=http://localhost:3001/api/v1/accounting
echo NEXT_PUBLIC_TENANT_ID=dev-tenant-001
) > .env.local

echo [SUCCESS] Environment files created

cd ..\..

REM 5. Setup backend dependencies (Phase 2)
echo [INFO] Setting up backend dependencies for Phase 2...
cd packages\accounting

REM Install analytics dependencies
call pnpm add d3@^7.8.0
call pnpm add observable-plot@^0.6.0
call pnpm add date-fns@^2.30.0
call pnpm add lodash@^4.17.21
call pnpm add @types/d3@^7.4.0
call pnpm add @types/lodash@^4.14.0

echo [SUCCESS] Backend dependencies installed

REM 6. Create service structure
echo [INFO] Creating service structure...
if not exist "src\services\analytics" mkdir "src\services\analytics"
if not exist "src\projections\analytics" mkdir "src\projections\analytics"
if not exist "src\__tests__\integration\analytics" mkdir "src\__tests__\integration\analytics"

echo [SUCCESS] Service structure created

REM 7. Setup documentation dependencies (Phase 3)
echo [INFO] Setting up documentation dependencies for Phase 3...
call pnpm add -D @nestjs/swagger@^7.1.0
call pnpm add -D swagger-ui-express@^5.0.0
call pnpm add -D compodoc@^1.1.0
call pnpm add -D typedoc@^0.25.0

echo [SUCCESS] Documentation dependencies installed

REM 8. Create scripts and docs structure
echo [INFO] Creating scripts and documentation structure...
if not exist "scripts" mkdir "scripts"
if not exist "docs" mkdir "docs"
if not exist "src\api" mkdir "src\api"

echo [SUCCESS] Scripts and documentation structure created

REM 9. Create environment configuration
echo [INFO] Creating environment configuration...
(
echo NODE_ENV=development
echo DATABASE_HOST=localhost
echo DATABASE_PORT=5432
echo DATABASE_USERNAME=accounting_user
echo DATABASE_PASSWORD=dev_password
echo DATABASE_NAME=accounting_dev
echo DATABASE_SSL=false
echo.
echo REDIS_HOST=localhost
echo REDIS_PORT=6379
echo REDIS_PASSWORD=
echo.
echo KAFKA_BROKERS=localhost:9092
echo KAFKA_CLIENT_ID=accounting-service-dev
echo.
echo EXCHANGE_RATE_API_KEY=your_api_key_here
echo EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4
echo.
echo APP_NAME=aibos-accounting-dev
echo LOG_LEVEL=debug
) > .env.development

echo [SUCCESS] Environment configuration created

cd ..\..

REM 10. Create test configurations
echo [INFO] Creating test configurations...

REM Vitest configuration for accounting package
(
echo import { defineConfig } from 'vitest/config';
echo.
echo export default defineConfig({
echo   test: {
echo     environment: 'node',
echo     globals: true,
echo     setupFiles: ['./src/__tests__/setup.ts'],
echo   },
echo });
) > packages\accounting\vitest.config.ts

REM Jest configuration for web app
(
echo const nextJest = require('next/jest');
echo.
echo const createJestConfig = nextJest({
echo   dir: './',
echo });
echo.
echo const customJestConfig = {
echo   setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
echo   moduleNameMapping: {
echo     '^@/(.*)$': '<rootDir>/src/$1',
echo   },
echo   testEnvironment: 'jest-environment-jsdom',
echo };
echo.
echo module.exports = createJestConfig(customJestConfig);
) > apps\web\jest.config.js

echo [SUCCESS] Test configurations created

REM 11. Create development scripts
echo [INFO] Creating development scripts...

REM Add scripts to package.json
(
echo @echo off
echo echo 🚀 Starting AI-BOS ERP Accounting Development Environment
echo echo =========================================================
echo.
echo REM Start database containers
echo echo Starting database containers...
echo docker run --name aibos-postgres -e POSTGRES_DB=accounting_dev -e POSTGRES_USER=accounting_user -e POSTGRES_PASSWORD=dev_password -p 5432:5432 -d postgres:15-alpine
echo docker run --name aibos-redis -p 6379:6379 -d redis:7-alpine
echo.
echo REM Wait for databases to be ready
echo echo Waiting for databases to be ready...
echo timeout /t 10 /nobreak
echo.
echo REM Start accounting service
echo echo Starting accounting service...
echo cd packages\accounting
echo start "Accounting Service" cmd /k "pnpm dev"
echo.
echo REM Start web application
echo echo Starting web application...
echo cd ..\..\apps\web
echo start "Web Application" cmd /k "pnpm dev"
echo.
echo echo Development environment started!
echo echo Accounting Service: http://localhost:3001
echo echo Web Application: http://localhost:3000
echo echo API Documentation: http://localhost:3001/api/docs
echo echo.
echo echo Press any key to stop all services
echo pause
echo.
echo REM Cleanup
echo echo Stopping services...
echo docker stop aibos-postgres aibos-redis
echo docker rm aibos-postgres aibos-redis
) > scripts\dev-accounting.bat

echo [SUCCESS] Development scripts created

REM 12. Create Docker Compose for development
echo [INFO] Creating Docker Compose configuration...
(
echo version: '3.8'
echo.
echo services:
echo   postgres:
echo     image: postgres:15-alpine
echo     container_name: aibos-postgres-dev
echo     environment:
echo       POSTGRES_DB: accounting_dev
echo       POSTGRES_USER: accounting_user
echo       POSTGRES_PASSWORD: dev_password
echo     ports:
echo       - "5432:5432"
echo     volumes:
echo       - postgres_data:/var/lib/postgresql/data
echo     healthcheck:
echo       test: ["CMD-SHELL", "pg_isready -U accounting_user -d accounting_dev"]
echo       interval: 10s
echo       timeout: 5s
echo       retries: 5
echo.
echo   redis:
echo     image: redis:7-alpine
echo     container_name: aibos-redis-dev
echo     ports:
echo       - "6379:6379"
echo     volumes:
echo       - redis_data:/data
echo     healthcheck:
echo       test: ["CMD", "redis-cli", "ping"]
echo       interval: 10s
echo       timeout: 5s
echo       retries: 5
echo.
echo   kafka:
echo     image: confluentinc/cp-kafka:latest
echo     container_name: aibos-kafka-dev
echo     environment:
echo       KAFKA_BROKER_ID: 1
echo       KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
echo       KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
echo       KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
echo     ports:
echo       - "9092:9092"
echo     depends_on:
echo       - zookeeper
echo.
echo   zookeeper:
echo     image: confluentinc/cp-zookeeper:latest
echo     container_name: aibos-zookeeper-dev
echo     environment:
echo       ZOOKEEPER_CLIENT_PORT: 2181
echo       ZOOKEEPER_TICK_TIME: 2000
echo     ports:
echo       - "2181:2181"
echo.
echo volumes:
echo   postgres_data:
echo   redis_data:
) > docker-compose.dev.yml

echo [SUCCESS] Docker Compose configuration created

REM 13. Final validation
echo [INFO] Running final validation...

REM Check if all dependencies are installed
call pnpm list --depth=0 >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Dependencies validation failed
    exit /b 1
) else (
    echo [SUCCESS] Dependencies validation passed
)

REM Check if file structure is correct
if exist "apps\web\src\components\accounting" (
    if exist "packages\accounting\src\services\analytics" (
        echo [SUCCESS] File structure validation passed
    ) else (
        echo [ERROR] File structure validation failed
        exit /b 1
    )
) else (
    echo [ERROR] File structure validation failed
    exit /b 1
)

echo [SUCCESS] Development environment setup completed successfully!
echo.
echo 🎉 Next Steps:
echo 1. Start development environment: scripts\dev-accounting.bat
echo 2. Or use Docker Compose: docker-compose -f docker-compose.dev.yml up
echo 3. Begin Phase 1 implementation following the development plan
echo 4. Run tests: pnpm test
echo 5. Run linting: pnpm lint
echo.
echo 📚 Documentation:
echo - Development Plan: docs\development\accounting-top-up-development-plan-v2.md
echo - Technical Guide: docs\development\technical-implementation-guide.md
echo - Preparation Guide: docs\development\DEVELOPMENT_PREPARATION.md
echo.
echo 🚀 Ready to start development!
pause
