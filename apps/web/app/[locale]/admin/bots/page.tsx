import { AdminDuaBots } from '@kit/community/components';
import { listDuaBotsForAdmin } from '@kit/community/server/advanced-actions';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

async function AdminBotsPage() {
  const bots = await listDuaBotsForAdmin();

  return (
    <PageBody>
      <PageHeader
        title="Dua bots"
        description="Stub runner for scheduled community posts — generation is not wired yet"
      />
      <AdminDuaBots bots={bots} />
    </PageBody>
  );
}

export default AdminGuard(AdminBotsPage);
