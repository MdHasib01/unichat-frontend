import type { Metadata } from 'next';
import { KnowledgeManager } from '@/features/ai/knowledge-manager';

export const metadata: Metadata = { title: 'Train Content' };

// Train Content and Knowledge are the same workflow viewed from two entries
// in the sidebar, so they share one implementation rather than duplicating it.
export default function TrainContentPage() {
  return <KnowledgeManager />;
}
