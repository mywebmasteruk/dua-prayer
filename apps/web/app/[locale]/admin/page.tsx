import { AdminDashboard } from '@kit/admin/components/admin-dashboard';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

function AdminPage() {
  return (
    <PageBody>
      <PageHeader description={`Super Admin`} />

      <AdminDashboard />
    </PageBody>
  );
}

export default AdminGuard(AdminPage);
