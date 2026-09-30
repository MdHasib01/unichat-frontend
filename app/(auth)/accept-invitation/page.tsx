'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormField, Input } from '@/components/ui/primitives';
import { ApiError, post } from '@/services/api';

const schema = z.object({
  firstName: z.string().trim().min(1, 'Tell us your first name'),
  lastName: z.string().trim().default(''),
  password: z
    .string()
    .min(10, 'Use at least 10 characters')
    .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v), {
      message: 'Include an uppercase letter, a lowercase letter and a number',
    }),
});

type FormValues = z.input<typeof schema>;

export default function AcceptInvitationPage() {
  return (
    <React.Suspense fallback={null}>
      <AcceptInvitationForm />
    </React.Suspense>
  );
}

function AcceptInvitationForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => post('/team/invitations/accept', { token, ...values }),
    onSuccess: () => {
      toast.success('You have joined the team — please sign in');
      router.push('/login');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  /**
   * An existing Repliva user only needs the link; the name and password
   * fields are used when the invite creates their account.
   */
  const joinExisting = useMutation({
    mutationFn: () => post('/team/invitations/accept', { token }),
    onSuccess: () => {
      toast.success('You have joined the team — please sign in');
      router.push('/login');
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && error.code === 'SIGNUP_REQUIRED') {
        toast.info('Finish creating your account below to join the team');
        return;
      }
      toast.error(error.message);
    },
  });

  React.useEffect(() => {
    if (token) joinExisting.mutate();
    // Only attempt the shortcut once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">This invitation link is incomplete</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ask your workspace owner to send the invitation again.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Join the team</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Finish setting up your account to start working in this Repliva workspace.
      </p>

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="mt-7 space-y-4"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name" error={errors.firstName?.message} required>
            <Input autoFocus autoComplete="given-name" {...register('firstName')} />
          </FormField>
          <FormField label="Last name" error={errors.lastName?.message}>
            <Input autoComplete="family-name" {...register('lastName')} />
          </FormField>
        </div>

        <FormField label="Password" error={errors.password?.message} required>
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </FormField>

        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Join workspace
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have a Repliva account?{' '}
        <button
          type="button"
          onClick={() => joinExisting.mutate()}
          className="font-medium text-primary hover:underline"
        >
          Join with it
        </button>
      </p>
    </div>
  );
}
