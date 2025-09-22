import {
  cn,
  createPolymorphic,
  type PolymorphicProps as PolymorphicProperties,
  type PolymorphicRef as PolymorphicReference,
  createDualModeStyles,
  createAccessibilityVariants,
  variants,
} from "../../utils";
import * as React from "react";

// Workflow Builder Types
export interface WorkflowBuilderComponentProperties {
  /** Workflow configuration */
  workflow?: WorkflowConfiguration;
  /** Callback when workflow changes */
  onWorkflowChange?: (workflow: WorkflowConfiguration) => void;
  /** Callback when workflow is saved */
  onWorkflowSave?: (workflow: WorkflowConfiguration) => void;
  /** Callback when workflow is published */
  onWorkflowPublish?: (workflow: WorkflowConfiguration) => void;
  /** Whether to show toolbar */
  showToolbar?: boolean;
  /** Whether to show sidebar */
  showSidebar?: boolean;
  /** Whether to show properties panel */
  showPropertiesPanel?: boolean;
  /** Whether to enable drag and drop */
  enableDragDrop?: boolean;
  /** Whether to enable undo/redo */
  enableUndoRedo?: boolean;
  /** Whether to enable analytics */
  enableAnalytics?: boolean;
  /** Analytics callback */
  onAnalytics?: (event: WorkflowBuilderAnalyticsEvent) => void;
  /** Custom class name */
  className?: string;
}

export interface WorkflowConfiguration {
  /** Workflow ID */
  id: string;
  /** Workflow name */
  name: string;
  /** Workflow description */
  description?: string;
  /** Workflow nodes */
  nodes: WorkflowNode[];
  /** Workflow edges */
  edges: WorkflowEdge[];
  /** Workflow settings */
  settings: WorkflowSettings;
  /** Workflow variables */
  variables: WorkflowVariable[];
  /** Workflow triggers */
  triggers: WorkflowTrigger[];
  /** Workflow actions */
  actions: WorkflowAction[];
  /** Workflow conditions */
  conditions: WorkflowCondition[];
  /** Workflow metadata */
  metadata: WorkflowMetadata;
}

export interface WorkflowNode {
  /** Node ID */
  id: string;
  /** Node type */
  type: WorkflowNodeType;
  /** Node label */
  label: string;
  /** Node description */
  description?: string;
  /** Node position */
  position: WorkflowPosition;
  /** Node size */
  size: WorkflowSize;
  /** Node data */
  data: Record<string, unknown>;
  /** Node style */
  style?: WorkflowNodeStyle;
  /** Node selected */
  selected?: boolean;
  /** Node disabled */
  disabled?: boolean;
  /** Node collapsed */
  collapsed?: boolean;
}

export interface WorkflowNodeType {
  /** Node type name */
  name: string;
  /** Node type category */
  category: "trigger" | "action" | "condition" | "gateway" | "event" | "subprocess";
  /** Node type icon */
  icon?: React.ReactNode;
  /** Node type description */
  description?: string;
  /** Node type component */
  component?: React.ComponentType<any>;
  /** Node type properties */
  properties?: Record<string, unknown>;
  /** Node type inputs */
  inputs?: WorkflowNodePort[];
  /** Node type outputs */
  outputs?: WorkflowNodePort[];
}

export interface WorkflowNodePort {
  /** Port ID */
  id: string;
  /** Port label */
  label: string;
  /** Port type */
  type: "string" | "number" | "boolean" | "object" | "array" | "any";
  /** Port required */
  required?: boolean;
  /** Port default value */
  defaultValue?: unknown;
}

export interface WorkflowEdge {
  /** Edge ID */
  id: string;
  /** Edge source node */
  source: string;
  /** Edge target node */
  target: string;
  /** Edge source port */
  sourcePort?: string;
  /** Edge target port */
  targetPort?: string;
  /** Edge label */
  label?: string;
  /** Edge style */
  style?: WorkflowEdgeStyle;
  /** Edge selected */
  selected?: boolean;
  /** Edge disabled */
  disabled?: boolean;
}

export interface WorkflowPosition {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
}

