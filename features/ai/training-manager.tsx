'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Download,
  FileJson,
  Inbox,
  MessageSquareQuote,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, apiPost, del, get, getWithMeta, patch, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { timeAgo, truncate } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  Checkbox,
  FormField,
  Progress,
  Switch,
  Textarea,
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
import { DataTable, useDebounced, type Column } from '@/components/shared/data-table';
import type {
  TrainingExample,
  TrainingImport,
  TrainingImportPreview,
  TrainingSource,
  TrainingStats,
  TrainingStatus,
} from '@/types';

const SOURCE_LABELS: Record<TrainingSource, string> = {
  MANUAL: 'Written',
  INBOX: 'From website chat',
  IMPORT: 'Imported',
};

const SAMPLE_JSON = `[
  { "question": "Do you ship internationally?",
    "answer": "Yes — to 40+ countries, 5–8 business days." },
  { "messages": [
      { "role": "customer", "content": "Can I change my order?" },
      { "role": "agent", "content": "Sure! Reply with your order number." }
  ] }
]`;

export function TrainingManager() {
  const queryClient = useQueryClient();
  const { can } = useSession();
  const train = can('ai.train');

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [source, setSource] = React.useState<TrainingSource | 'all'>('all');
  const [status, setStatus] = React.useState<TrainingStatus | 'all'>('all');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [editing, setEditing] = React.useState<TrainingExample | 'new' | null>(null);
  const [importing, setImporting] = React.useState(false);

  const debouncedSearch = useDebounced(search);
  const params = {
    page,
    pageSize: 25,
    search: debouncedSearch || undefined,
    source: source === 'all' ? undefined : source,
    status: status === 'all' ? undefined : status,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.training(params),
    queryFn: () => getWithMeta<TrainingExample[]>('/ai/training', params),
  });
  const stats = data?.meta?.stats as TrainingStats | undefined;
  const rows = data?.data ?? [];

  React.useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [debouncedSearch, source, status]);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['ai'] });

  const toggle = useMutation({
    mutationFn: (example: TrainingExample) =>
      patch(`/ai/training/${example.id}`, { status: example.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const bulk = useMutation({
    mutationFn: (action: 'enable' | 'disable' | 'delete') =>
      post<{ affected: number }>('/ai/training/bulk', { ids: Array.from(selected), action }),
    onSuccess: (result) => {
      setSelected(new Set());
      invalidate();
      toast.success(`${result.affected} answer${result.affected === 1 ? '' : 's'} updated`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del(`/ai/training/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Answer removed — the assistant stops using it now');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const exportAll = async () => {
    try {
      const response = await api.get('/ai/training/export', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    }
  };

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const columns: Array<Column<TrainingExample>> = [
    ...(train
      ? [
          {
            key: 'select',
            header: (
              <Checkbox
                checked={allOnPageSelected}
                onCheckedChange={(checked) =>
                  setSelected(checked ? new Set(rows.map((r) => r.id)) : new Set())
                }
                aria-label="Select all on this page"
              />
            ),
            cell: (example: TrainingExample) => (
              <Checkbox
                checked={selected.has(example.id)}
                onCheckedChange={(checked) =>
                  setSelected((current) => {
                    const next = new Set(current);
                    if (checked) next.add(example.id);
                    else next.delete(example.id);
                    return next;
                  })
                }
                aria-label="Select"
              />
            ),
            className: 'w-10',
          } as Column<TrainingExample>,
        ]
      : []),
    {
      key: 'qa',
      header: 'Customer asks → Approved answer',
      cell: (example) => (
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{truncate(example.question, 120)}</p>
          <p className="text-xs text-muted-foreground">{truncate(example.answer, 160)}</p>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      cell: (example) => <Badge variant="secondary">{SOURCE_LABELS[example.source]}</Badge>,
      className: 'w-32',
    },
    {
      key: 'used',
      header: 'Used',
      cell: (example) => (
        <span className="text-xs text-muted-foreground">
          {example.useCount ? `${example.useCount}× · ${timeAgo(example.lastUsedAt)}` : 'Not yet'}
        </span>
      ),
      className: 'w-32',
    },
    {
      key: 'status',
      header: 'Active',
      cell: (example) => (
        <Switch
          checked={example.status === 'ACTIVE'}
          disabled={!train || toggle.isPending}
          onCheckedChange={() => toggle.mutate(example)}
          aria-label="Use this answer"
        />
      ),
      className: 'w-20',
    },
    {
      key: 'actions',
      header: '',
      cell: (example) =>
        train ? (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(example)} aria-label="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => remove.mutate(example.id)} aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ) : null,
      className: 'w-24 text-right',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard icon={MessageSquareQuote} label="Approved answers" value={stats?.active ?? 0} />
        <StatCard icon={Pencil} label="Written" value={stats?.manual ?? 0} />
        <StatCard icon={Inbox} label="Taught from website chat" value={stats?.inbox ?? 0} />
        <StatCard icon={FileJson} label="Imported" value={stats?.imported ?? 0} />
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-sm">
          <p className="font-medium">How the assistant uses these</p>
          <p className="mt-0.5 text-muted-foreground">
            When a customer asks exactly one of these questions, the approved answer is sent as written — instantly,
            with no AI cost. For similar questions, the closest answers guide the assistant’s reply. Teach new answers
            from website chat conversations with the <strong>Teach AI</strong> button in the inbox.
            Messages from Facebook, Instagram and WhatsApp cannot be used as training material.
          </p>
        </CardContent>
      </Card>

      {selected.size > 0 && train ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2 text-sm">
          <span className="px-2 font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate('enable')} loading={bulk.isPending}>
            Turn on
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate('disable')} loading={bulk.isPending}>
            Turn off
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => bulk.mutate('delete')} loading={bulk.isPending}>
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(example) => example.id}
        isLoading={isLoading}
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        search={{ value: search, onChange: setSearch, placeholder: 'Search questions and answers' }}
        emptyTitle="No approved answers yet"
        emptyDescription="Add the questions customers ask most with the exact answer you want sent, import a JSON file of past chats, or teach answers from website chat conversations in the inbox."
        emptyAction={
          train ? (
            <div className="flex gap-2">
              <Button onClick={() => setEditing('new')}>
                <Plus className="h-4 w-4" />
                Add answer
              </Button>
              <Button variant="outline" onClick={() => setImporting(true)}>
                <Upload className="h-4 w-4" />
                Import JSON
              </Button>
            </div>
          ) : null
        }
        toolbar={
          <>
            <Select value={source} onValueChange={(value) => setSource(value as typeof source)}>
              <SelectTrigger className="h-8 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                <SelectItem value="ACTIVE">On</SelectItem>
                <SelectItem value="DISABLED">Off</SelectItem>
              </SelectContent>
            </Select>
            {train ? (
              <>
                <Button size="sm" onClick={() => setEditing('new')}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
                <Button size="sm" variant="outline" onClick={() => setImporting(true)}>
                  <Upload className="h-4 w-4" />
                  Import JSON
                </Button>
              </>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => void exportAll()} disabled={!stats?.total}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </>
        }
      />

      <TrainingDialog example={editing} onClose={() => setEditing(null)} />
      <ImportDialog open={importing} onOpenChange={setImporting} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Inbox; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-lg font-semibold tabular-nums">{value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TrainingDialog({ example, onClose }: { example: TrainingExample | 'new' | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const existing = example && example !== 'new' ? example : null;

  React.useEffect(() => {
    setQuestion(existing?.question ?? '');
    setAnswer(existing?.answer ?? '');
  }, [existing]);

  const save = useMutation({
    mutationFn: () =>
      existing
        ? patch(`/ai/training/${existing.id}`, { question: question.trim(), answer: answer.trim() })
        : post('/ai/training', { question: question.trim(), answer: answer.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai'] });
      onClose();
      toast.success('Saved — the assistant uses it from the next message');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={Boolean(example)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit approved answer' : 'Add approved answer'}</DialogTitle>
          <DialogDescription>
            Write the question the way customers ask it, and the reply exactly as you want it sent.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <FormField label="Customer asks" required>
            <Textarea rows={2} value={question} maxLength={2000} onChange={(e) => setQuestion(e.target.value)} autoFocus />
          </FormField>
          <FormField label="Approved answer" required>
            <Textarea rows={6} value={answer} maxLength={4000} onChange={(e) => setAnswer(e.target.value)} />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!question.trim() || !answer.trim()}>
            Save answer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<TrainingImportPreview | null>(null);
  const [importId, setImportId] = React.useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setImportId(null);
  };

  const upload = async (dryRun: boolean, target: File) => {
    const form = new FormData();
    form.append('file', target);
    const response = await apiPost<TrainingImportPreview | TrainingImport>(
      `/ai/training/import?dryRun=${dryRun}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  };

  const check = useMutation({
    mutationFn: (target: File) => upload(true, target) as Promise<TrainingImportPreview>,
    onSuccess: setPreview,
    onError: (error: Error) => {
      setFile(null);
      toast.error(error.message);
    },
  });

  const start = useMutation({
    mutationFn: () => upload(false, file!) as Promise<TrainingImport>,
    onSuccess: (record) => setImportId(record.id),
    onError: (error: Error) => toast.error(error.message),
  });

  const { data: progress } = useQuery({
    queryKey: queryKeys.trainingImport(importId ?? 'none'),
    queryFn: () => get<TrainingImport>(`/ai/training/imports/${importId}`),
    enabled: Boolean(importId),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'COMPLETED' || s === 'FAILED' ? false : 1_000;
    },
  });

  React.useEffect(() => {
    if (progress?.status === 'COMPLETED') void queryClient.invalidateQueries({ queryKey: ['ai'] });
  }, [progress?.status, queryClient]);

  const processed = progress ? progress.imported + progress.updated + progress.skipped : 0;
  const done = progress?.status === 'COMPLETED';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from JSON</DialogTitle>
          <DialogDescription>
            Upload question/answer pairs, or exported chats where a customer message is followed by your team’s
            reply. Questions you already have get their answer updated.
          </DialogDescription>
        </DialogHeader>

        {importId ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {done ? (
                  <span className="inline-flex items-center gap-1.5 text-success">
                    <CheckCircle2 className="h-4 w-4" /> Import complete
                  </span>
                ) : progress?.status === 'FAILED' ? (
                  <span className="text-destructive">The import stopped — retrying automatically</span>
                ) : (
                  'Importing and indexing…'
                )}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {processed} / {progress?.total ?? preview?.count ?? 0}
              </span>
            </div>
            <Progress value={progress?.total ? (processed / progress.total) * 100 : 5} />
            {progress ? (
              <p className="text-xs text-muted-foreground">
                {progress.imported} new · {progress.updated} updated · {progress.skipped} skipped
              </p>
            ) : null}
          </div>
        ) : preview ? (
          <div className="space-y-3">
            <p className="text-sm">
              Found <strong>{preview.count}</strong> answer{preview.count === 1 ? '' : 's'}
              {preview.format === 'transcripts' ? ' in your conversations' : ''}
              {preview.skipped ? ` · ${preview.skipped} skipped` : ''}.
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
              {preview.preview.map((pair, index) => (
                <div key={index} className="text-sm">
                  <p className="font-medium">{truncate(pair.question, 140)}</p>
                  <p className="text-xs text-muted-foreground">{truncate(pair.answer, 200)}</p>
                </div>
              ))}
              {preview.count > preview.preview.length ? (
                <p className="text-xs text-muted-foreground">…and {preview.count - preview.preview.length} more</p>
              ) : null}
            </div>
            {preview.errors.length ? (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">{preview.errors.length} item(s) could not be read</summary>
                <ul className="mt-1 list-disc pl-5">
                  {preview.errors.slice(0, 10).map((error, i) => (
                    <li key={i}>
                      {error.index >= 0 ? `Item ${error.index + 1}: ` : ''}
                      {error.message}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/40 hover:bg-secondary/50">
              <FileJson className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">{check.isPending ? 'Reading…' : 'Choose a .json file'}</span>
              <span className="text-xs text-muted-foreground">Up to 5 MB · 5,000 answers per file</span>
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => {
                  const chosen = e.target.files?.[0];
                  e.target.value = '';
                  if (!chosen) return;
                  setFile(chosen);
                  check.mutate(chosen);
                }}
              />
            </label>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Accepted formats</summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono">{SAMPLE_JSON}</pre>
              <p className="mt-1 text-muted-foreground">
                Also accepted: <code>message/reply</code>, <code>q/a</code>, <code>input/output</code> and{' '}
                <code>prompt/completion</code> keys, or the whole list wrapped in <code>{'{ "examples": [...] }'}</code>.
              </p>
            </details>
          </div>
        )}

        <DialogFooter>
          {importId ? (
            <Button onClick={() => onOpenChange(false)} disabled={!done && progress?.status !== 'FAILED'}>
              {done ? 'Done' : 'Working…'}
            </Button>
          ) : preview ? (
            <>
              <Button variant="outline" onClick={reset}>
                Choose another file
              </Button>
              <Button onClick={() => start.mutate()} loading={start.isPending}>
                Import {preview.count} answer{preview.count === 1 ? '' : 's'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
