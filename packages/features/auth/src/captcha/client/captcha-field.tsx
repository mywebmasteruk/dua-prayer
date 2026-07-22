'use client';

import { useRef } from 'react';

import {
  Turnstile,
  TurnstileInstance,
  TurnstileProps,
  WidgetSize,
} from '@marsidev/react-turnstile';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { useController } from 'react-hook-form';

// NEXT_PUBLIC_CAPTCHA_WIDGET_SIZE controls the default Turnstile widget size.
// Set to 'normal' or 'compact' when using a Managed site key so the checkbox
// is visible. Defaults to 'invisible' for non-interactive / invisible keys.
const DEFAULT_WIDGET_SIZE =
  (process.env['NEXT_PUBLIC_CAPTCHA_WIDGET_SIZE'] as WidgetSize | undefined) ??
  'invisible';

interface BaseCaptchaFieldProps {
  siteKey: string | undefined;
  options?: Omit<TurnstileProps, 'siteKey' | 'onSuccess'>;
  nonce?: string;
  className?: string;
}

interface StandaloneCaptchaFieldProps extends BaseCaptchaFieldProps {
  onTokenChange: (token: string) => void;
  onInstanceChange?: (instance: TurnstileInstance | null) => void;
  control?: never;
  name?: never;
}

interface ReactHookFormCaptchaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends BaseCaptchaFieldProps {
  control: Control<TFieldValues>;
  name: TName;
  onTokenChange?: never;
  onInstanceChange?: never;
}

type CaptchaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> =
  | StandaloneCaptchaFieldProps
  | ReactHookFormCaptchaFieldProps<TFieldValues, TName>;

/**
 * @name CaptchaField
 * @description Self-contained captcha component with two modes:
 *
 * **Standalone mode** - For use outside react-hook-form:
 * ```tsx
 * <CaptchaField
 *   siteKey={siteKey}
 *   onTokenChange={setToken}
 * />
 * ```
 *
 * **React Hook Form mode** - Automatic form integration:
 * ```tsx
 * <CaptchaField
 *   siteKey={siteKey}
 *   control={form.control}
 *   name="captchaToken"
 * />
 * ```
 */
export function CaptchaField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: CaptchaFieldProps<TFieldValues, TName>) {
  if (!props.siteKey) {
    return null;
  }

  if ('control' in props && props.control) {
    return (
      <CaptchaFieldRHF
        siteKey={props.siteKey}
        control={props.control}
        name={props.name}
        options={props.options}
        nonce={props.nonce}
        className={props.className}
      />
    );
  }

  const standaloneProps = props as StandaloneCaptchaFieldProps;

  return (
    <CaptchaFieldStandalone
      siteKey={props.siteKey}
      onTokenChange={standaloneProps.onTokenChange}
      onInstanceChange={standaloneProps.onInstanceChange}
      options={props.options}
      nonce={props.nonce}
      className={props.className}
    />
  );
}

function CaptchaFieldStandalone({
  siteKey,
  options,
  nonce,
  className,
  onTokenChange,
  onInstanceChange,
}: StandaloneCaptchaFieldProps & { siteKey: string }) {
  const instanceRef = useRef<TurnstileInstance | null>(null);

  return (
    <CaptchaWidget
      siteKey={siteKey}
      options={options}
      nonce={nonce}
      className={className}
      onSuccess={onTokenChange}
      onInstanceChange={(instance) => {
        instanceRef.current = instance;
        onInstanceChange?.(instance);
      }}
    />
  );
}

function CaptchaFieldRHF<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  siteKey,
  options,
  nonce,
  control,
  name,
  className,
}: ReactHookFormCaptchaFieldProps<TFieldValues, TName> & { siteKey: string }) {
  const { field } = useController({ control, name });

  return (
    <CaptchaWidget
      siteKey={siteKey}
      options={options}
      nonce={nonce}
      className={className}
      onSuccess={field.onChange}
    />
  );
}

interface CaptchaWidgetProps {
  siteKey: string;
  options?: Omit<TurnstileProps, 'siteKey' | 'onSuccess'>;
  nonce?: string;
  className?: string;
  onSuccess: (token: string) => void;
  onInstanceChange?: (instance: TurnstileInstance | null) => void;
}

function CaptchaWidget({
  siteKey,
  options,
  nonce,
  className,
  onSuccess,
  onInstanceChange,
}: CaptchaWidgetProps) {
  const widgetOptions = {
    size: DEFAULT_WIDGET_SIZE,
    ...options?.options,
  };

  return (
    <Turnstile
      className={className}
      ref={(instance) => {
        if (instance) {
          onInstanceChange?.(instance);
        }
      }}
      siteKey={siteKey}
      onSuccess={onSuccess}
      scriptOptions={{ nonce }}
      {...options}
      options={widgetOptions}
    />
  );
}
