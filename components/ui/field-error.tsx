'use client';

import { cn } from "@/lib/utils";

interface FieldErrorProps {
  message?: string;
  className?: string;
}

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className={cn("text-sm text-red-500 mt-1", className)}>{message}</p>
  );
}
