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
import type { SessionPayload } from '@/types';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      post<{ user: SessionPayload['user']; organizationId: string | null }>('/auth/login', values),
    onSuccess: () => {
      // Hard navigation so the session query refetches with the new cookies.
      window.location.href = next;
    },
    onError: (error: Error) => {
      if (error instanceof ApiError) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof FormValues, { message });
        }
        if (error.code === 'INVALID_CREDENTIALS') {
          setError('password', { message: 'That email and password do not match' });
          return;
        }
      }
      toast.error(error.message);
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in to your Unichat workspace to pick up where you left off.
      </p>

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="mt-7 space-y-4"
        noValidate
      >
        <FormField label="Work email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@business.com"
            autoFocus
            {...register('email')}
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
        </FormField>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Unichat?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create a workspace
        </Link>
      </p>

      <div className="mt-8 rounded-lg border border-dashed border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Demo workspace</p>
        <p className="mt-1">
          After running the seed, sign in as <code className="font-mono">owner@demo.unichat.app</code>{' '}
          with the password <code className="font-mono">Unichat2026!</code>
        </p>
      </div>
    </div>
  );
}
