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

// Form Builder Types
export interface FormBuilderComponentProperties {
  /** Form configuration */
  form?: FormConfiguration;
  /** Callback when form changes */
  onFormChange?: (form: FormConfiguration) => void;
  /** Callback when form is saved */
  onFormSave?: (form: FormConfiguration) => void;
  /** Callback when form is published */
  onFormPublish?: (form: FormConfiguration) => void;
  /** Whether to show toolbar */
  showToolbar?: boolean;
  /** Whether to show sidebar */
  showSidebar?: boolean;
  /** Whether to show preview */
  showPreview?: boolean;
  /** Whether to enable drag and drop */
  enableDragDrop?: boolean;
  /** Whether to enable undo/redo */
  enableUndoRedo?: boolean;
  /** Whether to enable analytics */
  enableAnalytics?: boolean;
  /** Analytics callback */
  onAnalytics?: (event: FormBuilderAnalyticsEvent) => void;
  /** Custom class name */
  className?: string;
}

export interface FormConfiguration {
  /** Form ID */
  id: string;
  /** Form title */
  title: string;
  /** Form description */
  description?: string;
  /** Form fields */
  fields: FormBuilderField[];
  /** Form settings */
  settings: FormSettings;
  /** Form validation rules */
  validation: FormValidation;
  /** Form styling */
  styling: FormStyling;
  /** Form accessibility */
  accessibility: FormAccessibility;
  /** Form analytics */
  analytics: FormAnalytics;
  /** Form metadata */
  metadata: FormMetadata;
}

export interface FormBuilderField {
  /** Field ID */
  id: string;
  /** Field type */
  type: FormFieldType;
  /** Field label */
  label: string;
  /** Field placeholder */
  placeholder?: string;
  /** Field description */
  description?: string;
  /** Field validation */
  validation?: FieldValidation;
  /** Field styling */
  styling?: FieldStyling;
  /** Field position */
  position: FormPosition;
  /** Field size */
  size: FormSize;
  /** Field visibility */
  visibility: FieldVisibility;
  /** Field dependencies */
  dependencies?: FieldDependency[];
  /** Field options (for select, radio, checkbox) */
  options?: FormFieldOption[];
  /** Field default value */
  defaultValue?: unknown;
  /** Field required */
  required?: boolean;
  /** Field disabled */
  disabled?: boolean;
  /** Field readonly */
  readonly?: boolean;
}

export interface FormFieldType {
  /** Field type name */
  name: string;
  /** Field type category */
  category: "input" | "selection" | "layout" | "media" | "advanced";
  /** Field type icon */
  icon?: React.ReactNode;
  /** Field type description */
  description?: string;
  /** Field type component */
  component?: React.ComponentType<any>;
  /** Field type properties */
  properties?: Record<string, unknown>;
}

export interface FormFieldOption {
  /** Option label */
  label: string;
  /** Option value */
  value: string | number;
  /** Option description */
  description?: string;
  /** Option disabled */
  disabled?: boolean;
}

export interface FormPosition {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Z index */
  z: number;
}

export interface FormSize {
  /** Width */
  width: number;
  /** Height */
  height: number;
}

export interface FieldValidation {
  /** Required validation */
  required?: boolean;
  /** Minimum length */
  minLength?: number;
  /** Maximum length */
  maxLength?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Pattern validation */
  pattern?: string;
  /** Custom validation function */
  custom?: (value: unknown) => string | null;
}

export interface FieldStyling {
  /** Field width */
  width?: string;
  /** Field height */
  height?: string;
  /** Field margin */
  margin?: string;
  /** Field padding */
  padding?: string;
  /** Field border */
  border?: string;
  /** Field background */
  background?: string;
  /** Field color */
  color?: string;
  /** Field font size */
  fontSize?: string;
  /** Field font weight */
  fontWeight?: string;
}

export interface FieldVisibility {
  /** Always visible */
  always?: boolean;
  /** Visible when */
  when?: FieldCondition[];
  /** Hidden when */
  hiddenWhen?: FieldCondition[];
}

export interface FieldCondition {
  /** Field ID to check */
  fieldId: string;
  /** Condition operator */
  operator: "equals" | "notEquals" | "contains" | "notContains" | "greaterThan" | "lessThan" | "isEmpty" | "isNotEmpty";
  /** Condition value */
  value: unknown;
}