export interface WorkflowSize {
  /** Width */
  width: number;
  /** Height */
  height: number;
}

export interface WorkflowNodeStyle {
  /** Background color */
  backgroundColor?: string;
  /** Border color */
  borderColor?: string;
  /** Text color */
  textColor?: string;
  /** Border width */
  borderWidth?: number;
  /** Border radius */
  borderRadius?: number;
  /** Font size */
  fontSize?: number;
  /** Font weight */
  fontWeight?: string;
}

export interface WorkflowEdgeStyle {
  /** Stroke color */
  strokeColor?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Stroke dash array */
  strokeDashArray?: string;
  /** Arrow color */
  arrowColor?: string;
  /** Arrow size */
  arrowSize?: number;
}

export interface WorkflowSettings {
  /** Workflow name */
  name: string;
  /** Workflow description */
  description?: string;
  /** Workflow version */
  version?: string;
  /** Workflow author */
  author?: string;
  /** Workflow tags */
  tags?: string[];
  /** Workflow category */
  category?: string;
  /** Workflow status */
  status?: "draft" | "published" | "archived";
  /** Workflow visibility */
  visibility?: "public" | "private" | "team";
  /** Workflow execution mode */
  executionMode?: "manual" | "automatic" | "scheduled";
  /** Workflow timeout */
  timeout?: number;
  /** Workflow retry count */
  retryCount?: number;
  /** Workflow retry delay */
  retryDelay?: number;
}

export interface WorkflowVariable {
  /** Variable ID */
  id: string;
  /** Variable name */
  name: string;
  /** Variable type */
  type: "string" | "number" | "boolean" | "object" | "array";
  /** Variable value */
  value?: unknown;
  /** Variable description */
  description?: string;
  /** Variable required */
  required?: boolean;
  /** Variable scope */
  scope?: "global" | "local" | "input" | "output";
}

export interface WorkflowTrigger {
  /** Trigger ID */
  id: string;
  /** Trigger type */
  type: "webhook" | "schedule" | "event" | "manual" | "api";
  /** Trigger name */
  name: string;
  /** Trigger description */
  description?: string;
  /** Trigger configuration */
  configuration: Record<string, unknown>;
  /** Trigger enabled */
  enabled?: boolean;
}

export interface WorkflowAction {
  /** Action ID */
  id: string;
  /** Action type */
  type: "http" | "email" | "database" | "file" | "notification" | "custom";
  /** Action name */
  name: string;
  /** Action description */
  description?: string;
  /** Action configuration */
  configuration: Record<string, unknown>;
  /** Action enabled */
  enabled?: boolean;
}

export interface WorkflowCondition {
  /** Condition ID */
  id: string;
  /** Condition type */
  type: "if" | "switch" | "loop" | "try-catch";
  /** Condition name */
  name: string;
  /** Condition description */
  description?: string;
  /** Condition expression */
  expression: string;
  /** Condition enabled */
  enabled?: boolean;
}

export interface WorkflowMetadata {
  /** Workflow created date */
  createdAt: Date;
  /** Workflow updated date */
  updatedAt: Date;
  /** Workflow created by */
  createdBy: string;
  /** Workflow updated by */
  updatedBy: string;
  /** Workflow version */
  version: string;
  /** Workflow tags */
  tags: string[];
  /** Workflow category */
  category?: string;
}

export interface WorkflowBuilderAnalyticsEvent {
  type: "workflow_create" | "workflow_update" | "workflow_save" | "workflow_publish" | "node_add" | "node_remove" | "node_update" | "node_move" | "node_resize" | "edge_add" | "edge_remove" | "edge_update" | "preview_open" | "preview_close";
  payload: {
    workflowId?: string;
    nodeId?: string;
    nodeType?: string;
    edgeId?: string;
    timestamp: number;
  };
}

