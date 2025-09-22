import { Button, Card, Badge } from "@aibos/ui";

export default function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <Badge variant="primary" className="text-sm">
              Phase 1 - Platform Bootstrap
            </Badge>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              AI-BOS ERP
            </h1>
          </div>

          <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
            Transform your business operations with our intelligent,
            cloud-native Enterprise Resource Planning system designed for modern
            enterprises.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="text-center p-6 hover:shadow-medium transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 text-xl">🚀</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Modern Architecture
              </h3>
              <p className="text-secondary-600 text-sm">
                Built with Next.js, NestJS, and cloud-native technologies
              </p>
            </Card>

            <Card className="text-center p-6 hover:shadow-medium transition-shadow">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-success-600 text-xl">🛡️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Enterprise Security
              </h3>
              <p className="text-secondary-600 text-sm">
                Multi-tenant architecture with Row Level Security
              </p>
            </Card>

            <Card className="text-center p-6 hover:shadow-medium transition-shadow">
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-warning-600 text-xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">High Performance</h3>
              <p className="text-secondary-600 text-sm">
                Optimized for speed with advanced caching and monitoring
              </p>
            </Card>
          </div>

          <div className="mt-16 p-6 bg-white rounded-lg shadow-soft border border-secondary-200">
            <h2 className="text-2xl font-semibold mb-4">Development Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-success-600">✅</div>
                <div className="text-sm text-secondary-600">Monorepo</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success-600">✅</div>
                <div className="text-sm text-secondary-600">Anti-Drift</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success-600">✅</div>
                <div className="text-sm text-secondary-600">CI/CD</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success-600">✅</div>
                <div className="text-sm text-secondary-600">Docker</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
