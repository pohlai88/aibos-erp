import {
  createPolymorphic,
  composeRefs as composeReferences,
  dataAttr as dataAttribute,
  ariaAttr as ariaAttribute,
  cn,
  createAccessibilityVariants,
  createDualModeStyles,
  createDualModeProps as createDualModeProperties,
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "../../utils";
import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Bar,
  Pie,
  Cell,
  Area,
  type TooltipProps,
} from "recharts";

/**
 * CHART COMPONENT SYSTEM
 * Real chart components with Recharts integration
 */
export interface ChartData {
  name: string;
  value: number;
  [key: string]: unknown;
}

export interface ChartProperties {
  data: ChartData[];
  width?: number | string;
  height?: number | string;
  className?: string;
}

export interface LineChartProperties extends ChartProperties {
  xAxisKey?: string;
  yAxisKey?: string;
  lines?: Array<{
    dataKey: string;
    stroke?: string;
    strokeWidth?: number;
  }>;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

export interface BarChartProperties extends ChartProperties {
  xAxisKey?: string;
  yAxisKey?: string;
  bars?: Array<{
    dataKey: string;
    fill?: string;
  }>;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

export interface PieChartProperties extends ChartProperties {
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

export interface AreaChartProperties extends ChartProperties {
  xAxisKey?: string;
  yAxisKey?: string;
  areas?: Array<{
    dataKey: string;
    fill?: string;
    stroke?: string;
  }>;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

// Chart Container Styles
const chartStyles = createAccessibilityVariants({
  beautiful: {
    base: "w-full",
  },
  wcagAAA: {
    base: "w-full",
  },
});

// Custom Tooltip Component
interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            <span
              className="inline-block w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}: {formatNumber(entry.value || 0)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Line Chart Component
export const LineChartComponent = createPolymorphic<"div", LineChartProperties>(
  (
    {
      as,
      data,
      width = "100%",
      height = 300,
      xAxisKey = "name",
      yAxisKey = "value",
      lines = [{ dataKey: "value", stroke: "#8884d8" }],
      showGrid = true,
      showLegend = true,
      showTooltip = true,
      className,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-chart": "line",
        "data-points": data.length,
        "data-lines": lines.length,
        "data-mode": "beautiful",
      },
      {
        "data-chart": "line",
        "data-points": data.length,
        "data-lines": lines.length,
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "img",
        "aria-label": `Line chart with ${data.length} data points`,
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(chartStyles(), className)}
        {...dataProperties}
        {...props}
      >
        <ResponsiveContainer width={width} height={height}>
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {lines.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth || 2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Tag>
    );
  },
  "LineChartComponent",
);

// Bar Chart Component
export const BarChartComponent = createPolymorphic<"div", BarChartProperties>(
  (
    {
      as,
      data,
      width = "100%",
      height = 300,
      xAxisKey = "name",
      yAxisKey = "value",
      bars = [{ dataKey: "value", fill: "#8884d8" }],
      showGrid = true,
      showLegend = true,
      showTooltip = true,
      className,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-chart": "bar",
        "data-points": data.length,
        "data-bars": bars.length,
        "data-mode": "beautiful",
      },
      {
        "data-chart": "bar",
        "data-points": data.length,
        "data-bars": bars.length,
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "img",
        "aria-label": `Bar chart with ${data.length} data points`,
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(chartStyles(), className)}
        {...dataProperties}
        {...props}
      >
        <ResponsiveContainer width={width} height={height}>
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {bars.map((bar, index) => (
              <Bar
                key={index}
                dataKey={bar.dataKey}
                fill={bar.fill}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Tag>
    );
  },
  "BarChartComponent",
);

// Pie Chart Component
export const PieChartComponent = createPolymorphic<"div", PieChartProperties>(
  (
    {
      as,
      data,
      width = "100%",
      height = 300,
      dataKey = "value",
      nameKey = "name",
      colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"],
      showLegend = true,
      showTooltip = true,
      innerRadius = 0,
      outerRadius = 80,
      className,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-chart": "pie",
        "data-points": data.length,
        "data-mode": "beautiful",
      },
      {
        "data-chart": "pie",
        "data-points": data.length,
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "img",
        "aria-label": `Pie chart with ${data.length} segments`,
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(chartStyles(), className)}
        {...dataProperties}
        {...props}
      >
        <ResponsiveContainer width={width} height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </Tag>
    );
  },
  "PieChartComponent",
);

// Area Chart Component
export const AreaChartComponent = createPolymorphic<"div", AreaChartProperties>(
  (
    {
      as,
      data,
      width = "100%",
      height = 300,
      xAxisKey = "name",
      yAxisKey = "value",
      areas = [{ dataKey: "value", fill: "#8884d8", stroke: "#8884d8" }],
      showGrid = true,
      showLegend = true,
      showTooltip = true,
      className,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-chart": "area",
        "data-points": data.length,
        "data-areas": areas.length,
        "data-mode": "beautiful",
      },
      {
        "data-chart": "area",
        "data-points": data.length,
        "data-areas": areas.length,
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "img",
        "aria-label": `Area chart with ${data.length} data points`,
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(chartStyles(), className)}
        {...dataProperties}
        {...props}
      >
        <ResponsiveContainer width={width} height={height}>
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {areas.map((area, index) => (
              <Area
                key={index}
                type="monotone"
                dataKey={area.dataKey}
                stackId="1"
                stroke={area.stroke}
                fill={area.fill}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Tag>
    );
  },
  "AreaChartComponent",
);

// Chart Wrapper Component
export interface ChartWrapperProperties {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

const chartWrapperStyles = createAccessibilityVariants({
  beautiful: {
    base: "bg-card border border-border rounded-lg p-4 shadow-sm",
  },
  wcagAAA: {
    base: "bg-card border-2 border-border rounded-lg p-4 shadow-md",
  },
});

export const ChartWrapper = createPolymorphic<"div", ChartWrapperProperties>(
  ({ as, title, description, children, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(chartWrapperStyles(), className)}
        {...props}
      >
        {(title || description) && (
          <div className="mb-4">
            {title && (
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        {children}
      </Tag>
    );
  },
  "ChartWrapper",
);

// Legacy export for backward compatibility
export const chartVariants = chartStyles;