// Default workflow node types
export const defaultWorkflowNodeTypes: WorkflowNodeType[] = [
  {
    name: "start",
    category: "trigger",
    description: "Workflow start node",
    inputs: [],
    outputs: [{ id: "output", label: "Output", type: "any" }],
  },
  {
    name: "end",
    category: "trigger",
    description: "Workflow end node",
    inputs: [{ id: "input", label: "Input", type: "any" }],
    outputs: [],
  },
  {
    name: "http-request",
    category: "action",
    description: "HTTP request action",
    inputs: [{ id: "input", label: "Input", type: "any" }],
    outputs: [{ id: "output", label: "Output", type: "any" }],
  },
  {
    name: "email",
    category: "action",
    description: "Send email action",
    inputs: [{ id: "input", label: "Input", type: "any" }],
    outputs: [{ id: "output", label: "Output", type: "any" }],
  },
  {
    name: "condition",
    category: "condition",
    description: "Conditional logic",
    inputs: [{ id: "input", label: "Input", type: "any" }],
    outputs: [
      { id: "true", label: "True", type: "any" },
      { id: "false", label: "False", type: "any" },
    ],
  },
  {
    name: "delay",
    category: "action",
    description: "Delay execution",
    inputs: [{ id: "input", label: "Input", type: "any" }],
    outputs: [{ id: "output", label: "Output", type: "any" }],
  },
  {
    name: "webhook",
    category: "trigger",
    description: "Webhook trigger",
    inputs: [],
    outputs: [{ id: "output", label: "Output", type: "any" }],
  },
  {
    name: "schedule",
    category: "trigger",
    description: "Scheduled trigger",
    inputs: [],
    outputs: [{ id: "output", label: "Output", type: "any" }],
  },
];

