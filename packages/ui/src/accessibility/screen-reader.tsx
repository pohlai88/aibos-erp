// Screen Reader component - Placeholder
import * as React from "react";

export interface ScreenReaderProperties {
  children?: React.ReactNode;
  className?: string;
}

export const ScreenReader = ({
  children,
  className,
}: ScreenReaderProperties) => {
  return <div className={className}>{children}</div>;
};
