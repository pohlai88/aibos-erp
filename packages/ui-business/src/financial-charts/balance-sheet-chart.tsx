import React, { memo, useMemo } from 'react';
import { Card, tokens } from '@aibos/ui';
import type { ElementType } from 'react';

export interface BalanceSheetChartProps {
  data: {
    period: string;
    assets: {
      currentAssets: number;
      fixedAssets: number;
      totalAssets: number;
    };
    liabilities: {
      currentLiabilities: number;
      longTermDebt: number;
      totalLiabilities: number;
    };
    equity: {
      retainedEarnings: number;
      shareCapital: number;
      totalEquity: number;
    };
  }[];
  period: string;
  companyId?: string;
  className?: string;
  as?: ElementType;
  onDrillDown?: (account: string, period: string) => void;
}

export const BalanceSheetChart = memo(function BalanceSheetChart({
  data,
  period,
  companyId,
  className,
  as: Component = 'div',
  onDrillDown,
}: BalanceSheetChartProps): JSX.Element {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const latestData = data[data.length - 1];
    const previousData = data.length > 1 ? data[data.length - 2] : null;
    
    return {
      current: latestData,
      previous: previousData,
      trends: data.map(d => ({
        period: d.period,
        totalAssets: d.assets.totalAssets,
        totalLiabilities: d.liabilities.totalLiabilities,
        totalEquity: d.equity.totalEquity,
      })),
    };
  }, [data]);

  if (!chartData) {
    return (
      <Component className={className}>
        <Card className="p-6">
          <div className="text-center text-semantic-muted-foreground">
            No Balance Sheet data available for {period}
          </div>
        </Card>
      </Component>
    );
  }

  const { current, previous, trends } = chartData;

  if (!current) {
    return (
      <Component className={className}>
        <Card className="p-6">
          <div className="text-center text-semantic-muted-foreground">
            No current data available for {period}
          </div>
        </Card>
      </Component>
    );
  }

  const calculateChange = (current: number, previous: number | null): { value: number; percentage: number; direction: 'up' | 'down' | 'neutral' } => {
    if (!previous) return { value: 0, percentage: 0, direction: 'neutral' };
    const change = current - previous;
    const percentage = (change / previous) * 100;
    return {
      value: change,
      percentage: Math.abs(percentage),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    };
  };

  const assetsChange = calculateChange(current.assets.totalAssets, previous?.assets?.totalAssets ?? null);
  const liabilitiesChange = calculateChange(current.liabilities.totalLiabilities, previous?.liabilities?.totalLiabilities ?? null);
  const equityChange = calculateChange(current.equity.totalEquity, previous?.equity?.totalEquity ?? null);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const debtToEquityRatio = current.liabilities.totalLiabilities / current.equity.totalEquity;
  const currentRatio = current.assets.currentAssets / current.liabilities.currentLiabilities;

  return (
    <Component className={className}>
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold" style={{ color: tokens.colors.neutral[900] }}>
            Balance Sheet
          </h3>
          <p className="text-sm text-semantic-muted-foreground">
            {period} • {companyId ? `Company: ${companyId}` : 'Consolidated'}
          </p>
        </div>

        {/* Key Ratios */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-semantic-border p-4">
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Debt-to-Equity Ratio</div>
            <div className="mb-1 text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
              {debtToEquityRatio.toFixed(2)}
            </div>
            <div className={`text-sm ${
              debtToEquityRatio < 0.5 
                ? 'text-semantic-success' 
                : debtToEquityRatio < 1.0 
                  ? 'text-semantic-warning' 
                  : 'text-semantic-error'
            }`}>
              {debtToEquityRatio < 0.5 ? 'Low Risk' : debtToEquityRatio < 1.0 ? 'Moderate Risk' : 'High Risk'}
            </div>
          </div>

          <div className="rounded-lg border border-semantic-border p-4">
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Current Ratio</div>
            <div className="mb-1 text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
              {currentRatio.toFixed(2)}
            </div>
            <div className={`text-sm ${
              currentRatio > 2.0 
                ? 'text-semantic-success' 
                : currentRatio > 1.0 
                  ? 'text-semantic-warning' 
                  : 'text-semantic-error'
            }`}>
              {currentRatio > 2.0 ? 'Strong Liquidity' : currentRatio > 1.0 ? 'Adequate' : 'Weak Liquidity'}
            </div>
          </div>

          <div className="rounded-lg border border-semantic-border p-4">
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Equity Ratio</div>
            <div className="mb-1 text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
              {((current.equity.totalEquity / current.assets.totalAssets) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-semantic-muted-foreground">
              Equity as % of Assets
            </div>
          </div>
        </div>

        {/* Assets vs Liabilities vs Equity */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Assets */}
          <div className="rounded-lg border border-semantic-border p-4">
            <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
              Assets
            </h4>
            <div className="space-y-3">
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('current-assets', period)}
              >
                <span className="text-sm">Current Assets</span>
                <span className="font-medium">{formatCurrency(current.assets.currentAssets)}</span>
              </div>
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('fixed-assets', period)}
              >
                <span className="text-sm">Fixed Assets</span>
                <span className="font-medium">{formatCurrency(current.assets.fixedAssets)}</span>
              </div>
              <div className="border-t border-semantic-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Assets</span>
                  <span className="text-lg font-semibold" style={{ color: tokens.colors.neutral[900] }}>
                    {formatCurrency(current.assets.totalAssets)}
                  </span>
                </div>
                {previous && (
                  <div className={`mt-1 text-sm ${
                    assetsChange.direction === 'up' 
                      ? 'text-semantic-success' 
                      : assetsChange.direction === 'down' 
                        ? 'text-semantic-error' 
                        : 'text-semantic-muted-foreground'
                  }`}>
                    {formatPercentage(assetsChange.percentage)} vs prev period
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Liabilities */}
          <div className="rounded-lg border border-semantic-border p-4">
            <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
              Liabilities
            </h4>
            <div className="space-y-3">
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('current-liabilities', period)}
              >
                <span className="text-sm">Current Liabilities</span>
                <span className="font-medium">{formatCurrency(current.liabilities.currentLiabilities)}</span>
              </div>
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('long-term-debt', period)}
              >
                <span className="text-sm">Long-term Debt</span>
                <span className="font-medium">{formatCurrency(current.liabilities.longTermDebt)}</span>
              </div>
              <div className="border-t border-semantic-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Liabilities</span>
                  <span className="text-lg font-semibold" style={{ color: tokens.colors.neutral[900] }}>
                    {formatCurrency(current.liabilities.totalLiabilities)}
                  </span>
                </div>
                {previous && (
                  <div className={`mt-1 text-sm ${
                    liabilitiesChange.direction === 'up' 
                      ? 'text-semantic-error' 
                      : liabilitiesChange.direction === 'down' 
                        ? 'text-semantic-success' 
                        : 'text-semantic-muted-foreground'
                  }`}>
                    {formatPercentage(liabilitiesChange.percentage)} vs prev period
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Equity */}
          <div className="rounded-lg border border-semantic-border p-4">
            <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
              Equity
            </h4>
            <div className="space-y-3">
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('share-capital', period)}
              >
                <span className="text-sm">Share Capital</span>
                <span className="font-medium">{formatCurrency(current.equity.shareCapital)}</span>
              </div>
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('retained-earnings', period)}
              >
                <span className="text-sm">Retained Earnings</span>
                <span className="font-medium">{formatCurrency(current.equity.retainedEarnings)}</span>
              </div>
              <div className="border-t border-semantic-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Equity</span>
                  <span className="text-lg font-semibold" style={{ color: tokens.colors.neutral[900] }}>
                    {formatCurrency(current.equity.totalEquity)}
                  </span>
                </div>
                {previous && (
                  <div className={`mt-1 text-sm ${
                    equityChange.direction === 'up' 
                      ? 'text-semantic-success' 
                      : equityChange.direction === 'down' 
                        ? 'text-semantic-error' 
                        : 'text-semantic-muted-foreground'
                  }`}>
                    {formatPercentage(equityChange.percentage)} vs prev period
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trend Visualization */}
        <div className="rounded-lg border border-semantic-border p-4">
          <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
            Balance Sheet Trends
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Assets Trend */}
            <div>
              <div className="mb-3 text-sm font-medium text-semantic-muted-foreground">Assets Trend</div>
              <div className="flex h-16 items-end justify-between gap-1">
                {trends.map((trend, index) => {
                  const maxValue = Math.max(...trends.map(t => t.totalAssets));
                  const height = (trend.totalAssets / maxValue) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 rounded-t bg-semantic-primary transition-all duration-300 hover:bg-semantic-primary/80"
                      style={{
                        height: `${height}%`,
                        minHeight: '4px',
                      }}
                      title={`${trend.period}: ${formatCurrency(trend.totalAssets)}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Liabilities Trend */}
            <div>
              <div className="mb-3 text-sm font-medium text-semantic-muted-foreground">Liabilities Trend</div>
              <div className="flex h-16 items-end justify-between gap-1">
                {trends.map((trend, index) => {
                  const maxValue = Math.max(...trends.map(t => t.totalLiabilities));
                  const height = (trend.totalLiabilities / maxValue) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 rounded-t bg-semantic-warning transition-all duration-300 hover:bg-semantic-warning/80"
                      style={{
                        height: `${height}%`,
                        minHeight: '4px',
                      }}
                      title={`${trend.period}: ${formatCurrency(trend.totalLiabilities)}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Equity Trend */}
            <div>
              <div className="mb-3 text-sm font-medium text-semantic-muted-foreground">Equity Trend</div>
              <div className="flex h-16 items-end justify-between gap-1">
                {trends.map((trend, index) => {
                  const maxValue = Math.max(...trends.map(t => t.totalEquity));
                  const height = (trend.totalEquity / maxValue) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 rounded-t bg-semantic-success transition-all duration-300 hover:bg-semantic-success/80"
                      style={{
                        height: `${height}%`,
                        minHeight: '4px',
                      }}
                      title={`${trend.period}: ${formatCurrency(trend.totalEquity)}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-semantic-muted-foreground">
            {trends.map(t => t.period).join(' → ')}
          </div>
        </div>
      </Card>
    </Component>
  );
});
