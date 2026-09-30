import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalTable, type LegalSection } from '@/components/legal/legal-page';
import { LEGAL } from '@/lib/legal';
import { getBrand } from '@/lib/brand-server';
import { BrandName } from '@/components/brand-provider';

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getBrand();
  return {
    title: 'Cookie Policy',
    description: `The cookies and browser storage ${name} uses, and how to control them.`,
  };
}

/** The product name for the current domain (Unichat or Repliva). */
const P = <BrandName />;

const sections: LegalSection[] = [
  {
    id: 'what',
    title: 'What cookies and similar technologies are',
    content: (
      <p>
        Cookies are small text files a website stores in your browser. Browser storage
        (“localStorage”) works in a similar way but is only read by the page’s own code and is never
        sent to our servers automatically. This policy covers both.
      </p>
    ),
  },
  {
    id: 'essential',
    title: 'Essential and authentication cookies',
    content: (
      <>
        <p>
          We set two cookies, and only after you sign in. They are strictly necessary to keep you
          signed in securely, so they cannot be switched off without breaking sign-in. Both are
          HTTP-only, which means scripts on the page cannot read them. In production they are also
          marked <code>Secure</code> and <code>SameSite=Strict</code>.
        </p>
        <LegalTable
          columns={['Name', 'Purpose', 'Duration']}
          rows={[
            [<code key="at">unichat_at</code>, 'Short-lived access token that proves you are signed in.', '1 hour'],
            [
              <code key="rt">unichat_rt</code>,
              'Refresh token that renews your session without asking for your password again. Signing out, or revoking the session under Your account → Security, invalidates it.',
              '30 days',
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: 'preferences',
    title: 'Preferences (browser storage)',
    content: (
      <>
        <p>The app remembers a few interface choices in your browser’s localStorage. These are never sent to us:</p>
        <LegalTable
          columns={['Key', 'Purpose', 'Duration']}
          rows={[
            [<code key="t">theme</code>, 'Your light or dark theme choice.', 'Until you clear it'],
            [<code key="c">unichat:sidebar-collapsed</code>, 'Whether the sidebar is collapsed.', 'Until you clear it'],
            [<code key="g">unichat:sidebar-groups</code>, 'Which sidebar sections are expanded.', 'Until you clear it'],
            [<code key="n">unichat:notification-preferences</code>, 'Your in-app notification settings on this device.', 'Until you clear it'],
          ]}
        />
      </>
    ),
  },
  {
    id: 'widget',
    title: 'Website chat widget',
    content: (
      <>
        <p>
          Businesses can add the {P} chat widget to their own websites. The widget sets <strong>no
          cookies</strong>. It stores one localStorage entry on that website (named{' '}
          <code>unichat:</code> followed by the widget’s key). The entry holds a signed, random visitor
          token, valid for up to 12 months, so the visitor’s conversation continues when they move
          between pages or come back later. It also remembers whether the visitor dismissed the
          pre-chat form. The token contains no name or contact details.
        </p>
        <p>
          The business running that website decides whether to use the widget and is responsible for
          describing it in its own cookie notice.
        </p>
      </>
    ),
  },
  {
    id: 'not-used',
    title: 'Analytics, advertising and third-party cookies',
    content: (
      <p>
        {P} does <strong>not</strong> use analytics cookies, advertising or tracking cookies, social
        media pixels, or any other third-party cookies. When you connect Facebook, Instagram or
        WhatsApp, you sign in on Meta’s own website, and Meta’s cookie policy applies there.
      </p>
    ),
  },
  {
    id: 'control',
    title: 'How to control cookies',
    content: (
      <>
        <ul>
          <li>
            <strong>Sign out</strong> to remove the authentication cookies from this browser, or sign
            out everywhere from <em>Your account → Security</em>.
          </li>
          <li>
            <strong>Browser settings</strong> let you view, block and delete cookies and site data. If
            you block cookies for {P}, you will not be able to sign in.
          </li>
          <li>
            <strong>Clearing site data</strong> removes the preference entries above and, on
            websites using the chat widget, starts a new chat session.
          </li>
        </ul>
        <p>
          Because we only use strictly necessary cookies and local preferences, we do not show a
          cookie consent banner. If we ever add optional cookies, we will ask for your consent first
          and update this policy.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <p>
        Questions? Email <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>. See also our{' '}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
];

export default function CookiePolicyPage() {
  return <LegalPage title="Cookie Policy" sections={sections} />;
}
