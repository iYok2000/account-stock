'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardSectionProps {
  /** Unique identifier for the section (used for localStorage and scroll anchors) */
  id: string;

  /** Section heading displayed in the header (Thai text) */
  title: string;

  /** Optional description shown below title when expanded */
  description?: string;

  /** Icon component displayed before the title */
  icon?: React.ReactNode;

  /** Default expanded state (overridden by localStorage if exists) */
  defaultOpen?: boolean;

  /** Summary text shown when collapsed (extracted insights) */
  summary?: string;

  /** Optional warning badge (e.g., "24% ยกเลิก") */
  warningBadge?: string;

  /** Number of charts inside (shown in badge) */
  chartCount?: number;

  /** The chart components to render inside */
  children: React.ReactNode;

  /** Optional className for custom styling */
  className?: string;

  /** Disable collapsing (for Overview section) */
  collapsible?: boolean;
}

export function DashboardSection({
  id,
  title,
  description,
  icon,
  defaultOpen = false,
  summary,
  warningBadge,
  chartCount,
  children,
  className,
  collapsible = true,
}: DashboardSectionProps) {
  // Load saved state from localStorage (SSR-safe)
  const [isOpen, setIsOpen] = useState(() => {
    if (!collapsible) return true;
    if (typeof window === 'undefined') return defaultOpen;

    try {
      const saved = localStorage.getItem(`dashboard-section-${id}-expanded`);
      return saved !== null ? saved === 'true' : defaultOpen;
    } catch (error) {
      console.warn('localStorage not available:', error);
      return defaultOpen;
    }
  });

  const [hasBeenOpened, setHasBeenOpened] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  // Persist state to localStorage
  useEffect(() => {
    if (!collapsible) return;

    try {
      localStorage.setItem(`dashboard-section-${id}-expanded`, String(isOpen));
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  }, [id, isOpen, collapsible]);

  // Track if section has been opened at least once (for lazy loading)
  useEffect(() => {
    if (isOpen && !hasBeenOpened) {
      setHasBeenOpened(true);
    }
  }, [isOpen, hasBeenOpened]);

  const toggleSection = () => {
    if (collapsible) {
      setIsOpen(!isOpen);
    }
  };

  // If not collapsible, render without the header button
  if (!collapsible) {
    return (
      <section
        id={id}
        className={cn('mb-6', className)}
        aria-labelledby={`${id}-heading`}
      >
        {/* Simple header without collapse button */}
        <div className="px-4 py-4 md:px-6 md:py-4 bg-brown-50 border border-brown-200 rounded-t-lg">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="text-brown-600 w-5 h-5 flex-shrink-0">
                {icon}
              </span>
            )}
            <h2
              id={`${id}-heading`}
              className="text-base md:text-lg font-semibold text-brown-700"
            >
              {title}
            </h2>
          </div>
          {description && (
            <p className="text-sm text-brown-600 mt-2">
              {description}
            </p>
          )}
        </div>

        {/* Content always visible */}
        <div className="bg-brown-50 border-x border-b border-brown-200 rounded-b-lg p-4 md:p-6">
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id={id}
      className={cn('mb-6', className)}
      aria-labelledby={`${id}-heading`}
    >
      {/* Section Header - Clickable to toggle */}
      <button
        onClick={toggleSection}
        className={cn(
          'w-full flex items-center justify-between',
          'px-4 py-4 md:px-6 md:py-4',
          'min-h-[64px]',
          isOpen ? 'bg-brown-50' : 'bg-white',
          'border border-brown-200',
          isOpen ? 'rounded-t-lg' : 'rounded-lg',
          'active:scale-[0.99] active:bg-brown-100 md:hover:bg-brown-100 md:hover:border-brown-300',
          'focus:outline-none focus:ring-2 focus:ring-brown-400',
          'transition-all duration-150'
        )}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
        aria-label={`${isOpen ? 'ยุบ' : 'ขยาย'} ${title}`}
      >
        {/* Left side: Icon + Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <span className="text-brown-600 w-5 h-5 flex-shrink-0">
              {icon}
            </span>
          )}
          <h2
            id={`${id}-heading`}
            className={cn(
              'text-base md:text-lg font-semibold',
              isOpen ? 'text-brown-700' : 'text-brown-600'
            )}
          >
            {title}
          </h2>
        </div>

        {/* Right side: Summary + Chart Count + Warning + Toggle */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Summary (only when collapsed) */}
          {!isOpen && summary && (
            <span className="hidden md:block text-sm text-brown-500 mr-2 max-w-md truncate">
              {summary}
            </span>
          )}

          {/* Warning Badge */}
          {warningBadge && (
            <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full whitespace-nowrap">
              {warningBadge}
            </span>
          )}

          {/* Chart Count Badge */}
          {chartCount && !isOpen && (
            <span className="hidden sm:flex items-center text-xs bg-brown-100 text-brown-700 px-2 py-1 rounded-full whitespace-nowrap">
              {chartCount} กราฟ
            </span>
          )}

          {/* Chevron Toggle */}
          <ChevronDown
            className={cn(
              'w-5 h-5 text-brown-600 flex-shrink-0',
              'transition-transform duration-300',
              isOpen ? 'rotate-0' : '-rotate-90'
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Section Content - Only render if opened at least once (lazy loading) */}
      {hasBeenOpened && (
        <div
          id={`${id}-content`}
          ref={contentRef}
          role="region"
          aria-labelledby={`${id}-heading`}
          aria-hidden={!isOpen}
          className={cn(
            'overflow-hidden',
            'transition-all duration-300 ease-in-out',
            isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="bg-brown-50 border-x border-b border-brown-200 rounded-b-lg p-4 md:p-6">
            {/* Description */}
            {description && (
              <p className="text-sm text-brown-600 mb-6">
                {description}
              </p>
            )}

            {/* Charts */}
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
