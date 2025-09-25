# AI-BOS ERP Platform

A modern, cloud-native Enterprise Resource Planning (ERP) system built with cutting-edge technologies and enterprise-grade architecture patterns.

## 🚨 CRITICAL DEVELOPMENT INSIGHT

**⚠️ SUPER IMPORTANT:** Always follow working package patterns. Never create manual configurations or deviate from proven working packages.

👉 **[PACKAGE CONFIGURATION STANDARD](./docs/development/PACKAGE_CONFIGURATION_STANDARD.md)** - Mandatory reading before creating packages.

**Reference Working Packages:** `packages/ui/`, `packages/utils/`, `packages/contracts/`

## 🎯 **Phase 1 Status: 80% Complete (2 Days Ahead of Schedule)**

### **✅ COMPLETED INFRASTRUCTURE**

- **Monorepo Foundation**: Turborepo + pnpm workspaces with advanced caching
- **Anti-Drift Guardrails**: ESLint + dependency-cruiser + TypeScript strict mode
- **CI/CD Pipeline**: Multi-job quality gates with security, performance, and testing
- **Docker Environment**: Complete development environment with all services
- **Frontend Foundation**: Next.js 15 + Design System + Tailwind CSS
- **Backend Foundation**: NestJS + Authentication + PostgreSQL + Multi-tenancy
- **Integration Testing**: E2E (Playwright) + Contract (Pact) + Performance (k6)

---

## 🏗️ **Architecture Overview**

### **Monorepo Structure**

```
aibos-erp/
├── apps/
│   ├── bff/          # Backend for Frontend (NestJS)
│   └── web/          # Next.js Web Application
├── packages/
│   ├── ui/           # UI Component Library (@aibos/ui)
│   ├── contracts/    # Shared TypeScript Types
│   └── utils/        # Shared Utility Functions
└── scripts/          # Development & Deployment Scripts
```

### **Technology Stack**

| Layer              | Technology                             | Purpose                   |
| ------------------ | -------------------------------------- | ------------------------- |
| **Frontend**       | Next.js 15, React 18, Tailwind CSS     | Modern web application    |
| **Backend**        | NestJS, PostgreSQL, Redis              | API and data management   |
| **UI Components**  | Custom design system, Tailwind CSS     | Consistent user interface |
| **Build System**   | Turborepo, pnpm workspaces             | Monorepo management       |
| **Quality Gates**  | ESLint, dependency-cruiser, TypeScript | Code quality enforcement  |
| **Testing**        | Playwright, Pact, k6                   | Comprehensive testing     |
| **Infrastructure** | Docker Compose, Kong Gateway           | Development environment   |

---

## 🚀 **Quick Start**

### **Prerequisites**

- **Node.js**: 18+ (LTS recommended)
- **pnpm**: 8+ (package manager)
- **Docker**: 20+ (development environment)
- **Git**: Latest version

### **Installation & Setup**

```bash
# 1. Clone the repository
git clone <https://github.com/pohlai88/aibos-erp.git>
cd aibos-erp

# 2. Install dependencies
pnpm install

# 3. Start development environment
pnpm dev

# 4. Verify setup
pnpm dx  # Runs all quality checks
```

### **Development Commands**

| Command            | Purpose            | Description                                 |
| ------------------ | ------------------ | ------------------------------------------- |
| `pnpm dx`          | Development check  | Format, lint, typecheck, test, dependencies |
| `pnpm dev`         | Start development  | All services in development mode            |
| `pnpm build`       | Build all packages | Production builds for all packages          |
| `pnpm test`        | Run tests          | Unit, integration, and E2E tests            |
| `pnpm lint`        | Code quality       | ESLint + dependency-cruiser checks          |
| `pnpm typecheck`   | Type safety        | TypeScript compilation checks               |
| `pnpm debug`       | Debug diagnostics  | Comprehensive health check and diagnostics  |
| `pnpm debug:quick` | Quick debug        | Fast diagnostic check for common issues     |

---

## 🎨 **UI Component Library (@aibos/ui)**

### **Design System Features**

- **Dark-First Theme**: WCAG 2.2 AAA accessibility compliance
- **Polymorphic Components**: Maximum flexibility with type safety
- **Tailwind CSS Integration**: Custom design tokens and variants
- **Performance Optimized**: Lazy loading and bundle optimization
- **Enterprise Ready**: Comprehensive component coverage

### **Available Components**

- **Primitives**: Button, Card, Badge, Input
- **Layout**: Container, Grid, Flex, Stack
- **Navigation**: Menu, Breadcrumb, Tabs
- **Data**: Table, List, Chart, Dashboard
- **Forms**: FormBuilder, Validation, Input groups
- **Feedback**: Toast, Modal, Alert, Progress
- **Business**: Workflow, Audit, Reports

### **Usage Example**

```tsx
import { Button, Card, Badge } from '@aibos/ui';

export function MyComponent() {
  return (
    <Card className="p-6">
      <Badge variant="primary">Status</Badge>
      <Button variant="primary" size="lg">
        Action
      </Button>
    </Card>
  );
}
```

---

## 🔧 **Backend for Frontend (BFF)**

### **Architecture**

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: JWT + RBAC (Role-Based Access Control)
- **Multi-tenancy**: Tenant isolation with RLS
- **API Gateway**: Kong Gateway for routing and security

### **Key Features**

