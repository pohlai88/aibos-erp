import {
  createPolymorphic,
  composeRefs as composeReferences,
  dataAttr as dataAttribute,
  ariaAttr as ariaAttribute,
  cn,
  createAccessibilityVariants,
  createDualModeStyles,
  createDualModeProps as createDualModeProperties,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
} from "../../utils";
import * as React from "react";

/**
 * 🎨 ADVANCED DATA VISUALIZATION UTILITIES
 * Market-winning business intelligence components
 * Competitive edge over Zoho/Odoo weak visualization
 */

// Chart data formatting utilities
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export interface ChartConfig {
  type: "line" | "bar" | "pie" | "doughnut" | "area";
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: { display?: boolean; position?: string };
    tooltip?: { enabled?: boolean };
  };
  scales?: {
    x?: { display?: boolean };
    y?: { display?: boolean; beginAtZero?: boolean };
  };
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
}

export interface KPIDashboard {
  metrics: Array<{
    label: string;
    value: number;
    format: "number" | "currency" | "percentage";
    change: number;
    changePercent: number;
    trend: "up" | "down" | "stable";
  }>;
}

// Export KPIData type alias for backward compatibility
export type KPIData = KPIDashboard;

// Chart data formatting utilities
interface KPIDataItem {
  label?: string;
  name?: string;
  date?: string;
  value?: number;
  amount?: number;
  count?: number;
}

export function formatChartData(
  data: KPIDataItem[],
  config: ChartConfig,
): ChartData {
  const labels = data.map((item) => item.label || item.name || item.date || "");
  const datasets =
    config.type === "pie" || config.type === "doughnut"
      ? [
          {
            label: "Data",
            data: data.map(
              (item) => item.value || item.amount || item.count || 0,
            ),
            backgroundColor: [
              "hsl(var(--primary))",
              "hsl(var(--secondary))",
              "hsl(var(--success))",
              "hsl(var(--warning))",
              "hsl(var(--info))",
              "hsl(var(--destructive))",
            ],
            borderColor: "hsl(var(--background))",
            borderWidth: 2,
          },
        ]
      : [
          {
            label: "Data",
            data: data.map(
              (item) => item.value || item.amount || item.count || 0,
            ),
            backgroundColor: "hsl(var(--primary) / 0.1)",
            borderColor: "hsl(var(--primary))",
            borderWidth: 2,
          },
        ];

  return { labels, datasets };
}

export function generateTrendData(
  values: number[],
  period: "day" | "week" | "month",
): TrendData[] {
  return values.map((value, index) => {
    const previousValue = index > 0 ? values[index - 1] : value;
    const change = value - (previousValue ?? value);
    const changePercent =
      (previousValue ?? value) === 0
        ? 0
        : (change / (previousValue ?? value)) * 100;

    return {
      period: `${index + 1}`,
      value,
      change,
      changePercent,
      trend: change > 0 ? "up" : (change < 0 ? "down" : "stable"),
    };
  });
}

export function calculateKPIs(
  metrics: Array<{
    label: string;
    value: number;
    format: "number" | "currency" | "percentage";
    previousValue: number;
  }>,
): KPIDashboard {
  return {
    metrics: metrics.map((metric) => {
      const change = metric.value - metric.previousValue;
      const changePercent =
        metric.previousValue === 0 ? 0 : (change / metric.previousValue) * 100;

      return {
        ...metric,
        change,
        changePercent,
        trend: change > 0 ? "up" : (change < 0 ? "down" : "stable"),
      };
    }),
  };
}

export function createDrillDownPath(
  level: string,
  filters: Array<{ key: string; value: unknown }>,
): string {
  const filterString = filters.map((f) => `${f.key}=${f.value}`).join("&");
  return `${level}?${filterString}`;
}

// KPI Card Component
export interface KPICardProperties {
  label: string;
  value: number;
  format?: "number" | "currency" | "percentage";
  change?: number;
  changePercent?: number;
  trend?: "up" | "down" | "stable";
  loading?: boolean;
  className?: string;
}

const kpiCardStyles = createAccessibilityVariants({
  beautiful: {
    base: "bg-card border border-border rounded-lg p-6 shadow-sm transition-all duration-200 hover:shadow-md",
    variants: {
      trend: {
        up: "border-l-4 border-l-success",
        down: "border-l-4 border-l-destructive",
        stable: "border-l-4 border-l-muted",
      },
    },
    defaultVariants: { trend: "stable" },
  },
  wcagAAA: {
    base: "bg-card border-2 border-border rounded-lg p-6 shadow-md transition-all duration-0 hover:shadow-lg",
    variants: {
      trend: {
        up: "border-l-4 border-l-success shadow-lg",
        down: "border-l-4 border-l-destructive shadow-lg",
        stable: "border-l-4 border-l-muted shadow-lg",
      },
    },
    defaultVariants: { trend: "stable" },
  },
});

