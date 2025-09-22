import {
  ERPDashboard,
  ERPKPISection,
  ERPDataTable,
  ERPSearchSection,
  ERPActionBar,
  ERPFormSection,
  ERPStatusBadge,
  ERPMobileNav,
} from "./erp-components";
import * as React from "react";
// Note: These imports will be available once components are fully implemented
// Force TypeScript to re-parse this file
// import {
//   AccessibilityToggle,
//   generateTrendData,
//   formatChartData,
// } from "../index";

/**
 * 🎯 DEMO COMPONENTS
 * Complete examples showing how to utilize our wrapper system
 * Demonstrates the power of our market-dominating utilities
 */

// Complete Dashboard Demo
export const CompleteDashboardDemo = () => {
  // Sample KPI data
  const kpiMetrics = [
    {
      label: "Total Revenue",
      value: 1_250_000,
      format: "currency" as const,
      change: 50_000,
      changePercent: 4.2,
      trend: "up" as const,
    },
    {
      label: "Active Customers",
      value: 2847,
      format: "number" as const,
      change: 127,
      changePercent: 4.7,
      trend: "up" as const,
    },
    {
      label: "Order Completion Rate",
      value: 94.5,
      format: "percentage" as const,
      change: 2.1,
      changePercent: 2.3,
      trend: "up" as const,
    },
    {
      label: "Inventory Turnover",
      value: 8.2,
      format: "number" as const,
      change: -0.3,
      changePercent: -3.5,
      trend: "down" as const,
    },
  ];

  // Sample order data
  const orderData = [
    {
      id: "ORD-001",
      customer: "Acme Corp",
      amount: 15_000,
      status: "completed",
      date: "2024-01-15",
    },
    {
      id: "ORD-002",
      customer: "TechStart Inc",
      amount: 8500,
      status: "processing",
      date: "2024-01-14",
    },
    {
      id: "ORD-003",
      customer: "Global Ltd",
      amount: 22_000,
      status: "pending",
      date: "2024-01-13",
    },
    {
      id: "ORD-004",
      customer: "Innovation Co",
      amount: 12_000,
      status: "completed",
      date: "2024-01-12",
    },
    {
      id: "ORD-005",
      customer: "Future Systems",
      amount: 18_500,
      status: "processing",
      date: "2024-01-11",
    },
  ];

  const orderColumns = [
    { key: "id", header: "Order ID", format: "text" as const },
    { key: "customer", header: "Customer", format: "text" as const },
    {
      key: "amount",
      header: "Amount",
      format: "currency" as const,
      align: "right" as const,
    },
    { key: "status", header: "Status", format: "text" as const },
    { key: "date", header: "Date", format: "date" as const },
  ];

  // Sample search suggestions
  const searchSuggestions = [
    { text: "Acme Corp", type: "recent" as const, count: 15 },
    { text: "ORD-001", type: "recent" as const, count: 1 },
    { text: "TechStart Inc", type: "popular" as const, count: 8 },
    { text: "Global Ltd", type: "autocomplete" as const, count: 3 },
  ];

  // Sample action buttons
  const actionButtons = [
    {
      label: "New Order",
      variant: "primary" as const,
      onClick: () => console.log("New Order"),
    },
    {
      label: "Export Data",
      variant: "secondary" as const,
      onClick: () => console.log("Export"),
    },
    {
      label: "Refresh",
      variant: "ghost" as const,
      onClick: () => console.log("Refresh"),
    },
  ];

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
  };

  const handleRowClick = (row: unknown) => {
    console.log("Row clicked:", row);
  };

  return (
    <ERPDashboard title="Executive Dashboard">
      {/* KPI Section */}
      <ERPKPISection metrics={kpiMetrics} />

      {/* Search Section */}
      <ERPSearchSection
        onSearch={handleSearch}
        suggestions={searchSuggestions}
      />

      {/* Action Bar */}
      <ERPActionBar actions={actionButtons} />

      {/* Data Table */}
      <ERPDataTable
        title="Recent Orders"
        data={orderData}
        columns={orderColumns}
        onRowClick={handleRowClick}
      />
    </ERPDashboard>
  );
};

// Form Demo
export const FormDemo = () => {
  const orderFields = [
    {
      name: "customerName",
      label: "Customer Name",
      type: "text" as const,
      value: "",
      onChange: () => {},
      required: true,
    },
    {
      name: "orderAmount",
      label: "Order Amount",
      type: "number" as const,
      value: "",
      onChange: () => {},
      required: true,
    },
    {
      name: "orderDate",
      label: "Order Date",
      type: "date" as const,
      value: "",
      onChange: () => {},
      required: true,
    },
    {
      name: "priority",
      label: "Priority",
      type: "select" as const,
      value: "",
      onChange: () => {},
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "urgent", label: "Urgent" },
      ],
    },
  ];

  const handleSubmit = (data: unknown) => {
    console.log("Form submitted:", data);
  };

  return (
    <ERPFormSection
      title="Create New Order"
      fields={orderFields}
      onSubmit={handleSubmit}
    />
  );
};

// Status Badge Demo
export const StatusBadgeDemo = () => {
  const statuses = [
    "pending",
    "processing",
    "completed",
    "cancelled",
    "approved",
    "rejected",
  ] as const;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Status Badges</h3>
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <ERPStatusBadge key={status} status={status} />
        ))}
      </div>
    </div>
  );
};

// Mobile Navigation Demo
export const MobileNavDemo = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Mobile Navigation</h3>
      <ERPMobileNav activeItem="/orders" />
    </div>
  );
};

// Accessibility Demo
export const AccessibilityDemo = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Accessibility Toggle</h3>
      <p className="text-sm text-muted-foreground">
        Toggle between Beautiful and WCAG AAA modes to see the difference in
        real-time.
      </p>
      <div>AccessibilityToggle (placeholder)</div>
    </div>
  );
};

// Complete Demo Page
export const CompleteDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              AI-BOS ERP UI Demo
            </h1>
            <div>AccessibilityToggle (placeholder)</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Dashboard Demo */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Complete Dashboard</h2>
          <CompleteDashboardDemo />
        </section>

        {/* Form Demo */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Form Example</h2>
          <FormDemo />
        </section>

        {/* Status Badge Demo */}
        <section>
          <StatusBadgeDemo />
        </section>

        {/* Mobile Navigation Demo */}
        <section>
          <MobileNavDemo />
        </section>

        {/* Accessibility Demo */}
        <section>
          <AccessibilityDemo />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            AI-BOS ERP UI System - Market Dominating Utilities
          </p>
        </div>
      </footer>
    </div>
  );
};

/**
 * USAGE EXAMPLES:
 *
 * // Import and use complete demos
 * import { CompleteDashboardDemo, FormDemo, StatusBadgeDemo } from "@aibos/ui";
 *
 * // Use in your app
 * <CompleteDashboardDemo />
 * <FormDemo />
 * <StatusBadgeDemo />
 *
 * // Or use individual ERP components
 * import { ERPDashboard, ERPKPISection } from "@aibos/ui";
 *
 * <ERPDashboard title="My Dashboard">
 *   <ERPKPISection metrics={myMetrics} />
 * </ERPDashboard>
 */
