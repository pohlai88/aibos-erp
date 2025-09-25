# @aibos/ui-business

**Enterprise-grade business UI components for AIBOS ERP**

A comprehensive collection of domain-specific UI components built on top of the AIBOS UI design system. These components provide ready-to-use business functionality for accounting, finance, and enterprise operations.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run type checking
pnpm typecheck

# Run tests
pnpm test
```

## 📦 Usage

### Basic Import

```tsx
import { 
  OutstandingCFODashboard,
  ProfitLossChart,
  BalanceSheetChart,
  CashFlowChart,
  TrendAnalysisChart,
  VarianceAnalysisChart,
  NumberFormattingSettingsComponent,
  NumberFormattingDemo
} from '@aibos/ui-business';
```

## 🔢 Configurable Number Formatting

The UI-Business package includes a comprehensive number formatting system that matches Excel/Google Sheets standards and supports multiple markets and locales.

### Key Features

- **Market-Specific Defaults**: Pre-configured for Malaysia, US, Europe, Singapore, and Australia
- **Excel/Google Sheets Compatibility**: Matches standard formatting conventions
- **Thousand Separators**: Proper comma placement (1,000,000)
- **Currency Formatting**: Localized currency symbols and positioning
- **Percentage Formatting**: Consistent decimal places and symbols
- **Compact Notation**: Automatic K/M/B notation for large numbers
- **Real-time Configuration**: Change settings and see immediate updates

### Basic Usage

```tsx
import { formatCurrency, formatPercentage, formatNumber } from '@aibos/ui-business';

// Format currency with current settings
const revenue = formatCurrency(2500000); // RM2,500,000 (Malaysia default)

// Format percentage with current settings  
const growth = formatPercentage(15.7); // 15.7%

// Format large numbers with thousand separators
const users = formatNumber(1500000); // 1,500,000
```

### Market Configuration

```tsx
import { globalNumberFormatting } from '@aibos/ui-business';

// Switch to US market
globalNumberFormatting.setMarket('us');
// Now: formatCurrency(2500000) returns $2,500,000

// Switch to European market
globalNumberFormatting.setMarket('europe');
// Now: formatCurrency(2500000) returns 2,500,000.00 €
```

### Custom Configuration

```tsx
import { globalNumberFormatting } from '@aibos/ui-business';

// Custom settings
globalNumberFormatting.updateConfig({
  currencyDecimals: 2,
  showSignForPositive: true,
  useCompactNotation: true,
  compactThreshold: 1000000
});

// Now: formatCurrency(2500000) returns +RM2.50M
```

### React Hook Usage

```tsx
import { useNumberFormattingSettings } from '@aibos/ui-business';

function MyComponent() {
  const { config, updateConfig, setMarket } = useNumberFormattingSettings();
  
  return (
    <div>
      <span>{formatCurrency(1000000)}</span>
      <button onClick={() => setMarket('us')}>
        Switch to US Format
      </button>
      <button onClick={() => updateConfig({ currencyDecimals: 2 })}>
        Add Decimals
      </button>
    </div>
  );
}
```

### Settings Component

```tsx
import { NumberFormattingSettingsComponent } from '@aibos/ui-business';

function SettingsPage() {
  return (
    <NumberFormattingSettingsComponent 
      showPreview={true}
      compact={false}
      onConfigChange={(config) => {
        // Save to user preferences
        localStorage.setItem('numberFormat', JSON.stringify(config));
      }}
    />
  );
}
```

### Demo Component

```tsx
import { NumberFormattingDemo } from '@aibos/ui-business';

function FormattingDemo() {
  return <NumberFormattingDemo />;
}
```

### Available Markets

| Market | Locale | Currency | Symbol | Example |
|--------|--------|----------|--------|---------|
| Malaysia | en-MY | MYR | RM | RM2,500,000 |
| US | en-US | USD | $ | $2,500,000 |
| Europe | en-GB | EUR | € | €2,500,000 |
| Singapore | en-MY | SGD | S$ | S$2,500,000 |
| Australia | en-AU | AUD | A$ | A$2,500,000 |

### Formatting Functions

- `formatCurrency(value, options?)` - Currency with thousand separators
- `formatNumber(value, options?)` - Numbers with thousand separators  
- `formatPercentage(value, options?)` - Percentages with proper decimals
- `formatRatio(value, options?)` - Ratios (e.g., debt-to-equity)
- `formatCompact(value, options?)` - Compact notation (K/M/B)
- `formatSmart(value, options?)` - Auto-selects best format

### CFO Dashboard

```tsx
import { OutstandingCFODashboard } from '@aibos/ui-business';

