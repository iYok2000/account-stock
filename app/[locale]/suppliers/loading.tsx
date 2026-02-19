import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function SuppliersLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={5} />
    </div>
  );
}
