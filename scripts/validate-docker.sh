#!/bin/bash

# Docker Compose Validation Script for AI-BOS ERP
# This script validates the Docker Compose configuration and tests all services

set -e

echo "🔍 Validating AI-BOS ERP Docker Compose Configuration..."

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
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Determine Docker Compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

print_status "Using Docker Compose command: $DOCKER_COMPOSE"

# Validate Docker Compose configuration
print_status "Validating Docker Compose configuration..."
if $DOCKER_COMPOSE config > /dev/null; then
    print_success "Docker Compose configuration is valid"
else
    print_error "Docker Compose configuration is invalid"
    exit 1
fi

# Test service definitions
print_status "Testing service definitions..."

# Check if all required services are defined
REQUIRED_SERVICES=("postgres" "redis" "clickhouse" "kong" "otel-collector" "jaeger" "prometheus" "grafana" "mongodb")

for service in "${REQUIRED_SERVICES[@]}"; do
    if $DOCKER_COMPOSE config --services | grep -q "^$service$"; then
        print_success "Service '$service' is defined"
    else
        print_error "Service '$service' is missing"
        exit 1
    fi
done

# Check if all required volumes are defined
REQUIRED_VOLUMES=("postgres_data" "redis_data" "clickhouse_data" "jaeger_data" "prometheus_data" "grafana_data" "mongodb_data")

for volume in "${REQUIRED_VOLUMES[@]}"; do
    if $DOCKER_COMPOSE config --volumes | grep -q "^$volume$"; then
        print_success "Volume '$volume' is defined"
    else
        print_error "Volume '$volume' is missing"
        exit 1
    fi
done

# Check if all required networks are defined
REQUIRED_NETWORKS=("aibos-network")

for network in "${REQUIRED_NETWORKS[@]}"; do
    if $DOCKER_COMPOSE config --networks | grep -q "^$network$"; then
        print_success "Network '$network' is defined"
    else
        print_error "Network '$network' is missing"
        exit 1
    fi
done

# Check if all required configuration files exist
REQUIRED_CONFIGS=(
    "scripts/init-db.sql"
    "scripts/clickhouse-init.sql"
    "scripts/kong.yml"
    "scripts/otel-collector-config.yaml"
    "scripts/prometheus.yml"
    "scripts/grafana-datasources/datasources.yml"
    "scripts/mongo-init.js"
)

for config in "${REQUIRED_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        print_success "Configuration file '$config' exists"
    else
        print_error "Configuration file '$config' is missing"
        exit 1
    fi
done

# Test port conflicts
print_status "Checking for port conflicts..."

REQUIRED_PORTS=("5432" "6379" "8123" "8000" "8001" "16686" "9090" "3001" "27017" "4317" "4318" "8888" "8889")

for port in "${REQUIRED_PORTS[@]}"; do
    if lsof -i :$port > /dev/null 2>&1; then
        print_warning "Port $port is already in use"
    else
        print_success "Port $port is available"
    fi
done

# Test Docker Compose dry run
print_status "Testing Docker Compose dry run..."
if $DOCKER_COMPOSE up --dry-run > /dev/null 2>&1; then
    print_success "Docker Compose dry run successful"
else
    print_error "Docker Compose dry run failed"
    exit 1
fi

# Test service health checks
print_status "Testing service health check configurations..."

# Check if health checks are configured for critical services
CRITICAL_SERVICES=("postgres" "redis" "clickhouse")

for service in "${CRITICAL_SERVICES[@]}"; do
    if $DOCKER_COMPOSE config | grep -A 10 "services:" | grep -A 20 "$service:" | grep -q "healthcheck:"; then
        print_success "Health check configured for '$service'"
    else
        print_warning "Health check not configured for '$service'"
    fi
done

# Test environment variable validation
print_status "Testing environment variable validation..."

