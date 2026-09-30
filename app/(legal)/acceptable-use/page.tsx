import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, type LegalSection } from '@/components/legal/legal-page';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy',
  description: `What you may not do with ${LEGAL.productName}.`,
};

const P = LEGAL.productName;

const sections: LegalSection[] = [
  {
    id: 'spam',
    title: 'Spam and unsolicited messages',
    content: (
      <ul>
        <li>Do not send bulk, repetitive or unsolicited messages, including promotional messages people have not asked for.</li>
        <li>Message people only after they have contacted you or opted in as the platform and the law require. On WhatsApp, this means a recorded opt-in.</li>
        <li>Do not message people using contact details you bought, scraped or received from someone else.</li>
        <li>Stop messaging anyone who asks you to stop, and honor opt-outs promptly.</li>
      </ul>
    ),
  },
  {
    id: 'messaging-abuse',
    title: 'Abuse of messaging and automation features',
    content: (
      <ul>
        <li>
          Do not configure automations, templates or the AI assistant to send misleading, deceptive
          or harmful messages, or to impersonate a person without disclosure where disclosure is
          required.
        </li>
        <li>Do not use automated follow-ups or replies to send messages outside a platform’s permitted messaging window, or to get around its message tags and template rules.</li>
        <li>Do not create automation loops or send patterns that overload a platform or a recipient.</li>
        <li>Do not use the website chat widget on sites you do not own or are not authorized to operate.</li>
      </ul>
    ),
  },
  {
    id: 'fraud',
    title: 'Fraud, phishing and deception',
    content: (
      <ul>
        <li>Do not use {P} for scams, fraud, pyramid schemes or deceptive offers.</li>
        <li>Do not send phishing messages or links, or request passwords, one-time codes, card numbers or other credentials under false pretenses.</li>
        <li>Do not impersonate another business, person or brand, including Meta, Facebook, Instagram or WhatsApp.</li>
        <li>Do not distribute malware or links to malicious sites.</li>
      </ul>
    ),
  },
  {
    id: 'harassment',
    title: 'Harassment and harmful content',
    content: (
      <ul>
        <li>Do not harass, threaten, bully, stalk or intimidate anyone.</li>
        <li>Do not send hateful, violent, sexually explicit or otherwise objectionable content, or any content that sexualizes minors.</li>
        <li>Do not publish other people’s private information without their permission.</li>
      </ul>
    ),
  },
  {
    id: 'illegal',
    title: 'Illegal activities',
    content: (
      <ul>
        <li>Do not use {P} for any activity that is illegal where you or your recipients are.</li>
        <li>Do not sell or promote goods and services that Meta’s Commerce Policies or the law prohibit, such as illegal drugs, weapons or counterfeit goods.</li>
        <li>Do not infringe anyone’s intellectual property, privacy or publicity rights.</li>
        <li>Do not process personal data in {P} without a lawful basis, or process special-category data without the safeguards the law requires.</li>
      </ul>
    ),
  },
  {
    id: 'unauthorized-access',
    title: 'Unauthorized access and security',
    content: (
      <ul>
        <li>Do not connect Facebook Pages, Instagram accounts or WhatsApp numbers you do not own or are not authorized to manage.</li>
        <li>Do not access, or try to access, another workspace’s data, or any part of the Service you are not authorized to use.</li>
        <li>Do not probe, scan or test the vulnerability of the Service without our written permission, or bypass authentication, rate limits or other security measures.</li>
        <li>Do not share your login with others. Invite them as team members instead.</li>
      </ul>
    ),
  },
  {
    id: 'platform-abuse',
    title: 'Platform abuse',
    content: (
      <ul>
        <li>Do not overload, disrupt or degrade the Service, for example with excessive automated requests.</li>
        <li>Do not scrape, copy or resell the Service, or reverse-engineer it except where the law allows.</li>
        <li>Do not use the Service to build a competing product or to benchmark it for publication without our permission.</li>
      </ul>
    ),
  },
  {
    id: 'meta-policies',
    title: 'Circumventing Meta’s policies',
    content: (
      <>
        <p>Your use of Facebook, Instagram and WhatsApp through {P} must follow Meta’s terms and policies. In particular, do not:</p>
        <ul>
          <li>use {P} to get around restrictions, suspensions or quality limits Meta has placed on your accounts or phone numbers;</li>
          <li>misuse message tags or send non-template WhatsApp messages outside the customer service window;</li>
          <li>use data received from Meta for any purpose other than communicating with the people who contacted you, including advertising, profiling or selling it; or</li>
          <li>operate automated behavior that breaks a connected platform’s rules on automated messaging.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'enforcement',
    title: 'Enforcement',
    content: (
      <>
        <p>
          If we reasonably believe you have broken this policy, we may remove content, pause
          automations or AI replies, disconnect channels, suspend or terminate your account, and
          report illegal activity to the authorities or to Meta. Where appropriate, we will first
          give you notice and a chance to fix the problem.
        </p>
        <p>
          This policy is part of our <Link href="/terms">Terms of Service</Link>. To report abuse,
          email <a href={`mailto:${LEGAL.legalEmail}`}>{LEGAL.legalEmail}</a>.
        </p>
      </>
    ),
  },
];

export default function AcceptableUsePage() {
  return (
    <LegalPage
      title="Acceptable Use Policy"
      intro={
        <p>
          {P} helps businesses talk to their own customers. To keep the service safe and the
          connected platforms usable for everyone, you and everyone in your workspace must not use{' '}
          {P} in the ways listed below.
        </p>
      }
      sections={sections}
    />
  );
}