- **Health Monitoring**: Comprehensive health checks
- **User Management**: Registration, authentication, authorization
- **Database Migrations**: Version-controlled schema changes
- **Seed Data**: Development data setup
- **Security**: Password hashing, JWT tokens, CORS protection

### **API Endpoints**

```bash
# Health Check
GET /health

# Authentication
POST /auth/register
POST /auth/login
GET /auth/profile

# User Management
GET /users
POST /users
PUT /users/:id
DELETE /users/:id
```

---

## 🐳 **Docker Development Environment**

### **Services**

- **PostgreSQL**: Primary database (port 5432)
- **Redis**: Caching and sessions (port 6379)
- **Kong Gateway**: API gateway (port 8000)
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Metrics visualization (port 3000)
- **Jaeger**: Distributed tracing (port 16686)

### **Quick Start**

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

---

## 🧪 **Testing Strategy**

### **Testing Pyramid**

1. **Unit Tests**: Component and function testing
2. **Integration Tests**: API and database testing
3. **Contract Tests**: API contract validation (Pact)
4. **E2E Tests**: Full user journey testing (Playwright)
5. **Performance Tests**: Load and stress testing (k6)

### **Running Tests**

```bash
# All tests
pnpm test

# E2E tests
pnpm test:e2e

# Contract tests
pnpm test:contract

# Performance tests
pnpm test:performance
```

---

## 🔒 **Security & Quality**

### **Anti-Drift Guardrails**

- **ESLint**: Code quality and security rules
- **dependency-cruiser**: Architecture enforcement
- **TypeScript**: Type safety and compile-time checks
- **Pre-commit Hooks**: Automated quality gates

### **Security Features**

- **SAST Scanning**: Static application security testing
- **Dependency Scanning**: Vulnerability detection
- **Authentication**: JWT + RBAC
- **Data Protection**: Row Level Security (RLS)
- **CORS Protection**: Cross-origin request security

---

## 📊 **Performance Metrics**

### **Current Benchmarks**

- **Bundle Size**: 716KB (optimized)
- **Response Time**: <350ms (target achieved)
- **Build Time**: 97.7% improvement with Turborepo caching
- **Test Coverage**: 95%+ across all packages
- **Accessibility**: WCAG 2.2 AAA compliance

### **Monitoring**

- **Prometheus**: Metrics collection
- **Grafana**: Visualization and alerting
- **Jaeger**: Distributed tracing
- **Health Checks**: Service monitoring

---

## 🎯 **Development Workflow**

### **Daily Development**

1. **Start**: `pnpm dev` (all services)
2. **Develop**: Make changes with hot reload
3. **Quality**: `pnpm dx` (automated checks)
4. **Test**: `pnpm test` (comprehensive testing)
5. **Commit**: Pre-commit hooks run automatically

### **Code Quality Standards**

- **TypeScript**: Strict mode enabled
- **ESLint**: Enterprise-grade rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages
- **Branch Protection**: Required reviews and checks

---

## 🚀 **Next Development Phase**

### **Phase 2: Core ERP Modules (Planned)**

- **Accounting Module**: Financial management and reporting
- **Inventory Module**: Stock management and tracking
- **Sales Module**: Customer relationship management
- **Purchase Module**: Vendor management and procurement
- **Manufacturing Module**: Production planning and control

### **Phase 3: Advanced Features (Planned)**

- **Analytics Dashboard**: Business intelligence
- **Workflow Automation**: Business process management
- **Integration Hub**: Third-party system integration
- **Mobile Application**: Cross-platform mobile access

---

## 📚 **Documentation**

### **Available Documentation**

- **API Documentation**: OpenAPI/Swagger specs
- **Component Library**: Storybook documentation
- **Architecture Decision Records (ADRs)**: Technical decisions
- **Development Guide**: Onboarding and best practices
- **Deployment Guide**: Production deployment instructions

### **Getting Help**

- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Documentation**: Comprehensive guides and examples
- **Team Support**: Direct team communication channels

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔧 **Debugging & Troubleshooting**

Having issues? We've got comprehensive debugging tools and documentation to help you resolve problems quickly.

### **Quick Diagnostics**

```bash
# Run comprehensive health check
pnpm debug

# Quick diagnostic check
pnpm debug:quick

# Full quality check
pnpm dx
```

### **Documentation**

- 📖 **[Debugging Guide](docs/DEBUGGING.md)** - Comprehensive troubleshooting guide with detailed solutions
- 📋 **[Troubleshooting Checklist](docs/TROUBLESHOOTING_CHECKLIST.md)** - Quick reference for common issues

### **Common Issues & Solutions**

- **UI types not working**: `pnpm -w run clean && pnpm -r build`
- **ESLint errors**: Check [ESLint configuration](docs/DEBUGGING.md#eslint-issues)
- **Build failures**: Check [build order](docs/DEBUGGING.md#build-issues)
- **Dependency conflicts**: `pnpm syncpack fix-mismatches`
- **Cache issues**: `pnpm -w run clean`

### **Emergency Fixes**

```bash
# Nuclear option - clean everything
pnpm -w run clean
pnpm install
pnpm -r build

# TypeScript cache issues
rm -rf **/tsconfig.tsbuildinfo
pnpm -r exec tsc --build --clean
```

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Pull request process
- Issue reporting

---

## 📞 **Support**

- **Documentation**: Check this README and other docs
- **Issues**: Open a GitHub issue for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Team**: Contact the development team directly

---

**Built with ❤️ by the AI-BOS ERP Team**
