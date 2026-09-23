'use client';

import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import { EmptyState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';

export default function InboxIndexPage() {
  return (
    <div className="flex h-full items-center justify-center bg-secondary/30">
      <EmptyState
        icon={MessagesSquare}
        title="Pick a conversation"
        description="Choose a conversation from the list to read the history, reply, assign it to a teammate or add a note."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/integrations">Connect another channel</Link>
          </Button>
        }
      />
    </div>
  );
}
