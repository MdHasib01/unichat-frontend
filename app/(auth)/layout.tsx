import Link from 'next/link';
import { Check } from 'lucide-react';
import { UnichatWordmark } from '@/components/shared/brand';
import { LegalFooter } from '@/components/legal/legal-footer';

const HIGHLIGHTS = [
  'Messenger, Instagram Direct and WhatsApp in one inbox',
  'An AI assistant trained only on your own business knowledge',
  'Automations that greet, tag, route and follow up for you',
  'Orders, products and parcels next to the conversation that created them',
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex">
            <UnichatWordmark />
          </Link>
          {children}
          <LegalFooter className="mt-10 border-t border-border pt-6" />
        </div>
      </div>

      {/* Marketing panel — hidden on small screens so the form owns the view. */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_45%),radial-gradient(circle_at_80%_70%,white_0,transparent_40%)]"
        />
        <div className="relative max-w-md text-white">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/70">Repliva</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">
            One inbox for every customer conversation.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            Bring your social channels together, let automation handle the repetitive replies, and
            keep your whole team working from the same view of each customer.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-white/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
