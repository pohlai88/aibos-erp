import React, { memo, useMemo } from 'react';
import { Card, tokens } from '@aibos/ui';
import type { ElementType } from 'react';
import { formatCurrency, formatPercentage } from '../utils';

export interface ProfitLossChartProps {
  data: {
    period: string;
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    netIncome: number;
  }[];
  period: string;
  companyId?: string;
  className?: string;
  as?: ElementType;
  onDrillDown?: (account: string, period: string) => void;
}

export const ProfitLossChart = memo(function ProfitLossChart({
  data,
  period,
  companyId,
  className,
  as: Component = 'div',
  onDrillDown,
}: ProfitLossChartProps): JSX.Element {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const latestData = data[data.length - 1];
    const previousData = data.length > 1 ? data[data.length - 2] : null;
    
    return {
      current: latestData,
      previous: previousData,
      trends: data.map(d => ({
        period: d.period,
        revenue: d.revenue,
        grossProfit: d.grossProfit,
        operatingIncome: d.operatingIncome,
        netIncome: d.netIncome,
      })),
    };
  }, [data]);

  if (!chartData) {
    return (
      <Component className={className}>
        <Card className="p-6">
          <div className="text-center text-semantic-muted-foreground">
            No P&L data available for {period}
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

  const revenueChange = calculateChange(current.revenue, previous?.revenue ?? null);
  const grossProfitChange = calculateChange(current.grossProfit, previous?.grossProfit ?? null);
  const operatingIncomeChange = calculateChange(current.operatingIncome, previous?.operatingIncome ?? null);
  const netIncomeChange = calculateChange(current.netIncome, previous?.netIncome ?? null);


  return (
    <Component className={className}>
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold" style={{ color: tokens.colors.neutral[900] }}>
            Profit & Loss Statement
          </h3>
          <p className="text-sm text-semantic-muted-foreground">
            {period} • {companyId ? `Company: ${companyId}` : 'Consolidated'}
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Revenue */}
          <div 
            className="cursor-pointer rounded-lg border border-semantic-border p-4 transition-colors hover:bg-semantic-muted/50"
            onClick={() => onDrillDown?.('revenue', period)}
          >
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Revenue</div>
            <div className="mb-1 text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
              {formatCurrency(current.revenue)}
            </div>
            {previous && (
              <div className={`text-sm ${
                revenueChange.direction === 'up' 
                  ? 'text-semantic-success' 
                  : revenueChange.direction === 'down' 
                    ? 'text-semantic-error' 
                    : 'text-semantic-muted-foreground'
              }`}>
                {formatPercentage(revenueChange.percentage)} vs prev period
              </div>
            )}
          </div>

          {/* Gross Profit */}
          <div 
            className="cursor-pointer rounded-lg border border-semantic-border p-4 transition-colors hover:bg-semantic-muted/50"
            onClick={() => onDrillDown?.('gross-profit', period)}
          >
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Gross Profit</div>
            <div className="mb-1 text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
              {formatCurrency(current.grossProfit)}
            </div>
            <div className="mb-1 text-sm text-semantic-muted-foreground">
              Margin: {formatPercentage((current.grossProfit / current.revenue) * 100)}
            </div>
            {previous && (
              <div className={`text-sm ${
                grossProfitChange.direction === 'up' 
                  ? 'text-semantic-success' 
                  : grossProfitChange.direction === 'down' 
                    ? 'text-semantic-error' 
                    : 'text-semantic-muted-foreground'
              }`}>
                {formatPercentage(grossProfitChange.percentage)} vs prev period
              </div>
            )}
          </div>

          {/* Operating Income */}
          <div 
            className="cursor-pointer rounded-lg border border-semantic-border p-4 transition-colors hover:bg-semantic-muted/50"
            onClick={() => onDrillDown?.('operating-income', period)}
          >
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Operating Income</div>
            <div className="mb-1 text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
              {formatCurrency(current.operatingIncome)}
            </div>
            <div className="mb-1 text-sm text-semantic-muted-foreground">
              Margin: {formatPercentage((current.operatingIncome / current.revenue) * 100)}
            </div>
            {previous && (
              <div className={`text-sm ${
                operatingIncomeChange.direction === 'up' 
                  ? 'text-semantic-success' 
                  : operatingIncomeChange.direction === 'down' 
                    ? 'text-semantic-error' 
                    : 'text-semantic-muted-foreground'
              }`}>
                {formatPercentage(operatingIncomeChange.percentage)} vs prev period
              </div>
            )}
          </div>

          {/* Net Income */}
          <div 
            className="cursor-pointer rounded-lg border border-semantic-border p-4 transition-colors hover:bg-semantic-muted/50"
            onClick={() => onDrillDown?.('net-income', period)}
          >
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Net Income</div>
            <div className="mb-1 text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
              {formatCurrency(current.netIncome)}
            </div>
            <div className="mb-1 text-sm text-semantic-muted-foreground">
              Margin: {formatPercentage((current.netIncome / current.revenue) * 100)}
            </div>
            {previous && (
              <div className={`text-sm ${
                netIncomeChange.direction === 'up' 
                  ? 'text-semantic-success' 
                  : netIncomeChange.direction === 'down' 
                    ? 'text-semantic-error' 
                    : 'text-semantic-muted-foreground'
              }`}>
                {formatPercentage(netIncomeChange.percentage)} vs prev period
              </div>
            )}
          </div>
        </div>

        {/* Trend Visualization */}
        <div className="mb-6">
          <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
            Trend Analysis
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Revenue Trend */}
            <div className="rounded-lg border border-semantic-border p-4">
              <div className="mb-3 text-sm font-medium text-semantic-muted-foreground">Revenue Trend</div>
              <div className="flex h-20 items-end justify-between gap-1">
                {trends.map((trend, index) => {
                  const maxRevenue = Math.max(...trends.map(t => t.revenue));
                  const height = (trend.revenue / maxRevenue) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 rounded-t bg-semantic-primary transition-all duration-300 hover:bg-semantic-primary/80"
                      style={{
                        height: `${height}%`,
                        minHeight: '4px',
                      }}
                      title={`${trend.period}: ${formatCurrency(trend.revenue)}`}
                    />
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-semantic-muted-foreground">
                {trends.map(t => t.period).join(' → ')}
              </div>
            </div>

            {/* Profitability Trend */}
            <div className="rounded-lg border border-semantic-border p-4">
              <div className="mb-3 text-sm font-medium text-semantic-muted-foreground">Profitability Trend</div>
              <div className="flex h-20 items-end justify-between gap-1">
                {trends.map((trend, index) => {
                  const maxProfit = Math.max(...trends.map(t => t.netIncome));
                  const height = (trend.netIncome / maxProfit) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 rounded-t bg-semantic-success transition-all duration-300 hover:bg-semantic-success/80"
                      style={{
                        height: `${height}%`,
                        minHeight: '4px',
                      }}
                      title={`${trend.period}: ${formatCurrency(trend.netIncome)}`}
                    />
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-semantic-muted-foreground">
                {trends.map(t => t.period).join(' → ')}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="rounded-lg border border-semantic-border p-4">
          <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
            Detailed Breakdown
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Revenue</span>
              <span className="font-medium">{formatCurrency(current.revenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-semantic-muted-foreground">- Cost of Goods Sold</span>
              <span className="text-sm">{formatCurrency(current.costOfGoodsSold)}</span>
            </div>
            <div className="border-t border-semantic-border pt-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Gross Profit</span>
                <span className="font-medium">{formatCurrency(current.grossProfit)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-semantic-muted-foreground">- Operating Expenses</span>
              <span className="text-sm">{formatCurrency(current.operatingExpenses)}</span>
            </div>
            <div className="border-t border-semantic-border pt-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Operating Income</span>
                <span className="font-medium">{formatCurrency(current.operatingIncome)}</span>
              </div>
            </div>
            <div className="border-t border-semantic-border pt-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Net Income</span>
                <span className="text-lg font-semibold" style={{ color: tokens.colors.neutral[900] }}>
                  {formatCurrency(current.netIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Component>
  );
});
