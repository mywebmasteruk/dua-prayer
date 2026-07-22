import {
  AdminFooterLinks,
  AdminSiteCopy,
} from '@kit/community/components';
import {
  getFooterLinks,
  getSiteCopyForAdmin,
} from '@kit/community/server/advanced-actions';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

async function AdminCopyPage() {
  const [rows, footerLinks] = await Promise.all([
    getSiteCopyForAdmin(),
    getFooterLinks(),
  ]);

  return (
    <PageBody className="space-y-8">
      <PageHeader
        title="Site copy"
        description="Edit composer, empty-state, and footer text"
      />
      <section className="space-y-3">
        <h2 className="font-medium">Copy strings</h2>
        <AdminSiteCopy rows={rows} />
      </section>
      <section className="space-y-3">
        <h2 className="font-medium">Footer links</h2>
        <AdminFooterLinks links={[...footerLinks]} />
      </section>
    </PageBody>
  );
}

export default AdminGuard(AdminCopyPage);
