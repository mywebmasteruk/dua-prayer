import { AdminSiteCopy } from '@kit/community/components';
import { getSiteCopyForAdmin } from '@kit/community/server/advanced-actions';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

async function AdminCopyPage() {
  const rows = await getSiteCopyForAdmin();

  return (
    <PageBody>
      <PageHeader
        title="Site copy"
        description="Edit composer and empty-state text"
      />
      <AdminSiteCopy rows={rows} />
    </PageBody>
  );
}

export default AdminGuard(AdminCopyPage);
