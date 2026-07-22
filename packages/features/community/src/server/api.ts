import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@kit/supabase/database';

import { createCommunityService } from './community.service';

export function createCommunityApi(client: SupabaseClient<Database>) {
  return createCommunityService(client);
}
