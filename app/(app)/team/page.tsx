'use client';

import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { TeamManager } from '@/features/team/team-manager';

export default function TeamPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Team"
        description="Invite colleagues, set what each of them can do, and see who is handling which conversations."
      />
      <TeamManager />
    </PageContainer>
  );
}
