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

// Print Types
export interface PrintComponentProperties {
  /** Content to print */
  children?: React.ReactNode;
  /** Print title */
  title?: string;
  /** Print options */
  options?: PrintOptions;
  /** Whether to show print button */
  showPrintButton?: boolean;
  /** Whether to show preview */
  showPreview?: boolean;
  /** Whether to enable analytics */
  enableAnalytics?: boolean;
  /** Analytics callback */
  onAnalytics?: (event: PrintAnalyticsEvent) => void;
  /** Custom class name */
  className?: string;
}

export interface PrintOptions {
  /** Page orientation */
  orientation?: "portrait" | "landscape";
  /** Page size */
  pageSize?: "A4" | "A3" | "A5" | "Letter" | "Legal" | "Tabloid";
  /** Margins */
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** Scale */
  scale?: number;
  /** Whether to include background colors */
  includeBackground?: boolean;
  /** Whether to include headers and footers */
  includeHeadersFooters?: boolean;
  /** Custom CSS for print */
  printCSS?: string;
  /** Custom JavaScript for print */
  printJS?: string;
  /** Whether to show page numbers */
  showPageNumbers?: boolean;
  /** Whether to show date/time */
  showDateTime?: boolean;
  /** Custom header */
  header?: React.ReactNode;
  /** Custom footer */
  footer?: React.ReactNode;
}

export interface PrintPreviewProperties {
  /** Whether preview is open */
  open?: boolean;
  /** Callback when preview closes */
  onClose?: () => void;
  /** Content to preview */
  children?: React.ReactNode;
  /** Print options */
  options?: PrintOptions;
  /** Custom class name */
  className?: string;
}

export interface PrintAnalyticsEvent {
  type: "print_start" | "print_complete" | "print_cancel" | "preview_open" | "preview_close";
  payload: {
    title?: string;
    pageCount?: number;
    timestamp: number;
  };
}

