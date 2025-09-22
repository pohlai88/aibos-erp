# AI-BOS ERP Development Environment

This directory contains all the configuration files and scripts needed to run the AI-BOS ERP development environment locally.

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose
- Node.js 18+ and pnpm
- Git

### Starting the Environment

**Windows:**
```bash
scripts/start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/start-dev.sh
scripts/start-dev.sh
```

**Manual Start:**
```bash
# Start all services
docker-compose up -d

# Install dependencies
pnpm install

# Run migrations and seed data
cd apps/bff && pnpm run db:migrate && pnpm run db:seed

# Start development servers
pnpm dev
```

## 🐳 Docker Services

### Core Services

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **PostgreSQL** | 5432 | Primary database with RLS | `pg_isready` |
| **Redis** | 6379 | Caching and session storage | `redis-cli ping` |
| **ClickHouse** | 8123 | Analytics database | HTTP ping |
| **MongoDB** | 27017 | Document storage | Connection test |

### API Gateway

| Service | Port | Description |
|---------|------|-------------|
| **Kong** | 8000 | API Gateway (Proxy) |
| **Kong Admin** | 8001 | Kong Admin API |

### Observability Stack

| Service | Port | Description |
|---------|------|-------------|
| **Jaeger** | 16686 | Distributed tracing UI |
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3001 | Metrics visualization |
| **OTEL Collector** | 4317/4318 | OpenTelemetry collector |

## 🔧 Configuration Files

### Database Configuration

- **`init-db.sql`** - PostgreSQL initialization with RLS and multi-tenancy
- **`clickhouse-init.sql`** - ClickHouse analytics database setup
- **`mongo-init.js`** - MongoDB document storage setup

### Service Configuration

- **`kong.yml`** - Kong API Gateway configuration
- **`otel-collector-config.yaml`** - OpenTelemetry collector setup
- **`prometheus.yml`** - Prometheus metrics collection
- **`grafana-datasources/datasources.yml`** - Grafana data sources

## 📊 Service URLs

Once the environment is running, you can access:

- **Web Application**: http://localhost:3000
- **BFF API**: http://localhost:3001
- **Kong Gateway**: http://localhost:8000
- **Kong Admin**: http://localhost:8001
- **Jaeger Tracing**: http://localhost:16686
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001

## 🔐 Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| PostgreSQL | `aibos` | `aibos_dev_password` |
| Redis | - | `aibos_redis_password` |
| ClickHouse | `aibos` | `aibos_clickhouse_password` |
| MongoDB | `aibos` | `aibos_mongo_password` |
| Grafana | `admin` | `aibos_grafana_password` |

## 🛠️ Development Commands

### Quality Checks
```bash
pnpm dx              # Run all quality checks
pnpm lint            # Run ESLint
pnpm typecheck       # Run TypeScript checks
pnpm test            # Run tests
pnpm dep:check       # Run dependency analysis
```

### Building
```bash
pnpm build           # Build all packages
pnpm dev             # Start all development servers
```

### Database Operations
```bash
cd apps/bff
pnpm run db:migrate  # Run database migrations
pnpm run db:seed     # Seed development data
```

### Docker Operations
```bash
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs      # View service logs
docker-compose ps        # Check service status
```

## 🔍 Monitoring and Debugging

### Health Checks

All services include health checks. You can verify service health:

```bash
# Check all services
docker-compose ps

# Check specific service logs
docker-compose logs postgres
docker-compose logs redis
docker-compose logs kong
```

### Database Access

**PostgreSQL:**
```bash
docker exec -it aibos-postgres psql -U aibos -d aibos_erp
```

**Redis:**
```bash
docker exec -it aibos-redis redis-cli -a aibos_redis_password
```

**ClickHouse:**
```bash
docker exec -it aibos-clickhouse clickhouse-client --user aibos --password aibos_clickhouse_password
```

**MongoDB:**
```bash
docker exec -it aibos-mongodb mongosh -u aibos -p aibos_mongo_password
```

### Observability

- **Jaeger**: http://localhost:16686 - Distributed tracing
- **Prometheus**: http://localhost:9090 - Metrics collection
- **Grafana**: http://localhost:3001 - Metrics visualization

## 🚨 Troubleshooting

### Common Issues

**1. Port Conflicts**
If you get port conflicts, check what's running on the ports:
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# Linux/Mac
lsof -i :3000
lsof -i :5432
```

**2. Docker Services Not Starting**
```bash
# Check Docker status
docker info

# Restart Docker services
docker-compose down
docker-compose up -d
```

**3. Database Connection Issues**
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker exec -it aibos-postgres pg_isready -U aibos -d aibos_erp
```

**4. Permission Issues (Linux/Mac)**
```bash
# Fix script permissions
chmod +x scripts/start-dev.sh

# Fix Docker permissions
sudo usermod -aG docker $USER
```

### Reset Environment

To completely reset the development environment:

```bash
# Stop all services
docker-compose down

# Remove all volumes (WARNING: This will delete all data)
docker-compose down -v

# Remove all images (WARNING: This will delete all images)
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## 📝 Environment Variables

The development environment uses the following environment variables (automatically created in `.env`):

```bash
# Application
NODE_ENV=development
CI=false

# Database
DATABASE_URL=postgresql://aibos:aibos_dev_password@localhost:5432/aibos_erp
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=aibos_erp
POSTGRES_USER=aibos
POSTGRES_PASSWORD=aibos_dev_password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=aibos_redis_password

# ClickHouse
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DB=aibos_analytics
CLICKHOUSE_USER=aibos
CLICKHOUSE_PASSWORD=aibos_clickhouse_password

# MongoDB
MONGODB_URL=mongodb://localhost:27017/aibos_documents
MONGODB_USER=aibos
MONGODB_PASSWORD=aibos_mongo_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Observability
JAEGER_URL=http://localhost:16686
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3001
```

## 🎯 Next Steps

1. **Start the environment** using the scripts above
2. **Verify all services** are running and healthy
3. **Access the web application** at http://localhost:3000
4. **Check the API** at http://localhost:3001/health
5. **Explore observability** tools (Jaeger, Prometheus, Grafana)
6. **Run quality checks** with `pnpm dx`
7. **Begin development** on your features

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [ClickHouse Documentation](https://clickhouse.com/docs/)
- [Kong Documentation](https://docs.konghq.com/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
