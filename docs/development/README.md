# Development Guide

## Overview

This guide provides comprehensive instructions for setting up, developing, and contributing to the AI-BOS ERP platform. It covers everything from initial setup to advanced development workflows.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **pnpm**: 8+ (package manager)
- **Docker**: 20+ (development environment)
- **Git**: Latest version

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd aibos-erp

# 2. Install dependencies
pnpm install

# 3. Start development environment
pnpm dev

# 4. Verify setup
pnpm dx  # Runs all quality checks
```

---

## 🏗️ Project Structure

### Monorepo Architecture

```
aibos-erp/
├── apps/                    # Applications
│   ├── bff/                # Backend for Frontend (NestJS)
│   │   ├── src/            # Source code
│   │   ├── dist/           # Build output
│   │   ├── package.json    # Package configuration
│   │   └── tsconfig.json   # TypeScript configuration
│   └── web/                # Next.js Web Application
│       ├── src/            # Source code
│       ├── public/         # Static assets
│       ├── package.json    # Package configuration
│       └── next.config.js  # Next.js configuration
├── packages/               # Shared packages
│   ├── ui/                 # UI Component Library
│   │   ├── src/            # Component source
│   │   ├── dist/           # Build output
│   │   └── package.json    # Package configuration
│   ├── contracts/          # Shared TypeScript types
│   └── utils/              # Shared utility functions
├── scripts/                # Development scripts
├── tests/                  # Test files
├── docs/                   # Documentation
├── turbo.json             # Turborepo configuration
├── pnpm-workspace.yaml    # pnpm workspace configuration
└── package.json           # Root package configuration
```

### Package Dependencies

- **Workspace Protocol**: Internal packages use `workspace:^`
- **Shared Dependencies**: Common dependencies hoisted to root
- **Version Management**: Centralized in root `package.json`

---

## 🛠️ Development Commands

### Core Commands

| Command | Purpose | Description |
|---------|---------|-------------|
| `pnpm dx` | Development check | Format, lint, typecheck, test, dependencies |
| `pnpm dev` | Start development | All services in development mode |
| `pnpm build` | Build all packages | Production builds for all packages |
| `pnpm test` | Run tests | Unit, integration, and E2E tests |
| `pnpm lint` | Code quality | ESLint + dependency-cruiser checks |
| `pnpm typecheck` | Type safety | TypeScript compilation checks |

### Package-Specific Commands

```bash
# Work on specific package
pnpm --filter @aibos/ui dev
pnpm --filter @aibos/bff dev
pnpm --filter @aibos/web dev

# Build specific package
pnpm --filter @aibos/ui build
pnpm --filter @aibos/bff build
pnpm --filter @aibos/web build

# Test specific package
pnpm --filter @aibos/ui test
pnpm --filter @aibos/bff test
pnpm --filter @aibos/web test
```

### Testing Commands

```bash
# All tests
pnpm test

# E2E tests
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed

# Contract tests
pnpm test:contract

# Performance tests
pnpm test:performance
```

---

## 🔧 Development Environment

### Docker Services

The development environment includes several services:

| Service | Port | Purpose |
|---------|------|---------|
| **PostgreSQL** | 5432 | Primary database |
| **Redis** | 6379 | Caching and sessions |
| **Kong Gateway** | 8000 | API gateway |
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3000 | Metrics visualization |
| **Jaeger** | 16686 | Distributed tracing |

### Starting Services

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down
```

### Service Health Checks

```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready

# Check Redis
docker-compose exec redis redis-cli ping

# Check Kong
curl http://localhost:8000/status

# Check Prometheus
curl http://localhost:9090/-/healthy
```

---

## 🎨 UI Component Development

### Component Library Structure

```
packages/ui/src/
├── components/           # Component implementations
│   ├── button.tsx       # Button component
│   ├── card.tsx         # Card component
│   ├── badge.tsx        # Badge component
│   └── input.tsx        # Input component
├── utils.ts             # Utility functions
├── index.ts             # Public API exports
└── types.ts             # TypeScript types
```

### Creating New Components

1. **Create component file** in `packages/ui/src/`
2. **Export from index.ts** to make it available
3. **Add to package.json** exports if needed
4. **Write tests** for the component
5. **Update documentation** with usage examples

### Component Guidelines

- **Polymorphic**: Use `as` prop for flexibility
- **Accessible**: Follow WCAG 2.2 AAA guidelines
- **Type-safe**: Full TypeScript support
- **Consistent**: Follow design system patterns
- **Tested**: Comprehensive test coverage

