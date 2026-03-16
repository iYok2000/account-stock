'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-[28px] w-[51px] shrink-0 cursor-pointer rounded-full',
        'transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        checked
          ? 'bg-emerald-500 focus-visible:ring-emerald-500'
          : 'bg-neutral-300 focus-visible:ring-neutral-400',
        disabled && 'cursor-not-allowed opacity-50',
        'min-h-[44px] sm:min-h-0',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-[24px] w-[24px] rounded-full bg-white shadow-lg',
          'transform ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-[25px]' : 'translate-x-[2px]',
          'relative top-[2px]',
        )}
      />
    </button>
  );
}