function CFOView() {
  return (
    <OutstandingCFODashboard
      tenantId="tenant-123"
      period="2024-Q4"
      companies={companies}
      onOpenDrill={(params) => console.log('Drill down:', params)}
      onExportBoardPack={(params) => console.log('Export:', params)}
      onToggleEliminations={(enabled) => console.log('Eliminations:', enabled)}
      onVarianceClick={(metricId) => console.log('Variance:', metricId)}
    />
  );
}
```

### Financial Charts

```tsx
import { 
  ProfitLossChart, 
  BalanceSheetChart, 
  CashFlowChart 
} from '@aibos/ui-business';

function FinancialReports() {
  return (
    <div className="space-y-6">
      <ProfitLossChart
        data={profitLossData}
        period="2024-Q4"
        companyId="company-123"
        onDrillDown={(account, period) => console.log('Drill:', account, period)}
      />
      
      <BalanceSheetChart
        data={balanceSheetData}
        period="2024-Q4"
        companyId="company-123"
        onDrillDown={(account, period) => console.log('Drill:', account, period)}
      />
      
      <CashFlowChart
        data={cashFlowData}
        period="2024-Q4"
        companyId="company-123"
        onDrillDown={(activity, period) => console.log('Drill:', activity, period)}
      />
    </div>
  );
}
```

### Trend Analysis

```tsx
import { TrendAnalysisChart } from '@aibos/ui-business';

function TrendView() {
  return (
    <TrendAnalysisChart
      data={trendData}
      metrics={['revenue', 'grossProfit', 'operatingIncome', 'netIncome']}
      period="2024-Q4"
      companyId="company-123"
      onDrillDown={(metric, period) => console.log('Drill:', metric, period)}
    />
  );
}
```

### Variance Analysis

```tsx
import { VarianceAnalysisChart } from '@aibos/ui-business';