### Example Component

```tsx
import { forwardRef } from "react";
import { cn } from "./utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "button";
    
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          {
            "bg-primary-600 text-white hover:bg-primary-700": variant === "primary",
            "bg-secondary-100 text-secondary-900 hover:bg-secondary-200": variant === "secondary",
            "border border-primary-600 text-primary-600 hover:bg-primary-50": variant === "outline",
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4": size === "md",
            "h-12 px-6 text-lg": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
```

---

## 🔒 Security & Quality

### Anti-Drift Guardrails

The platform implements comprehensive anti-drift guardrails:

1. **ESLint**: Code quality and security rules
2. **dependency-cruiser**: Architecture enforcement
3. **TypeScript**: Type safety and compile-time checks
4. **Pre-commit Hooks**: Automated quality gates

### Code Quality Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Enterprise-grade rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages
- **Branch Protection**: Required reviews and checks

### Running Quality Checks

```bash
# All quality checks
pnpm dx

# Individual checks
pnpm lint
pnpm typecheck
pnpm test
pnpm check:deps
```

---

## 🧪 Testing

### Testing Strategy

The platform uses a comprehensive testing pyramid:

1. **Unit Tests**: Component and function testing
2. **Integration Tests**: API and database testing
3. **Contract Tests**: API contract validation (Pact)
4. **E2E Tests**: Full user journey testing (Playwright)
5. **Performance Tests**: Load and stress testing (k6)

### Writing Tests

#### Unit Tests

```typescript
import { render, screen } from "@testing-library/react";
import { Button } from "@aibos/ui";

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies correct variant styles", () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-primary-600");
  });
});
```

#### Integration Tests

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
```

#### E2E Tests

```typescript
import { test, expect } from "@playwright/test";

test("homepage loads correctly", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AI-BOS ERP/);
  await expect(page.locator("h1")).toContainText("AI-BOS ERP");
});
```

### Test Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run contract tests
pnpm test:contract

# Run performance tests
pnpm test:performance
```

---

## 🚀 Deployment

### Development Deployment

```bash
# Build all packages
pnpm build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Run health checks
pnpm health:check
```

### Production Deployment

1. **Build**: `pnpm build`
2. **Test**: `pnpm test`
3. **Lint**: `pnpm lint`
4. **Deploy**: Use CI/CD pipeline
5. **Verify**: Run health checks

---

## 🔍 Debugging

### Common Issues

#### Module Resolution Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Clear Turborepo cache
pnpm turbo clean
```

#### Docker Issues
```bash
# Clean Docker environment
docker-compose down
docker system prune -f
docker-compose up -d
```

#### Build Issues
```bash
# Clear all build outputs
pnpm clean
pnpm build
```

### Debugging Tools

- **VS Code**: Built-in debugging support
- **Chrome DevTools**: Browser debugging
- **Docker**: Container debugging
- **PostgreSQL**: Database debugging
- **Redis**: Cache debugging

---

## 📚 Resources

### Documentation

- [API Documentation](../api/README.md)
- [Architecture Decision Records](../adr/README.md)
- [Component Library Documentation](../components/README.md)
- [Testing Guide](../testing/README.md)

### External Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Documentation](https://pnpm.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Team Resources

- **Slack**: #aibos-erp-dev
- **GitHub**: Issues and discussions
- **Confluence**: Team documentation
- **Jira**: Project management

---

## 🤝 Contributing

### Development Workflow

1. **Create branch**: `git checkout -b feature/new-feature`
2. **Make changes**: Follow coding standards
3. **Run tests**: `pnpm test`
4. **Run quality checks**: `pnpm dx`
5. **Commit changes**: Use conventional commits
6. **Push branch**: `git push origin feature/new-feature`
7. **Create PR**: Follow PR template
8. **Review**: Address feedback
9. **Merge**: Squash and merge

### Code Standards

- **TypeScript**: Strict mode, no `any` types
- **ESLint**: Follow configured rules
- **Prettier**: Consistent formatting
- **Tests**: 95%+ coverage required
- **Documentation**: Update relevant docs

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

---

## 📞 Support

### Getting Help

- **Documentation**: Check this guide and other docs
- **Issues**: Open a GitHub issue for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Team**: Contact the development team directly

### Reporting Issues

When reporting issues, please include:

1. **Environment**: OS, Node.js version, pnpm version
2. **Steps**: Detailed steps to reproduce
3. **Expected**: What should happen
4. **Actual**: What actually happens
5. **Logs**: Relevant error logs or screenshots

---

**Happy coding! 🚀**
