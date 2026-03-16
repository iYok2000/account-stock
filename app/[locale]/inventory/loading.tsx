import { PageHeaderSkeleton, FilterRowSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function InventoryLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <FilterRowSkeleton />
      <TableSkeleton rows={8} />
    </div>
  );
}
