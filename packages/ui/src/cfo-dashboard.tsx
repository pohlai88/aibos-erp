import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './card';
import { Badge } from './badge';
import { LoadingSpinner } from './loading-states';

export interface FinancialMetric {
  id: string;
  label: string;
  value: number;
  currency: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  trend: 'up' | 'down' | 'stable';
  period: string;
  category: 'revenue' | 'expense' | 'profit' | 'cash' | 'assets' | 'liabilities';
}

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
  lastUpdated: Date;
}

export interface CFODashboardProps {
  tenantId: string;
  period?: 'monthly' | 'quarterly' | 'yearly';
  onMetricClick?: (metric: FinancialMetric) => void;
  onKPIClick?: (kpi: KPIMetric) => void;
  className?: string;
}

/**
 * CFO Dashboard - Executive-level financial oversight
 * Provides real-time financial metrics, KPI tracking, and executive reporting
 */
export function CFODashboard({
  tenantId,
  period = 'monthly',
  onMetricClick,
  onKPIClick,
  className = '',
}: CFODashboardProps): JSX.Element {
  const [metrics, setMetrics] = useState<FinancialMetric[]>([]);
  const [kpis, setKPIs] = useState<KPIMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Mock data for demonstration - in production, this would fetch from API
  const mockMetrics: FinancialMetric[] = useMemo(
    () => [
      {
        id: 'revenue',
        label: 'Total Revenue',
        value: 2_450_000,
        currency: 'USD',
        change: 12.5,
        changeType: 'positive',
        trend: 'up',
        period: 'Q4 2024',
        category: 'revenue',
      },
      {
        id: 'expenses',
        label: 'Total Expenses',
        value: 1_890_000,
        currency: 'USD',
        change: -3.2,
        changeType: 'positive',
        trend: 'down',
        period: 'Q4 2024',
        category: 'expense',
      },
      {
        id: 'net-profit',
        label: 'Net Profit',
        value: 560_000,
        currency: 'USD',
        change: 28.7,
        changeType: 'positive',
        trend: 'up',
        period: 'Q4 2024',
        category: 'profit',
      },
      {
        id: 'cash-flow',
        label: 'Operating Cash Flow',
        value: 680_000,
        currency: 'USD',
        change: 15.3,
        changeType: 'positive',
        trend: 'up',
        period: 'Q4 2024',
        category: 'cash',
      },
    ],
    [],
  );

  const mockKPIs: KPIMetric[] = useMemo(
    () => [
      {
        id: 'gross-margin',
        name: 'Gross Margin',
        value: 23.4,
        target: 25.0,
        unit: '%',
        status: 'good',
        description: 'Gross profit margin percentage',
        lastUpdated: new Date(),
      },
      {
        id: 'debt-ratio',
        name: 'Debt-to-Equity Ratio',
        value: 0.45,
        target: 0.5,
        unit: 'ratio',
        status: 'excellent',
        description: 'Financial leverage ratio',
        lastUpdated: new Date(),
      },
      {
        id: 'roi',
        name: 'Return on Investment',
        value: 18.7,
        target: 20.0,
        unit: '%',
        status: 'good',
        description: 'Return on invested capital',
        lastUpdated: new Date(),
      },
      {
        id: 'cash-conversion',
        name: 'Cash Conversion Cycle',
        value: 45,
        target: 30,
        unit: 'days',
        status: 'warning',
        description: 'Days to convert investments to cash',
        lastUpdated: new Date(),
      },
    ],
    [],
  );

  useEffect(() => {
    const loadDashboardData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(undefined);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setMetrics(mockMetrics);
        setKPIs(mockKPIs);
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [tenantId, period, mockMetrics, mockKPIs]);

  const formatCurrency = (value: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: KPIMetric['status']): string => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChangeColor = (changeType: FinancialMetric['changeType']): string => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: FinancialMetric['trend']): string => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="large" text="Loading CFO Dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <h3 className="text-lg font-semibold">Dashboard Error</h3>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CFO Dashboard</h1>
          <p className="text-gray-600">Executive Financial Overview - {period}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Tenant: {tenantId}
        </Badge>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            key={metric.id}
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => onMetricClick?.(metric)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">{metric.label}</h3>
                <span className="text-lg">{getTrendIcon(metric.trend)}</span>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metric.value, metric.currency)}
                </p>
                <p className={`text-sm ${getChangeColor(metric.changeType)}`}>
                  {formatPercentage(metric.change)} vs {metric.period}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Key Performance Indicators</h3>
            <div className="space-y-4">
              {kpis.map((kpi) => (
                <div
                  key={kpi.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                  onClick={() => onKPIClick?.(kpi)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      onKPIClick?.(kpi);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{kpi.name}</h4>
                      <Badge className={getStatusColor(kpi.status)}>{kpi.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{kpi.description}</p>
                    <div className="mt-2 flex items-center">
                      <span className="text-lg font-semibold text-gray-900">
                        {kpi.value}
                        {kpi.unit}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        Target: {kpi.target}
                        {kpi.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Financial Health Summary */}
        <Card>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Financial Health Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Health Score</span>
                <Badge className="border-green-200 bg-green-100 text-green-800">85/100</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Risk Level</span>
                <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">Low</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Compliance Status</span>
                <Badge className="border-green-200 bg-green-100 text-green-800">Compliant</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Audit</span>
                <span className="text-sm text-gray-900">Dec 15, 2024</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Financial Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <div>
                <p className="font-medium text-gray-900">Q4 Financial Close Completed</p>
                <p className="text-sm text-gray-600">All accounts reconciled and closed</p>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <div>
                <p className="font-medium text-gray-900">Tax Provision Updated</p>
                <p className="text-sm text-gray-600">Year-end tax calculations completed</p>
              </div>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">Budget Variance Analysis</p>
                <p className="text-sm text-gray-600">Q4 budget vs actual analysis completed</p>
              </div>
              <span className="text-sm text-gray-500">3 days ago</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Hook for CFO Dashboard data management
 */
export function useCFODashboard(
  tenantId: string,
  _period: string = 'monthly',
): {
  data: {
    metrics: FinancialMetric[];
    kpis: KPIMetric[];
  };
  isLoading: boolean;
  error: string | undefined;
  refreshData: () => Promise<void>;
} {
  const [data, _setData] = useState<{
    metrics: FinancialMetric[];
    kpis: KPIMetric[];
  }>({ metrics: [], kpis: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const refreshData = async (): Promise<void> => {
    setIsLoading(true);
    setError(undefined);

    try {
      // In production, this would make API calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Mock data would be replaced with actual API calls
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refreshData,
  };
}
