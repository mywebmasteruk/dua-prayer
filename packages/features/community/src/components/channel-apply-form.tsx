'use client';

import type { FormRegistry } from '../form-fields';
import { DynamicApplicationForm } from './dynamic-application-form';

export function ChannelApplyForm({ registry }: { registry: FormRegistry }) {
  return <DynamicApplicationForm kind="channel" registry={registry} />;
}
