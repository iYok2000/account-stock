/**
 * Select — A styled dropdown component with consistent styling
 * Part of the UI component library
 */
"use client";

import { ChevronDown } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

export type SelectProps = ComponentPropsWithoutRef<"select"> & {
  /**
   * Icon to display on the left side of the select
   */
  icon?: React.ReactNode;
  /**
   * Error state - adds error styling
   */
  error?: boolean;
};

/**
 * Enhanced select component with consistent styling and optional icon
 * 
 * @example
 * ```tsx
 * <Select icon={<User className="h-4 w-4" />}>
 *   <option value="admin">Admin</option>
 *   <option value="user">User</option>
 * </Select>
 * ```
 */
export function Select({ icon, error, className = "", ...props }: SelectProps) {
  return (
    <div className="relative inline-block w-full">
      {icon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      <select
        className={`
          input-base
          w-full
          appearance-none
          ${icon ? "pl-9" : "pl-3"}
          pr-9
          cursor-pointer
          transition-all
          duration-200
          hover:border-primary/50
          focus:border-primary
          focus:ring-2
          focus:ring-primary/20
          disabled:cursor-not-allowed
          disabled:opacity-50
          disabled:hover:border-input
          ${error ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}
          ${className}
        `}
        {...props}
      />
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
}
