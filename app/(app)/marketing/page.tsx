import { redirect } from 'next/navigation';

// Every Marketing module is crown-marked, so this lands on the first one,
// which explains that the service is not for sale yet.
export default function MarketingIndexPage() {
  redirect('/marketing/ads-flow');
}
