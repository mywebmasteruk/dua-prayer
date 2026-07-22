'use client';

import { useMemo, useState, useTransition } from 'react';

import { CaptchaField } from '@kit/auth/captcha/client';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Checkbox } from '@kit/ui/checkbox';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { RadioGroup, RadioGroupItem } from '@kit/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Textarea } from '@kit/ui/textarea';

import {
  isFieldVisible,
  validateAnswers,
  visibleFields,
  type FormAnswerValue,
  type FormKind,
  type FormRegistry,
} from '../form-fields';
import {
  submitChannelApplicationAction,
  submitVolunteerApplicationAction,
} from '../server/advanced-actions';

function asString(value: FormAnswerValue | undefined): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return value.join(', ');
  return '';
}

export function DynamicApplicationForm({
  kind,
  registry,
}: {
  kind: FormKind;
  registry: FormRegistry;
}) {
  const [answers, setAnswers] = useState<
    Record<string, FormAnswerValue | undefined>
  >({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [captchaToken, setCaptchaToken] = useState('');
  const [isPending, startTransition] = useTransition();
  const captchaSiteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

  const fields = useMemo(
    () =>
      visibleFields(registry).filter((field) =>
        isFieldVisible(field, answers),
      ),
    [answers, registry],
  );

  const setAnswer = (id: string, value: FormAnswerValue | undefined) => {
    setAnswers((current) => ({ ...current, [id]: value }));
    setFieldErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const toggleMulti = (id: string, option: string) => {
    const current = answers[id];
    const list = Array.isArray(current) ? [...current] : [];
    const index = list.indexOf(option);
    if (index >= 0) list.splice(index, 1);
    else list.push(option);
    setAnswer(id, list);
  };

  return (
    <form
      className="space-y-4 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const validation = validateAnswers(registry, answers);

        if (!validation.ok) {
          setFieldErrors(validation.errors);
          toast.error('Please complete the required fields.');
          return;
        }

        startTransition(async () => {
          const payload = {
            answers: answers as Record<string, unknown>,
            captchaToken: captchaToken || undefined,
          };

          const result =
            kind === 'channel'
              ? await submitChannelApplicationAction(payload)
              : await submitVolunteerApplicationAction(payload);

          if (result?.serverError) {
            toast.error(result.serverError);
            return;
          }

          toast.success(
            kind === 'channel'
              ? 'Application submitted for review'
              : 'Volunteer application submitted',
          );
          setAnswers({});
          setCaptchaToken('');
          setFieldErrors({});
        });
      }}
    >
      {fields.map((field) => {
        if (field.type === 'file') {
          return (
            <div key={field.id} className="space-y-1">
              <Label>{field.label}</Label>
              <p className="text-muted-foreground text-xs">
                File uploads are not available in this form yet.
              </p>
            </div>
          );
        }

        const error = fieldErrors[field.id];

        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required ? ' *' : ''}
            </Label>
            {field.helpText ? (
              <p className="text-muted-foreground text-xs">{field.helpText}</p>
            ) : null}

            {field.type === 'textarea' ? (
              <Textarea
                id={field.id}
                value={asString(answers[field.id])}
                placeholder={field.placeholder}
                onChange={(event) => setAnswer(field.id, event.target.value)}
                rows={4}
              />
            ) : null}

            {field.type === 'text' ||
            field.type === 'email' ||
            field.type === 'url' ||
            field.type === 'tel' ? (
              <Input
                id={field.id}
                type={field.type}
                value={asString(answers[field.id])}
                placeholder={field.placeholder}
                onChange={(event) => setAnswer(field.id, event.target.value)}
              />
            ) : null}

            {field.type === 'select' ? (
              <Select
                value={asString(answers[field.id]) || undefined}
                onValueChange={(value) => {
                  if (value) setAnswer(field.id, value);
                }}
              >
                <SelectTrigger id={field.id}>
                  <SelectValue
                    placeholder={field.placeholder ?? 'Select…'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {field.type === 'radio' ? (
              <RadioGroup
                value={asString(answers[field.id])}
                onValueChange={(value) => setAnswer(field.id, value)}
              >
                {(field.options ?? []).map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center gap-2"
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`${field.id}-${option.value}`}
                    />
                    <Label htmlFor={`${field.id}-${option.value}`}>
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : null}

            {field.type === 'checkbox' ? (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={answers[field.id] === true}
                  onCheckedChange={(checked) =>
                    setAnswer(field.id, checked === true)
                  }
                />
                {field.label}
              </label>
            ) : null}

            {field.type === 'multiselect' ? (
              <div className="flex flex-col gap-2">
                {(field.options ?? []).map((option) => {
                  const current = answers[field.id];
                  const selected =
                    Array.isArray(current) && current.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={Boolean(selected)}
                        onCheckedChange={() =>
                          toggleMulti(field.id, option.value)
                        }
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            ) : null}

            {error ? (
              <p className="text-destructive text-xs">{error}</p>
            ) : null}
          </div>
        );
      })}

      {captchaSiteKey ? (
        <CaptchaField
          siteKey={captchaSiteKey}
          onTokenChange={(token) => setCaptchaToken(token)}
        />
      ) : null}

      <Button
        type="submit"
        disabled={isPending || (Boolean(captchaSiteKey) && !captchaToken)}
      >
        {isPending ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  );
}
