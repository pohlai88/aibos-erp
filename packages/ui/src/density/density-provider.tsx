// Density Provider component - Placeholder
import * as React from "react";

export interface DensityProviderProperties {
  children?: React.ReactNode;
  className?: string;
}

export const DensityProvider = ({
  children,
  className,
}: DensityProviderProperties) => {
  return <div className={className}>{children}</div>;
};
