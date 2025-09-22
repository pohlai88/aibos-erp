// SCALABLE UI SYSTEM - TREE-SHAKABLE EXPORTS
// Multiple entry points for optimal bundle size

import * as React from "react";

// Core utilities and foundations
export * from "./core";

// Primitive UI components - Basic building blocks
export * from "./primitives";

// Layout components - Grid, Flexbox, Containers, Sidebars, etc.
export * from "./layout";

// Navigation components - Navbar, Tabs, Breadcrumbs, Pagination, Command Palette
export * from "./navigation";

// Data components - Tables, Charts, KPIs, Data Grids
export * from "./data";

// Form components - Forms, Form Builder, Validation
export * from "./forms";

// Feedback components - Alerts, Toasts, Notifications, Loading states
export * from "./feedback";

// Overlay components - Modals, Popovers, Tooltips, Dropdowns
export * from "./overlay";

// Interaction components - Command Palette, Drag & Drop, Keyboard, Gestures, Motion
export * from "./interaction";

// Density components - Density System, Density Controls, Density Presets
export * from "./density";

// Business components - Workflow, Reports, Dashboard, Analytics
export * from "./business";

// Collaboration components - Chat, Comments, Mentions, File Sharing
export * from "./collaboration";

// Accessibility components - Accessibility Toggle, Focus Trap, Screen Reader
export * from "./accessibility";

// Media components - Print, Responsive
export * from "./media";

// Density system - Density Provider, Density Toggle
export * from "./density";

// Undo/Redo system - Undo Redo, History Manager
export * from "./undo-redo";

// Icon system - Icon, Icon Button, Icon Text, Icon Map
export * from "./icons";

// Wrapper systems - Smart Wrapper, Component Factory
export * from "./wrappers";

// Styles - Global CSS, Component CSS
// Note: Styles are handled separately by the build system

// Placeholder components for demo purposes
export const SmartWrapper = () => null;
export const QuickCard = () => null;
export const QuickButton = () => null;
export const QuickInput = () => null;
export const QuickText = () => null;
export const ResponsiveContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => React.createElement("div", null, children);
export const TouchButton = () => null;
export const MobileNav = () => null;
