import { AdminVolunteerApplications } from '@kit/community/components';
import { listVolunteerApplications } from '@kit/community/server/advanced-actions';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

async function AdminVolunteersPage() {
  const applications = await listVolunteerApplications();

  return (
    <PageBody>
      <PageHeader
        title="Volunteer applications"
        description="Review people who want to help support the community"
      />
      <AdminVolunteerApplications applications={applications} />
    </PageBody>
  );
}

export default AdminGuard(AdminVolunteersPage);
