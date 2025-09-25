import { Button } from '@aibos/ui';
import { ArrowRight, CreditCard, Package, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function HomePage(): JSX.Element {
  const modules = [
    {
      name: 'Accounting',
      description: 'Manage financial records, journal entries, and reports',
      href: '/accounting',
      icon: CreditCard,
      color: 'bg-blue-500',
    },
    {
      name: 'Inventory',
      description: 'Track products, stock levels, and warehouse operations',
      href: '/inventory',
      icon: Package,
      color: 'bg-green-500',
    },
    {
      name: 'CRM',
      description: 'Customer relationship management and sales tracking',
      href: '/crm',
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'Reports',
      description: 'Business intelligence and analytics dashboard',
      href: '/reports',
      icon: BarChart3,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to <span className="text-blue-600">AI-BOS ERP</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
            Comprehensive enterprise resource planning system designed for modern businesses.
            Streamline your operations with integrated modules for accounting, inventory, CRM, and
            more.
          </p>
          <div className="mx-auto mt-5 max-w-md sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/accounting">
                <Button className="flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 md:px-10 md:py-4 md:text-lg">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div key={module.name} className="group relative">
                <div className="relative rounded-lg bg-white p-6 shadow-md transition-shadow duration-200 hover:shadow-lg">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 transition-colors duration-200 group-hover:bg-gray-200">
                    <Icon className="h-6 w-6 text-gray-600" />
                  </div>
                  <h3 className="mb-2 text-center text-lg font-medium text-gray-900">
                    {module.name}
                  </h3>
                  <p className="mb-4 text-center text-sm text-gray-500">{module.description}</p>
                  <div className="text-center">
                    <Link href={module.href}>
                      <Button variant="secondary" size="sm" className="w-full">
                        Access Module
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose AI-BOS ERP?</h2>
            <p className="mt-4 text-lg text-gray-600">
              Built with modern technology and designed for scalability
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">Fast & Reliable</h3>
              <p className="text-gray-600">
                Built with modern technologies for optimal performance and reliability.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">Secure & Compliant</h3>
              <p className="text-gray-600">
                Enterprise-grade security with compliance to industry standards.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <svg
                  className="h-8 w-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">User Friendly</h3>
              <p className="text-gray-600">
                Intuitive interface designed for ease of use and productivity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
