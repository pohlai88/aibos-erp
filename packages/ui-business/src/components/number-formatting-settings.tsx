/**
 * Number Formatting Settings Component
 * Provides a UI for users to configure number formatting preferences
 */

import React from 'react';
import { Card, Button, Input } from '@aibos/ui';
import { 
  NumberFormattingSettings, 
  NumberFormattingConfig, 
  MARKET_CONFIGS,
  MarketConfigKey
} from '../utils';
import { useNumberFormattingSettings } from '../hooks/useNumberFormattingSettings';

export interface NumberFormattingSettingsProps {
  className?: string;
  onConfigChange?: (config: NumberFormattingConfig) => void;
  showPreview?: boolean;
  compact?: boolean;
}

export const NumberFormattingSettingsComponent = React.memo<NumberFormattingSettingsProps>(
  ({ className, onConfigChange, showPreview = true, compact = false }) => {
    const { config, updateConfig, setMarket, reset } = useNumberFormattingSettings();

    const handleMarketChange = (market: MarketConfigKey) => {
      setMarket(market);
      onConfigChange?.(config);
    };

    const handleConfigUpdate = (updates: Partial<NumberFormattingConfig>) => {
      updateConfig(updates);
      onConfigChange?.({ ...config, ...updates });
    };

    const previewValues = {
      currency: 1234567.89,
      number: 9876543,
      percentage: 15.67,
      ratio: 2.45,
    };

    if (compact) {
      return (
        <Card className={`p-4 ${className || ''}`}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Number Formatting</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Market</label>
                <select 
                  value={config.locale}
                  onChange={(e) => {
                    const market = Object.keys(MARKET_CONFIGS).find(
                      key => MARKET_CONFIGS[key as MarketConfigKey].locale === e.target.value
                    ) as MarketConfigKey;
                    if (market) handleMarketChange(market);
                  }}
                  className="w-full p-2 border rounded"
                >
                  {Object.entries(MARKET_CONFIGS).map(([key, marketConfig]) => (
                    <option key={key} value={marketConfig.locale}>
                      {key.charAt(0).toUpperCase() + key.slice(1)} ({marketConfig.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Currency Decimals</label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={config.currencyDecimals.toString()}
                  onChange={(e) => handleConfigUpdate({ currencyDecimals: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {showPreview && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h4 className="text-sm font-medium mb-2">Preview:</h4>
                <div className="text-sm space-y-1">
                  <div>Currency: {new Intl.NumberFormat(config.locale, { 
                    style: 'currency', 
                    currency: config.currency,
                    minimumFractionDigits: config.currencyDecimals,
                    maximumFractionDigits: config.currencyDecimals,
                    useGrouping: true
                  }).format(previewValues.currency)}</div>
                  <div>Number: {new Intl.NumberFormat(config.locale, { 
                    minimumFractionDigits: config.numberDecimals,
                    maximumFractionDigits: config.numberDecimals,
                    useGrouping: true
                  }).format(previewValues.number)}</div>
                  <div>Percentage: {new Intl.NumberFormat(config.locale, { 
                    style: 'percent',
                    minimumFractionDigits: config.percentageDecimals,
                    maximumFractionDigits: config.percentageDecimals
                  }).format(previewValues.percentage / 100)}</div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={reset} variant="outline" size="sm">
                Reset
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className={`p-6 ${className || ''}`}>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Number Formatting Settings</h3>
            <p className="text-gray-600 text-sm">
              Configure how numbers, currencies, and percentages are displayed throughout the application.
            </p>
          </div>

          {/* Market Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Market Configuration</label>
            <select 
              value={config.locale}
              onChange={(e) => {
                const market = Object.keys(MARKET_CONFIGS).find(
                  key => MARKET_CONFIGS[key as MarketConfigKey].locale === e.target.value
                ) as MarketConfigKey;
                if (market) handleMarketChange(market);
              }}
              className="w-full p-3 border rounded-lg"
            >
              {Object.entries(MARKET_CONFIGS).map(([key, marketConfig]) => (
                <option key={key} value={marketConfig.locale}>
                  {key.charAt(0).toUpperCase() + key.slice(1)} ({marketConfig.currency}) - {marketConfig.locale}
                </option>
              ))}
            </select>
          </div>

          {/* Decimal Places Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Currency Decimals</label>
              <Input
                type="number"
                min="0"
                max="10"
                value={config.currencyDecimals.toString()}
                onChange={(e) => handleConfigUpdate({ currencyDecimals: parseInt(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Number Decimals</label>
              <Input
                type="number"
                min="0"
                max="10"
                value={config.numberDecimals.toString()}
                onChange={(e) => handleConfigUpdate({ numberDecimals: parseInt(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Percentage Decimals</label>
              <Input
                type="number"
                min="0"
                max="4"
                value={config.percentageDecimals.toString()}
                onChange={(e) => handleConfigUpdate({ percentageDecimals: parseInt(e.target.value) })}
                placeholder="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ratio Decimals</label>
              <Input
                type="number"
                min="0"
                max="4"
                value={config.ratioDecimals.toString()}
                onChange={(e) => handleConfigUpdate({ ratioDecimals: parseInt(e.target.value) })}
                placeholder="2"
              />
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Display Options</h4>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showSignForPositive"
                checked={config.showSignForPositive}
                onChange={(e) => handleConfigUpdate({ showSignForPositive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="showSignForPositive" className="text-sm">
                Show + sign for positive numbers
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useCompactNotation"
                checked={config.useCompactNotation}
                onChange={(e) => handleConfigUpdate({ useCompactNotation: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="useCompactNotation" className="text-sm">
                Use compact notation (1M instead of 1,000,000)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Compact Threshold</label>
              <Input
                type="number"
                min="1000"
                value={config.compactThreshold.toString()}
                onChange={(e) => handleConfigUpdate({ compactThreshold: parseInt(e.target.value) })}
                placeholder="1000000"
              />
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-medium mb-4">Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium mb-2">Currency:</div>
                  <div className="font-mono">
                    {new Intl.NumberFormat(config.locale, { 
                      style: 'currency', 
                      currency: config.currency,
                      minimumFractionDigits: config.currencyDecimals,
                      maximumFractionDigits: config.currencyDecimals,
                      useGrouping: true
                    }).format(previewValues.currency)}
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">Large Number:</div>
                  <div className="font-mono">
                    {new Intl.NumberFormat(config.locale, { 
                      minimumFractionDigits: config.numberDecimals,
                      maximumFractionDigits: config.numberDecimals,
                      useGrouping: true
                    }).format(previewValues.number)}
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">Percentage:</div>
                  <div className="font-mono">
                    {new Intl.NumberFormat(config.locale, { 
                      style: 'percent',
                      minimumFractionDigits: config.percentageDecimals,
                      maximumFractionDigits: config.percentageDecimals
                    }).format(previewValues.percentage / 100)}
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">Ratio:</div>
                  <div className="font-mono">
                    {new Intl.NumberFormat(config.locale, { 
                      minimumFractionDigits: config.ratioDecimals,
                      maximumFractionDigits: config.ratioDecimals,
                      useGrouping: true
                    }).format(previewValues.ratio)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={reset} variant="outline">
              Reset to Default
            </Button>
            <Button 
              onClick={() => {
                const configJson = JSON.stringify(config, null, 2);
                navigator.clipboard.writeText(configJson);
              }}
              variant="outline"
            >
              Copy Config
            </Button>
          </div>
        </div>
      </Card>
    );
  }
);

NumberFormattingSettingsComponent.displayName = 'NumberFormattingSettingsComponent';
