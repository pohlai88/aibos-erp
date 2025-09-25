import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';

import { Badge, Card, LoadingSpinner, tokens, Button, Input, Skeleton } from '@aibos/ui';
import type {
  CashForecast,
  CloseReadiness,
  Company,
  CompanyId,
  KPI,
  MetricId,
  Period,
  VarianceStoryline,
} from '@aibos/accounting-contracts';

export interface OutstandingCFODashboardProps {
  tenantId: string;
  period: Period;
  companies: Company[];
  onOpenDrill?: (params: { metricId: MetricId; companyId: CompanyId }) => void;
  onExportBoardPack?: (params: { companyIds: CompanyId[]; period: Period }) => void;
  onToggleEliminations?: (enabled: boolean) => void;
  onVarianceClick?: (metricId: MetricId) => void;
  className?: string;
}

const INACTIVE_BUTTON_STYLES = 'border border-semantic-border bg-semantic-background text-semantic-muted-foreground';

export const OutstandingCFODashboard = memo(function OutstandingCFODashboard({
  tenantId,
  period,
  companies,
  onOpenDrill,
  onExportBoardPack,
  onToggleEliminations,
  onVarianceClick,
  className,
}: OutstandingCFODashboardProps): JSX.Element {
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyId[]>([]);
  const [eliminationsEnabled, setEliminationsEnabled] = useState(false);
  const [consolidatedView, setConsolidatedView] = useState(true);
  const [collapsedKPIs, setCollapsedKPIs] = useState<Set<MetricId>>(new Set());
  const [_pinnedKPIs, setPinnedKPIs] = useState<Set<MetricId>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Mock data - in production, this would come from your BFF
  const mockKPIs: KPI[] = useMemo(
    () => [
      {
        id: 'revenue',
        title: 'Total Revenue',
        value: 'RM 2,450,000',
        raw: 2450000,
        delta: { pct: 12.5, direction: 'up' },
        lineage: {
          reportId: 'P&L-2024-Q4',
          journalIds: ['JE-001', 'JE-002'],
          sourceRefs: ['INV-001', 'INV-002'],
        },
        disclosure: 'MFRS 15',
        sparkline: [2100000, 2200000, 2300000, 2400000, 2450000],
        category: 'revenue',
        priority: 'critical',
        collapsible: true,
        pinned: true,
      },
      {
        id: 'gross-margin',
        title: 'Gross Margin',
        value: '23.4%',
        raw: 23.4,
        delta: { pct: 2.1, direction: 'up' },
        lineage: {
          reportId: 'P&L-2024-Q4',
          journalIds: ['JE-003'],
          sourceRefs: ['COGS-001'],
        },
        disclosure: 'MFRS 2',
        sparkline: [21.2, 21.8, 22.5, 23.1, 23.4],
        category: 'ratios',
        priority: 'high',
        collapsible: true,
      },
      {
        id: 'operating-cash-flow',
        title: 'Operating Cash Flow',
        value: 'RM 680,000',
        raw: 680000,
        delta: { pct: 15.3, direction: 'up' },
        lineage: {
          reportId: 'CF-2024-Q4',
          journalIds: ['JE-004', 'JE-005'],
          sourceRefs: ['CASH-001'],
        },
        disclosure: 'MFRS 7',
        sparkline: [580000, 620000, 650000, 670000, 680000],
        category: 'cash',
        priority: 'critical',
        collapsible: true,
        pinned: true,
      },
      {
        id: 'debt-equity-ratio',
        title: 'Debt-to-Equity Ratio',
        value: '0.45',
        raw: 0.45,
        delta: { pct: -5.2, direction: 'down' },
        lineage: {
          reportId: 'BS-2024-Q4',
          journalIds: ['JE-006'],
          sourceRefs: ['DEBT-001'],
        },
        disclosure: 'MFRS 7',
        sparkline: [0.52, 0.5, 0.48, 0.46, 0.45],
        category: 'ratios',
        priority: 'medium',
        collapsible: true,
      },
    ],
    [],
  );

  const mockCloseReadiness: CloseReadiness = useMemo(
    () => ({
      periodId: '2024-Q4',
      journalsApproved: 45,
      totalJournals: 52,
      lateAdjustments: 3,
      periodLocked: false,
      owner: 'Sarah Chen',
      lastUpdated: new Date(),
      bottlenecks: [
        {
          type: 'journal',
          description: 'JE-048: FX Revaluation pending approval',
          urgency: 'high',
        },
        {
          type: 'reconciliation',
          description: 'Bank reconciliation for USD account',
          urgency: 'medium',
        },
      ],
    }),
    [],
  );

  const mockCashForecast: CashForecast = useMemo(
    () => ({
      period: 'Q1 2025',
      cashRunway: 45,
      riskLevel: 'medium',
      scenarios: [
        { name: 'Optimistic', cashRunway: 65, probability: 0.3 },
        { name: 'Base Case', cashRunway: 45, probability: 0.5 },
        { name: 'Pessimistic', cashRunway: 25, probability: 0.2 },
      ],
      whatIf: {
        slowReceipts: 5,
        pushPayables: -3,
      },
    }),
    [],
  );

  const mockVarianceStoryline: VarianceStoryline = useMemo(
    () => ({
      metricId: 'revenue',
      change: 12.5,
      drivers: [
        {
          type: 'volume',
          impact: 8.2,
          description: 'New product line launch',
          owner: 'Marketing Team',
        },
        {
          type: 'price',
          impact: 3.1,
          description: 'Price increase on premium products',
          owner: 'Sales Team',
        },
        {
          type: 'fx',
          impact: 1.2,
          description: 'USD appreciation vs MYR',
          owner: 'Treasury',
        },
      ],
      attachments: [
        {
          type: 'document',
          name: 'Q4 Sales Analysis.pdf',
          url: '/docs/q4-sales-analysis.pdf',
        },
        {
          type: 'note',
          name: 'CEO Comments',
          url: '/notes/ceo-q4-comments',
        },
      ],
    }),
    [],
  );

  useEffect(() => {
    const loadDashboardData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(undefined);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Set default selected companies
        if (companies.length > 0 && selectedCompanies.length === 0) {
          setSelectedCompanies(companies.map((c) => c.id));
        }
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [tenantId, period, companies, selectedCompanies.length]);

  const handleCompanyToggle = useCallback((companyId: CompanyId) => {
    setSelectedCompanies((previous) =>
      previous.includes(companyId)
        ? previous.filter((id) => id !== companyId)
        : [...previous, companyId],
    );
  }, []);

  const handleEliminationsToggle = useCallback(
    (enabled: boolean) => {
      setEliminationsEnabled(enabled);
      onToggleEliminations?.(enabled);
    },
    [onToggleEliminations],
  );

  const handleKPICollapse = useCallback((kpiId: MetricId) => {
    setCollapsedKPIs((previous) => {
      const newSet = new Set(previous);
      if (newSet.has(kpiId)) {
        newSet.delete(kpiId);
      } else {
        newSet.add(kpiId);
      }
      return newSet;
    });
  }, []);

  const handleKPIPin = useCallback((kpiId: MetricId) => {
    setPinnedKPIs((previous) => {
      const newSet = new Set(previous);
      if (newSet.has(kpiId)) {
        newSet.delete(kpiId);
      } else {
        newSet.add(kpiId);
      }
      return newSet;
    });
  }, []);

  const handleExportBoardPack = useCallback(() => {
    onExportBoardPack?.({
      companyIds: selectedCompanies,
      period: period,
    });
  }, [onExportBoardPack, selectedCompanies, period]);

  const _formatCurrency = (value: number, currency: string = 'MYR'): string => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getPriorityColor = (priority: KPI['priority']): string => {
    switch (priority) {
      case 'critical':
        return tokens.colors.error[500];
      case 'high':
        return tokens.colors.warning[500];
      case 'medium':
        return tokens.colors.primary[500];
      case 'low':
        return tokens.colors.neutral[500];
      default:
        return tokens.colors.neutral[500];
    }
  };

  const getRiskColor = (riskLevel: CashForecast['riskLevel']): string => {
    switch (riskLevel) {
      case 'low':
        return tokens.colors.success[500];
      case 'medium':
        return tokens.colors.warning[500];
      case 'high':
        return tokens.colors.error[500];
      case 'critical':
        return tokens.colors.error[700];
      default:
        return tokens.colors.neutral[500];
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="large" text="Loading Outstanding CFO Dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="rounded-lg bg-semantic-error/10 p-4 text-semantic-error">
          <h3 className="text-lg font-semibold">Dashboard Error</h3>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 ${className}`}
      style={{ fontFamily: tokens.typography.fontFamily.sans.join(', ') }}
    >
      {/* Header with Multi-Company Lens */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
            Outstanding CFO Dashboard
          </h1>
          <p className="text-semantic-muted-foreground">Multi-Company Financial Command Center - {period}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Company Selector */}
          <div className="flex flex-wrap gap-2">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanyToggle(company.id)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  selectedCompanies.includes(company.id)
                    ? 'border border-semantic-primary bg-semantic-primary text-semantic-primary-foreground'
                    : INACTIVE_BUTTON_STYLES
                }`}
              >
                {company.code}
              </button>
            ))}
          </div>

          {/* Consolidation Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConsolidatedView(!consolidatedView)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                consolidatedView
                  ? 'border border-semantic-success bg-semantic-success text-semantic-success-foreground'
                  : INACTIVE_BUTTON_STYLES
              }`}
            >
              {consolidatedView ? 'Consolidated' : 'Entity View'}
            </button>
            {consolidatedView && (
              <button
                onClick={() => handleEliminationsToggle(!eliminationsEnabled)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  eliminationsEnabled
                    ? 'border border-semantic-info bg-semantic-info text-semantic-info-foreground'
                    : INACTIVE_BUTTON_STYLES
                }`}
              >
                {eliminationsEnabled ? 'Eliminations ON' : 'Eliminations OFF'}
              </button>
            )}
          </div>

          {/* Board Pack Export */}
          <button
            onClick={handleExportBoardPack}
            className="rounded-lg bg-semantic-primary px-4 py-2 font-medium text-semantic-primary-foreground transition-colors hover:bg-semantic-primary/90"
          >
            📊 Export Board Pack
          </button>
        </div>
      </div>

      {/* Close Readiness Meter */}
      <Card className="border-l-4" style={{ borderLeftColor: tokens.colors.primary[500] }}>
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: tokens.colors.neutral[900] }}>
              Close Readiness Meter - {mockCloseReadiness.periodId}
            </h3>
            <Badge
              className={`${
                mockCloseReadiness.periodLocked
                  ? 'border-semantic-success bg-semantic-success text-semantic-success-foreground'
                  : 'border-semantic-warning bg-semantic-warning text-semantic-warning-foreground'
              }`}
            >
              {mockCloseReadiness.periodLocked ? '🔒 Locked' : '⏳ In Progress'}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: tokens.colors.primary[600] }}>
                {Math.round((mockCloseReadiness.journalsApproved / mockCloseReadiness.totalJournals) * 100)}%
              </div>
              <div className="text-sm text-semantic-muted-foreground">Journals Approved</div>
              <div className="text-xs text-semantic-muted-foreground">
                {mockCloseReadiness.journalsApproved}/{mockCloseReadiness.totalJournals}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: tokens.colors.error[600] }}>
                {mockCloseReadiness.lateAdjustments}
              </div>
              <div className="text-sm text-semantic-muted-foreground">Late Adjustments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: tokens.colors.neutral[600] }}>
                {mockCloseReadiness.owner}
              </div>
              <div className="text-sm text-semantic-muted-foreground">Period Owner</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: tokens.colors.warning[600] }}>
                {mockCloseReadiness.bottlenecks.length}
              </div>
              <div className="text-sm text-semantic-muted-foreground">Bottlenecks</div>
            </div>
          </div>
          {mockCloseReadiness.bottlenecks.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 font-medium" style={{ color: tokens.colors.neutral[700] }}>
                Active Bottlenecks:
              </h4>
              <div className="space-y-2">
                {mockCloseReadiness.bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="flex items-center justify-between rounded bg-semantic-muted p-2">
                    <span className="text-sm">{bottleneck.description}</span>
                    <Badge
                      className={`${
                        bottleneck.urgency === 'critical'
                          ? 'bg-semantic-error text-semantic-error-foreground'
                          : bottleneck.urgency === 'high'
                            ? 'bg-semantic-warning text-semantic-warning-foreground'
                            : 'bg-semantic-warning text-semantic-warning-foreground'
                      }`}
                    >
                      {bottleneck.urgency}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockKPIs
          .sort((a, b) => {
            // Sort pinned first, then by priority
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            const priorityOrder: Record<KPI['priority'], number> = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })
          .map((kpi) => (
            <Card
              key={kpi.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                collapsedKPIs.has(kpi.id) ? 'opacity-75' : ''
              }`}
              onClick={() => onOpenDrill?.({ metricId: kpi.id, companyId: selectedCompanies[0] || '' })}
            >
              <div className="p-6">
                {/* KPI Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: getPriorityColor(kpi.priority) }}
                    />
                    <h3 className="text-sm font-medium" style={{ color: tokens.colors.neutral[700] }}>
                      {kpi.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {kpi.pinned && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleKPIPin(kpi.id);
                        }}
                        className="text-semantic-warning hover:text-semantic-warning/80"
                      >
                        📌
                      </button>
                    )}
                    {kpi.collapsible && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleKPICollapse(kpi.id);
                        }}
                        className="text-semantic-muted-foreground hover:text-semantic-muted-foreground/80"
                      >
                        {collapsedKPIs.has(kpi.id) ? '📖' : '📕'}
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Value */}
                <div className="mb-3">
                  <div className="text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
                    {kpi.value}
                  </div>
                  {kpi.delta && (
                    <div
                      className={`text-sm ${
                        kpi.delta.direction === 'up'
                          ? 'text-semantic-success'
                          : kpi.delta.direction === 'down'
                            ? 'text-semantic-error'
                            : 'text-semantic-muted-foreground'
                      }`}
                    >
                      {formatPercentage(kpi.delta.pct)} vs prev period
                    </div>
                  )}
                </div>

                {/* Sparkline */}
                {!collapsedKPIs.has(kpi.id) && kpi.sparkline && (
                  <div className="mb-3">
                    <div className="flex h-8 w-full items-end justify-between rounded bg-semantic-muted px-1">
                      {kpi.sparkline.map((value: number, index: number) => {
                        const max = Math.max(...kpi.sparkline!);
                        const height = (value / max) * 100;
                        return (
                          <div
                            key={index}
                            className="rounded-t bg-semantic-primary"
                            style={{
                              width: `${100 / kpi.sparkline!.length}%`,
                              height: `${height}%`,
                              minHeight: '2px',
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Disclosure */}
                {!collapsedKPIs.has(kpi.id) && kpi.disclosure && (
                  <div className="text-xs text-semantic-muted-foreground">Disclosure: {kpi.disclosure}</div>
                )}

                {/* Variance Storyline Button */}
                {kpi.delta && Math.abs(kpi.delta.pct) > 5 && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onVarianceClick?.(kpi.id);
                    }}
                    className="mt-2 text-xs text-semantic-primary underline hover:text-semantic-primary/80"
                  >
                    Why changed? →
                  </button>
                )}
              </div>
            </Card>
          ))}
      </div>

      {/* 13-Week Cash Early-Warning Radar */}
      <Card
        className="border-l-4"
        style={{ borderLeftColor: getRiskColor(mockCashForecast.riskLevel) }}
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: tokens.colors.neutral[900] }}>
              13-Week Cash Early-Warning Radar
            </h3>
            <Badge
              className={`${
                mockCashForecast.riskLevel === 'low'
                  ? 'border-semantic-success bg-semantic-success text-semantic-success-foreground'
                  : mockCashForecast.riskLevel === 'medium'
                    ? 'border-semantic-warning bg-semantic-warning text-semantic-warning-foreground'
                    : mockCashForecast.riskLevel === 'high'
                      ? 'border-semantic-warning bg-semantic-warning text-semantic-warning-foreground'
                      : 'border-semantic-error bg-semantic-error text-semantic-error-foreground'
              }`}
            >
              {mockCashForecast.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Cash Runway */}
            <div className="text-center">
              <div
                className="text-4xl font-bold"
                style={{ color: getRiskColor(mockCashForecast.riskLevel) }}
              >
                {mockCashForecast.cashRunway}
              </div>
              <div className="text-sm text-semantic-muted-foreground">Days Cash Runway</div>
              <div className="text-xs text-semantic-muted-foreground">Base Case Scenario</div>
            </div>

            {/* Scenarios */}
            <div>
              <h4 className="mb-3 font-medium" style={{ color: tokens.colors.neutral[700] }}>
                Scenario Analysis
              </h4>
              <div className="space-y-2">
                {mockCashForecast.scenarios.map((scenario, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{scenario.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{scenario.cashRunway}d</span>
                      <div className="h-2 w-16 rounded-full bg-semantic-muted">
                        <div
                          className="h-2 rounded-full bg-semantic-primary"
                          style={{ width: `${scenario.probability * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What-If Controls */}
            <div>
              <h4 className="mb-3 font-medium" style={{ color: tokens.colors.neutral[700] }}>
                What-If Analysis
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Slow Receipts (+days)</span>
                  <input
                    type="number"
                    value={mockCashForecast.whatIf.slowReceipts}
                    className="w-16 rounded border border-semantic-border px-2 py-1 text-sm"
                    readOnly
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Push Payables (-days)</span>
                  <input
                    type="number"
                    value={mockCashForecast.whatIf.pushPayables}
                    className="w-16 rounded border border-semantic-border px-2 py-1 text-sm"
                    readOnly
                  />
                </div>
                <button className="w-full rounded bg-semantic-primary px-3 py-1 text-sm text-semantic-primary-foreground hover:bg-semantic-primary/90">
                  Recalculate
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Variance Storyline Modal Placeholder */}
      {mockVarianceStoryline && (
        <Card>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold" style={{ color: tokens.colors.neutral[900] }}>
              Variance Storyline: Revenue Change +12.5%
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Drivers */}
              <div>
                <h4 className="mb-3 font-medium" style={{ color: tokens.colors.neutral[700] }}>
                  Change Drivers
                </h4>
                <div className="space-y-3">
                  {mockVarianceStoryline.drivers.map((driver, index) => (
                    <div key={index} className="flex items-center justify-between rounded bg-semantic-muted p-3">
                      <div>
                        <div className="text-sm font-medium">{driver.type.toUpperCase()}</div>
                        <div className="text-xs text-semantic-muted-foreground">{driver.description}</div>
                        <div className="text-xs text-semantic-muted-foreground">Owner: {driver.owner}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">+{driver.impact}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <h4 className="mb-3 font-medium" style={{ color: tokens.colors.neutral[700] }}>
                  Supporting Documents
                </h4>
                <div className="space-y-2">
                  {mockVarianceStoryline.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 rounded bg-semantic-muted p-2">
                      <span className="text-sm">📄</span>
                      <span className="text-sm">{attachment.name}</span>
                      <button className="text-xs text-semantic-primary hover:text-semantic-primary/80">
                        View →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
});

/**
 * Hook for Outstanding CFO Dashboard data management
 */
export function useOutstandingCFODashboard(
  tenantId: string,
  _period: Period = 'monthly',
): {
  data: {
    kpis: KPI[];
    closeReadiness: CloseReadiness;
    cashForecast: CashForecast;
    varianceStoryline: VarianceStoryline;
  };
  isLoading: boolean;
  error: string | undefined;
  refreshData: () => Promise<void>;
} {
  const [data, _setData] = useState<{
    kpis: KPI[];
    closeReadiness: CloseReadiness;
    cashForecast: CashForecast;
    varianceStoryline: VarianceStoryline;
  }>({
    kpis: [],
    closeReadiness: {} as CloseReadiness,
    cashForecast: {} as CashForecast,
    varianceStoryline: {} as VarianceStoryline,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const refreshData = async (): Promise<void> => {
    setIsLoading(true);
    setError(undefined);

    try {
      // In production, this would make API calls to your BFF
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
