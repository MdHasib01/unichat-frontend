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
import { post } from '@/services/api';

const schema = z
  .object({
    password: z
      .string()
      .min(10, 'Use at least 10 characters')
      .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v), {
        message: 'Include an uppercase letter, a lowercase letter and a number',
      }),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'Both passwords must match',
    path: ['confirm'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordForm />
    </React.Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => post('/auth/reset-password', { token, password: values.password }),
    onSuccess: () => {
      toast.success('Password updated — please sign in');
      router.push('/login');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!token) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">This link is incomplete</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          The reset link is missing its token. Request a new one and try again.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Setting a new password signs you out everywhere else.
      </p>

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="mt-7 space-y-4"
        noValidate
      >
        <FormField label="New password" error={errors.password?.message}>
          <Input type="password" autoComplete="new-password" autoFocus {...register('password')} />
        </FormField>

        <FormField label="Confirm password" error={errors.confirm?.message}>
          <Input type="password" autoComplete="new-password" {...register('confirm')} />
        </FormField>

        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Update password
        </Button>
      </form>
    </div>
  );
}
