'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Globe, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Skeleton,
} from '@/components/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlays';
import type { ChatWidget } from '@/types';

/** Integrations → Website chat: the embeddable widgets for this workspace. */
export function WebsiteChatCard({ canManage }: { canManage: boolean }) {
  const [creating, setCreating] = React.useState(false);

  const { data: widgets, isLoading } = useQuery({
    queryKey: queryKeys.widgets,
    queryFn: () => get<ChatWidget[]>('/integrations/webchat'),
  });

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Website chat
          </CardTitle>
          <CardDescription>
            Add a chat bubble to your website with one line of code. Visitor messages land in this
            inbox next to Messenger, Instagram and WhatsApp.
          </CardDescription>
        </div>
        {canManage && widgets?.length ? (
          <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            New widget
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-14 w-full" />
          </div>
        ) : !widgets?.length ? (
          <div className="flex flex-col items-start gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              You choose the colours, logo, position and whether visitors introduce themselves first.
            </p>
            {canManage ? (
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                Add website chat
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="divide-y divide-border border-t border-border">
            {widgets.map((widget) => (
              <Link
                key={widget.id}
                href={`/integrations/web-chat/${widget.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-white"
                  style={{ backgroundColor: widget.primaryColor }}
                >
                  {widget.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={widget.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    {widget.name}
                    {!widget.isActive ? <Badge variant="muted">Off</Badge> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {widget.lastSeenAt
                      ? `Live on ${hostOf(widget.lastSeenOrigin)} · seen ${timeAgo(widget.lastSeenAt)}`
                      : 'Not installed yet — add the snippet to your website'}
                    {typeof widget.conversationCount === 'number'
                      ? ` · ${widget.conversationCount} conversation${widget.conversationCount === 1 ? '' : 's'}`
                      : ''}
                  </p>
                </div>
                {widget.lastSeenAt ? <Badge variant="success">Installed</Badge> : <Badge variant="warning">Not installed</Badge>}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      <CreateWidgetDialog open={creating} onOpenChange={setCreating} />
    </Card>
  );
}

function hostOf(origin: string | null): string {
  if (!origin) return 'your website';
  try {
    return new URL(origin).host;
  } catch {
    return origin;
  }
}

function CreateWidgetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('Main website');

  const create = useMutation({
    mutationFn: () => post<ChatWidget>('/integrations/webchat', { name: name.trim() }),
    onSuccess: (widget) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.widgets });
      onOpenChange(false);
      toast.success('Website chat created — customise it and copy the snippet');
      router.push(`/integrations/web-chat/${widget.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add website chat</DialogTitle>
          <DialogDescription>
            Give it a name your team will recognise. You can style it and set it up next.
          </DialogDescription>
        </DialogHeader>
        <FormField label="Name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus />
        </FormField>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
