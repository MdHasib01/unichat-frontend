import { headers } from 'next/headers';
import { brandForHost, type Brand } from './brand';

/**
 * The brand for the current request, for server components and metadata.
 * Reading headers makes the route render per request, which is required —
 * the same URL must look different on each domain.
 */
export async function getBrand(): Promise<Brand> {
  const h = await headers();
  return brandForHost(h.get('x-forwarded-host') ?? h.get('host'));
}