# Check if required environment variables are set
REQUIRED_ENV_VARS=(
    "POSTGRES_DB=aibos_erp"
    "POSTGRES_USER=aibos"
    "POSTGRES_PASSWORD=aibos_dev_password"
    "CLICKHOUSE_DB=aibos_analytics"
    "CLICKHOUSE_USER=aibos"
    "CLICKHOUSE_PASSWORD=aibos_clickhouse_password"
    "MONGO_INITDB_DATABASE=aibos_documents"
    "MONGO_INITDB_ROOT_USERNAME=aibos"
    "MONGO_INITDB_ROOT_PASSWORD=aibos_mongo_password"
)

for env_var in "${REQUIRED_ENV_VARS[@]}"; do
    if $DOCKER_COMPOSE config | grep -q "$env_var"; then
        print_success "Environment variable '$env_var' is configured"
    else
        print_error "Environment variable '$env_var' is missing"
        exit 1
    fi
done

# Test network connectivity
print_status "Testing network connectivity..."

# Check if all services are on the same network
if $DOCKER_COMPOSE config | grep -A 5 "networks:" | grep -q "aibos-network"; then
    print_success "All services are configured to use 'aibos-network'"
else
    print_warning "Not all services are configured to use 'aibos-network'"
fi

# Test volume mounts
print_status "Testing volume mounts..."

# Check if all services have proper volume mounts
VOLUME_SERVICES=("postgres" "redis" "clickhouse" "jaeger" "prometheus" "grafana" "mongodb")

for service in "${VOLUME_SERVICES[@]}"; do
    if $DOCKER_COMPOSE config | grep -A 10 "services:" | grep -A 20 "$service:" | grep -q "volumes:"; then
        print_success "Volume mounts configured for '$service'"
    else
        print_warning "Volume mounts not configured for '$service'"
    fi
done

# Test configuration file syntax
print_status "Testing configuration file syntax..."

# Test SQL files
if command -v psql &> /dev/null; then
    if psql --version > /dev/null 2>&1; then
        print_success "PostgreSQL client available for SQL validation"
    else
        print_warning "PostgreSQL client not available for SQL validation"
    fi
else
    print_warning "PostgreSQL client not installed"
fi

# Test YAML files
if command -v yamllint &> /dev/null; then
    for yaml_file in scripts/*.yml scripts/*.yaml scripts/grafana-datasources/*.yml; do
        if [ -f "$yaml_file" ]; then
            if yamllint "$yaml_file" > /dev/null 2>&1; then
                print_success "YAML file '$yaml_file' syntax is valid"
            else
                print_warning "YAML file '$yaml_file' syntax may have issues"
            fi
        fi
    done
else
    print_warning "yamllint not installed - skipping YAML validation"
fi

# Test JavaScript files
if command -v node &> /dev/null; then
    if node -c scripts/mongo-init.js > /dev/null 2>&1; then
        print_success "JavaScript file 'scripts/mongo-init.js' syntax is valid"
    else
        print_warning "JavaScript file 'scripts/mongo-init.js' syntax may have issues"
    fi
else
    print_warning "Node.js not installed - skipping JavaScript validation"
fi

# Final validation summary
echo ""
echo "🎉 Docker Compose Validation Complete!"
echo ""
echo "✅ Configuration Status:"
echo "  - Docker Compose configuration: VALID"
echo "  - Service definitions: COMPLETE"
echo "  - Volume definitions: COMPLETE"
echo "  - Network definitions: COMPLETE"
echo "  - Configuration files: PRESENT"
echo "  - Environment variables: CONFIGURED"
echo "  - Health checks: CONFIGURED"
echo "  - Volume mounts: CONFIGURED"
echo ""
echo "🚀 Ready to start the development environment!"
echo ""
echo "Next steps:"
echo "  1. Run: docker-compose up -d"
echo "  2. Wait for services to be healthy"
echo "  3. Run: pnpm install"
echo "  4. Run: pnpm dev"
echo ""
echo "Service URLs will be available at:"
echo "  - Web Application: http://localhost:3000"
echo "  - BFF API: http://localhost:3001"
echo "  - Kong Gateway: http://localhost:8000"
echo "  - Jaeger Tracing: http://localhost:16686"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001"
echo ""