function VarianceView() {
  return (
    <VarianceAnalysisChart
      data={varianceData}
      metric="revenue"
      period="2024-Q4"
      companyId="company-123"
      onDrillDown={(metric, period) => console.log('Drill:', metric, period)}
    />
  );
}
```

## 🏗️ Architecture

```
src/
├── cfo-dashboard/           # CFO Dashboard components
│   ├── index.ts
│   └── outstanding-cfo-dashboard.tsx
├── financial-charts/        # Financial chart components
│   ├── index.ts
│   ├── profit-loss-chart.tsx
│   ├── balance-sheet-chart.tsx
│   ├── cash-flow-chart.tsx
│   ├── trend-analysis-chart.tsx
│   └── variance-analysis-chart.tsx
└── index.ts                # Main exports
```

## 🎨 Design Principles

### **Domain-Specific Components**
- **Business Logic**: Components contain domain-specific business logic
- **Data Models**: Built for specific accounting and finance data structures
- **User Workflows**: Designed for specific business user journeys

### **Enterprise Features**
- **Multi-Company Support**: Handle consolidated and entity-level views
- **Drill-Down Capabilities**: Interactive exploration of financial data
- **Export Functionality**: Board pack and report generation
- **Real-time Updates**: Live data refresh and synchronization

### **Performance Optimized**
- **Memoized Components**: React.memo for optimal re-rendering
- **Efficient Data Processing**: Optimized calculations and aggregations
- **Lazy Loading**: On-demand component loading
- **Virtual Scrolling**: Handle large datasets efficiently

## 📊 Available Components

### **CFO Dashboard**
- **OutstandingCFODashboard**: Comprehensive financial command center
  - Multi-company lens with consolidation controls
  - Close readiness meter with bottleneck tracking
  - KPI cards with sparklines and variance analysis
  - 13-week cash early-warning radar
  - Variance storyline with driver analysis

### **Financial Charts**
- **ProfitLossChart**: P&L statement visualization
  - Revenue, gross profit, operating income, net income
  - Trend analysis with sparklines
  - Margin calculations and period comparisons
  - Interactive drill-down capabilities

- **BalanceSheetChart**: Balance sheet visualization
  - Assets, liabilities, and equity breakdown
  - Financial ratios (debt-to-equity, current ratio)
  - Trend analysis across periods
  - Interactive account exploration

- **CashFlowChart**: Cash flow statement visualization
  - Operating, investing, and financing activities
  - Cash flow health indicators
  - Scenario analysis and what-if modeling
  - Trend visualization with color coding

### **Analysis Components**
- **TrendAnalysisChart**: Multi-metric trend analysis
  - Multiple metrics visualization
  - Correlation analysis
  - Trend direction indicators
  - Interactive metric exploration

- **VarianceAnalysisChart**: Budget vs actual analysis
  - Variance status indicators
  - Trend analysis over time
  - Budget vs actual comparisons
  - Variance insights and recommendations

## 🔧 Component Props

### **Common Props**
All components support these common props:
- `period`: Reporting period (e.g., "2024-Q4")
- `companyId`: Company identifier for entity-level views
- `className`: Additional CSS classes
- `as`: Polymorphic element type
- `onDrillDown`: Callback for drill-down interactions

### **Data Requirements**
Components expect specific data structures:
- **Financial Data**: Currency values, percentages, ratios
- **Time Series**: Period-based data with trends
- **Hierarchical Data**: Account structures and consolidations
- **Metadata**: Lineage, disclosures, and audit trails

## 🎯 Business Use Cases

### **CFO Dashboard**
- **Monthly Close**: Track close readiness and bottlenecks
- **Board Reporting**: Generate board packs and presentations
- **Cash Management**: Monitor cash runway and scenarios
- **Variance Analysis**: Understand performance drivers

### **Financial Reporting**
- **P&L Analysis**: Revenue and profitability trends
- **Balance Sheet Review**: Asset and liability management
- **Cash Flow Monitoring**: Liquidity and cash management
- **Budget vs Actual**: Performance against targets

### **Analytics & Insights**
- **Trend Analysis**: Multi-metric performance tracking
- **Variance Investigation**: Root cause analysis
- **Scenario Planning**: What-if analysis and modeling
- **Benchmarking**: Performance comparisons

## 🛡️ Data Security

### **Access Control**
- **Tenant Isolation**: Multi-tenant data separation
- **Role-Based Access**: User permission enforcement
- **Audit Trails**: Complete activity logging
- **Data Encryption**: Secure data transmission

### **Compliance**
- **MFRS Compliance**: Malaysian Financial Reporting Standards
- **SOX Compliance**: Sarbanes-Oxley requirements
- **Data Retention**: Automated data lifecycle management
- **Privacy Protection**: Personal data handling

## 🚀 Performance

### **Optimization Features**
- **Memoization**: React.memo for component optimization
- **Lazy Loading**: On-demand component loading
- **Virtual Scrolling**: Efficient large dataset handling
- **Caching**: Intelligent data caching strategies

### **Bundle Size**
- **Tree Shaking**: Individual component imports
- **Code Splitting**: Route-based splitting
- **Compression**: Gzip and Brotli compression
- **CDN**: Global content delivery

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### **Test Coverage**
- **Unit Tests**: Component logic and calculations
- **Integration Tests**: Data flow and interactions
- **Visual Tests**: Screenshot comparisons
- **Accessibility Tests**: WCAG compliance

## 📋 Quality Gates

- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Performance**: Optimized rendering and calculations
- ✅ **Accessibility**: WCAG 2.1 AA compliance
- ✅ **Testing**: Comprehensive test coverage
- ✅ **Documentation**: Complete API documentation
- ✅ **Security**: Data protection and access control

## 🤝 Contributing

1. **Follow Business Domain Patterns** - Use existing components as templates
2. **Maintain Data Contracts** - Ensure compatibility with accounting contracts
3. **Add Comprehensive Tests** - Cover business logic and edge cases
4. **Update Documentation** - Keep README and examples current
5. **Ensure Performance** - Monitor impact on bundle size and rendering
6. **Validate Accessibility** - Test with screen readers and keyboard navigation

## 📄 License

MIT License - see LICENSE file for details.

---

**Need help?** Check the [Developer Guide](../ui/README.md) or create an issue in the repository.