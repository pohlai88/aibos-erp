// Undo Redo component - Placeholder
import * as React from "react";

export interface UndoRedoProperties {
  children?: React.ReactNode;
  className?: string;
}

export const UndoRedo = ({ children, className }: UndoRedoProperties) => {
  return <div className={className}>{children}</div>;
};
