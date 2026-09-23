import { redirect } from 'next/navigation';

export default function RootPage() {
  // The app has no marketing site; signed-out users land on /login via the
  // dashboard's own auth guard.
  redirect('/dashboard');
}
