import { PageHeaderSkeleton, StatCardsSkeleton, SplitLayoutSkeleton } from "@/components/ui/Skeleton";

export default function TaxLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton cols={4} />
      <SplitLayoutSkeleton />
    </div>
  );
}