export interface FieldDependency {
  /** Dependent field ID */
  fieldId: string;
  /** Dependency type */
  type: "show" | "hide" | "enable" | "disable" | "require" | "optional";
  /** Dependency condition */
  condition: FieldCondition;
}

export interface FormSettings {
  /** Form title */
  title: string;
  /** Form description */
  description?: string;
  /** Form submit button text */
  submitButtonText?: string;
  /** Form reset button text */
  resetButtonText?: string;
  /** Form submit action */
  submitAction?: FormSubmitAction;
  /** Form redirect URL */
  redirectUrl?: string;
  /** Form success message */
  successMessage?: string;
  /** Form error message */
  errorMessage?: string;
  /** Form auto-save */
  autoSave?: boolean;
  /** Form auto-save interval */
  autoSaveInterval?: number;
  /** Form draft mode */
  draftMode?: boolean;
}

export interface FormSubmitAction {
  /** Action type */
  type: "url" | "api" | "email" | "webhook" | "custom";
  /** Action URL */
  url?: string;
  /** Action method */
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Action headers */
  headers?: Record<string, string>;
  /** Action body */
  body?: Record<string, unknown>;
}

export interface FormValidation {
  /** Form validation rules */
  rules: ValidationRule[];
  /** Form validation messages */
  messages: ValidationMessages;
  /** Form validation mode */
  mode: "onChange" | "onBlur" | "onSubmit";
}

export interface ValidationRule {
  /** Rule ID */
  id: string;
  /** Rule field */
  field: string;
  /** Rule type */
  type: "required" | "email" | "url" | "phone" | "number" | "date" | "minLength" | "maxLength" | "min" | "max" | "pattern" | "custom";
  /** Rule value */
  value?: unknown;
  /** Rule message */
  message: string;
}

export interface ValidationMessages {
  /** Required message */
  required?: string;
  /** Email message */
  email?: string;
  /** URL message */
  url?: string;
  /** Phone message */
  phone?: string;
  /** Number message */
  number?: string;
  /** Date message */
  date?: string;
  /** Min length message */
  minLength?: string;
  /** Max length message */
  maxLength?: string;
  /** Min message */
  min?: string;
  /** Max message */
  max?: string;
  /** Pattern message */
  pattern?: string;
  /** Custom message */
  custom?: string;
}

export interface FormStyling {
  /** Form theme */
  theme: "light" | "dark" | "auto";
  /** Form layout */
  layout: "vertical" | "horizontal" | "grid" | "custom";
  /** Form spacing */
  spacing: "compact" | "comfortable" | "spacious";
  /** Form colors */
  colors: FormColors;
  /** Form fonts */
  fonts: FormFonts;
  /** Form borders */
  borders: FormBorders;
  /** Form shadows */
  shadows: FormShadows;
}

export interface FormColors {
  /** Primary color */
  primary?: string;
  /** Secondary color */
  secondary?: string;
  /** Success color */
  success?: string;
  /** Warning color */
  warning?: string;
  /** Error color */
  error?: string;
  /** Background color */
  background?: string;
  /** Text color */
  text?: string;
  /** Border color */
  border?: string;
}

export interface FormFonts {
  /** Font family */
  family?: string;
  /** Font size */
  size?: string;
  /** Font weight */
  weight?: string;
  /** Line height */
  lineHeight?: string;
}

export interface FormBorders {
  /** Border width */
  width?: string;
  /** Border style */
  style?: string;
  /** Border radius */
  radius?: string;
}

export interface FormShadows {
  /** Shadow type */
  type?: "none" | "sm" | "md" | "lg" | "xl";
  /** Shadow color */
  color?: string;
}

export interface FormAccessibility {
  /** Form labels */
  labels: "visible" | "hidden" | "screen-reader-only";
  /** Form descriptions */
  descriptions: "visible" | "hidden" | "screen-reader-only";
  /** Form error messages */
  errorMessages: "visible" | "hidden" | "screen-reader-only";
  /** Form focus management */
  focusManagement: "auto" | "manual";
  /** Form keyboard navigation */
  keyboardNavigation: "enabled" | "disabled";
  /** Form screen reader support */
  screenReaderSupport: "enabled" | "disabled";
}

export interface FormAnalytics {
  /** Form tracking */
  tracking: "enabled" | "disabled";
  /** Form events */
  events: FormBuilderAnalyticsEvent[];
  /** Form metrics */
  metrics: FormMetrics;
}

