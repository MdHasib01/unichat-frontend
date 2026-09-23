import { redirect } from 'next/navigation';

// Calls has no page of its own; Recordings is its landing screen.
export default function CallsIndexPage() {
  redirect('/calls/recordings');
}
