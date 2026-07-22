import { AdminFormRegistry } from '@kit/community/components';
import { getFormRegistryForAdmin } from '@kit/community/server/advanced-actions';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

async function AdminFormsPage() {
  const [channel, volunteer] = await Promise.all([
    getFormRegistryForAdmin('channel'),
    getFormRegistryForAdmin('volunteer'),
  ]);

  return (
    <PageBody className="space-y-8">
      <PageHeader
        title="Application forms"
        description="Toggle fields and edit labels for channel and volunteer applications"
      />
      <section className="space-y-3">
        <h2 className="font-medium">Channel application</h2>
        <AdminFormRegistry kind="channel" registry={channel} />
      </section>
      <section className="space-y-3">
        <h2 className="font-medium">Volunteer application</h2>
        <AdminFormRegistry kind="volunteer" registry={volunteer} />
      </section>
    </PageBody>
  );
}

export default AdminGuard(AdminFormsPage);