// Styles for Print
const printStyles = variants({
  base: "print-component",
  variants: {
    variant: {
      default: "",
      minimal: "print-minimal",
      full: "print-full",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const printButtonStyles = variants({
  base: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
  variants: {
    variant: {
      default: "border-border",
      primary: "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/90",
    },
    size: {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

const printPreviewStyles = variants({
  base: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm",
  variants: {
    variant: {
      default: "bg-background/80",
      minimal: "bg-transparent",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const printPreviewContentStyles = variants({
  base: "relative w-full max-w-6xl max-h-[90vh] rounded-lg border bg-card shadow-xl overflow-hidden",
  variants: {
    variant: {
      default: "border-border",
      minimal: "border-border/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const printPreviewHeaderStyles = variants({
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

const printPreviewBodyStyles = variants({
  base: "flex-1 overflow-y-auto p-4 bg-white",
  variants: {
    variant: {
      default: "bg-white",
      minimal: "bg-white/95",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const printPreviewFooterStyles = variants({
  base: "flex items-center justify-between p-4 border-t border-border bg-muted/50",
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

// Print Component
export const Print = createPolymorphic<"div", PrintComponentProperties>(
  ({
    as,
    children,
    title = "Document",
    options = {},
    showPrintButton = true,
    showPreview = true,
    enableAnalytics = false,
    onAnalytics,
    className,
    ...props
  }: PolymorphicProperties<"div", PrintComponentProperties>, ref: PolymorphicReference<"div">) => {
    const [isPrinting, setIsPrinting] = React.useState(false);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const printRef = React.useRef<HTMLDivElement>(null);

    // Default print options
    const defaultOptions: PrintOptions = {
      orientation: "portrait",
      pageSize: "A4",
      margins: { top: 1, right: 1, bottom: 1, left: 1 },
      scale: 1,
      includeBackground: false,
      includeHeadersFooters: true,
      showPageNumbers: true,
      showDateTime: true,
      ...options,
    };

    // Generate print CSS
    const generatePrintCSS = React.useCallback(() => {
      const { orientation, pageSize, margins, scale, includeBackground, showPageNumbers, showDateTime } = defaultOptions;
      
      return `
        @page {
          size: ${pageSize} ${orientation};
          margin: ${margins?.top || 1}in ${margins?.right || 1}in ${margins?.bottom || 1}in ${margins?.left || 1}in;
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: ${includeBackground ? 'exact' : 'economy'};
            color-adjust: ${includeBackground ? 'exact' : 'economy'};
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12pt;
            line-height: 1.4;
            color: #000;
            background: #fff;
          }
          
          .print-component {
            transform: scale(${scale});
            transform-origin: top left;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          ${showPageNumbers ? `
            @page {
              @bottom-center {
                content: counter(page);
                font-size: 10pt;
                color: #666;
              }
            }
          ` : ''}
          
          ${showDateTime ? `
            .print-header::before {
              content: "Printed on " attr(data-date);
              font-size: 10pt;
              color: #666;
              float: right;
            }
          ` : ''}
          
          .print-break {
            page-break-before: always;
          }
          
          .print-break-after {
            page-break-after: always;
          }
          
          .print-break-inside-avoid {
            page-break-inside: avoid;
          }
          
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          img {
            max-width: 100% !important;
            height: auto !important;
            page-break-inside: avoid;
          }
        }
      `;
    }, [defaultOptions]);

    // Handle print
    const handlePrint = React.useCallback(async () => {
      if (!printRef.current) return;

      setIsPrinting(true);

      // Analytics
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "print_start",
          payload: { title, timestamp: Date.now() },
        });
      }

      try {
        // Create print window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
          throw new Error('Unable to open print window');
        }

        // Get content
        const content = printRef.current.innerHTML;
        
        // Create print document
        const printDocument = printWindow.document;
        printDocument.open();
        printDocument.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                ${generatePrintCSS()}
                ${defaultOptions.printCSS || ''}
              </style>
            </head>
            <body>
              <div class="print-component" data-date="${new Date().toLocaleString()}">
                ${defaultOptions.header ? `<div class="print-header">${defaultOptions.header}</div>` : ''}
                ${content}
                ${defaultOptions.footer ? `<div class="print-footer">${defaultOptions.footer}</div>` : ''}
              </div>
              ${defaultOptions.printJS ? `<script>${defaultOptions.printJS}</script>` : ''}
            </body>
          </html>
        `);
        printDocument.close();

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 500));

        // Print
        printWindow.print();
        
        // Close window after print
        printWindow.addEventListener('afterprint', () => {
          printWindow.close();
        });

        // Analytics
        if (enableAnalytics && onAnalytics) {
          onAnalytics({
            type: "print_complete",
            payload: { title, timestamp: Date.now() },
          });
        }

      } catch (error) {
        console.error('Print error:', error);
        
        // Analytics
        if (enableAnalytics && onAnalytics) {
          onAnalytics({
            type: "print_cancel",
            payload: { title, timestamp: Date.now() },
          });
        }
      } finally {
        setIsPrinting(false);
      }
    }, [printRef, title, defaultOptions, generatePrintCSS, enableAnalytics, onAnalytics]);

    // Handle preview
    const handlePreview = React.useCallback(() => {
      setPreviewOpen(true);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "preview_open",
          payload: { title, timestamp: Date.now() },
        });
      }
    }, [enableAnalytics, onAnalytics, title]);

    // Close preview
    const closePreview = React.useCallback(() => {
      setPreviewOpen(false);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "preview_close",
          payload: { title, timestamp: Date.now() },
        });
      }
    }, [enableAnalytics, onAnalytics, title]);

    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn(printStyles({ variant: "default" }), className)}
        {...props}
      >
        {/* Print Controls */}
        {(showPrintButton || showPreview) && (
          <div className="no-print flex items-center gap-2 p-4 border-b border-border bg-muted/50">
            {showPreview && (
              <button
                onClick={handlePreview}
                className={cn(printButtonStyles({ variant: "secondary", size: "sm" }))}
                disabled={isPrinting}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            )}
            {showPrintButton && (
              <button
                onClick={handlePrint}
                className={cn(printButtonStyles({ variant: "primary", size: "sm" }))}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Printing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Print Content */}
        <div ref={printRef} className="print-content">
          {children}
        </div>

        {/* Preview Modal */}
        {previewOpen && (
          <PrintPreview
            open={previewOpen}
            onClose={closePreview}
            options={defaultOptions}
          >
            {children}
          </PrintPreview>
        )}
      </Component>
    );
  },
  "Print"
);

// Print Preview Component
export const PrintPreview = createPolymorphic<"div", PrintPreviewProperties>(
  ({
    as,
    open = false,
    onClose,
    children,
    options = {},
    className,
    ...props
  }: PolymorphicProperties<"div", PrintPreviewProperties>, ref: PolymorphicReference<"div">) => {
    const previewRef = React.useRef<HTMLDivElement>(null);

    // Default options
    const defaultOptions: PrintOptions = {
      orientation: "portrait",
      pageSize: "A4",
      margins: { top: 1, right: 1, bottom: 1, left: 1 },
      scale: 0.8,
      includeBackground: false,
      includeHeadersFooters: true,
      showPageNumbers: true,
      showDateTime: true,
      ...options,
    };

    // Generate preview CSS
    const generatePreviewCSS = React.useCallback(() => {
      const { orientation, pageSize, margins, scale, includeBackground } = defaultOptions;
      
      return `
        .print-preview {
          background: #f5f5f5;
          padding: 20px;
          min-height: 100vh;
        }
        
        .print-preview-page {
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          margin: 0 auto;
          transform: scale(${scale});
          transform-origin: top center;
          ${orientation === 'landscape' ? 'width: 11in; height: 8.5in;' : 'width: 8.5in; height: 11in;'}
          padding: ${margins?.top || 1}in ${margins?.right || 1}in ${margins?.bottom || 1}in ${margins?.left || 1}in;
          box-sizing: border-box;
        }
        
        .print-preview-content {
          -webkit-print-color-adjust: ${includeBackground ? 'exact' : 'economy'};
          color-adjust: ${includeBackground ? 'exact' : 'economy'};
        }
      `;
    }, [defaultOptions]);

    // Handle escape key
    React.useEffect(() => {
      if (!open) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose?.();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [open, onClose]);

    if (!open) return null;

    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn(printPreviewStyles({ variant: "default" }), className)}
        role="dialog"
        aria-modal="true"
        aria-label="Print Preview"
        {...props}
      >
        <div className={cn(printPreviewContentStyles({ variant: "default" }))}>
          {/* Header */}
          <div className={cn(printPreviewHeaderStyles({ variant: "default" }))}>
            <h2 className="text-lg font-semibold text-foreground">Print Preview</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close preview"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Preview Body */}
          <div className={cn(printPreviewBodyStyles({ variant: "default" }))}>
            <style>{generatePreviewCSS()}</style>
            <div className="print-preview">
              <div className="print-preview-page">
                <div className="print-preview-content">
                  {children}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={cn(printPreviewFooterStyles({ variant: "default" }))}>
            <div className="text-sm text-muted-foreground">
              Preview of {defaultOptions.pageSize} {defaultOptions.orientation} page
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className={cn(printButtonStyles({ variant: "secondary", size: "sm" }))}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Component>
    );
  },
  "PrintPreview"
);

// Export styles for external use
export const printVariants = {
  printStyles,
  printButtonStyles,
  printPreviewStyles,
  printPreviewContentStyles,
  printPreviewHeaderStyles,
  printPreviewBodyStyles,
  printPreviewFooterStyles,
};
