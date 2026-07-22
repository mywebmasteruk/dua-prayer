import { AdminChannelApplications } from '@kit/community/components';
import { listChannelApplications } from '@kit/community/server/advanced-actions';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

async function AdminChannelsPage() {
  const applications = await listChannelApplications();

  return (
    <PageBody>
      <PageHeader
        title="Channel applications"
        description="Review requests for community channels"
      />
      <AdminChannelApplications applications={applications} />
    </PageBody>
  );
}

export default AdminGuard(AdminChannelsPage);
