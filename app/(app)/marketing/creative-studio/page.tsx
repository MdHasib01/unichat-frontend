import type { Metadata } from 'next';
import { NotForSale } from '@/components/shared/not-for-sale';

export const metadata: Metadata = { title: 'Creative Studio' };

// Crown-marked module: visible and reachable, but not for sale yet.
export default function Page() {
  return <NotForSale route="/marketing/creative-studio" />;
}
