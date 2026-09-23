'use client';

import { TeamManager } from '@/features/team/team-manager';

// Workspace settings and the Team page manage the same thing, so this reuses
// the team manager rather than duplicating the feature.
export default function SettingsTeamPage() {
  return <TeamManager />;
}
