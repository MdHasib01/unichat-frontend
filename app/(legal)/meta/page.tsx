import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalTable, type LegalSection } from '@/components/legal/legal-page';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Meta Integration Disclosure',
  description: `How ${LEGAL.productName} integrates with Facebook, Instagram and WhatsApp, which permissions it requests and why.`,
};

const P = LEGAL.productName;

/** Mirrors META_SCOPES in .env.example. Keep the two in sync. */
const PERMISSIONS: Array<[string, string]> = [
  ['pages_show_list', 'List the Facebook Pages you manage, so you can choose which ones to connect.'],
  ['pages_messaging', 'Receive Messenger conversations sent to your connected Pages, and send your replies.'],
  ['pages_manage_metadata', 'Subscribe connected Pages to message notifications (webhooks), and unsubscribe them when you disconnect.'],
  ['pages_read_engagement', 'Read basic Page details (name, category, picture) and find the Instagram account linked to each Page.'],
  ['instagram_basic', 'Read the linked Instagram Professional account’s ID, username, name and profile picture.'],
  ['instagram_manage_messages', 'Receive Instagram Direct messages sent to your connected account, and send your replies.'],
  ['business_management', 'Find the WhatsApp Business Accounts owned by your Meta business, so you can choose a number to connect.'],
  ['whatsapp_business_management', 'Read your WhatsApp phone numbers, verified business name and quality rating.'],
  ['whatsapp_business_messaging', 'Receive WhatsApp messages sent to your connected number, and send your replies.'],
];

const sections: LegalSection[] = [
  {
    id: 'what',
    title: 'What the integration does',
    content: (
      <p>
        {P} connects to Facebook, Instagram and WhatsApp through Meta’s official APIs, so a business
        can read and answer messages sent to its Facebook Pages, Instagram Professional accounts and
        WhatsApp Business numbers from one inbox. We do not post on your behalf, read your personal
        Facebook feed or friends, or access personal profiles beyond what is listed below.
      </p>
    ),
  },
  {
    id: 'authorization',
    title: 'You choose what to connect',
    content: (
      <ul>
        <li>Connecting is voluntary. You start it from <strong>Integrations → Connect Meta</strong> in {P}.</li>
        <li>You sign in and approve permissions on Meta’s own screens. We never see your Facebook password.</li>
        <li>After approving, you pick which Pages, Instagram accounts and WhatsApp numbers to connect. Nothing else is synced.</li>
      </ul>
    ),
  },
  {
    id: 'permissions',
    title: 'Permissions we request and why',
    content: (
      <>
        <p>We use each permission only to provide the messaging and inbox features of {P}:</p>
        <LegalTable
          columns={['Permission', 'How we use it']}
          rows={PERMISSIONS.map(([scope, why]) => [<code key={scope}>{scope}</code>, why])}
        />
        <p>
          We store the messages and profile details described in our{' '}
          <Link href="/privacy#meta-data">Privacy Policy</Link>. Access tokens are encrypted at rest.
          We do not sell Meta data or use it for advertising.
        </p>
      </>
    ),
  },
  {
    id: 'disconnect',
    title: 'Disconnecting',
    content: (
      <p>
        You can disconnect any account at any time under <strong>Integrations</strong> in {P}, or
        remove {P} from your Facebook and Instagram settings. When you disconnect, we delete the
        stored access tokens and stop syncing. Existing conversations stay in your workspace until you
        delete them or ask us to. See the <Link href="/data-deletion">Data Deletion Instructions</Link>.
      </p>
    ),
  },
  {
    id: 'third-party',
    title: 'Meta is a third party',
    content: (
      <>
        <p>
          Facebook, Instagram, Messenger and WhatsApp are services of Meta Platforms, Inc. Their own
          terms and privacy policies apply to your use of them, including when you use them through{' '}
          {P}: see the{' '}
          <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">Meta Privacy Policy</a>{' '}
          and <a href="https://www.facebook.com/terms" target="_blank" rel="noopener noreferrer">Meta Terms of Service</a>.
        </p>
        <p>
          <strong>
            {P} is an independent product. It is not affiliated with, endorsed by, sponsored by or
            operated by Meta Platforms, Inc.
          </strong>{' '}
          Facebook, Instagram, Messenger, WhatsApp and Meta are trademarks of Meta Platforms, Inc.
        </p>
      </>
    ),
  },
];

export default function MetaDisclosurePage() {
  return <LegalPage title="Meta Integration Disclosure" sections={sections} showToc={false} />;
}
