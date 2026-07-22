'use client';

import type { FormRegistry } from '../form-fields';
import { DynamicApplicationForm } from './dynamic-application-form';

export function VolunteerApplyForm({ registry }: { registry: FormRegistry }) {
  return <DynamicApplicationForm kind="volunteer" registry={registry} />;
}
