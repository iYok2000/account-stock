import { PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton cols={4} />
      <TableSkeleton rows={6} />
    </div>
  );
}
