"use client";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block size-5 animate-spin rounded-full border-2 border-neutral-300 border-t-primary ${className ?? ""}`}
      aria-hidden
    />
  );
}

export function ButtonLoading() {
  return (
    <span className="inline-flex items-center gap-2">
      <LoadingSpinner className="size-4 border-2" />
      <span>...</span>
    </span>
  );
}
