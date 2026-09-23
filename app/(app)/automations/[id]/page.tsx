'use client';

import { useParams } from 'next/navigation';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { AutomationEditor } from '@/features/automations/automation-editor';

export default function EditAutomationPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="Edit automation"
        description="Changes take effect on the next matching event."
      />
      <AutomationEditor automationId={id} />
    </PageContainer>
  );
}
