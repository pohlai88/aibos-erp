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

// Notification System Types
export interface NotificationSystemComponentProperties {
  /** Notification configuration */
  notifications?: NotificationItem[];
  /** Callback when notification is added */
  onNotificationAdd?: (notification: NotificationItem) => void;
  /** Callback when notification is removed */
  onNotificationRemove?: (notificationId: string) => void;
  /** Callback when notification is updated */
  onNotificationUpdate?: (notification: NotificationItem) => void;
  /** Callback when notification is clicked */
  onNotificationClick?: (notification: NotificationItem) => void;
  /** Callback when notification is dismissed */
  onNotificationDismiss?: (notificationId: string) => void;
  /** Callback when all notifications are cleared */
  onNotificationsClear?: () => void;
  /** Notification position */
  position?: NotificationPosition;
  /** Notification max count */
  maxCount?: number;
  /** Notification auto dismiss delay */
  autoDismissDelay?: number;
  /** Whether to enable analytics */
  enableAnalytics?: boolean;
  /** Analytics callback */
  onAnalytics?: (event: NotificationSystemAnalyticsEvent) => void;
  /** Custom class name */
  className?: string;
}

export interface NotificationItem {
  /** Notification ID */
  id: string;
  /** Notification type */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Notification description */
  description?: string;
  /** Notification icon */
  icon?: React.ReactNode;
  /** Notification image */
  image?: string;
  /** Notification actions */
  actions?: NotificationAction[];
  /** Notification timestamp */
  timestamp: Date;
  /** Notification duration */
  duration?: number;
  /** Notification priority */
  priority?: NotificationPriority;
  /** Notification category */
  category?: string;
  /** Notification tags */
  tags?: string[];
  /** Notification metadata */
  metadata?: Record<string, unknown>;
  /** Whether notification is persistent */
  persistent?: boolean;
  /** Whether notification is dismissible */
  dismissible?: boolean;
  /** Whether notification is read */
  read?: boolean;
  /** Whether notification is archived */
  archived?: boolean;
  /** Notification style */
  style?: NotificationStyle;
  /** Notification accessibility */
  accessibility?: NotificationAccessibility;
}

export interface NotificationType {
  /** Type name */
  name: string;
  /** Type color */
  color: string;
  /** Type icon */
  icon?: React.ReactNode;
  /** Type description */
  description?: string;
}

export interface NotificationAction {
  /** Action ID */
  id: string;
  /** Action label */
  label: string;
  /** Action type */
  type: "button" | "link" | "dropdown";
  /** Action callback */
  onClick?: () => void;
  /** Action href */
  href?: string;
  /** Action icon */
  icon?: React.ReactNode;
  /** Action style */
  style?: "primary" | "secondary" | "danger" | "success";
  /** Action disabled */
  disabled?: boolean;
}

export interface NotificationPosition {
  /** Horizontal position */
  horizontal: "left" | "center" | "right";
  /** Vertical position */
  vertical: "top" | "bottom";
  /** Offset from edge */
  offset?: number;
}

export interface NotificationPriority {
  /** Priority level */
  level: "low" | "normal" | "high" | "urgent";
  /** Priority weight */
  weight: number;
  /** Priority color */
  color?: string;
}

export interface NotificationStyle {
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
  /** Shadow */
  shadow?: string;
  /** Animation */
  animation?: "slide" | "fade" | "bounce" | "none";
}

export interface NotificationAccessibility {
  /** ARIA label */
  ariaLabel?: string;
  /** ARIA description */
  ariaDescription?: string;
  /** ARIA live region */
  ariaLive?: "polite" | "assertive" | "off";
  /** Keyboard shortcuts */
  keyboardShortcuts?: NotificationKeyboardShortcuts;
}

export interface NotificationKeyboardShortcuts {
  /** Dismiss shortcut */
  dismiss?: string;
  /** Clear all shortcut */
  clearAll?: string;
  /** Next notification shortcut */
  next?: string;
  /** Previous notification shortcut */
  previous?: string;
}

