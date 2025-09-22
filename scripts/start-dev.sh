#!/bin/bash

# AI-BOS ERP Development Environment Startup Script
# This script starts all development services and validates the environment

set -e

echo "🚀 Starting AI-BOS ERP Development Environment..."

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file..."
    cat > .env << EOF
# AI-BOS ERP Development Environment Variables
NODE_ENV=development
CI=false

# Database Configuration
DATABASE_URL=postgresql://aibos:aibos_dev_password@localhost:5432/aibos_erp
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=aibos_erp
POSTGRES_USER=aibos
POSTGRES_PASSWORD=aibos_dev_password

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=aibos_redis_password

# ClickHouse Configuration
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DB=aibos_analytics
CLICKHOUSE_USER=aibos
CLICKHOUSE_PASSWORD=aibos_clickhouse_password

# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017/aibos_documents
MONGODB_USER=aibos
MONGODB_PASSWORD=aibos_mongo_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# API Gateway Configuration
KONG_ADMIN_URL=http://localhost:8001
KONG_PROXY_URL=http://localhost:8000

# Observability Configuration
JAEGER_URL=http://localhost:16686
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3001

# Application URLs
BFF_URL=http://localhost:3001
WEB_URL=http://localhost:3000
EOF
    print_success ".env file created"
fi

# Start Docker services
print_status "Starting Docker services..."
docker-compose up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."

# Function to check service health
check_service() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps $service | grep -q "healthy"; then
            print_success "$service is healthy"
            return 0
        fi
        
        print_status "Waiting for $service to be healthy... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service failed to become healthy"
    return 1
}

# Check critical services
check_service postgres
check_service redis
check_service clickhouse

# Check optional services
if docker-compose ps kong | grep -q "healthy"; then
    print_success "Kong is healthy"
else
    print_warning "Kong is not healthy, but continuing..."
fi

if docker-compose ps jaeger | grep -q "healthy"; then
    print_success "Jaeger is healthy"
else
    print_warning "Jaeger is not healthy, but continuing..."
fi

if docker-compose ps prometheus | grep -q "healthy"; then
    print_success "Prometheus is healthy"
else
    print_warning "Prometheus is not healthy, but continuing..."
fi

if docker-compose ps grafana | grep -q "healthy"; then
    print_success "Grafana is healthy"
else
    print_warning "Grafana is not healthy, but continuing..."
fi

# Run database migrations
print_status "Running database migrations..."
cd apps/bff
pnpm run db:migrate
cd ../..

# Seed development data
print_status "Seeding development data..."
cd apps/bff
pnpm run db:seed
cd ../..

# Install dependencies if needed
print_status "Installing dependencies..."
pnpm install

# Start development servers
print_status "Starting development servers..."

# Start BFF in background
print_status "Starting BFF server..."
cd apps/bff
pnpm run dev &
BFF_PID=$!
cd ../..

# Start Web in background
print_status "Starting Web server..."
cd apps/web
pnpm run dev &
WEB_PID=$!
cd ../..

# Wait a moment for servers to start
sleep 5

# Check if servers are running
if curl -s http://localhost:3001/health > /dev/null; then
    print_success "BFF server is running on http://localhost:3001"
else
    print_warning "BFF server may not be running properly"
fi

if curl -s http://localhost:3000 > /dev/null; then
    print_success "Web server is running on http://localhost:3000"
else
    print_warning "Web server may not be running properly"
fi

# Display service URLs
echo ""
echo "🎉 AI-BOS ERP Development Environment is ready!"
echo ""
echo "📊 Service URLs:"
echo "  Web Application:    http://localhost:3000"
echo "  BFF API:            http://localhost:3001"
echo "  Kong Gateway:       http://localhost:8000"
echo "  Kong Admin:         http://localhost:8001"
echo "  Jaeger Tracing:    http://localhost:16686"
echo "  Prometheus:         http://localhost:9090"
echo "  Grafana:           http://localhost:3001"
echo "  PostgreSQL:        localhost:5432"
echo "  Redis:             localhost:6379"
echo "  ClickHouse:        http://localhost:8123"
echo "  MongoDB:           localhost:27017"
echo ""
echo "🔧 Development Commands:"
echo "  pnpm dx            - Run quality checks"
echo "  pnpm build         - Build all packages"
echo "  pnpm dev           - Start all development servers"
echo "  docker-compose logs - View service logs"
echo "  docker-compose down - Stop all services"
echo ""
echo "📝 Default Credentials:"
echo "  Database:          aibos / aibos_dev_password"
echo "  Redis:             aibos_redis_password"
echo "  ClickHouse:        aibos / aibos_clickhouse_password"
echo "  MongoDB:           aibos / aibos_mongo_password"
echo "  Grafana:           admin / aibos_grafana_password"
echo ""
echo "🛑 To stop the environment:"
echo "  Press Ctrl+C to stop this script"
echo "  Run 'docker-compose down' to stop Docker services"
echo ""

# Function to cleanup on exit
cleanup() {
    print_status "Stopping development servers..."
    kill $BFF_PID 2>/dev/null || true
    kill $WEB_PID 2>/dev/null || true
    print_success "Development environment stopped"
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Keep script running
print_status "Development environment is running. Press Ctrl+C to stop."
wait
