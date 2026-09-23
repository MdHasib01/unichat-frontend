import type { Metadata } from 'next';
import { KnowledgeManager } from '@/features/ai/knowledge-manager';

export const metadata: Metadata = { title: 'Knowledge' };

export default function KnowledgePage() {
  return <KnowledgeManager />;
}
