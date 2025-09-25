/**
 * React hook for number formatting settings
 * Automatically re-renders when settings change
 */

import React from 'react';
import { globalNumberFormatting, NumberFormattingConfig } from '../utils/number-formatting';

export function useNumberFormattingSettings() {
  const [config, setConfig] = React.useState(() => globalNumberFormatting.getConfig());

  React.useEffect(() => {
    const unsubscribe = globalNumberFormatting.subscribe(setConfig);
    return unsubscribe;
  }, []);

  return {
    config,
    updateConfig: globalNumberFormatting.updateConfig.bind(globalNumberFormatting),
    setMarket: globalNumberFormatting.setMarket.bind(globalNumberFormatting),
    reset: globalNumberFormatting.reset.bind(globalNumberFormatting),
    export: globalNumberFormatting.export.bind(globalNumberFormatting),
    import: globalNumberFormatting.import.bind(globalNumberFormatting),
  };
}
