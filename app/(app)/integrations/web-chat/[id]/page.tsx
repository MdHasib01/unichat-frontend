'use client';

import { useParams } from 'next/navigation';
import { WidgetSettings } from '@/features/webchat/widget-settings';

export default function WebChatSettingsPage() {
  const { id } = useParams<{ id: string }>();
  return <WidgetSettings widgetId={id} />;
}
