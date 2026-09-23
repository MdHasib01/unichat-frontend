'use client';

import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { TeamManager } from '@/features/team/team-manager';

// Invitations live alongside members rather than in a separate screen, so
// this route reuses the same manager instead of duplicating the feature.
export default function InvitationsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Invitations"
        description="People you have invited to this workspace, and everyone who has already joined."
      />
      <TeamManager />
    </PageContainer>
  );
}