export interface FormMetrics {
  /** Form views */
  views: number;
  /** Form submissions */
  submissions: number;
  /** Form completion rate */
  completionRate: number;
  /** Form average time */
  averageTime: number;
  /** Form field analytics */
  fieldAnalytics: FieldAnalytics[];
}

export interface FieldAnalytics {
  /** Field ID */
  fieldId: string;
  /** Field views */
  views: number;
  /** Field interactions */
  interactions: number;
  /** Field errors */
  errors: number;
  /** Field completion rate */
  completionRate: number;
}

export interface FormMetadata {
  /** Form created date */
  createdAt: Date;
  /** Form updated date */
  updatedAt: Date;
  /** Form created by */
  createdBy: string;
  /** Form updated by */
  updatedBy: string;
  /** Form version */
  version: string;
  /** Form tags */
  tags: string[];
  /** Form category */
  category?: string;
}

export interface FormBuilderAnalyticsEvent {
  type: "form_create" | "form_update" | "form_save" | "form_publish" | "field_add" | "field_remove" | "field_update" | "field_move" | "field_resize" | "preview_open" | "preview_close";
  payload: {
    formId?: string;
    fieldId?: string;
    fieldType?: string;
    timestamp: number;
  };
}

// Default form field types
export const defaultFormFieldTypes: FormFieldType[] = [
  {
    name: "text",
    category: "input",
    description: "Single line text input",
  },
  {
    name: "textarea",
    category: "input",
    description: "Multi-line text input",
  },
  {
    name: "email",
    category: "input",
    description: "Email address input",
  },
  {
    name: "password",
    category: "input",
    description: "Password input",
  },
  {
    name: "number",
    category: "input",
    description: "Number input",
  },
  {
    name: "date",
    category: "input",
    description: "Date picker",
  },
  {
    name: "time",
    category: "input",
    description: "Time picker",
  },
  {
    name: "datetime",
    category: "input",
    description: "Date and time picker",
  },
  {
    name: "url",
    category: "input",
    description: "URL input",
  },
  {
    name: "phone",
    category: "input",
    description: "Phone number input",
  },
  {
    name: "select",
    category: "selection",
    description: "Dropdown selection",
  },
  {
    name: "multiselect",
    category: "selection",
    description: "Multiple selection dropdown",
  },
  {
    name: "radio",
    category: "selection",
    description: "Radio button group",
  },
  {
    name: "checkbox",
    category: "selection",
    description: "Checkbox group",
  },
  {
    name: "switch",
    category: "selection",
    description: "Toggle switch",
  },
  {
    name: "file",
    category: "media",
    description: "File upload",
  },
  {
    name: "image",
    category: "media",
    description: "Image upload",
  },
  {
    name: "divider",
    category: "layout",
    description: "Visual divider",
  },
  {
    name: "spacer",
    category: "layout",
    description: "Empty space",
  },
  {
    name: "heading",
    category: "layout",
    description: "Section heading",
  },
  {
    name: "paragraph",
    category: "layout",
    description: "Text paragraph",
  },
];