export const KPICard = createPolymorphic<"div", KPICardProperties>(
  (
    {
      as,
      label,
      value,
      format = "number",
      change,
      changePercent,
      trend = "stable",
      loading = false,
      className,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const formatValue = (value_: number) => {
      switch (format) {
        case "currency": {
          return formatCurrency(value_);
        }
        case "percentage": {
          return formatPercentage(value_);
        }
        case "number": {
          return formatCompactNumber(value_);
        }
        default: {
          return value_.toString();
        }
      }
    };

    const formatChange = (value_: number) => {
      const sign = value_ >= 0 ? "+" : "";
      switch (format) {
        case "currency": {
          return `${sign}${formatCurrency(value_)}`;
        }
        case "percentage": {
          return `${sign}${formatPercentage(value_)}`;
        }
        case "number": {
          return `${sign}${formatCompactNumber(value_)}`;
        }
        default: {
          return `${sign}${value_}`;
        }
      }
    };

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-kpi": "true",
        "data-trend": trend,
        "data-loading": dataAttribute(loading),
      },
      {
        "data-kpi": "true",
        "data-trend": trend,
        "data-loading": dataAttribute(loading),
        "data-wcag-compliant": "true",
        role: "region",
        "aria-label": `KPI: ${label}`,
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(kpiCardStyles({ trend }), className)}
        {...dataProperties}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">
              {loading ? "..." : formatValue(value)}
            </p>
          </div>
          {change !== undefined && changePercent !== undefined && (
            <div className="text-right">
              <p
                className={cn(
                  "text-sm font-medium",
                  trend === "up" && "text-success",
                  trend === "down" && "text-destructive",
                  trend === "stable" && "text-muted-foreground",
                )}
              >
                {formatChange(change)}
              </p>
              <p className="text-xs text-muted-foreground">
                {changePercent >= 0 ? "+" : ""}
                {changePercent.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
        {loading && (
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary animate-pulse"
              style={{ width: "60%" }}
            />
          </div>
        )}
      </Tag>
    );
  },
  "KPICard",
);

// Trend Chart Component
export interface TrendChartProperties {
  data: TrendData[];
  title?: string;
  className?: string;
}

const trendChartStyles = createAccessibilityVariants({
  beautiful: {
    base: "bg-card border border-border rounded-lg p-6 shadow-sm",
  },
  wcagAAA: {
    base: "bg-card border-2 border-border rounded-lg p-6 shadow-md",
  },
});

export const TrendChart = createPolymorphic<"div", TrendChartProperties>(
  ({ as, data, title, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-chart": "trend",
        "data-points": data.length,
      },
      {
        "data-chart": "trend",
        "data-points": data.length,
        "data-wcag-compliant": "true",
        role: "img",
        "aria-label": `Trend chart: ${title || "Data visualization"}`,
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(trendChartStyles(), className)}
        {...dataProperties}
        {...props}
      >
        {title && (
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {title}
          </h3>
        )}
        <div className="space-y-3">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm font-medium">{item.period}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatCompactNumber(item.value)}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    item.trend === "up" && "text-success",
                    item.trend === "down" && "text-destructive",
                    item.trend === "stable" && "text-muted-foreground",
                  )}
                >
                  {item.changePercent >= 0 ? "+" : ""}
                  {item.changePercent.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </Tag>
    );
  },
  "TrendChart",
);

/**
 * USAGE EXAMPLES:
 *
 * // KPI Dashboard
 * <KPICard
 *   label="Total Revenue"
 *   value={1250000}
 *   format="currency"
 *   change={50000}
 *   changePercent={4.2}
 *   trend="up"
 * />
 *
 * // Trend Chart
 * <TrendChart
 *   data={generateTrendData([100, 120, 110, 140, 130], "month")}
 *   title="Monthly Performance"
 * />
 *
 * // Chart Data Formatting
 * const chartData = formatChartData([
 *   { label: "Q1", value: 100 },
 *   { label: "Q2", value: 120 },
 *   { label: "Q3", value: 110 },
 *   { label: "Q4", value: 140 }
 * ], { type: "bar" });
 */
