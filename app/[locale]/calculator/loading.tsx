import { PageHeaderSkeleton, SplitLayoutSkeleton } from "@/components/ui/Skeleton";

export default function CalculatorLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <SplitLayoutSkeleton />
    </div>
  );
}
