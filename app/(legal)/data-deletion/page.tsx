import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalTable, type LegalSection } from '@/components/legal/legal-page';
import { LEGAL, PHONE_HREF } from '@/lib/legal';
import { getBrand } from '@/lib/brand-server';
import { BrandName } from '@/components/brand-provider';

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getBrand();
  return {
    title: 'Data Deletion Instructions',
    description: `How to disconnect Facebook, Instagram and WhatsApp from ${name} and how to delete your account and data.`,
  };
}

/** The product name for the current domain (Unichat or Repliva). */
const P = <BrandName />;
const deletionMail = `mailto:${LEGAL.privacyEmail}?subject=${encodeURIComponent('Data deletion request')}`;

const sections: LegalSection[] = [
  {
    id: 'disconnect-channel',
    title: 'Disconnect a single Facebook Page, Instagram account or WhatsApp number',
    content: (
      <>
        <ol>
          <li>
            <Link href="/login">Sign in</Link> to {P}.
          </li>
          <li>Open <strong>Integrations</strong> from the sidebar.</li>
          <li>Under <strong>Connected channels</strong>, find the Page, Instagram account or WhatsApp number.</li>
          <li>Click <strong>Disconnect</strong> next to it.</li>
        </ol>
        <p>
          Only workspace owners and admins (or roles allowed to manage integrations) can do this.
          If you do not see the button, ask your workspace owner.
        </p>
      </>
    ),
  },
  {
    id: 'disconnect-meta',
    title: 'Disconnect Facebook, Instagram and WhatsApp completely',
    content: (
      <>
        <ol>
          <li>Open <strong>Integrations</strong>.</li>
          <li>
            On the <strong>Meta</strong> card, click <strong>Disconnect</strong>. This disconnects
            every Facebook Page, Instagram account and WhatsApp number in the workspace at once.
          </li>
        </ol>
        <p>
          You can also revoke {P}’s access from Meta’s side, even if you can no longer sign in to{' '}
          {P}:
        </p>
        <ul>
          <li>
            <strong>Facebook</strong>: go to <em>Settings &amp; privacy → Settings → Business
            integrations</em> (or <em>Apps and websites</em>), select {P} and choose{' '}
            <strong>Remove</strong>.
          </li>
          <li>
            <strong>Instagram</strong>: go to <em>Settings → Website permissions → Apps and
            websites</em>, select {P} and choose <strong>Remove</strong>.
          </li>
          <li>
            <strong>WhatsApp Business / Meta Business Suite</strong>: in <em>Business settings →
            Integrations → Connected apps</em> (or <em>Accounts → WhatsApp accounts → Partners</em>),
            remove {P}.
          </li>
        </ul>
        <p>Meta sometimes renames these menus. If a path above does not match, search Meta’s Help Center for “remove business integration”.</p>
      </>
    ),
  },
  {
    id: 'after-disconnect',
    title: 'What happens after you disconnect',
    content: (
      <ul>
        <li>We permanently delete the stored access tokens for the disconnected accounts.</li>
        <li>
          We unsubscribe disconnected Facebook Pages from message notifications and stop adding new
          messages from them to your inbox.
        </li>
        <li>We can no longer send messages through the disconnected accounts.</li>
        <li>
          <strong>Conversations, contacts and messages already synced stay in your workspace</strong>{' '}
          as your business records, until you delete them (next section) or request deletion. They
          are not deleted automatically.
        </li>
        <li>You can reconnect later. You will need to approve access on Meta’s screens again.</li>
      </ul>
    ),
  },
  {
    id: 'delete-messages',
    title: 'Delete synced messages and contacts',
    content: (
      <>
        <p>
          <strong>Individual people</strong>: open <strong>Contacts</strong>, select the contact, click
          the delete (trash) icon and confirm. This permanently deletes the contact and all their
          conversations and messages in your workspace.
        </p>
        <p>
          <strong>All synced messaging data</strong>: if you want every conversation, message and
          contact received from your connected platforms removed while keeping your account and
          workspace settings, submit a request for <em>“Synchronized messaging data only”</em> on the{' '}
          <Link href="/delete-account">Delete account</Link> page (owners and admins), or email us.
        </p>
      </>
    ),
  },
  {
    id: 'delete-account',
    title: 'Delete your account or workspace',
    content: (
      <>
        <p>
          Sign in and go to <Link href="/delete-account">Delete account</Link> (also linked from{' '}
          <em>Your account → Security</em>). Choose what to delete and submit the request. You will
          get a reference code, and you can follow the status of your request on the same page.
        </p>
        <LegalTable
          columns={['Option', 'What is deleted', 'Who can request it']}
          rows={[
            [
              'My user account',
              'Your profile, sign-in details, sessions and workspace memberships. Messages you sent stay in the workspace, no longer linked to you, because they belong to the business’s records.',
              'Any user',
            ],
            [
              'Entire workspace',
              'The workspace and everything in it: connected accounts and tokens, conversations, messages, contacts, AI knowledge, automations, sales and call records, and team memberships.',
              'Workspace owner',
            ],
            [
              'Synchronized messaging data only',
              'All conversations, messages and contacts, and the related webhook logs, received from connected platforms. Settings, team and configuration are kept.',
              'Owner or admin',
            ],
          ]}
        />
        <p>
          If you are the only owner of a workspace and ask to delete only your user account, we will
          contact you first about transferring ownership or deleting the workspace too.
        </p>
      </>
    ),
  },
  {
    id: 'by-email',
    title: 'Request deletion by email',
    content: (
      <>
        <p>
          If you cannot sign in, or you prefer email, write to{' '}
          <a href={deletionMail}>{LEGAL.privacyEmail}</a> with the subject “Data deletion request”.
          Please include:
        </p>
        <ul>
          <li>the email address of your {P} account (send the request from that address if you can);</li>
          <li>the workspace (business) name;</li>
          <li>what you want deleted (account, workspace or synced messaging data); and</li>
          <li>if relevant, the names of the connected Facebook Pages, Instagram accounts or WhatsApp numbers.</li>
        </ul>
        <p>
          <strong>If you messaged a business that uses {P}</strong>, that business controls your
          conversation. Ask the business to delete it. It can do this from its Contacts page. If
          you cannot reach the business, email us with the business’s name and the platform you
          used, and we will pass on your request and help the business respond.
        </p>
        <p>
          <strong>Response time:</strong> we acknowledge within {LEGAL.acknowledgeHours} hours and
          complete verified requests within {LEGAL.deletionDays} days.
        </p>
        <p>
          You can also call us on <a href={PHONE_HREF}>{LEGAL.phone}</a>. We will ask you to confirm
          the request by email so we have a written record of it.
        </p>
        <p>We may ask you to confirm your identity before deleting anything, to protect your data from fraudulent requests.</p>
      </>
    ),
  },
  {
    id: 'timing',
    title: 'Timing and what we keep',
    content: (
      <ul>
        <li>
          For email requests, we acknowledge within {LEGAL.acknowledgeHours} hours and complete
          verified requests within {LEGAL.deletionDays} days.
        </li>
        <li>Deleted data may remain in database backups until they rotate out (currently within 14 days). It is not restored into the live service.</li>
        <li>
          We keep a minimal record of each deletion request (reference, date, scope and outcome) so
          we can show it was honored, plus anything we are legally required to retain.
        </li>
        <li>
          Copies held by Meta (for example, the original messages in your Facebook, Instagram or
          WhatsApp inbox) are controlled by Meta and are not affected. Manage them in Meta’s own
          settings.
        </li>
      </ul>
    ),
  },
  {
    id: 'contact',
    title: 'Questions',
    content: (
      <>
        <p>
          Email <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>, call{' '}
          <a href={PHONE_HREF}>{LEGAL.phone}</a> or visit our <Link href="/contact">Contact</Link>{' '}
          page. For more on how we handle data, see our <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          {LEGAL.operatorName} — Proprietor: {LEGAL.proprietor} · {LEGAL.address}
        </p>
      </>
    ),
  },
];

export default function DataDeletionPage() {
  return (
    <LegalPage
      title="Data Deletion Instructions"
      intro={
        <p>
          This page explains how to disconnect Facebook, Instagram and WhatsApp from {P}, how to
          delete messages and contacts synced from those platforms, and how to delete your {P}{' '}
          account or workspace.
        </p>
      }
      summary={
        <ul>
          <li>
            <strong>Stop access</strong>: Integrations → Disconnect. Access tokens are deleted
            immediately.
          </li>
          <li>
            <strong>Delete data</strong>: sign in and use <Link href="/delete-account">Delete account</Link>,
            email <a href={deletionMail}>{LEGAL.privacyEmail}</a> or call{' '}
            <a href={PHONE_HREF}>{LEGAL.phone}</a>. No sign-in is needed to send a request by email.
          </li>
          <li>
            We acknowledge email requests within {LEGAL.acknowledgeHours} hours and complete verified
            requests within {LEGAL.deletionDays} days.
          </li>
        </ul>
      }
      sections={sections}
    />
  );
}
