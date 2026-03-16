import { PageHeaderSkeleton, StatCardsSkeleton, CardGridSkeleton } from "@/components/ui/Skeleton";

export default function CampaignsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton cols={4} />
      <CardGridSkeleton count={4} cols={2} />
    </div>
  );
}
