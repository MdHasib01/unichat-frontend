import type { Metadata } from 'next';
import { TrainingManager } from '@/features/ai/training-manager';

export const metadata: Metadata = { title: 'Train Messages' };

// Approved question → answer pairs: written here, taught from the inbox, or
// imported from JSON. Long-form documents live under Knowledge.
export default function TrainMessagesPage() {
  return <TrainingManager />;
}
