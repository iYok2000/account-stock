import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-green-100 text-green-800 border-transparent",
  warning: "bg-yellow-100 text-yellow-800 border-transparent",
  danger: "bg-red-100 text-red-800 border-transparent",
  info: "bg-blue-100 text-blue-800 border-transparent",
  neutral: "bg-gray-100 text-gray-800 border-transparent",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