// Styles for Form Builder
const formBuilderStyles = variants({
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

const formBuilderToolbarStyles = variants({
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

const formBuilderSidebarStyles = variants({
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

const formBuilderCanvasStyles = variants({
  base: "flex-1 p-4 bg-background overflow-y-auto",
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

const formBuilderPreviewStyles = variants({
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

// Form Builder Component
export const FormBuilder = createPolymorphic<"div", FormBuilderComponentProperties>(
  ({
    as,
    form,
    onFormChange,
    onFormSave,
    onFormPublish,
    showToolbar = true,
    showSidebar = true,
    showPreview = true,
    enableDragDrop = true,
    enableUndoRedo = true,
    enableAnalytics = false,
    onAnalytics,
    className,
    ...props
  }: PolymorphicProperties<"div", FormBuilderComponentProperties>, ref: PolymorphicReference<"div">) => {
    const [currentForm, setCurrentForm] = React.useState<FormConfiguration>(
      form || {
        id: "new-form",
        title: "New Form",
        description: "",
        fields: [],
        settings: {
          title: "New Form",
          description: "",
          submitButtonText: "Submit",
          resetButtonText: "Reset",
          submitAction: { type: "url", url: "", method: "POST" },
          autoSave: true,
          autoSaveInterval: 30000,
          draftMode: true,
        },
        validation: {
          rules: [],
          messages: {
            required: "This field is required",
            email: "Please enter a valid email address",
            url: "Please enter a valid URL",
            phone: "Please enter a valid phone number",
            number: "Please enter a valid number",
            date: "Please enter a valid date",
            minLength: "Minimum length is {min} characters",
            maxLength: "Maximum length is {max} characters",
            min: "Minimum value is {min}",
            max: "Maximum value is {max}",
            pattern: "Please enter a valid format",
            custom: "Please enter a valid value",
          },
          mode: "onSubmit",
        },
        styling: {
          theme: "light",
          layout: "vertical",
          spacing: "comfortable",
          colors: {
            primary: "#3b82f6",
            secondary: "#6b7280",
            success: "#10b981",
            warning: "#f59e0b",
            error: "#ef4444",
            background: "#ffffff",
            text: "#111827",
            border: "#d1d5db",
          },
          fonts: {
            family: "Inter, sans-serif",
            size: "16px",
            weight: "400",
            lineHeight: "1.5",
          },
          borders: {
            width: "1px",
            style: "solid",
            radius: "6px",
          },
          shadows: {
            type: "sm",
            color: "rgba(0, 0, 0, 0.1)",
          },
        },
        accessibility: {
          labels: "visible",
          descriptions: "visible",
          errorMessages: "visible",
          focusManagement: "auto",
          keyboardNavigation: "enabled",
          screenReaderSupport: "enabled",
        },
        analytics: {
          tracking: "enabled",
          events: [],
          metrics: {
            views: 0,
            submissions: 0,
            completionRate: 0,
            averageTime: 0,
            fieldAnalytics: [],
          },
        },
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

    const [selectedField, setSelectedField] = React.useState<string | null>(null);
    const [draggedField, setDraggedField] = React.useState<FormFieldType | null>(null);
    const [undoStack, setUndoStack] = React.useState<FormConfiguration[]>([]);
    const [redoStack, setRedoStack] = React.useState<FormConfiguration[]>([]);

    // Update form
    const updateForm = React.useCallback((newForm: FormConfiguration) => {
      setCurrentForm(newForm);
      onFormChange?.(newForm);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "form_update",
          payload: { formId: newForm.id, timestamp: Date.now() },
        });
      }
    }, [onFormChange, enableAnalytics, onAnalytics]);

    // Add field
    const addField = React.useCallback((fieldType: FormFieldType, position: FormPosition) => {
      const newField: FormBuilderField = {
        id: `field-${Date.now()}`,
        type: fieldType,
        label: fieldType.name.charAt(0).toUpperCase() + fieldType.name.slice(1),
        placeholder: `Enter ${fieldType.name}`,
        position,
        size: { width: 200, height: 40 },
        visibility: { always: true },
        required: false,
        disabled: false,
        readonly: false,
      };

      const newForm = {
        ...currentForm,
        fields: [...currentForm.fields, newField],
        metadata: {
          ...currentForm.metadata,
          updatedAt: new Date(),
          updatedBy: "user",
        },
      };

      // Add to undo stack
      if (enableUndoRedo) {
        setUndoStack(prev => [...prev, currentForm]);
        setRedoStack([]);
      }

      updateForm(newForm);

      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "field_add",
          payload: { formId: currentForm.id, fieldId: newField.id, fieldType: fieldType.name, timestamp: Date.now() },
        });
      }
    }, [currentForm, updateForm, enableUndoRedo, enableAnalytics, onAnalytics]);

    // Remove field
    const removeField = React.useCallback((fieldId: string) => {
      const newForm = {
        ...currentForm,
        fields: currentForm.fields.filter(field => field.id !== fieldId),
        metadata: {
          ...currentForm.metadata,
          updatedAt: new Date(),
          updatedBy: "user",
        },
      };

      // Add to undo stack
      if (enableUndoRedo) {
        setUndoStack(prev => [...prev, currentForm]);
        setRedoStack([]);
      }

      updateForm(newForm);

      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "field_remove",
          payload: { formId: currentForm.id, fieldId, timestamp: Date.now() },
        });
      }
    }, [currentForm, updateForm, enableUndoRedo, enableAnalytics, onAnalytics]);

    // Update field
    const updateField = React.useCallback((fieldId: string, updates: Partial<FormBuilderField>) => {
      const newForm = {
        ...currentForm,
        fields: currentForm.fields.map(field =>
          field.id === fieldId ? { ...field, ...updates } : field
        ),
        metadata: {
          ...currentForm.metadata,
          updatedAt: new Date(),
          updatedBy: "user",
        },
      };

      // Add to undo stack
      if (enableUndoRedo) {
        setUndoStack(prev => [...prev, currentForm]);
        setRedoStack([]);
      }

      updateForm(newForm);

      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "field_update",
          payload: { formId: currentForm.id, fieldId, timestamp: Date.now() },
        });
      }
    }, [currentForm, updateForm, enableUndoRedo, enableAnalytics, onAnalytics]);

    // Save form
    const saveForm = React.useCallback(() => {
      onFormSave?.(currentForm);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "form_save",
          payload: { formId: currentForm.id, timestamp: Date.now() },
        });
      }
    }, [currentForm, onFormSave, enableAnalytics, onAnalytics]);

    // Publish form
    const publishForm = React.useCallback(() => {
      onFormPublish?.(currentForm);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "form_publish",
          payload: { formId: currentForm.id, timestamp: Date.now() },
        });
      }
    }, [currentForm, onFormPublish, enableAnalytics, onAnalytics]);

    // Undo
    const undo = React.useCallback(() => {
      if (undoStack.length === 0) return;

      const previousForm = undoStack[undoStack.length - 1];
      if (previousForm) {
        setRedoStack(prev => [...prev, currentForm]);
        setUndoStack(prev => prev.slice(0, -1));
        setCurrentForm(previousForm);
      }
    }, [undoStack, currentForm]);

    // Redo
    const redo = React.useCallback(() => {
      if (redoStack.length === 0) return;

      const nextForm = redoStack[redoStack.length - 1];
      if (nextForm) {
        setUndoStack(prev => [...prev, currentForm]);
        setRedoStack(prev => prev.slice(0, -1));
        setCurrentForm(nextForm);
      }
    }, [redoStack, currentForm]);

    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn(formBuilderStyles({ variant: "default" }), className)}
        {...props}
      >
        {/* Toolbar */}
        {showToolbar && (
          <div className={cn(formBuilderToolbarStyles({ variant: "default" }))}>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">{currentForm.title}</h1>
              <span className="text-sm text-muted-foreground">
                {currentForm.fields.length} field{currentForm.fields.length !== 1 ? 's' : ''}
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
                onClick={saveForm}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Save
              </button>
              <button
                onClick={publishForm}
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
            <div className={cn(formBuilderSidebarStyles({ variant: "default" }))}>
              <div className="p-4">
                <h2 className="text-sm font-medium text-foreground mb-3">Form Fields</h2>
                <div className="space-y-2">
                  {defaultFormFieldTypes.map(fieldType => (
                    <div
                      key={fieldType.name}
                      className="p-3 border border-border rounded cursor-pointer hover:bg-accent/50 transition-colors"
                      draggable={enableDragDrop}
                      onDragStart={() => setDraggedField(fieldType)}
                      onClick={() => addField(fieldType, { x: 100, y: 100, z: 1 })}
                    >
                      <div className="text-sm font-medium text-foreground">{fieldType.name}</div>
                      <div className="text-xs text-muted-foreground">{fieldType.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Canvas */}
          <div className={cn(formBuilderCanvasStyles({ variant: "default" }))}>
            <div className="min-h-full p-4 border-2 border-dashed border-border rounded">
              <div className="text-center text-muted-foreground mb-4">
                <p className="text-sm">Drag fields from the sidebar to build your form</p>
              </div>
              <div className="space-y-4">
                {currentForm.fields.map(field => (
                  <div
                    key={field.id}
                    className={cn(
                      "p-4 border border-border rounded bg-card",
                      selectedField === field.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedField(field.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">{field.label}</label>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(field.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{field.type.name}</div>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
                      disabled
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className={cn(formBuilderPreviewStyles({ variant: "default" }))}>
              <div className="p-4">
                <h2 className="text-sm font-medium text-foreground mb-3">Preview</h2>
                <div className="space-y-4">
                  {currentForm.fields.map(field => (
                    <div key={field.id} className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{field.label}</label>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
                        disabled
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Component>
    );
  },
  "FormBuilder"
);

// Export styles for external use
export const formBuilderVariants = {
  formBuilderStyles,
  formBuilderToolbarStyles,
  formBuilderSidebarStyles,
  formBuilderCanvasStyles,
  formBuilderPreviewStyles,
};
