'use client';

import { useState, useTransition } from 'react';

import { CaptchaField } from '@kit/auth/captcha/client';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';

import { submitChannelApplicationAction } from '../server/advanced-actions';

export function ChannelApplyForm() {
  const [channelName, setChannelName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [isPending, startTransition] = useTransition();
  const captchaSiteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

  return (
    <form
      className="space-y-4 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await submitChannelApplicationAction({
            channelName,
            handle,
            description,
            message,
            captchaToken: captchaToken || undefined,
          });

          if (result?.serverError) {
            toast.error(result.serverError);
            return;
          }

          toast.success('Application submitted for review');
          setChannelName('');
          setHandle('');
          setDescription('');
          setMessage('');
          setCaptchaToken('');
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="channel-name">Channel name</Label>
        <Input
          id="channel-name"
          value={channelName}
          onChange={(event) => setChannelName(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="handle">Handle</Label>
        <Input
          id="handle"
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder="my_channel"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message to reviewers</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
        />
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
          isPending || (Boolean(captchaSiteKey) && !captchaToken)
        }
      >
        {isPending ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  );
}
