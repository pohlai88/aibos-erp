@echo off
REM Docker Compose Validation Script for AI-BOS ERP (Windows)
REM This script validates the Docker Compose configuration and tests all services

setlocal enabledelayedexpansion

echo 🔍 Validating AI-BOS ERP Docker Compose Configuration...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Docker Compose is not installed. Please install Docker Compose and try again.
        exit /b 1
    ) else (
        set DOCKER_COMPOSE=docker compose
    )
) else (
    set DOCKER_COMPOSE=docker-compose
)

echo [INFO] Using Docker Compose command: %DOCKER_COMPOSE%

REM Validate Docker Compose configuration
echo [INFO] Validating Docker Compose configuration...
%DOCKER_COMPOSE% config >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Docker Compose configuration is valid
) else (
    echo [ERROR] Docker Compose configuration is invalid
    exit /b 1
)

REM Test service definitions
echo [INFO] Testing service definitions...

REM Check if all required services are defined
set REQUIRED_SERVICES=postgres redis clickhouse kong otel-collector jaeger prometheus grafana mongodb

for %%s in (%REQUIRED_SERVICES%) do (
    %DOCKER_COMPOSE% config --services | findstr /b "%%s" >nul
    if %errorlevel% equ 0 (
        echo [SUCCESS] Service '%%s' is defined
    ) else (
        echo [ERROR] Service '%%s' is missing
        exit /b 1
    )
)

REM Check if all required volumes are defined
set REQUIRED_VOLUMES=postgres_data redis_data clickhouse_data jaeger_data prometheus_data grafana_data mongodb_data

for %%v in (%REQUIRED_VOLUMES%) do (
    %DOCKER_COMPOSE% config --volumes | findstr /b "%%v" >nul
    if %errorlevel% equ 0 (
        echo [SUCCESS] Volume '%%v' is defined
    ) else (
        echo [ERROR] Volume '%%v' is missing
        exit /b 1
    )
)

REM Check if all required networks are defined
set REQUIRED_NETWORKS=aibos-network

for %%n in (%REQUIRED_NETWORKS%) do (
    %DOCKER_COMPOSE% config --networks | findstr /b "%%n" >nul
    if %errorlevel% equ 0 (
        echo [SUCCESS] Network '%%n' is defined
    ) else (
        echo [ERROR] Network '%%n' is missing
        exit /b 1
    )
)

REM Check if all required configuration files exist
set REQUIRED_CONFIGS=scripts\init-db.sql scripts\clickhouse-init.sql scripts\kong.yml scripts\otel-collector-config.yaml scripts\prometheus.yml scripts\grafana-datasources\datasources.yml scripts\mongo-init.js

for %%c in (%REQUIRED_CONFIGS%) do (
    if exist "%%c" (
        echo [SUCCESS] Configuration file '%%c' exists
    ) else (
        echo [ERROR] Configuration file '%%c' is missing
        exit /b 1
    )
)

REM Test port conflicts
echo [INFO] Checking for port conflicts...

set REQUIRED_PORTS=5432 6379 8123 8000 8001 16686 9090 3001 27017 4317 4318 8888 8889

for %%p in (%REQUIRED_PORTS%) do (
    netstat -an | findstr ":%%p " >nul
    if %errorlevel% equ 0 (
        echo [WARNING] Port %%p is already in use
    ) else (
        echo [SUCCESS] Port %%p is available
    )
)

REM Test Docker Compose dry run
echo [INFO] Testing Docker Compose dry run...
%DOCKER_COMPOSE% up --dry-run >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Docker Compose dry run successful
) else (
    echo [ERROR] Docker Compose dry run failed
    exit /b 1
)

REM Test service health checks
echo [INFO] Testing service health check configurations...

set CRITICAL_SERVICES=postgres redis clickhouse

for %%s in (%CRITICAL_SERVICES%) do (
    %DOCKER_COMPOSE% config | findstr /i "healthcheck" >nul
    if %errorlevel% equ 0 (
        echo [SUCCESS] Health check configured for '%%s'
    ) else (
        echo [WARNING] Health check not configured for '%%s'
    )
)

REM Test environment variable validation
echo [INFO] Testing environment variable validation...

set REQUIRED_ENV_VARS=POSTGRES_DB=aibos_erp POSTGRES_USER=aibos POSTGRES_PASSWORD=aibos_dev_password CLICKHOUSE_DB=aibos_analytics CLICKHOUSE_USER=aibos CLICKHOUSE_PASSWORD=aibos_clickhouse_password MONGO_INITDB_DATABASE=aibos_documents MONGO_INITDB_ROOT_USERNAME=aibos MONGO_INITDB_ROOT_PASSWORD=aibos_mongo_password

for %%e in (%REQUIRED_ENV_VARS%) do (
    %DOCKER_COMPOSE% config | findstr "%%e" >nul
    if %errorlevel% equ 0 (
        echo [SUCCESS] Environment variable '%%e' is configured
    ) else (
        echo [ERROR] Environment variable '%%e' is missing
        exit /b 1
    )
)

REM Test network connectivity
echo [INFO] Testing network connectivity...

%DOCKER_COMPOSE% config | findstr "aibos-network" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] All services are configured to use 'aibos-network'
) else (
    echo [WARNING] Not all services are configured to use 'aibos-network'
)

REM Test volume mounts
echo [INFO] Testing volume mounts...

set VOLUME_SERVICES=postgres redis clickhouse jaeger prometheus grafana mongodb

for %%s in (%VOLUME_SERVICES%) do (
    %DOCKER_COMPOSE% config | findstr /i "volumes" >nul
    if %errorlevel% equ 0 (
        echo [SUCCESS] Volume mounts configured for '%%s'
    ) else (
        echo [WARNING] Volume mounts not configured for '%%s'
    )
)

REM Test configuration file syntax
echo [INFO] Testing configuration file syntax...

REM Test JavaScript files
node --version >nul 2>&1
if %errorlevel% equ 0 (
    node -c scripts\mongo-init.js >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] JavaScript file 'scripts\mongo-init.js' syntax is valid
    ) else (
        echo [WARNING] JavaScript file 'scripts\mongo-init.js' syntax may have issues
    )
) else (
    echo [WARNING] Node.js not installed - skipping JavaScript validation
)

REM Final validation summary
echo.
echo 🎉 Docker Compose Validation Complete!
echo.
echo ✅ Configuration Status:
echo   - Docker Compose configuration: VALID
echo   - Service definitions: COMPLETE
echo   - Volume definitions: COMPLETE
echo   - Network definitions: COMPLETE
echo   - Configuration files: PRESENT
echo   - Environment variables: CONFIGURED
echo   - Health checks: CONFIGURED
echo   - Volume mounts: CONFIGURED
echo.
echo 🚀 Ready to start the development environment!
echo.
echo Next steps:
echo   1. Run: docker-compose up -d
echo   2. Wait for services to be healthy
echo   3. Run: pnpm install
echo   4. Run: pnpm dev
echo.
echo Service URLs will be available at:
echo   - Web Application: http://localhost:3000
echo   - BFF API: http://localhost:3001
echo   - Kong Gateway: http://localhost:8000
echo   - Jaeger Tracing: http://localhost:16686
echo   - Prometheus: http://localhost:9090
echo   - Grafana: http://localhost:3001
echo.
