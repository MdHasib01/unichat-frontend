'use client';

import Link from 'next/link';
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
  organizationName: z.string().trim().min(2, 'Enter your business name'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(10, 'Use at least 10 characters')
    .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v), {
      message: 'Include an uppercase letter, a lowercase letter and a number',
    }),
});

type FormValues = z.input<typeof schema>;

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => post('/auth/register', values),
    onSuccess: () => {
      // Straight into onboarding — the workspace exists but is not set up yet.
      window.location.href = '/onboarding';
    },
    onError: (error: Error) => {
      if (error instanceof ApiError) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof FormValues, { message });
        }
        if (error.code === 'EMAIL_TAKEN') {
          setError('email', { message: 'An account with this email already exists' });
          return;
        }
      }
      toast.error(error.message);
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Your workspace is private to your business — its conversations, customers and settings are
        never shared with anyone else.
      </p>

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="mt-7 space-y-4"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name" error={errors.firstName?.message} required>
            <Input placeholder="Dana" autoComplete="given-name" autoFocus {...register('firstName')} />
          </FormField>
          <FormField label="Last name" error={errors.lastName?.message}>
            <Input placeholder="Owens" autoComplete="family-name" {...register('lastName')} />
          </FormField>
        </div>

        <FormField label="Business name" error={errors.organizationName?.message} required>
          <Input placeholder="Acme Marketing" autoComplete="organization" {...register('organizationName')} />
        </FormField>

        <FormField label="Work email" error={errors.email?.message} required>
          <Input type="email" placeholder="you@business.com" autoComplete="email" {...register('email')} />
        </FormField>

        <FormField
          label="Password"
          error={errors.password?.message}
          hint="At least 10 characters, with an uppercase letter, a lowercase letter and a number."
          required
        >
          <Input type="password" placeholder="••••••••" autoComplete="new-password" {...register('password')} />
        </FormField>

        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Create workspace
        </Button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          By creating a workspace you agree to the{' '}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/acceptable-use" className="font-medium text-primary hover:underline">
            Acceptable Use Policy
          </Link>
          , and acknowledge the{' '}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
