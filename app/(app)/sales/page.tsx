import { redirect } from 'next/navigation';

// The Sales group has no page of its own; Orders is its landing screen.
export default function SalesIndexPage() {
  redirect('/sales/orders');
}
