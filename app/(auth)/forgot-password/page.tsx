'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandName } from '@/components/brand-provider';
import { FormField, Input } from '@/components/ui/primitives';
import { post } from '@/services/api';

const schema = z.object({ email: z.string().email('Enter a valid email address') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);
  const [devLink, setDevLink] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      post<{ resetUrl?: string | null }>('/auth/forgot-password', values),
    onSuccess: (data) => {
      setSent(true);
      // Outside production the API returns the link so the flow is testable
      // before email delivery is configured.
      if (data?.resetUrl) setDevLink(data.resetUrl);
    },
    // The response is deliberately identical whether or not the account
    // exists, so there is nothing to surface on error either.
    onError: () => setSent(true),
  });

  if (sent) {
    return (
      <div>
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-success/12 text-success">
          <MailCheck className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          If that email is registered with <BrandName />, a password reset link is on its way. The link
          expires in one hour.
        </p>

        {devLink ? (
          <div className="mt-5 rounded-lg border border-dashed border-border bg-secondary/50 p-3 text-xs">
            <p className="font-medium text-foreground">Development link</p>
            <Link href={devLink} className="mt-1 block break-all text-primary hover:underline">
              {devLink}
            </Link>
          </div>
        ) : null}

        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter the email you sign in with and we&apos;ll send you a reset link.
      </p>

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="mt-7 space-y-4"
        noValidate
      >
        <FormField label="Work email" error={errors.email?.message}>
          <Input type="email" placeholder="you@business.com" autoFocus {...register('email')} />
        </FormField>

        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
