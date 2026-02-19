import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/ui/Skeleton";

export default function ShopsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={3} cols={3} />
    </div>
  );
}
