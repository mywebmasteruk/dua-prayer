'use client';

import { useState, useTransition } from 'react';

import { CaptchaField } from '@kit/auth/captcha/client';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';

import { submitVolunteerApplicationAction } from '../server/advanced-actions';

export function VolunteerApplyForm() {
  const [name, setName] = useState('');
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
          const result = await submitVolunteerApplicationAction({
            name,
            message,
            captchaToken: captchaToken || undefined,
          });

          if (result?.serverError) {
            toast.error(result.serverError);
            return;
          }

          toast.success('Volunteer application submitted');
          setName('');
          setMessage('');
          setCaptchaToken('');
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="volunteer-name">Name</Label>
        <Input
          id="volunteer-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="volunteer-message">Why you want to help</Label>
        <Textarea
          id="volunteer-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          required
          minLength={10}
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
