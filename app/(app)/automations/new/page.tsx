'use client';

import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { AutomationEditor } from '@/features/automations/automation-editor';

export default function NewAutomationPage() {
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="New automation"
        description="Describe when the rule should fire and what Unichat should do."
      />
      <AutomationEditor />
    </PageContainer>
  );
}
