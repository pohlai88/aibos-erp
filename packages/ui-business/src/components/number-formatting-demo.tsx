/**
 * Number Formatting Demo Component
 * Demonstrates the configurable number formatting system
 */

import React from 'react';
import { Card, Button } from '@aibos/ui';
import { 
  globalNumberFormatting,
  MARKET_CONFIGS,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatRatio,
  formatCompact
} from '../utils';
import { NumberFormattingSettingsComponent } from './number-formatting-settings';
import { useNumberFormattingSettings } from '../hooks/useNumberFormattingSettings';

export interface NumberFormattingDemoProps {
  className?: string;
}

export const NumberFormattingDemo = React.memo<NumberFormattingDemoProps>(
  ({ className }) => {
    const [currentConfig, setCurrentConfig] = React.useState(() => 
      globalNumberFormatting.getConfig()
    );

    // Sample data for demonstration
    const sampleData = {
      revenue: 2500000,
      expenses: 1800000,
      profit: 700000,
      growthRate: 15.7,
      debtToEquity: 1.25,
      largeNumber: 15000000,
    };

    // Subscribe to configuration changes
    React.useEffect(() => {
      const unsubscribe = globalNumberFormatting.subscribe(setCurrentConfig);
      return unsubscribe;
    }, []);

    const handleMarketChange = (market: keyof typeof MARKET_CONFIGS) => {
      globalNumberFormatting.setMarket(market);
    };

    return (
      <div className={`space-y-6 ${className || ''}`}>
        {/* Settings Panel */}
        <NumberFormattingSettingsComponent 
          onConfigChange={setCurrentConfig}
          showPreview={true}
        />

        {/* Market Quick Switcher */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Quick Market Switch</h3>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(MARKET_CONFIGS).map((market) => (
              <Button
                key={market}
                onClick={() => handleMarketChange(market as keyof typeof MARKET_CONFIGS)}
                variant={currentConfig.locale === MARKET_CONFIGS[market as keyof typeof MARKET_CONFIGS].locale ? 'default' : 'outline'}
                size="sm"
              >
                {market.charAt(0).toUpperCase() + market.slice(1)}
              </Button>
            ))}
          </div>
        </Card>

        {/* Live Demo */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6">Live Formatting Demo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Metrics */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Financial Metrics</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Revenue</span>
                  <span className="font-mono text-lg">
                    {formatCurrency(sampleData.revenue)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Expenses</span>
                  <span className="font-mono text-lg">
                    {formatCurrency(sampleData.expenses)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-sm font-medium">Net Profit</span>
                  <span className="font-mono text-lg font-semibold text-green-700">
                    {formatCurrency(sampleData.profit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ratios and Percentages */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Ratios & Percentages</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Growth Rate</span>
                  <span className="font-mono text-lg">
                    {formatPercentage(sampleData.growthRate)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Debt-to-Equity</span>
                  <span className="font-mono text-lg">
                    {formatRatio(sampleData.debtToEquity)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Large Number</span>
                  <span className="font-mono text-lg">
                    {formatCompact(sampleData.largeNumber)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Details */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-lg font-medium mb-3">Current Configuration</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Locale:</span>
                <div className="font-mono">{currentConfig.locale}</div>
              </div>
              <div>
                <span className="font-medium">Currency:</span>
                <div className="font-mono">{currentConfig.currency}</div>
              </div>
              <div>
                <span className="font-medium">Currency Decimals:</span>
                <div className="font-mono">{currentConfig.currencyDecimals}</div>
              </div>
              <div>
                <span className="font-medium">Compact Threshold:</span>
                <div className="font-mono">{formatNumber(currentConfig.compactThreshold)}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Usage Examples */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Usage Examples</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Basic Usage</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { formatCurrency, formatPercentage } from '@aibos/ui-business';

// Format currency with current settings
const revenue = formatCurrency(2500000); // RM2,500,000

// Format percentage with current settings  
const growth = formatPercentage(15.7); // 15.7%`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Custom Configuration</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { globalNumberFormatting } from '@aibos/ui-business';

// Change market
globalNumberFormatting.setMarket('us');

// Custom settings
globalNumberFormatting.updateConfig({
  currencyDecimals: 2,
  showSignForPositive: true
});`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">React Hook Usage</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { useNumberFormattingSettings } from '@aibos/ui-business';

function MyComponent() {
  const { config, updateConfig } = useNumberFormattingSettings();
  
  return (
    <div>
      <span>{formatCurrency(1000000)}</span>
      <button onClick={() => updateConfig({ currencyDecimals: 2 })}>
        Add Decimals
      </button>
    </div>
  );
}`}
              </pre>
            </div>
          </div>
        </Card>
      </div>
    );
  }
);

NumberFormattingDemo.displayName = 'NumberFormattingDemo';
