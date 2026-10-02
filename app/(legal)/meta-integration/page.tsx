import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalTable, type LegalSection } from '@/components/legal/legal-page';
import type { Legal } from '@/lib/legal';
import { getBrand, getLegal } from '@/lib/brand-server';
import { BrandName } from '@/components/brand-provider';

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getBrand();
  return {
    title: 'Meta Integration',
    description: `How ${name} connects to Facebook Messenger, Instagram Direct and WhatsApp Business, every Meta permission it uses and why, and the messaging rules it follows.`,
    alternates: { canonical: '/meta-integration' },
  };
}

/** The product name for the current domain (Unichat or Repliva). */
const P = <BrandName />;

/**
 * Every permission the app requests. Mirrors META_SCOPES in
 * backend/src/config/env.ts (plus public_profile, which Meta grants by
 * default) and the Graph API calls in backend/src/integrations/meta/client.ts.
 * Keep all three in sync.
 */
const PERMISSIONS: Array<[string, string]> = [
  [
    'public_profile',
    'Granted by default. Reads the Meta user ID and name of the person who connects, so the workspace shows who authorized the connection.',
  ],
  [
    'pages_show_list',
    'Lists the Facebook Pages the person manages, so they can choose which Pages to connect.',
  ],
  [
    'pages_read_engagement',
    'Reads basic details of each connected Page (name, category and profile picture) and finds the Instagram professional account linked to it.',
  ],
  [
    'pages_manage_metadata',
    'Subscribes each connected Page to Messenger webhooks, so new messages reach the inbox. Unsubscribes the Page again when it is disconnected.',
  ],
  [
    'pages_messaging',
    'Receives Messenger messages sent to a connected Page, reads the sender’s name, profile picture and locale, sends the replies the business writes in the inbox and marks messages as seen.',
  ],
  [
    'instagram_basic',
    'Reads the ID, username, name and profile picture of the connected Instagram professional account.',
  ],
  [
    'instagram_manage_messages',
    'Receives Instagram Direct messages sent to the connected account, reads the sender’s name, username and profile picture, and sends the replies the business writes in the inbox.',
  ],
  [
    'business_management',
    'Lists the businesses in the person’s Meta business portfolio and the WhatsApp Business Accounts each one owns, so they can choose a WhatsApp number to connect.',
  ],
  [
    'whatsapp_business_management',
    'Reads the phone numbers of a WhatsApp Business Account: display number, verified business name and quality rating.',
  ],
  [
    'whatsapp_business_messaging',
    'Receives WhatsApp messages sent to the connected number and sends the replies the business writes in the inbox.',
  ],
];