export interface NotificationSystemAnalyticsEvent {
  type: "notification_add" | "notification_remove" | "notification_update" | "notification_click" | "notification_dismiss" | "notifications_clear" | "notification_action";
  payload: {
    notificationId?: string;
    notificationType?: string;
    actionId?: string;
    timestamp: number;
  };
}

// Default notification types
export const defaultNotificationTypes: NotificationType[] = [
  {
    name: "success",
    color: "#10b981",
    description: "Success notification",
  },
  {
    name: "error",
    color: "#ef4444",
    description: "Error notification",
  },
  {
    name: "warning",
    color: "#f59e0b",
    description: "Warning notification",
  },
  {
    name: "info",
    color: "#3b82f6",
    description: "Information notification",
  },
];

// Default notification priorities
export const defaultNotificationPriorities: NotificationPriority[] = [
  { level: "low", weight: 1, color: "#6b7280" },
  { level: "normal", weight: 2, color: "#3b82f6" },
  { level: "high", weight: 3, color: "#f59e0b" },
  { level: "urgent", weight: 4, color: "#ef4444" },
];

// Styles for Notification System
const notificationSystemStyles = variants({
  base: "fixed z-50 pointer-events-none",
  variants: {
    position: {
      "top-left": "top-4 left-4",
      "top-center": "top-4 left-1/2 transform -translate-x-1/2",
      "top-right": "top-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
      "bottom-right": "bottom-4 right-4",
    },
  },
  defaultVariants: {
    position: "top-right",
  },
});

