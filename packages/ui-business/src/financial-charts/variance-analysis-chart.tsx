import React, { memo, useMemo } from 'react';
import { Card, tokens } from '@aibos/ui';
import type { ElementType } from 'react';

export interface VarianceAnalysisChartProps {
  data: {
    period: string;
    budget: number;
    actual: number;
    variance: number;
    variancePercentage: number;
  }[];
  metric: string;
  period: string;
  companyId?: string;
  className?: string;
  as?: ElementType;
  onDrillDown?: (metric: string, period: string) => void;
}

export const VarianceAnalysisChart = memo(function VarianceAnalysisChart({
  data,
  metric,
  period,
  companyId,
  className,
  as: Component = 'div',
  onDrillDown,
}: VarianceAnalysisChartProps): JSX.Element {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const latestData = data[data.length - 1];
    const previousData = data.length > 1 ? data[data.length - 2] : null;
    
    return {
      current: latestData,
      previous: previousData,
      trends: data.map(d => ({
        period: d.period,
        budget: d.budget,
        actual: d.actual,
        variance: d.variance,
        variancePercentage: d.variancePercentage,
      })),
    };
  }, [data]);

  if (!chartData) {
    return (
      <Component className={className}>
        <Card className="p-6">
          <div className="text-center text-semantic-muted-foreground">
            No variance data available for {metric} in {period}
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
            No current data available for {metric} in {period}
          </div>
        </Card>
      </Component>
    );
  }

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

  const getVarianceStatus = (variancePercentage: number): { status: string; color: string; description: string } => {
    const absVariance = Math.abs(variancePercentage);
    
    if (absVariance <= 5) {
      return {
        status: 'On Target',
        color: tokens.colors.success[500],
        description: 'Within acceptable variance range'
      };
    } else if (absVariance <= 15) {
      return {
        status: 'Minor Variance',
        color: tokens.colors.warning[500],
        description: 'Moderate variance requiring attention'
      };
    } else {
      return {
        status: 'Significant Variance',
        color: tokens.colors.error[500],
        description: 'Large variance requiring immediate action'
      };
    }
  };

  const varianceStatus = getVarianceStatus(current.variancePercentage);

  const calculateVarianceTrend = (): { direction: 'improving' | 'worsening' | 'stable'; percentage: number } => {
    if (!previous) return { direction: 'stable', percentage: 0 };
    
    const currentAbs = Math.abs(current.variancePercentage);
    const previousAbs = Math.abs(previous.variancePercentage);
    const change = currentAbs - previousAbs;
    
    return {
      direction: change < -2 ? 'improving' : change > 2 ? 'worsening' : 'stable',
      percentage: Math.abs(change),
    };
  };

  const varianceTrend = calculateVarianceTrend();

  return (
    <Component className={className}>
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold" style={{ color: tokens.colors.neutral[900] }}>
            Variance Analysis: {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </h3>
          <p className="text-sm text-semantic-muted-foreground">
            {period} • {companyId ? `Company: ${companyId}` : 'Consolidated'}
          </p>
        </div>

        {/* Variance Status */}
        <div className="mb-8 rounded-lg border border-semantic-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
                Variance Status
              </h4>
              <p className="text-sm text-semantic-muted-foreground">{varianceStatus.description}</p>
            </div>
            <div className="text-right">
              <div 
                className="text-2xl font-bold"
                style={{ color: varianceStatus.color }}
              >
                {varianceStatus.status}
              </div>
              <div className="text-sm text-semantic-muted-foreground">
                {formatPercentage(current.variancePercentage)} variance
              </div>
            </div>
          </div>
        </div>

        {/* Budget vs Actual */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-semantic-border p-4">
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Budget</div>
            <div className="text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
              {formatCurrency(current.budget)}
            </div>
          </div>
          <div className="rounded-lg border border-semantic-border p-4">
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Actual</div>
            <div className="text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
              {formatCurrency(current.actual)}
            </div>
          </div>
          <div className="rounded-lg border border-semantic-border p-4">
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Variance</div>
            <div 
              className="text-2xl font-bold"
              style={{ 
                color: current.variance >= 0 
                  ? tokens.colors.success[600] 
                  : tokens.colors.error[600] 
              }}
            >
              {formatCurrency(current.variance)}
            </div>
            <div className="text-sm text-semantic-muted-foreground">
              {formatPercentage(current.variancePercentage)}
            </div>
          </div>
        </div>

        {/* Variance Trend */}
        <div className="mb-8 rounded-lg border border-semantic-border p-4">
          <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
            Variance Trend Analysis
          </h4>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Budget vs Actual Trend */}
            <div>
              <div className="mb-3 text-sm font-medium text-semantic-muted-foreground">Budget vs Actual Trend</div>
              <div className="flex h-20 items-end justify-between gap-1">
                {trends.map((trend, index) => {
                  const maxValue = Math.max(...trends.map(t => Math.max(t.budget, t.actual)));
                  const budgetHeight = (trend.budget / maxValue) * 100;
                  const actualHeight = (trend.actual / maxValue) * 100;
                  
                  return (
                    <div key={index} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-semantic-primary transition-all duration-300 hover:bg-semantic-primary/80"
                        style={{
                          height: `${budgetHeight}%`,
                          minHeight: '4px',
                        }}
                        title={`${trend.period} Budget: ${formatCurrency(trend.budget)}`}
                      />
                      <div
                        className="w-full rounded-t bg-semantic-success transition-all duration-300 hover:bg-semantic-success/80"
                        style={{
                          height: `${actualHeight}%`,
                          minHeight: '4px',
                        }}
                        title={`${trend.period} Actual: ${formatCurrency(trend.actual)}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-center gap-4 text-xs text-semantic-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded bg-semantic-primary"></div>
                  Budget
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded bg-semantic-success"></div>
                  Actual
                </div>
              </div>
            </div>

            {/* Variance Percentage Trend */}
            <div>
              <div className="mb-3 text-sm font-medium text-semantic-muted-foreground">Variance Percentage Trend</div>
              <div className="flex h-20 items-end justify-between gap-1">
                {trends.map((trend, index) => {
                  const maxVariance = Math.max(...trends.map(t => Math.abs(t.variancePercentage)));
                  const height = (Math.abs(trend.variancePercentage) / maxVariance) * 100;
                  
                  return (
                    <div
                      key={index}
                      className={`flex-1 rounded-t transition-all duration-300 hover:opacity-80 ${
                        trend.variancePercentage >= 0 ? 'bg-semantic-success' : 'bg-semantic-error'
                      }`}
                      style={{
                        height: `${height}%`,
                        minHeight: '4px',
                      }}
                      title={`${trend.period}: ${formatPercentage(trend.variancePercentage)}`}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex justify-center gap-4 text-xs text-semantic-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded bg-semantic-success"></div>
                  Favorable
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded bg-semantic-error"></div>
                  Unfavorable
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-semantic-muted-foreground">
            {trends.map(t => t.period).join(' → ')}
          </div>
        </div>

        {/* Variance Insights */}
        <div className="rounded-lg border border-semantic-border p-4">
          <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
            Variance Insights
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-semantic-muted p-4">
              <h5 className="mb-2 font-medium" style={{ color: tokens.colors.neutral[700] }}>
                Current Period Analysis
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Budget:</span>
                  <span>{formatCurrency(current.budget)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual:</span>
                  <span>{formatCurrency(current.actual)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Variance:</span>
                  <span 
                    style={{ 
                      color: current.variance >= 0 
                        ? tokens.colors.success[600] 
                        : tokens.colors.error[600] 
                    }}
                  >
                    {formatCurrency(current.variance)} ({formatPercentage(current.variancePercentage)})
                  </span>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-semantic-muted p-4">
              <h5 className="mb-2 font-medium" style={{ color: tokens.colors.neutral[700] }}>
                Trend Analysis
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Variance Trend:</span>
                  <span 
                    style={{ 
                      color: varianceTrend.direction === 'improving' 
                        ? tokens.colors.success[600] 
                        : varianceTrend.direction === 'worsening' 
                          ? tokens.colors.error[600] 
                          : tokens.colors.neutral[600]
                    }}
                  >
                    {varianceTrend.direction}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span>{formatPercentage(varianceTrend.percentage)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span style={{ color: varianceStatus.color }}>
                    {varianceStatus.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Component>
  );
});
