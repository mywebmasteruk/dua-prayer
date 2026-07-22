import { AdminDuaList } from '@kit/community/components';
import {
  getAdminDuas,
  getPostingMode,
} from '@kit/community/server/actions';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

async function AdminDuasPage() {
  const [result, postingMode] = await Promise.all([
    getAdminDuas(),
    getPostingMode(),
  ]);

  return (
    <PageBody>
      <PageHeader
        title="Community duas"
        description="Moderate shared duas and posting access"
      />
      <AdminDuaList duas={result.duas} postingMode={postingMode} />
    </PageBody>
  );
}

export default AdminGuard(AdminDuasPage);
