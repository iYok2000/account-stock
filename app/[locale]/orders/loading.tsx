import { PageHeaderSkeleton, FilterRowSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function OrdersLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <FilterRowSkeleton />
      <TableSkeleton rows={7} />
    </div>
  );
}