const notificationContainerStyles = variants({
  base: "flex flex-col gap-2 max-w-sm w-full",
  variants: {
    variant: {
      default: "gap-2",
      compact: "gap-1",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const notificationItemStyles = variants({
  base: "relative p-4 rounded-lg border shadow-lg bg-card text-card-foreground pointer-events-auto transition-all duration-300",
  variants: {
    type: {
      success: "border-green-200 bg-green-50 text-green-900",
      error: "border-red-200 bg-red-50 text-red-900",
      warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
      info: "border-blue-200 bg-blue-50 text-blue-900",
    },
    priority: {
      low: "opacity-75",
      normal: "opacity-100",
      high: "ring-2 ring-orange-200",
      urgent: "ring-2 ring-red-200 animate-pulse",
    },
    animation: {
      slide: "transform transition-transform",
      fade: "opacity-0 transition-opacity",
      bounce: "animate-bounce",
      none: "",
    },
  },
  defaultVariants: {
    type: "info",
    priority: "normal",
    animation: "slide",
  },
});

const notificationHeaderStyles = variants({
  base: "flex items-start justify-between gap-2",
  variants: {
    variant: {
      default: "gap-2",
      compact: "gap-1",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const notificationContentStyles = variants({
  base: "flex-1 min-w-0",
  variants: {
    variant: {
      default: "space-y-1",
      compact: "space-y-0.5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const notificationTitleStyles = variants({
  base: "text-sm font-medium text-foreground",
  variants: {
    variant: {
      default: "text-sm",
      compact: "text-xs",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const notificationMessageStyles = variants({
  base: "text-sm text-muted-foreground",
  variants: {
    variant: {
      default: "text-sm",
      compact: "text-xs",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const notificationDescriptionStyles = variants({
  base: "text-xs text-muted-foreground",
  variants: {
    variant: {
      default: "text-xs",
      compact: "text-xs",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const notificationActionsStyles = variants({
  base: "flex items-center gap-2 mt-2",
  variants: {
    variant: {
      default: "gap-2",
      compact: "gap-1",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const notificationActionStyles = variants({
  base: "px-3 py-1 text-xs rounded border transition-colors",
  variants: {
    style: {
      primary: "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/90",
      danger: "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90",
      success: "bg-green-600 text-white border-green-600 hover:bg-green-700",
    },
    disabled: {
      true: "opacity-50 cursor-not-allowed",
      false: "cursor-pointer",
    },
  },
  defaultVariants: {
    style: "secondary",
    disabled: "false",
  },
});

const notificationDismissStyles = variants({
  base: "p-1 rounded hover:bg-accent transition-colors",
  variants: {
    variant: {
      default: "hover:bg-accent",
      minimal: "hover:bg-accent/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Notification System Component
export const NotificationSystem = createPolymorphic<"div", NotificationSystemComponentProperties>(
  ({
    as,
    notifications = [],
    onNotificationAdd,
    onNotificationRemove,
    onNotificationUpdate,
    onNotificationClick,
    onNotificationDismiss,
    onNotificationsClear,
    position = { horizontal: "right", vertical: "top" },
    maxCount = 5,
    autoDismissDelay = 5000,
    enableAnalytics = false,
    onAnalytics,
    className,
    ...props
  }: PolymorphicProperties<"div", NotificationSystemComponentProperties>, ref: PolymorphicReference<"div">) => {
    const [notificationList, setNotificationList] = React.useState<NotificationItem[]>(notifications);
    const [dismissedNotifications, setDismissedNotifications] = React.useState<Set<string>>(new Set());

    // Update notifications when prop changes
    React.useEffect(() => {
      setNotificationList(notifications);
    }, [notifications]);

    // Auto dismiss notifications
    React.useEffect(() => {
      const timers: ReturnType<typeof setTimeout>[] = [];

      notificationList.forEach(notification => {
        if (!notification.persistent && notification.duration !== 0) {
          const timer = setTimeout(() => {
            dismissNotification(notification.id);
          }, notification.duration || autoDismissDelay);
          timers.push(timer);
        }
      });

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }, [notificationList, autoDismissDelay]);

    // Add notification
    const addNotification = React.useCallback((notification: NotificationItem) => {
      setNotificationList(prev => {
        const newList = [...prev, notification];
        // Keep only the latest notifications up to maxCount
        return newList.slice(-maxCount);
      });
      
      onNotificationAdd?.(notification);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "notification_add",
          payload: { notificationId: notification.id, notificationType: notification.type.name, timestamp: Date.now() },
        });
      }
    }, [maxCount, onNotificationAdd, enableAnalytics, onAnalytics]);

    // Remove notification
    const removeNotification = React.useCallback((notificationId: string) => {
      setNotificationList(prev => prev.filter(n => n.id !== notificationId));
      setDismissedNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      
      onNotificationRemove?.(notificationId);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "notification_remove",
          payload: { notificationId, timestamp: Date.now() },
        });
      }
    }, [onNotificationRemove, enableAnalytics, onAnalytics]);

    // Update notification
    const updateNotification = React.useCallback((notification: NotificationItem) => {
      setNotificationList(prev => prev.map(n => n.id === notification.id ? notification : n));
      
      onNotificationUpdate?.(notification);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "notification_update",
          payload: { notificationId: notification.id, notificationType: notification.type.name, timestamp: Date.now() },
        });
      }
    }, [onNotificationUpdate, enableAnalytics, onAnalytics]);

    // Dismiss notification
    const dismissNotification = React.useCallback((notificationId: string) => {
      setDismissedNotifications(prev => new Set(prev).add(notificationId));
      
      // Remove after animation
      setTimeout(() => {
        removeNotification(notificationId);
      }, 300);
      
      onNotificationDismiss?.(notificationId);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "notification_dismiss",
          payload: { notificationId, timestamp: Date.now() },
        });
      }
    }, [removeNotification, onNotificationDismiss, enableAnalytics, onAnalytics]);

    // Clear all notifications
    const clearAllNotifications = React.useCallback(() => {
      setNotificationList([]);
      setDismissedNotifications(new Set());
      
      onNotificationsClear?.();
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "notifications_clear",
          payload: { timestamp: Date.now() },
        });
      }
    }, [onNotificationsClear, enableAnalytics, onAnalytics]);

    // Handle notification click
    const handleNotificationClick = React.useCallback((notification: NotificationItem) => {
      onNotificationClick?.(notification);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "notification_click",
          payload: { notificationId: notification.id, notificationType: notification.type.name, timestamp: Date.now() },
        });
      }
    }, [onNotificationClick, enableAnalytics, onAnalytics]);

    // Handle action click
    const handleActionClick = React.useCallback((notification: NotificationItem, action: NotificationAction) => {
      action.onClick?.();
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "notification_action",
          payload: { notificationId: notification.id, actionId: action.id, timestamp: Date.now() },
        });
      }
    }, [enableAnalytics, onAnalytics]);

    // Get notification type
    const getNotificationType = React.useCallback((typeName: string) => {
      return defaultNotificationTypes.find(t => t.name === typeName) || defaultNotificationTypes[3]; // Default to info
    }, []);

    // Get notification priority
    const getNotificationPriority = React.useCallback((priorityLevel: string) => {
      return defaultNotificationPriorities.find(p => p.level === priorityLevel) || defaultNotificationPriorities[1]; // Default to normal
    }, []);

    // Render notification
    const renderNotification = React.useCallback((notification: NotificationItem) => {
      const notificationType = getNotificationType(notification.type.name);
      const notificationPriority = getNotificationPriority(notification.priority?.level || "normal");
      const isDismissed = dismissedNotifications.has(notification.id);

      return (
        <div
          key={notification.id}
          className={cn(
            notificationItemStyles({
              type: notification.type.name as "success" | "error" | "warning" | "info",
              priority: notification.priority?.level as "low" | "normal" | "high" | "urgent",
              animation: notification.style?.animation || "slide",
            }),
            isDismissed && "opacity-0 transform translate-x-full",
            notification.read && "opacity-75"
          )}
          onClick={() => handleNotificationClick(notification)}
          role="alert"
          aria-live={notification.accessibility?.ariaLive || "polite"}
          aria-label={notification.accessibility?.ariaLabel || notification.title}
        >
          <div className={cn(notificationHeaderStyles({ variant: "default" }))}>
            <div className={cn(notificationContentStyles({ variant: "default" }))}>
              {notification.icon && (
                <div className="flex-shrink-0 w-5 h-5 text-current">
                  {notification.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className={cn(notificationTitleStyles({ variant: "default" }))}>
                  {notification.title}
                </div>
                <div className={cn(notificationMessageStyles({ variant: "default" }))}>
                  {notification.message}
                </div>
                {notification.description && (
                  <div className={cn(notificationDescriptionStyles({ variant: "default" }))}>
                    {notification.description}
                  </div>
                )}
              </div>
            </div>
            {notification.dismissible !== false && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
                className={cn(notificationDismissStyles({ variant: "default" }))}
                aria-label="Dismiss notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {notification.actions && notification.actions.length > 0 && (
            <div className={cn(notificationActionsStyles({ variant: "default" }))}>
              {notification.actions.map(action => (
                <button
                  key={action.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(notification, action);
                  }}
                  className={cn(
                    notificationActionStyles({
                      style: action.style || "secondary",
                      disabled: action.disabled ? "true" : "false",
                    })
                  )}
                  disabled={action.disabled}
                >
                  {action.icon && <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }, [dismissedNotifications, getNotificationType, getNotificationPriority, handleNotificationClick, dismissNotification, handleActionClick]);

    // Get position class
    const getPositionClass = React.useCallback(() => {
      const { horizontal, vertical } = position;
      return `${vertical}-${horizontal}` as "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
    }, [position]);

    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn(notificationSystemStyles({ position: getPositionClass() }), className)}
        {...props}
      >
        <div className={cn(notificationContainerStyles({ variant: "default" }))}>
          {notificationList.map(renderNotification)}
        </div>
      </Component>
    );
  },
  "NotificationSystem"
);

// Export styles for external use
export const notificationSystemVariants = {
  notificationSystemStyles,
  notificationContainerStyles,
  notificationItemStyles,
  notificationHeaderStyles,
  notificationContentStyles,
  notificationTitleStyles,
  notificationMessageStyles,
  notificationDescriptionStyles,
  notificationActionsStyles,
  notificationActionStyles,
  notificationDismissStyles,
};
