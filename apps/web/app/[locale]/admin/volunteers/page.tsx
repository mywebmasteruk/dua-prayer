import {
  AdminVolunteerApplications,
  AdminVolunteerRoster,
} from '@kit/community/components';
import {
  listCommunityVolunteers,
  listVolunteerApplications,
} from '@kit/community/server/advanced-actions';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

async function AdminVolunteersPage() {
  const [applications, volunteers] = await Promise.all([
    listVolunteerApplications(),
    listCommunityVolunteers(),
  ]);

  return (
    <PageBody className="space-y-8">
      <PageHeader
        title="Volunteers"
        description="Review applications and manage the volunteer roster"
      />
      <section className="space-y-3">
        <h2 className="font-medium">Applications</h2>
        <AdminVolunteerApplications applications={applications} />
      </section>
      <section className="space-y-3">
        <h2 className="font-medium">Roster</h2>
        <AdminVolunteerRoster volunteers={volunteers} />
      </section>
    </PageBody>
  );
}

export default AdminGuard(AdminVolunteersPage);
