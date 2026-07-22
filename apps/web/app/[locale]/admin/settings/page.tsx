import { AdminRssSettings } from '@kit/community/components';
import { createCommunityApi } from '@kit/community/api';
import { getChannels } from '@kit/community/server/actions';
import { getRssSettings } from '@kit/community/server/advanced-actions';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { PageBody, PageHeader } from '@kit/ui/page';

import { AiModerationSettingsForm } from './_components/ai-moderation-settings-form';

async function AdminSettingsPage() {
  const client = getSupabaseServerClient();
  const api = createCommunityApi(client);
  const [rss, ai, channels] = await Promise.all([
    getRssSettings(),
    api.getAiModerationSettings(),
    getChannels(),
  ]);

  return (
    <PageBody className="space-y-8">
      <PageHeader
        title="Community settings"
        description="RSS feed and AI moderation"
      />
      <section className="space-y-3">
        <h2 className="font-medium">RSS</h2>
        <AdminRssSettings settings={rss} channels={channels} />
      </section>
      <section className="space-y-3">
        <h2 className="font-medium">AI moderation</h2>
        <AiModerationSettingsForm
          enabled={ai.enabled}
          model={ai.model}
          baseUrl={ai.baseUrl}
          hasApiKey={Boolean(ai.apiKey)}
        />
      </section>
    </PageBody>
  );
}

export default AdminGuard(AdminSettingsPage);
