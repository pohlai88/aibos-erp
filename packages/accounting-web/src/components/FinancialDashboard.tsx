import { CFODashboard } from '@aibos/ui';
import * as React from 'react';

interface FinancialDashboardProperties {
  tenantId: string;
}

export function FinancialDashboard({ tenantId }: FinancialDashboardProperties): JSX.Element {
  const handleMetricClick = React.useCallback((metric: unknown) => {
    // TODO: Implement metric drill-down navigation
    console.log('Metric clicked:', metric);
  }, []);

  const handleKPIClick = React.useCallback((kpi: unknown) => {
    // TODO: Implement KPI detail view
    console.log('KPI clicked:', kpi);
  }, []);

  return (
    <CFODashboard
      tenantId={tenantId}
      period="monthly"
      onMetricClick={handleMetricClick}
      onKPIClick={handleKPIClick}
      className="w-full"
    />
  );
}
