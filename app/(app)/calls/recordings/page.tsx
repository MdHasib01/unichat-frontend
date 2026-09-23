'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileAudio,
  Info,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { del, get, getWithMeta, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatDateTime, formatDuration } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  FormField,
  Input,
  Textarea,
  UserAvatar,
} from '@/components/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/overlays';
import { DataTable, STATUS_VARIANTS, useDebounced, type Column } from '@/components/shared/data-table';
import type { CallDirection, CallRecord, CallStatus, Contact } from '@/types';

interface CallStats {
  calls30d: number;
  missed30d: number;
  recordings: number;
  totalSeconds: number;
  averageSeconds: number;
}

export default function RecordingsPage() {
  const queryClient = useQueryClient();
  const { can } = useSession();
  const manage = can('calls.manage');

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [direction, setDirection] = React.useState<CallDirection | 'all'>('all');
  const [withRecordingOnly, setWithRecordingOnly] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [playing, setPlaying] = React.useState<CallRecord | null>(null);

  const debouncedSearch = useDebounced(search);
  const params = {
    page,
    pageSize: 25,
    search: debouncedSearch || undefined,
    direction: direction === 'all' ? undefined : direction,
    withRecordingOnly: withRecordingOnly || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.calls(params),
    queryFn: () => getWithMeta<CallRecord[]>('/calls', params),
  });

  const { data: stats } = useQuery({
    queryKey: queryKeys.callStats,
    queryFn: () => get<CallStats>('/calls/stats'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del(`/calls/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calls'] });
      toast.success('Call record deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  React.useEffect(() => setPage(1), [debouncedSearch, direction, withRecordingOnly]);

  const columns: Array<Column<CallRecord>> = [
    {
      key: 'direction',
      header: '',
      cell: (call) => (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            call.direction === 'INBOUND' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {call.direction === 'INBOUND' ? (
            <PhoneIncoming className="h-4 w-4" />
          ) : (
            <PhoneOutgoing className="h-4 w-4" />
          )}
        </span>
      ),
      className: 'w-14',
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (call) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar
            name={call.contact?.displayName}
            src={call.contact?.avatarUrl}
            className="h-7 w-7"
          />
          <div className="min-w-0">
            <p className="truncate text-sm">
              {call.contact?.displayName ??
                (call.direction === 'INBOUND' ? call.fromNumber : call.toNumber) ??
                'Unknown'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {call.direction === 'INBOUND' ? call.fromNumber : call.toNumber}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      cell: (call) => (
        <span className="tabular-nums text-muted-foreground">
          {call.durationSeconds ? formatDuration(call.durationSeconds) : '—'}
        </span>
      ),
      className: 'w-28',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (call) => (
        <Badge variant={STATUS_VARIANTS[call.status] ?? 'secondary'}>
          {call.status.replace(/_/g, ' ').toLowerCase()}
        </Badge>
      ),
      className: 'w-32',
    },
    {
      key: 'recording',
      header: 'Recording',
      cell: (call) =>
        call.recordingUrl ? (
          <Button variant="outline" size="sm" onClick={() => setPlaying(call)}>
            <FileAudio className="h-3.5 w-3.5" />
            Play
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        ),
      className: 'w-32',
    },
    {
      key: 'startedAt',
      header: 'When',
      cell: (call) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(call.startedAt)}</span>
      ),
      className: 'w-44',
    },
    {
      key: 'actions',
      header: '',
      cell: (call) =>
        manage ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => remove.mutate(call.id)}
            aria-label="Delete call record"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        ) : null,
      className: 'w-14 text-right',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Call recordings"
        description="Call history for your workspace, with recording metadata and playback where your telephony provider supplies it."
        actions={
          manage ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Log a call
            </Button>
          ) : null
        }
      />

      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Unichat stores call records and recording metadata — it does not place or record calls
            itself. Connect a telephony provider that posts call data here, or log calls manually to
            keep the customer history complete.
          </p>
        </CardContent>
      </Card>

      {stats ? (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Calls (30 days)" value={String(stats.calls30d)} />
          <Stat label="Missed" value={String(stats.missed30d)} />
          <Stat label="With recordings" value={String(stats.recordings)} />
          <Stat label="Average length" value={formatDuration(stats.averageSeconds)} />
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(call) => call.id}
        isLoading={isLoading}
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        search={{ value: search, onChange: setSearch, placeholder: 'Number, name or summary' }}
        emptyTitle="No calls recorded"
        emptyDescription="Log a call manually, or connect a telephony provider to sync call records automatically."
        toolbar={
          <>
            <Select value={direction} onValueChange={(value) => setDirection(value as typeof direction)}>
              <SelectTrigger className="h-8 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All directions</SelectItem>
                <SelectItem value="INBOUND">Inbound</SelectItem>
                <SelectItem value="OUTBOUND">Outbound</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={withRecordingOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setWithRecordingOnly((current) => !current)}
            >
              <FileAudio className="h-3.5 w-3.5" />
              With recording
            </Button>
          </>
        }
      />

      <LogCallDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog open={Boolean(playing)} onOpenChange={(open) => !open && setPlaying(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {playing?.contact?.displayName ?? playing?.fromNumber ?? 'Call recording'}
            </DialogTitle>
            <DialogDescription>
              {playing ? formatDateTime(playing.startedAt) : ''} ·{' '}
              {playing ? formatDuration(playing.durationSeconds) : ''}
            </DialogDescription>
          </DialogHeader>

          {playing?.recordingUrl ? (
            <audio controls src={playing.recordingUrl} className="w-full" preload="metadata" />
          ) : null}

          {playing?.summary ? (
            <div className="rounded-lg bg-secondary/60 p-3 text-sm">
              <p className="font-medium">Summary</p>
              <p className="mt-1 text-muted-foreground">{playing.summary}</p>
            </div>
          ) : null}

          {playing?.transcript ? (
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border p-3 text-sm">
              <p className="mb-1 font-medium">Transcript</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{playing.transcript}</p>
            </div>
          ) : null}

          <DialogFooter>
            {playing?.contact ? (
              <Button asChild variant="outline">
                <Link href={`/contacts/${playing.contact.id}`}>Open contact</Link>
              </Button>
            ) : null}
            <Button onClick={() => setPlaying(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

function LogCallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({
    contactId: '',
    direction: 'INBOUND' as CallDirection,
    status: 'COMPLETED' as CallStatus,
    fromNumber: '',
    toNumber: '',
    durationSeconds: '0',
    recordingUrl: '',
    summary: '',
  });

  const { data: contacts } = useQuery({
    queryKey: queryKeys.contacts({ picker: true }),
    queryFn: () => get<Contact[]>('/contacts', { pageSize: 50 }),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      post('/calls', {
        contactId: form.contactId || null,
        direction: form.direction,
        status: form.status,
        fromNumber: form.fromNumber.trim() || null,
        toNumber: form.toNumber.trim() || null,
        durationSeconds: Number(form.durationSeconds) || 0,
        recordingUrl: form.recordingUrl.trim() || null,
        summary: form.summary.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calls'] });
      onOpenChange(false);
      setForm({
        contactId: '',
        direction: 'INBOUND',
        status: 'COMPLETED',
        fromNumber: '',
        toNumber: '',
        durationSeconds: '0',
        recordingUrl: '',
        summary: '',
      });
      toast.success('Call logged');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a call</DialogTitle>
          <DialogDescription>
            Keep phone conversations in the same customer history as your messages.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Contact" className="sm:col-span-2">
            <Select value={form.contactId} onValueChange={(contactId) => setForm({ ...form, contactId })}>
              <SelectTrigger>
                <SelectValue placeholder="Optional — link a customer" />
              </SelectTrigger>
              <SelectContent>
                {contacts?.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Direction">
            <Select
              value={form.direction}
              onValueChange={(value) => setForm({ ...form, direction: value as CallDirection })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INBOUND">Inbound</SelectItem>
                <SelectItem value="OUTBOUND">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Outcome">
            <Select
              value={form.status}
              onValueChange={(value) => setForm({ ...form, status: value as CallStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['COMPLETED', 'MISSED', 'VOICEMAIL', 'FAILED'] as CallStatus[]).map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="From">
            <Input
              value={form.fromNumber}
              onChange={(event) => setForm({ ...form, fromNumber: event.target.value })}
              placeholder="+1 555 0100"
            />
          </FormField>

          <FormField label="To">
            <Input
              value={form.toNumber}
              onChange={(event) => setForm({ ...form, toNumber: event.target.value })}
              placeholder="+1 555 0199"
            />
          </FormField>

          <FormField label="Duration (seconds)">
            <Input
              type="number"
              min={0}
              value={form.durationSeconds}
              onChange={(event) => setForm({ ...form, durationSeconds: event.target.value })}
            />
          </FormField>

          <FormField label="Recording URL" hint="If your provider hosts one.">
            <Input
              type="url"
              value={form.recordingUrl}
              onChange={(event) => setForm({ ...form, recordingUrl: event.target.value })}
            />
          </FormField>

          <FormField label="Summary" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.summary}
              onChange={(event) => setForm({ ...form, summary: event.target.value })}
              placeholder="What the customer wanted and what was agreed."
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => create.mutate()} loading={create.isPending}>
            Log call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