// Styles for Workflow Builder
const workflowBuilderStyles = variants({
  base: "flex h-full w-full bg-background",
  variants: {
    variant: {
      default: "border border-border",
      minimal: "border-none",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const workflowBuilderToolbarStyles = variants({
  base: "flex items-center justify-between p-4 border-b border-border bg-muted/50",
  variants: {
    variant: {
      default: "bg-muted/50",
      minimal: "bg-muted/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const workflowBuilderSidebarStyles = variants({
  base: "w-80 border-r border-border bg-muted/30 overflow-y-auto",
  variants: {
    variant: {
      default: "bg-muted/30",
      minimal: "bg-muted/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const workflowBuilderCanvasStyles = variants({
  base: "flex-1 relative bg-background overflow-hidden",
  variants: {
    variant: {
      default: "bg-background",
      minimal: "bg-background/95",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const workflowBuilderPropertiesStyles = variants({
  base: "w-80 border-l border-border bg-muted/30 overflow-y-auto",
  variants: {
    variant: {
      default: "bg-muted/30",
      minimal: "bg-muted/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const workflowNodeStyles = variants({
  base: "absolute border border-border rounded-lg bg-card shadow-sm cursor-pointer transition-all",
  variants: {
    variant: {
      default: "border-border",
      selected: "border-primary ring-2 ring-primary/20",
      disabled: "opacity-50 cursor-not-allowed",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const workflowEdgeStyles = variants({
  base: "stroke-border stroke-2 fill-none",
  variants: {
    variant: {
      default: "stroke-border",
      selected: "stroke-primary",
      disabled: "stroke-muted-foreground opacity-50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Workflow Builder Component
export const WorkflowBuilder = createPolymorphic<"div", WorkflowBuilderComponentProperties>(
  ({
    as,
    workflow,
    onWorkflowChange,
    onWorkflowSave,
    onWorkflowPublish,
    showToolbar = true,
    showSidebar = true,
    showPropertiesPanel = true,
    enableDragDrop = true,
    enableUndoRedo = true,
    enableAnalytics = false,
    onAnalytics,
    className,
    ...props
  }: PolymorphicProperties<"div", WorkflowBuilderComponentProperties>, ref: PolymorphicReference<"div">) => {
    const [currentWorkflow, setCurrentWorkflow] = React.useState<WorkflowConfiguration>(
      workflow || {
        id: "new-workflow",
        name: "New Workflow",
        description: "",
        nodes: [],
        edges: [],
        settings: {
          name: "New Workflow",
          description: "",
          version: "1.0.0",
          author: "user",
          tags: [],
          category: "general",
          status: "draft",
          visibility: "private",
          executionMode: "manual",
          timeout: 300000,
          retryCount: 3,
          retryDelay: 1000,
        },
        variables: [],
        triggers: [],
        actions: [],
        conditions: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: "user",
          updatedBy: "user",
          version: "1.0.0",
          tags: [],
          category: "general",
        },
      }
    );

    const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
    const [selectedEdge, setSelectedEdge] = React.useState<string | null>(null);
    const [draggedNodeType, setDraggedNodeType] = React.useState<WorkflowNodeType | null>(null);
    const [undoStack, setUndoStack] = React.useState<WorkflowConfiguration[]>([]);
    const [redoStack, setRedoStack] = React.useState<WorkflowConfiguration[]>([]);
    const [canvasOffset, setCanvasOffset] = React.useState({ x: 0, y: 0 });
    const [canvasZoom, setCanvasZoom] = React.useState(1);

    // Update workflow
    const updateWorkflow = React.useCallback((newWorkflow: WorkflowConfiguration) => {
      setCurrentWorkflow(newWorkflow);
      onWorkflowChange?.(newWorkflow);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "workflow_update",
          payload: { workflowId: newWorkflow.id, timestamp: Date.now() },
        });
      }
    }, [onWorkflowChange, enableAnalytics, onAnalytics]);

    // Add node
    const addNode = React.useCallback((nodeType: WorkflowNodeType, position: WorkflowPosition) => {
      const newNode: WorkflowNode = {
        id: `node-${Date.now()}`,
        type: nodeType,
        label: nodeType.name.charAt(0).toUpperCase() + nodeType.name.slice(1),
        position,
        size: { width: 120, height: 60 },
        data: {},
        selected: false,
        disabled: false,
        collapsed: false,
      };

      const newWorkflow = {
        ...currentWorkflow,
        nodes: [...currentWorkflow.nodes, newNode],
        metadata: {
          ...currentWorkflow.metadata,
          updatedAt: new Date(),
          updatedBy: "user",
        },
      };

      // Add to undo stack
      if (enableUndoRedo) {
        setUndoStack(prev => [...prev, currentWorkflow]);
        setRedoStack([]);
      }

      updateWorkflow(newWorkflow);

      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "node_add",
          payload: { workflowId: currentWorkflow.id, nodeId: newNode.id, nodeType: nodeType.name, timestamp: Date.now() },
        });
      }
    }, [currentWorkflow, updateWorkflow, enableUndoRedo, enableAnalytics, onAnalytics]);

    // Remove node
    const removeNode = React.useCallback((nodeId: string) => {
      const newWorkflow = {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.filter(node => node.id !== nodeId),
        edges: currentWorkflow.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
        metadata: {
          ...currentWorkflow.metadata,
          updatedAt: new Date(),
          updatedBy: "user",
        },
      };

      // Add to undo stack
      if (enableUndoRedo) {
        setUndoStack(prev => [...prev, currentWorkflow]);
        setRedoStack([]);
      }

      updateWorkflow(newWorkflow);

      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "node_remove",
          payload: { workflowId: currentWorkflow.id, nodeId, timestamp: Date.now() },
        });
      }
    }, [currentWorkflow, updateWorkflow, enableUndoRedo, enableAnalytics, onAnalytics]);

    // Update node
    const updateNode = React.useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
      const newWorkflow = {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.map(node =>
          node.id === nodeId ? { ...node, ...updates } : node
        ),
        metadata: {
          ...currentWorkflow.metadata,
          updatedAt: new Date(),
          updatedBy: "user",
        },
      };

      // Add to undo stack
      if (enableUndoRedo) {
        setUndoStack(prev => [...prev, currentWorkflow]);
        setRedoStack([]);
      }

      updateWorkflow(newWorkflow);

      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "node_update",
          payload: { workflowId: currentWorkflow.id, nodeId, timestamp: Date.now() },
        });
      }
    }, [currentWorkflow, updateWorkflow, enableUndoRedo, enableAnalytics, onAnalytics]);

    // Add edge
    const addEdge = React.useCallback((source: string, target: string, sourcePort?: string, targetPort?: string) => {
      const newEdge: WorkflowEdge = {
        id: `edge-${Date.now()}`,
        source,
        target,
        sourcePort,
        targetPort,
        selected: false,
        disabled: false,
      };

      const newWorkflow = {
        ...currentWorkflow,
        edges: [...currentWorkflow.edges, newEdge],
        metadata: {
          ...currentWorkflow.metadata,
          updatedAt: new Date(),
          updatedBy: "user",
        },
      };

      // Add to undo stack
      if (enableUndoRedo) {
        setUndoStack(prev => [...prev, currentWorkflow]);
        setRedoStack([]);
      }

      updateWorkflow(newWorkflow);

      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "edge_add",
          payload: { workflowId: currentWorkflow.id, edgeId: newEdge.id, timestamp: Date.now() },
        });
      }
    }, [currentWorkflow, updateWorkflow, enableUndoRedo, enableAnalytics, onAnalytics]);

    // Remove edge
    const removeEdge = React.useCallback((edgeId: string) => {
      const newWorkflow = {
        ...currentWorkflow,
        edges: currentWorkflow.edges.filter(edge => edge.id !== edgeId),
        metadata: {
          ...currentWorkflow.metadata,
          updatedAt: new Date(),
          updatedBy: "user",
        },
      };

      // Add to undo stack
      if (enableUndoRedo) {
        setUndoStack(prev => [...prev, currentWorkflow]);
        setRedoStack([]);
      }

      updateWorkflow(newWorkflow);

      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "edge_remove",
          payload: { workflowId: currentWorkflow.id, edgeId, timestamp: Date.now() },
        });
      }
    }, [currentWorkflow, updateWorkflow, enableUndoRedo, enableAnalytics, onAnalytics]);

    // Save workflow
    const saveWorkflow = React.useCallback(() => {
      onWorkflowSave?.(currentWorkflow);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "workflow_save",
          payload: { workflowId: currentWorkflow.id, timestamp: Date.now() },
        });
      }
    }, [currentWorkflow, onWorkflowSave, enableAnalytics, onAnalytics]);

    // Publish workflow
    const publishWorkflow = React.useCallback(() => {
      onWorkflowPublish?.(currentWorkflow);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "workflow_publish",
          payload: { workflowId: currentWorkflow.id, timestamp: Date.now() },
        });
      }
    }, [currentWorkflow, onWorkflowPublish, enableAnalytics, onAnalytics]);

    // Undo
    const undo = React.useCallback(() => {
      if (undoStack.length === 0) return;

      const previousWorkflow = undoStack[undoStack.length - 1];
      if (previousWorkflow) {
        setRedoStack(prev => [...prev, currentWorkflow]);
        setUndoStack(prev => prev.slice(0, -1));
        setCurrentWorkflow(previousWorkflow);
      }
    }, [undoStack, currentWorkflow]);

    // Redo
    const redo = React.useCallback(() => {
      if (redoStack.length === 0) return;

      const nextWorkflow = redoStack[redoStack.length - 1];
      if (nextWorkflow) {
        setUndoStack(prev => [...prev, currentWorkflow]);
        setRedoStack(prev => prev.slice(0, -1));
        setCurrentWorkflow(nextWorkflow);
      }
    }, [redoStack, currentWorkflow]);

    // Render node
    const renderNode = React.useCallback((node: WorkflowNode) => {
      return (
        <div
          key={node.id}
          className={cn(
            workflowNodeStyles({
              variant: node.selected ? "selected" : node.disabled ? "disabled" : "default",
            })
          )}
          style={{
            left: node.position.x,
            top: node.position.y,
            width: node.size.width,
            height: node.size.height,
          }}
          onClick={() => setSelectedNode(node.id)}
        >
          <div className="p-2">
            <div className="text-sm font-medium text-foreground">{node.label}</div>
            <div className="text-xs text-muted-foreground">{node.type.name}</div>
          </div>
        </div>
      );
    }, []);

    // Render edge
    const renderEdge = React.useCallback((edge: WorkflowEdge) => {
      const sourceNode = currentWorkflow.nodes.find(node => node.id === edge.source);
      const targetNode = currentWorkflow.nodes.find(node => node.id === edge.target);
      
      if (!sourceNode || !targetNode) return null;

      const startX = sourceNode.position.x + sourceNode.size.width / 2;
      const startY = sourceNode.position.y + sourceNode.size.height / 2;
      const endX = targetNode.position.x + targetNode.size.width / 2;
      const endY = targetNode.position.y + targetNode.size.height / 2;

      return (
        <svg
          key={edge.id}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <path
            d={`M ${startX} ${startY} L ${endX} ${endY}`}
            className={cn(
              workflowEdgeStyles({
                variant: edge.selected ? "selected" : edge.disabled ? "disabled" : "default",
              })
            )}
            markerEnd="url(#arrowhead)"
          />
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="currentColor"
              />
            </marker>
          </defs>
        </svg>
      );
    }, [currentWorkflow.nodes]);

    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn(workflowBuilderStyles({ variant: "default" }), className)}
        {...props}
      >
        {/* Toolbar */}
        {showToolbar && (
          <div className={cn(workflowBuilderToolbarStyles({ variant: "default" }))}>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">{currentWorkflow.name}</h1>
              <span className="text-sm text-muted-foreground">
                {currentWorkflow.nodes.length} node{currentWorkflow.nodes.length !== 1 ? 's' : ''}, {currentWorkflow.edges.length} edge{currentWorkflow.edges.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {enableUndoRedo && (
                <>
                  <button
                    onClick={undo}
                    disabled={undoStack.length === 0}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Undo
                  </button>
                  <button
                    onClick={redo}
                    disabled={redoStack.length === 0}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Redo
                  </button>
                </>
              )}
              <button
                onClick={saveWorkflow}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Save
              </button>
              <button
                onClick={publishWorkflow}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Publish
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {showSidebar && (
            <div className={cn(workflowBuilderSidebarStyles({ variant: "default" }))}>
              <div className="p-4">
                <h2 className="text-sm font-medium text-foreground mb-3">Workflow Nodes</h2>
                <div className="space-y-2">
                  {defaultWorkflowNodeTypes.map(nodeType => (
                    <div
                      key={nodeType.name}
                      className="p-3 border border-border rounded cursor-pointer hover:bg-accent/50 transition-colors"
                      draggable={enableDragDrop}
                      onDragStart={() => setDraggedNodeType(nodeType)}
                      onClick={() => addNode(nodeType, { x: 100, y: 100 })}
                    >
                      <div className="text-sm font-medium text-foreground">{nodeType.name}</div>
                      <div className="text-xs text-muted-foreground">{nodeType.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Canvas */}
          <div className={cn(workflowBuilderCanvasStyles({ variant: "default" }))}>
            <div className="relative w-full h-full">
              {/* Edges */}
              {currentWorkflow.edges.map(renderEdge)}
              
              {/* Nodes */}
              {currentWorkflow.nodes.map(renderNode)}
            </div>
          </div>

          {/* Properties Panel */}
          {showPropertiesPanel && (
            <div className={cn(workflowBuilderPropertiesStyles({ variant: "default" }))}>
              <div className="p-4">
                <h2 className="text-sm font-medium text-foreground mb-3">Properties</h2>
                {selectedNode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Node ID</label>
                      <div className="text-sm text-foreground">{selectedNode}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Node Type</label>
                      <div className="text-sm text-foreground">
                        {currentWorkflow.nodes.find(n => n.id === selectedNode)?.type.name}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Position</label>
                      <div className="text-sm text-foreground">
                        {currentWorkflow.nodes.find(n => n.id === selectedNode)?.position.x}, {currentWorkflow.nodes.find(n => n.id === selectedNode)?.position.y}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Select a node to view properties</div>
                )}
              </div>
            </div>
          )}
        </div>
      </Component>
    );
  },
  "WorkflowBuilder"
);

// Export styles for external use
export const workflowBuilderVariants = {
  workflowBuilderStyles,
  workflowBuilderToolbarStyles,
  workflowBuilderSidebarStyles,
  workflowBuilderCanvasStyles,
  workflowBuilderPropertiesStyles,
  workflowNodeStyles,
  workflowEdgeStyles,
};
