// Focus Trap component - Placeholder
import * as React from "react";

export interface FocusTrapProperties {
  children?: React.ReactNode;
  className?: string;
}

export const FocusTrap = ({ children, className }: FocusTrapProperties) => {
  return <div className={className}>{children}</div>;
};
