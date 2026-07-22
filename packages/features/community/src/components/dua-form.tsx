'use client';

import { useState, useTransition } from 'react';

import { CaptchaField } from '@kit/auth/captcha/client';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Textarea } from '@kit/ui/textarea';

import type { PostingMode } from '../posting-settings';
import { createDuaAction } from '../server/server-actions';
import type { SiteCopy } from '../site-copy';
import type { Category } from '../types';

interface DuaFormProps {
  categories: Category[];
  channelId?: number | null;
  postingMode?: PostingMode;
  copy?: Pick<
    SiteCopy,
    | 'composerTitleEn'
    | 'composerDescriptionEn'
    | 'composerPlaceholderEn'
    | 'composerSubmitEn'
    | 'composerSubmittingEn'
  >;
  onCreated?: () => void;
}

export function DuaForm({
  categories,
  channelId = null,
  postingMode = 'public',
  copy,
  onCreated,
}: DuaFormProps) {
  const [text, setText] = useState('');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [captchaToken, setCaptchaToken] = useState('');
  const [isPending, startTransition] = useTransition();
  const captchaSiteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

  if (postingMode === 'closed') {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm">
        Public dua submissions are currently closed.
      </div>
    );
  }

  const remaining = 1200 - text.trim().length;
  const tooShort = text.trim().length > 0 && text.trim().length < 15;

  return (
    <form
      className="space-y-4 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          try {
            const result = await createDuaAction({
              text,
              categoryId:
                categoryId === 'none' ? null : Number.parseInt(categoryId, 10),
              channelId,
              website: '',
              captchaToken: captchaToken || undefined,
            });

            if (result?.serverError) {
              toast.error(result.serverError);
              return;
            }

            if (!result?.data?.success) {
              toast.error('Could not share dua');
              return;
            }

            setText('');
            setCategoryId('none');
            toast.success(
              result.data.heldForReview
                ? 'Dua received and waiting for review'
                : 'Dua shared with the community',
            );
            onCreated?.();
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : 'Could not share dua',
            );
          }
        });
      }}
    >
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="space-y-2">
        <Label htmlFor="dua-text">
          {copy?.composerTitleEn ?? 'Share a dua'}
        </Label>
        {copy?.composerDescriptionEn ? (
          <p className="text-muted-foreground text-xs">
            {copy.composerDescriptionEn}
          </p>
        ) : null}
        <Textarea
          id="dua-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            copy?.composerPlaceholderEn ?? 'Write your dua here...'
          }
          rows={4}
          maxLength={1200}
          required
        />
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>
            {tooShort
              ? 'At least 15 characters'
              : postingMode === 'registered_only'
                ? 'Sign in required to share'
                : 'Visible to the community'}
          </span>
          <span className={remaining < 0 ? 'text-destructive' : undefined}>
            {remaining}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Topic</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => setCategoryId(value ?? 'none')}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No topic</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {captchaSiteKey ? (
        <CaptchaField
          siteKey={captchaSiteKey}
          onTokenChange={(token) => setCaptchaToken(token)}
        />
      ) : null}

      <Button
        type="submit"
        disabled={
          isPending ||
          text.trim().length < 15 ||
          (Boolean(captchaSiteKey) && !captchaToken)
        }
      >
        {isPending
          ? (copy?.composerSubmittingEn ?? 'Sharing…')
          : (copy?.composerSubmitEn ?? 'Share dua')}
      </Button>
    </form>
  );
}
