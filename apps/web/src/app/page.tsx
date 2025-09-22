import { Button, Card, Badge } from '@aibos/ui';

export default function HomePage(): JSX.Element {
  return (
    <div className="from-primary-50 to-secondary-50 min-h-screen bg-gradient-to-br">
      <div className="container mx-auto px-4 py-24">
        <div className="space-y-8 text-center">
          <div className="space-y-4">
            <Badge variant="primary" className="text-sm">
              Phase 1 - Platform Bootstrap
            </Badge>
            <h1 className="from-primary-600 to-primary-800 bg-gradient-to-r bg-clip-text text-6xl font-bold text-transparent">
              AI-BOS ERP
            </h1>
          </div>

          <p className="text-secondary-600 mx-auto max-w-3xl text-xl leading-relaxed">
            Transform your business operations with our intelligent, cloud-native Enterprise
            Resource Planning system designed for modern enterprises.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="hover:shadow-medium p-6 text-center transition-shadow">
              <div className="bg-primary-100 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <span className="text-primary-600 text-xl">🚀</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Modern Architecture</h3>
              <p className="text-secondary-600 text-sm">
                Built with Next.js, NestJS, and cloud-native technologies
              </p>
            </Card>

            <Card className="hover:shadow-medium p-6 text-center transition-shadow">
              <div className="bg-success-100 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <span className="text-success-600 text-xl">🛡️</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Enterprise Security</h3>
              <p className="text-secondary-600 text-sm">
                Multi-tenant architecture with Row Level Security
              </p>
            </Card>

            <Card className="hover:shadow-medium p-6 text-center transition-shadow">
              <div className="bg-warning-100 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <span className="text-warning-600 text-xl">⚡</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">High Performance</h3>
              <p className="text-secondary-600 text-sm">
                Optimized for speed with advanced caching and monitoring
              </p>
            </Card>
          </div>

          <div className="shadow-soft border-secondary-200 mt-16 rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-2xl font-semibold">Development Status</h2>
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
              <div>
                <div className="text-success-600 text-2xl font-bold">✅</div>
                <div className="text-secondary-600 text-sm">Monorepo</div>
              </div>
              <div>
                <div className="text-success-600 text-2xl font-bold">✅</div>
                <div className="text-secondary-600 text-sm">Anti-Drift</div>
              </div>
              <div>
                <div className="text-success-600 text-2xl font-bold">✅</div>
                <div className="text-secondary-600 text-sm">CI/CD</div>
              </div>
              <div>
                <div className="text-success-600 text-2xl font-bold">✅</div>
                <div className="text-secondary-600 text-sm">Docker</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
