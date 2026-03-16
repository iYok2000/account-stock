import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { RequirePermission } from "@/components/auth/RequirePermission";

export default function DashboardPage() {
  return (
    <RequirePermission permission="dashboard:read">
      <DashboardContent />
    </RequirePermission>
  );
}
