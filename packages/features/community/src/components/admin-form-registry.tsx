'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Switch } from '@kit/ui/switch';

import type { FormKind, FormRegistry } from '../form-fields';
import { updateFormRegistryAction } from '../server/advanced-actions';

export function AdminFormRegistry({
  kind,
  registry: initial,
}: {
  kind: FormKind;
  registry: FormRegistry;
}) {
  const [registry, setRegistry] = useState(initial);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateFormRegistryAction({
            kind,
            registry,
          });

          if (result?.serverError) {
            toast.error(result.serverError);
            return;
          }

          toast.success(
            kind === 'channel'
              ? 'Channel form saved'
              : 'Volunteer form saved',
          );
        });
      }}
    >
      <ul className="space-y-3">
        {registry.fields
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((field) => (
            <li key={field.id} className="space-y-2 rounded-xl border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{field.id}</div>
                  <div className="text-muted-foreground text-xs">
                    {field.type}
                    {field.systemBinding
                      ? ` · ${field.systemBinding}`
                      : ''}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={field.enabled}
                      onCheckedChange={(checked) =>
                        setRegistry((current) => ({
                          ...current,
                          fields: current.fields.map((item) =>
                            item.id === field.id
                              ? { ...item, enabled: checked }
                              : item,
                          ),
                        }))
                      }
                    />
                    Enabled
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) =>
                        setRegistry((current) => ({
                          ...current,
                          fields: current.fields.map((item) =>
                            item.id === field.id
                              ? { ...item, required: checked }
                              : item,
                          ),
                        }))
                      }
                    />
                    Required
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`label-${kind}-${field.id}`}>Label</Label>
                <Input
                  id={`label-${kind}-${field.id}`}
                  value={field.label}
                  onChange={(event) =>
                    setRegistry((current) => ({
                      ...current,
                      fields: current.fields.map((item) =>
                        item.id === field.id
                          ? { ...item, label: event.target.value }
                          : item,
                      ),
                    }))
                  }
                />
              </div>
            </li>
          ))}
      </ul>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save form'}
      </Button>
    </form>
  );
}
