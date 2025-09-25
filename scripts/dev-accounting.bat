@echo off
echo 🚀 Starting AI-BOS ERP Accounting Development Environment
echo =========================================================

REM Start database containers
echo Starting database containers...
docker run --name aibos-postgres -e POSTGRES_DB=accounting_dev -e POSTGRES_USER=accounting_user -e POSTGRES_PASSWORD=dev_password -p 5432:5432 -d postgres:15-alpine
docker run --name aibos-redis -p 6379:6379 -d redis:7-alpine

REM Wait for databases to be ready
echo Waiting for databases to be ready...
timeout /t 10 /nobreak

REM Start accounting service
echo Starting accounting service...
cd packages\accounting
start "Accounting Service" cmd /k "pnpm dev"

REM Start web application
echo Starting web application...
cd ..\..\apps\web
start "Web Application" cmd /k "pnpm dev"

echo Development environment started!
echo Accounting Service: http://localhost:3001
echo Web Application: http://localhost:3000
echo API Documentation: http://localhost:3001/api/docs
echo.
echo Press any key to stop all services
pause

REM Cleanup
echo Stopping services...
docker stop aibos-postgres aibos-redis
docker rm aibos-postgres aibos-redis
