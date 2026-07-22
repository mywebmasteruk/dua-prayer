import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import {
  DEFAULT_CHANNEL_REGISTRY,
  DEFAULT_VOLUNTEER_REGISTRY,
  defaultRegistryFor,
  parseFormRegistry,
  serializeFormRegistry,
  type FormKind,
  type FormRegistry,
} from '../form-fields';

export const CHANNEL_FORM_SETTING_KEY = 'channel_form.fields';
export const VOLUNTEER_FORM_SETTING_KEY = 'volunteer_form.fields';

function settingKeyFor(kind: FormKind): string {
  return kind === 'channel'
    ? CHANNEL_FORM_SETTING_KEY
    : VOLUNTEER_FORM_SETTING_KEY;
}

export async function loadFormRegistry(kind: FormKind): Promise<FormRegistry> {
  const admin = getSupabaseServerAdminClient();
  const fallback =
    kind === 'channel' ? DEFAULT_CHANNEL_REGISTRY : DEFAULT_VOLUNTEER_REGISTRY;

  const { data, error } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', settingKeyFor(kind))
    .maybeSingle();

  if (error || !data?.value) return fallback;

  return parseFormRegistry(data.value, fallback);
}

export async function saveFormRegistry(
  kind: FormKind,
  registry: FormRegistry,
): Promise<void> {
  const admin = getSupabaseServerAdminClient();
  const { error } = await admin.from('site_settings').upsert({
    key: settingKeyFor(kind),
    value: serializeFormRegistry(registry),
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export { defaultRegistryFor };
