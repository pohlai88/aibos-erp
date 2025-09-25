import React, { memo, useMemo } from 'react';
import { Card, tokens } from '@aibos/ui';
import type { ElementType } from 'react';

export interface TrendAnalysisChartProps {
  data: {
    period: string;
    metrics: {
      [key: string]: number;
    };
  }[];
  metrics: string[];
  period: string;
  companyId?: string;
  className?: string;
  as?: ElementType;
  onDrillDown?: (metric: string, period: string) => void;
}

export const TrendAnalysisChart = memo(function TrendAnalysisChart({
  data,
  metrics,
  period,
  companyId,
  className,
  as: Component = 'div',
  onDrillDown,
}: TrendAnalysisChartProps): JSX.Element {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    return {
      trends: data.map(d => ({
        period: d.period,
        metrics: metrics.reduce((acc, metric) => {
          acc[metric] = d.metrics[metric] || 0;
          return acc;
        }, {} as Record<string, number>),
      })),
      latest: data[data.length - 1],
    };
  }, [data, metrics]);

  if (!chartData) {
    return (
      <Component className={className}>
        <Card className="p-6">
          <div className="text-center text-semantic-muted-foreground">
            No trend data available for {period}
          </div>
        </Card>
      </Component>
    );
  }

  const { trends, latest } = chartData;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-MY').format(value);
  };

  const getMetricColor = (index: number): string => {
    const colors = [
      tokens.colors.primary[500],
      tokens.colors.success[500],
      tokens.colors.warning[500],
      tokens.colors.error[500],
      tokens.colors.neutral[500],
    ];
    return colors[index % colors.length] || tokens.colors.neutral[500];
  };

  const calculateTrend = (values: (number | undefined)[]): { direction: 'up' | 'down' | 'neutral'; percentage: number } => {
    if (values.length < 2) return { direction: 'neutral', percentage: 0 };
    
    const first = values[0];
    const last = values[values.length - 1];
    
    if (first === undefined || last === undefined) return { direction: 'neutral', percentage: 0 };
    
    const change = ((last - first) / Math.abs(first)) * 100;
    
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
      percentage: Math.abs(change),
    };
  };

  return (
    <Component className={className}>
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold" style={{ color: tokens.colors.neutral[900] }}>
            Trend Analysis
          </h3>
          <p className="text-sm text-semantic-muted-foreground">
            {period} • {companyId ? `Company: ${companyId}` : 'Consolidated'}
          </p>
        </div>

        {/* Key Metrics Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, index) => {
              const values = trends.map(t => t.metrics[metric]);
              const trend = calculateTrend(values);
              const latestValue = latest?.metrics[metric];
            
            return (
              <div 
                key={metric}
                className="cursor-pointer rounded-lg border border-semantic-border p-4 transition-colors hover:bg-semantic-muted/50"
                onClick={() => onDrillDown?.(metric, period)}
              >
                <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">
                  {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </div>
                <div className="mb-1 text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
                  {typeof latestValue === 'number' && latestValue > 1000000 
                    ? formatCurrency(latestValue)
                    : latestValue !== undefined ? formatNumber(latestValue) : 'N/A'
                  }
                </div>
                <div className={`text-sm ${
                  trend.direction === 'up' 
                    ? 'text-semantic-success' 
                    : trend.direction === 'down' 
                      ? 'text-semantic-error' 
                      : 'text-semantic-muted-foreground'
                }`}>
                  {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} {trend.percentage.toFixed(1)}% trend
                </div>
              </div>
            );
          })}
        </div>

        {/* Trend Visualization */}
        <div className="rounded-lg border border-semantic-border p-4">
          <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
            Multi-Metric Trends
          </h4>
          <div className="space-y-4">
            {metrics.map((metric, index) => {
              const values = trends.map(t => t.metrics[metric]);
              const validValues = values.filter((v): v is number => v !== undefined);
              const maxValue = validValues.length > 0 ? Math.max(...validValues) : 0;
              const minValue = validValues.length > 0 ? Math.min(...validValues) : 0;
              const range = maxValue - minValue;
              
              return (
                <div key={metric}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-semantic-muted-foreground">
                      {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span className="text-sm font-medium">
                      {typeof latest?.metrics[metric] === 'number' && latest.metrics[metric] > 1000000 
                        ? formatCurrency(latest.metrics[metric])
                        : latest?.metrics[metric] !== undefined ? formatNumber(latest.metrics[metric]) : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex h-8 items-end justify-between gap-1">
                    {values.map((value, valueIndex) => {
                      const height = range > 0 && value !== undefined ? ((value - minValue) / range) * 100 : 50;
                      return (
                        <div
                          key={valueIndex}
                          className="flex-1 rounded-t transition-all duration-300 hover:opacity-80"
                          style={{
                            backgroundColor: getMetricColor(index),
                            height: `${height}%`,
                            minHeight: '4px',
                          }}
                          title={`${trends[valueIndex]?.period || 'Unknown'}: ${typeof value === 'number' && value > 1000000 ? formatCurrency(value) : value !== undefined ? formatNumber(value) : 'N/A'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-semantic-muted-foreground">
            {trends.map(t => t.period).join(' → ')}
          </div>
        </div>

        {/* Correlation Matrix */}
        <div className="mt-6 rounded-lg border border-semantic-border p-4">
          <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
            Metric Correlations
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {metrics.slice(0, 4).map((metric1, index1) => 
              metrics.slice(index1 + 1, 4).map((metric2, index2) => {
                const values1 = trends.map(t => t.metrics[metric1]);
                const values2 = trends.map(t => t.metrics[metric2]);
                
                // Simple correlation calculation
                const correlation = (() => {
                  if (values1.length < 2 || values2.length < 2) return 0;
                  
                  // Filter out undefined values
                  const validValues1 = values1.filter((v): v is number => v !== undefined);
                  const validValues2 = values2.filter((v): v is number => v !== undefined);
                  
                  if (validValues1.length < 2 || validValues2.length < 2) return 0;
                  
                  const mean1 = validValues1.reduce((a, b) => a + b, 0) / validValues1.length;
                  const mean2 = validValues2.reduce((a, b) => a + b, 0) / validValues2.length;
                  
                  const numerator = validValues1.reduce((sum, val, i) => sum + (val - mean1) * ((validValues2[i] || 0) - mean2), 0);
                  const denominator = Math.sqrt(
                    validValues1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) *
                    validValues2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0)
                  );
                  
                  return denominator === 0 ? 0 : numerator / denominator;
                })();
                
                const correlationStrength = Math.abs(correlation);
                const correlationDirection = correlation > 0 ? 'positive' : 'negative';
                
                return (
                  <div key={`${metric1}-${metric2}`} className="rounded-lg border border-semantic-border p-3">
                    <div className="mb-2 text-sm font-medium">
                      {metric1.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ↔ {' '}
                      {metric2.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`text-sm ${
                        correlationStrength > 0.7 
                          ? 'text-semantic-success' 
                          : correlationStrength > 0.3 
                            ? 'text-semantic-warning' 
                            : 'text-semantic-muted-foreground'
                      }`}>
                        {correlationDirection} correlation
                      </div>
                      <div className="text-sm font-medium">
                        {correlation.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>
    </Component>
  );
});