function buildSections(L: Legal): LegalSection[] {
  return [
  {
    id: 'what',
    title: 'What we do with Meta platforms',
    content: (
      <>
        <p>
          {P} is a unified inbox. It lets a business read and reply to messages from{' '}
          <strong>its own customers</strong> on Facebook Messenger, Instagram Direct and WhatsApp
          Business, from one screen, through Meta’s official APIs.
        </p>
        <ul>
          <li>
            A conversation always starts with the customer. {P} receives a message only after a
            customer writes to the business’s Facebook Page, Instagram professional account or
            WhatsApp number. It cannot open a new conversation with anyone.
          </li>
          <li>
            Replies are written by the business’s team. Optionally, they can come from automation
            rules or an AI assistant that the business configures.
          </li>
          <li>
            {P} does not post on Pages or profiles. It does not read anyone’s personal feed, friends
            list or Page content, and it does not use Meta’s advertising tools.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'connect',
    title: 'How a business connects',
    content: (
      <>
        <p>
          Connecting is always optional. You need a role in your workspace that can manage
          integrations, and you must manage the Page, Instagram account or WhatsApp Business Account
          on Meta:
        </p>
        <ol>
          <li>
            Sign in to {P} and open <strong>Integrations</strong>. Choose <strong>Connect Meta</strong>.
          </li>
          <li>
            You are sent to Meta’s own <strong>Facebook Login for Business</strong> screen. There
            you sign in to Facebook, choose which assets to share and approve the permissions listed
            below. {P} never sees your Facebook password.
          </li>
          <li>
            Back in {P}, choose which Facebook Pages, linked Instagram professional accounts and
            WhatsApp Business phone numbers to connect. Only the assets you choose are synced.
          </li>
        </ol>
        <p>
          WhatsApp numbers are connected in the same step. After you approve access, {P} lists the
          WhatsApp Business Accounts owned by your Meta business portfolio, and you pick the numbers
          you want.
        </p>
      </>
    ),
  },
  {
    id: 'disconnect',
    title: 'How to disconnect',
    content: (
      <>
        <ul>
          <li>
            <strong>One account</strong>: in {P}, open <strong>Integrations</strong> and click{' '}
            <strong>Disconnect</strong> next to the Page, Instagram account or WhatsApp number.
          </li>
          <li>
            <strong>Everything</strong>: click <strong>Disconnect</strong> on the Meta card in{' '}
            <strong>Integrations</strong> to disconnect all Facebook, Instagram and WhatsApp
            accounts at once.
          </li>
          <li>
            <strong>From Meta’s side</strong>: remove {P} under <em>Business integrations</em> in
            your Facebook settings, or under <em>Connected apps</em> in Meta Business Suite. This
            works even if you can no longer sign in to {P}.
          </li>
        </ul>
        <p>
          When you disconnect in {P}, we unsubscribe the Page from webhooks, permanently delete the
          stored access tokens and stop syncing. Messages already in your inbox stay there until you
          delete them or ask us to. See the <Link href="/data-deletion">Data Deletion Instructions</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'permissions',
    title: 'Permissions we use and why',
    content: (
      <>
        <p>
          {P} requests only the permissions below, and uses each one only for the purpose shown. We
          do not request any advertising, content-publishing or personal-data permissions.
        </p>
        <LegalTable
          columns={['Permission', 'Exactly how we use it']}
          rows={PERMISSIONS.map(([scope, why]) => [<code key={scope}>{scope}</code>, why])}
        />
      </>
    ),
  },
  {
    id: 'messaging-rules',
    title: 'Messaging rules we follow',
    content: (
      <ul>
        <li>
          <strong>Messenger and Instagram</strong>: messages are sent only within Meta’s 24-hour
          customer service window, which starts when the customer last messaged the business, or
          with an approved message tag where Meta’s policy allows one. {P} does not currently send
          tagged messages.
        </li>
        <li>
          <strong>WhatsApp</strong>: free-form messages are sent only within the 24-hour customer
          service window. Outside that window, WhatsApp allows only Meta-approved message templates,
          and only to people who have opted in to hear from the business. {P}’s saved replies are not
          WhatsApp templates and cannot be used to contact someone outside the window.
        </li>
        <li>
          <strong>No bulk, broadcast or unsolicited messaging.</strong> {P} has no feature for
          sending one message to many people, uploading contact lists to message, or contacting
          anyone who has not first messaged the business. Automations and the AI assistant only
          reply inside existing customer conversations, under the same rules.
        </li>
        <li>
          Our <Link href="/acceptable-use">Acceptable Use Policy</Link> and{' '}
          <Link href="/terms">Terms of Service</Link> forbid spam, purchased or scraped contact
          lists, and any attempt to get around Meta’s messaging rules. We suspend workspaces that
          break them.
        </li>
      </ul>
    ),
  },
  {
    id: 'data',
    title: 'How we handle Meta Platform Data',
    content: (
      <ul>
        <li>We use it only to provide the inbox features the business has turned on.</li>
        <li>
          We never sell it. We never use it for advertising, profiling or data brokering, and we
          never share it except with the service providers named in our{' '}
          <Link href="/privacy#sharing">Privacy Policy</Link>.
        </li>
        <li>
          We never use it to train, fine-tune or improve any AI model. See{' '}
          <Link href="/privacy#ai">AI features and Meta Platform Data</Link>.
        </li>
        <li>Access tokens are encrypted at rest (AES-256-GCM), and every webhook is checked against Meta’s signature.</li>
        <li>
          You can ask us to delete your data at any time. We complete verified requests within{' '}
          {L.deletionDays} days (see <Link href="/data-deletion">Data Deletion</Link>).
        </li>
      </ul>
    ),
  },
  {
    id: 'policies',
    title: 'Related policies',
    content: (
      <ul>
        <li><Link href="/privacy">Privacy Policy</Link></li>
        <li><Link href="/terms">Terms of Service</Link></li>
        <li><Link href="/data-deletion">Data Deletion Instructions</Link></li>
        <li><Link href="/acceptable-use">Acceptable Use Policy</Link></li>
        <li><Link href="/contact">Contact us</Link></li>
      </ul>
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
}

export default async function MetaIntegrationPage() {
  const L = await getLegal();
  return (
    <LegalPage
      title="Meta Integration"
      intro={
        <p>
          This page explains how {P} works with Facebook Messenger, Instagram Direct and WhatsApp
          Business: what it does, how a business connects and disconnects, which Meta permissions it
          uses, and the messaging rules it follows.
        </p>
      }
      summary={
        <ul>
          <li>{P} lets a business answer messages its own customers send it. Every conversation starts with the customer.</li>
          <li>No bulk, broadcast or unsolicited messaging, and replies stay within Meta’s messaging windows.</li>
          <li>Meta Platform Data is never sold, never used for ads and never used to train AI models.</li>
        </ul>
      }
      sections={buildSections(L)} legal={L}
    />
  );
}
