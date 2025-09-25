import React, { memo, useMemo } from 'react';
import { Card, tokens } from '@aibos/ui';
import type { ElementType } from 'react';

export interface CashFlowChartProps {
  data: {
    period: string;
    operating: {
      netIncome: number;
      depreciation: number;
      workingCapitalChanges: number;
      operatingCashFlow: number;
    };
    investing: {
      capex: number;
      assetSales: number;
      investingCashFlow: number;
    };
    financing: {
      debtIssuance: number;
      debtRepayment: number;
      dividends: number;
      financingCashFlow: number;
    };
    netCashFlow: number;
    beginningCash: number;
    endingCash: number;
  }[];
  period: string;
  companyId?: string;
  className?: string;
  as?: ElementType;
  onDrillDown?: (activity: string, period: string) => void;
}

export const CashFlowChart = memo(function CashFlowChart({
  data,
  period,
  companyId,
  className,
  as: Component = 'div',
  onDrillDown,
}: CashFlowChartProps): JSX.Element {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const latestData = data[data.length - 1];
    const previousData = data.length > 1 ? data[data.length - 2] : null;
    
    return {
      current: latestData,
      previous: previousData,
      trends: data.map(d => ({
        period: d.period,
        operatingCashFlow: d.operating.operatingCashFlow,
        investingCashFlow: d.investing.investingCashFlow,
        financingCashFlow: d.financing.financingCashFlow,
        netCashFlow: d.netCashFlow,
        endingCash: d.endingCash,
      })),
    };
  }, [data]);

  if (!chartData) {
    return (
      <Component className={className}>
        <Card className="p-6">
          <div className="text-center text-semantic-muted-foreground">
            No Cash Flow data available for {period}
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
    const percentage = (change / Math.abs(previous)) * 100;
    return {
      value: change,
      percentage: Math.abs(percentage),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    };
  };

  const operatingChange = calculateChange(current.operating.operatingCashFlow, previous?.operating?.operatingCashFlow ?? null);
  const investingChange = calculateChange(current.investing.investingCashFlow, previous?.investing?.investingCashFlow ?? null);
  const financingChange = calculateChange(current.financing.financingCashFlow, previous?.financing?.financingCashFlow ?? null);
  const netCashFlowChange = calculateChange(current.netCashFlow, previous?.netCashFlow ?? null);

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

  const getCashFlowHealth = (operating: number, investing: number, financing: number): { status: string; color: string; description: string } => {
    if (operating > 0 && investing < 0 && financing < 0) {
      return {
        status: 'Healthy',
        color: tokens.colors.success[500],
        description: 'Strong operating cash flow, investing in growth, reducing debt'
      };
    } else if (operating > 0 && investing < 0 && financing > 0) {
      return {
        status: 'Growth',
        color: tokens.colors.primary[500],
        description: 'Strong operating cash flow, investing in growth, raising capital'
      };
    } else if (operating < 0 && investing < 0 && financing > 0) {
      return {
        status: 'Concerning',
        color: tokens.colors.warning[500],
        description: 'Negative operating cash flow, investing in growth, raising capital'
      };
    } else if (operating < 0 && investing > 0 && financing > 0) {
      return {
        status: 'Critical',
        color: tokens.colors.error[500],
        description: 'Negative operating cash flow, selling assets, raising capital'
      };
    } else {
      return {
        status: 'Mixed',
        color: tokens.colors.neutral[500],
        description: 'Mixed cash flow patterns'
      };
    }
  };

  const cashFlowHealth = getCashFlowHealth(
    current.operating.operatingCashFlow,
    current.investing.investingCashFlow,
    current.financing.financingCashFlow
  );

  return (
    <Component className={className}>
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold" style={{ color: tokens.colors.neutral[900] }}>
            Statement of Cash Flows
          </h3>
          <p className="text-sm text-semantic-muted-foreground">
            {period} • {companyId ? `Company: ${companyId}` : 'Consolidated'}
          </p>
        </div>

        {/* Cash Flow Health Indicator */}
        <div className="mb-8 rounded-lg border border-semantic-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
                Cash Flow Health
              </h4>
              <p className="text-sm text-semantic-muted-foreground">{cashFlowHealth.description}</p>
            </div>
            <div className="text-right">
              <div 
                className="text-2xl font-bold"
                style={{ color: cashFlowHealth.color }}
              >
                {cashFlowHealth.status}
              </div>
              <div className="text-sm text-semantic-muted-foreground">
                Net Cash Flow: {formatCurrency(current.netCashFlow)}
              </div>
            </div>
          </div>
        </div>

        {/* Cash Flow Activities */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Operating Activities */}
          <div className="rounded-lg border border-semantic-border p-4">
            <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
              Operating Activities
            </h4>
            <div className="space-y-3">
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('net-income', period)}
              >
                <span className="text-sm">Net Income</span>
                <span className="font-medium">{formatCurrency(current.operating.netIncome)}</span>
              </div>
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('depreciation', period)}
              >
                <span className="text-sm">Depreciation</span>
                <span className="font-medium">{formatCurrency(current.operating.depreciation)}</span>
              </div>
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('working-capital', period)}
              >
                <span className="text-sm">Working Capital Changes</span>
                <span className="font-medium">{formatCurrency(current.operating.workingCapitalChanges)}</span>
              </div>
              <div className="border-t border-semantic-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Operating Cash Flow</span>
                  <span 
                    className="text-lg font-semibold"
                    style={{ 
                      color: current.operating.operatingCashFlow >= 0 
                        ? tokens.colors.success[600] 
                        : tokens.colors.error[600] 
                    }}
                  >
                    {formatCurrency(current.operating.operatingCashFlow)}
                  </span>
                </div>
                {previous && (
                  <div className={`mt-1 text-sm ${
                    operatingChange.direction === 'up' 
                      ? 'text-semantic-success' 
                      : operatingChange.direction === 'down' 
                        ? 'text-semantic-error' 
                        : 'text-semantic-muted-foreground'
                  }`}>
                    {formatPercentage(operatingChange.percentage)} vs prev period
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Investing Activities */}
          <div className="rounded-lg border border-semantic-border p-4">
            <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
              Investing Activities
            </h4>
            <div className="space-y-3">
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('capex', period)}
              >
                <span className="text-sm">Capital Expenditures</span>
                <span className="font-medium">{formatCurrency(current.investing.capex)}</span>
              </div>
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('asset-sales', period)}
              >
                <span className="text-sm">Asset Sales</span>
                <span className="font-medium">{formatCurrency(current.investing.assetSales)}</span>
              </div>
              <div className="border-t border-semantic-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Investing Cash Flow</span>
                  <span 
                    className="text-lg font-semibold"
                    style={{ 
                      color: current.investing.investingCashFlow >= 0 
                        ? tokens.colors.success[600] 
                        : tokens.colors.error[600] 
                    }}
                  >
                    {formatCurrency(current.investing.investingCashFlow)}
                  </span>
                </div>
                {previous && (
                  <div className={`mt-1 text-sm ${
                    investingChange.direction === 'up' 
                      ? 'text-semantic-success' 
                      : investingChange.direction === 'down' 
                        ? 'text-semantic-error' 
                        : 'text-semantic-muted-foreground'
                  }`}>
                    {formatPercentage(investingChange.percentage)} vs prev period
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financing Activities */}
          <div className="rounded-lg border border-semantic-border p-4">
            <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
              Financing Activities
            </h4>
            <div className="space-y-3">
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('debt-issuance', period)}
              >
                <span className="text-sm">Debt Issuance</span>
                <span className="font-medium">{formatCurrency(current.financing.debtIssuance)}</span>
              </div>
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('debt-repayment', period)}
              >
                <span className="text-sm">Debt Repayment</span>
                <span className="font-medium">{formatCurrency(current.financing.debtRepayment)}</span>
              </div>
              <div 
                className="cursor-pointer flex items-center justify-between rounded bg-semantic-muted p-3 transition-colors hover:bg-semantic-muted/80"
                onClick={() => onDrillDown?.('dividends', period)}
              >
                <span className="text-sm">Dividends</span>
                <span className="font-medium">{formatCurrency(current.financing.dividends)}</span>
              </div>
              <div className="border-t border-semantic-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Financing Cash Flow</span>
                  <span 
                    className="text-lg font-semibold"
                    style={{ 
                      color: current.financing.financingCashFlow >= 0 
                        ? tokens.colors.success[600] 
                        : tokens.colors.error[600] 
                    }}
                  >
                    {formatCurrency(current.financing.financingCashFlow)}
                  </span>
                </div>
                {previous && (
                  <div className={`mt-1 text-sm ${
                    financingChange.direction === 'up' 
                      ? 'text-semantic-success' 
                      : financingChange.direction === 'down' 
                        ? 'text-semantic-error' 
                        : 'text-semantic-muted-foreground'
                  }`}>
                    {formatPercentage(financingChange.percentage)} vs prev period
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cash Position */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-semantic-border p-4">
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Beginning Cash</div>
            <div className="text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
              {formatCurrency(current.beginningCash)}
            </div>
          </div>
          <div className="rounded-lg border border-semantic-border p-4">
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Net Cash Flow</div>
            <div 
              className="text-2xl font-bold"
              style={{ 
                color: current.netCashFlow >= 0 
                  ? tokens.colors.success[600] 
                  : tokens.colors.error[600] 
              }}
            >
              {formatCurrency(current.netCashFlow)}
            </div>
            {previous && (
              <div className={`text-sm ${
                netCashFlowChange.direction === 'up' 
                  ? 'text-semantic-success' 
                  : netCashFlowChange.direction === 'down' 
                    ? 'text-semantic-error' 
                    : 'text-semantic-muted-foreground'
              }`}>
                {formatPercentage(netCashFlowChange.percentage)} vs prev period
              </div>
            )}
          </div>
          <div className="rounded-lg border border-semantic-border p-4">
            <div className="mb-2 text-sm font-medium text-semantic-muted-foreground">Ending Cash</div>
            <div className="text-2xl font-bold" style={{ color: tokens.colors.neutral[900] }}>
              {formatCurrency(current.endingCash)}
            </div>
          </div>
        </div>

        {/* Trend Visualization */}
        <div className="rounded-lg border border-semantic-border p-4">
          <h4 className="mb-4 text-lg font-medium" style={{ color: tokens.colors.neutral[700] }}>
            Cash Flow Trends
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Operating Cash Flow Trend */}
            <div>
              <div className="mb-3 text-sm font-medium text-semantic-muted-foreground">Operating</div>
              <div className="flex h-16 items-end justify-between gap-1">
                {trends.map((trend, index) => {
                  const maxValue = Math.max(...trends.map(t => Math.abs(t.operatingCashFlow)));
                  const height = (Math.abs(trend.operatingCashFlow) / maxValue) * 100;
                  return (
                    <div
                      key={index}
                      className={`flex-1 rounded-t transition-all duration-300 hover:opacity-80 ${
                        trend.operatingCashFlow >= 0 ? 'bg-semantic-success' : 'bg-semantic-error'
                      }`}
                      style={{
                        height: `${height}%`,
                        minHeight: '4px',
                      }}
                      title={`${trend.period}: ${formatCurrency(trend.operatingCashFlow)}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Investing Cash Flow Trend */}
            <div>
              <div className="mb-3 text-sm font-medium text-semantic-muted-foreground">Investing</div>
              <div className="flex h-16 items-end justify-between gap-1">
                {trends.map((trend, index) => {
                  const maxValue = Math.max(...trends.map(t => Math.abs(t.investingCashFlow)));
                  const height = (Math.abs(trend.investingCashFlow) / maxValue) * 100;
                  return (
                    <div
                      key={index}
                      className={`flex-1 rounded-t transition-all duration-300 hover:opacity-80 ${
                        trend.investingCashFlow >= 0 ? 'bg-semantic-success' : 'bg-semantic-error'
                      }`}
                      style={{
                        height: `${height}%`,
                        minHeight: '4px',
                      }}
                      title={`${trend.period}: ${formatCurrency(trend.investingCashFlow)}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Financing Cash Flow Trend */}
            <div>
              <div className="mb-3 text-sm font-medium text-semantic-muted-foreground">Financing</div>
              <div className="flex h-16 items-end justify-between gap-1">
                {trends.map((trend, index) => {
                  const maxValue = Math.max(...trends.map(t => Math.abs(t.financingCashFlow)));
                  const height = (Math.abs(trend.financingCashFlow) / maxValue) * 100;
                  return (
                    <div
                      key={index}
                      className={`flex-1 rounded-t transition-all duration-300 hover:opacity-80 ${
                        trend.financingCashFlow >= 0 ? 'bg-semantic-success' : 'bg-semantic-error'
                      }`}
                      style={{
                        height: `${height}%`,
                        minHeight: '4px',
                      }}
                      title={`${trend.period}: ${formatCurrency(trend.financingCashFlow)}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Ending Cash Trend */}
            <div>
              <div className="mb-3 text-sm font-medium text-semantic-muted-foreground">Ending Cash</div>
              <div className="flex h-16 items-end justify-between gap-1">
                {trends.map((trend, index) => {
                  const maxValue = Math.max(...trends.map(t => t.endingCash));
                  const height = (trend.endingCash / maxValue) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 rounded-t bg-semantic-primary transition-all duration-300 hover:bg-semantic-primary/80"
                      style={{
                        height: `${height}%`,
                        minHeight: '4px',
                      }}
                      title={`${trend.period}: ${formatCurrency(trend.endingCash)}`}
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
