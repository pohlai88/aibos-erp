@echo off
REM AI-BOS ERP Development Environment Startup Script for Windows
REM This script starts all development services and validates the environment

setlocal enabledelayedexpansion

echo 🚀 Starting AI-BOS ERP Development Environment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose and try again.
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo [INFO] Creating .env file...
    (
        echo # AI-BOS ERP Development Environment Variables
        echo NODE_ENV=development
        echo CI=false
        echo.
        echo # Database Configuration
        echo DATABASE_URL=postgresql://aibos:aibos_dev_password@localhost:5432/aibos_erp
        echo POSTGRES_HOST=localhost
        echo POSTGRES_PORT=5432
        echo POSTGRES_DB=aibos_erp
        echo POSTGRES_USER=aibos
        echo POSTGRES_PASSWORD=aibos_dev_password
        echo.
        echo # Redis Configuration
        echo REDIS_URL=redis://localhost:6379
        echo REDIS_PASSWORD=aibos_redis_password
        echo.
        echo # ClickHouse Configuration
        echo CLICKHOUSE_URL=http://localhost:8123
        echo CLICKHOUSE_DB=aibos_analytics
        echo CLICKHOUSE_USER=aibos
        echo CLICKHOUSE_PASSWORD=aibos_clickhouse_password
        echo.
        echo # MongoDB Configuration
        echo MONGODB_URL=mongodb://localhost:27017/aibos_documents
        echo MONGODB_USER=aibos
        echo MONGODB_PASSWORD=aibos_mongo_password
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your-super-secret-jwt-key-change-in-production
        echo JWT_EXPIRES_IN=24h
        echo.
        echo # API Gateway Configuration
        echo KONG_ADMIN_URL=http://localhost:8001
        echo KONG_PROXY_URL=http://localhost:8000
        echo.
        echo # Observability Configuration
        echo JAEGER_URL=http://localhost:16686
        echo PROMETHEUS_URL=http://localhost:9090
        echo GRAFANA_URL=http://localhost:3001
        echo.
        echo # Application URLs
        echo BFF_URL=http://localhost:3001
        echo WEB_URL=http://localhost:3000
    ) > .env
    echo [SUCCESS] .env file created
)

REM Start Docker services
echo [INFO] Starting Docker services...
docker-compose up -d

REM Wait for services to be healthy
echo [INFO] Waiting for services to be healthy...

REM Function to check service health
:check_service
set service=%1
set max_attempts=30
set attempt=1

:check_loop
docker-compose ps %service% | findstr "healthy" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] %service% is healthy
    goto :eof
)

echo [INFO] Waiting for %service% to be healthy... (attempt %attempt%/%max_attempts%)
timeout /t 2 /nobreak >nul
set /a attempt+=1
if %attempt% leq %max_attempts% goto check_loop

echo [ERROR] %service% failed to become healthy
exit /b 1

REM Check critical services
call :check_service postgres
call :check_service redis
call :check_service clickhouse

REM Check optional services
docker-compose ps kong | findstr "healthy" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Kong is healthy
) else (
    echo [WARNING] Kong is not healthy, but continuing...
)

docker-compose ps jaeger | findstr "healthy" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Jaeger is healthy
) else (
    echo [WARNING] Jaeger is not healthy, but continuing...
)

docker-compose ps prometheus | findstr "healthy" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Prometheus is healthy
) else (
    echo [WARNING] Prometheus is not healthy, but continuing...
)

docker-compose ps grafana | findstr "healthy" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Grafana is healthy
) else (
    echo [WARNING] Grafana is not healthy, but continuing...
)

REM Run database migrations
echo [INFO] Running database migrations...
cd apps\bff
pnpm run db:migrate
cd ..\..

REM Seed development data
echo [INFO] Seeding development data...
cd apps\bff
pnpm run db:seed
cd ..\..

REM Install dependencies if needed
echo [INFO] Installing dependencies...
pnpm install

REM Start development servers
echo [INFO] Starting development servers...

REM Start BFF in background
echo [INFO] Starting BFF server...
cd apps\bff
start /b pnpm run dev
cd ..\..

REM Start Web in background
echo [INFO] Starting Web server...
cd apps\web
start /b pnpm run dev
cd ..\..

REM Wait a moment for servers to start
timeout /t 5 /nobreak >nul

REM Check if servers are running
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] BFF server is running on http://localhost:3001
) else (
    echo [WARNING] BFF server may not be running properly
)

curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Web server is running on http://localhost:3000
) else (
    echo [WARNING] Web server may not be running properly
)

REM Display service URLs
echo.
echo 🎉 AI-BOS ERP Development Environment is ready!
echo.
echo 📊 Service URLs:
echo   Web Application:    http://localhost:3000
echo   BFF API:            http://localhost:3001
echo   Kong Gateway:       http://localhost:8000
echo   Kong Admin:         http://localhost:8001
echo   Jaeger Tracing:    http://localhost:16686
echo   Prometheus:         http://localhost:9090
echo   Grafana:           http://localhost:3001
echo   PostgreSQL:        localhost:5432
echo   Redis:             localhost:6379
echo   ClickHouse:        http://localhost:8123
echo   MongoDB:           localhost:27017
echo.
echo 🔧 Development Commands:
echo   pnpm dx            - Run quality checks
echo   pnpm build         - Build all packages
echo   pnpm dev           - Start all development servers
echo   docker-compose logs - View service logs
echo   docker-compose down - Stop all services
echo.
echo 📝 Default Credentials:
echo   Database:          aibos / aibos_dev_password
echo   Redis:             aibos_redis_password
echo   ClickHouse:        aibos / aibos_clickhouse_password
echo   MongoDB:           aibos / aibos_mongo_password
echo   Grafana:           admin / aibos_grafana_password
echo.
echo 🛑 To stop the environment:
echo   Press Ctrl+C to stop this script
echo   Run 'docker-compose down' to stop Docker services
echo.

REM Keep script running
echo [INFO] Development environment is running. Press Ctrl+C to stop.
pause
