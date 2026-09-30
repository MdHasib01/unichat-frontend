'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpen,
  FileText,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { del, get, getWithMeta, patch, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { timeAgo, truncate } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
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
import { DataTable, STATUS_VARIANTS, useDebounced, type Column } from '@/components/shared/data-table';
import type { KnowledgeDocument, KnowledgeSourceType } from '@/types';

const SOURCE_LABELS: Record<KnowledgeSourceType, string> = {
  MANUAL: 'Written',
  FAQ: 'FAQ',
  WEBSITE: 'Website',
  DOCUMENT: 'Document',
  PRODUCT: 'Products',
};

/** Suggested topics — pre-fills the editor so a business knows where to start. */
const STARTERS = [
  { title: 'Shipping & delivery', prompt: 'Where do you ship, how long does it take, what does it cost?' },
  { title: 'Returns & refunds', prompt: 'How long is the return window, and how are refunds issued?' },
  { title: 'Pricing & packages', prompt: 'What do you charge, and what is included at each level?' },
  { title: 'Opening hours', prompt: 'When is your team available, and what happens outside those hours?' },
  { title: 'Payment methods', prompt: 'Which payment methods do you accept?' },
  { title: 'FAQs', prompt: 'The questions customers ask you every week.' },
];

export function KnowledgeManager() {
  const queryClient = useQueryClient();
  const { can } = useSession();
  const manage = can('ai.manage');

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [sourceType, setSourceType] = React.useState<KnowledgeSourceType | 'all'>('all');
  const [editing, setEditing] = React.useState<KnowledgeDocument | null>(null);
  const [creating, setCreating] = React.useState<{ title: string; content: string } | null>(null);
  const [deleting, setDeleting] = React.useState<KnowledgeDocument | null>(null);

  const debouncedSearch = useDebounced(search);

  const params = {
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
    sourceType: sourceType === 'all' ? undefined : sourceType,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.knowledge(params),
    queryFn: () => getWithMeta<KnowledgeDocument[]>('/ai/knowledge', params),
    // Indexing runs on a worker, so poll briefly while anything is pending.
    refetchInterval: (query) => {
      const docs = query.state.data?.data ?? [];
      return docs.some((d) => d.status === 'PENDING' || d.status === 'PROCESSING') ? 3_000 : false;
    },
  });

  const reindex = useMutation({
    mutationFn: () => post('/ai/knowledge/reindex'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai'] });
      toast.success('Re-indexing your knowledge base');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const importProducts = useMutation({
    mutationFn: () => post('/ai/knowledge/import-products'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai'] });
      toast.success('Products imported into your AI knowledge');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del(`/ai/knowledge/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai'] });
      setDeleting(null);
      toast.success('Removed from the knowledge base');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  React.useEffect(() => setPage(1), [debouncedSearch, sourceType]);

  const columns: Array<Column<KnowledgeDocument>> = [
    {
      key: 'title',
      header: 'Topic',
      cell: (doc) => (
        <div className="flex items-start gap-2.5">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate font-medium">{doc.title}</p>
            <p className="truncate text-xs text-muted-foreground">{truncate(doc.content, 80)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      cell: (doc) => (
        <Badge variant="secondary">{SOURCE_LABELS[doc.sourceType] ?? doc.sourceType}</Badge>
      ),
      className: 'w-32',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (doc) => (
        <div>
          <Badge variant={STATUS_VARIANTS[doc.status] ?? 'secondary'}>{doc.status.toLowerCase()}</Badge>
          {doc.error ? (
            <p className="mt-1 flex items-center gap-1 text-2xs text-destructive">
              <AlertTriangle className="h-3 w-3" />
              {truncate(doc.error, 40)}
            </p>
          ) : null}
        </div>
      ),
      className: 'w-32',
    },
    {
      key: 'chunks',
      header: 'Passages',
      cell: (doc) => <span className="tabular-nums text-muted-foreground">{doc.chunkCount}</span>,
      className: 'w-24',
    },
    {
      key: 'updated',
      header: 'Updated',
      cell: (doc) => <span className="text-xs text-muted-foreground">{timeAgo(doc.updatedAt)}</span>,
      className: 'w-28',
    },
    {
      key: 'actions',
      header: '',
      cell: (doc) =>
        manage ? (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(doc)} aria-label="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(doc)} aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ) : null,
      className: 'w-24 text-right',
    },
  ];

  return (
    <div className="space-y-4">
      {manage && (data?.data.length ?? 0) === 0 && !isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Start with what customers ask most
            </CardTitle>
            <CardDescription>
              Each topic becomes searchable knowledge the assistant can quote from. It never invents
              facts outside what you add here.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STARTERS.map((starter) => (
              <button
                key={starter.title}
                type="button"
                onClick={() => setCreating({ title: starter.title, content: '' })}
                className="rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary"
              >
                <p className="text-sm font-medium">{starter.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{starter.prompt}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(doc) => doc.id}
        isLoading={isLoading}
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        search={{ value: search, onChange: setSearch, placeholder: 'Search your knowledge' }}
        emptyTitle="No knowledge added yet"
        emptyDescription="Add what your business sells, how you ship, what you charge and what your policies are."
        emptyAction={
          manage ? (
            <Button onClick={() => setCreating({ title: '', content: '' })}>
              <Plus className="h-4 w-4" />
              Add knowledge
            </Button>
          ) : null
        }
        toolbar={
          <>
            <Select value={sourceType} onValueChange={(value) => setSourceType(value as typeof sourceType)}>
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

            {manage ? (
              <>
                <Button size="sm" onClick={() => setCreating({ title: '', content: '' })}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => importProducts.mutate()}
                  loading={importProducts.isPending}
                >
                  <Package className="h-4 w-4" />
                  Import products
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reindex.mutate()}
                  loading={reindex.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                  Re-index
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <KnowledgeDialog
        document={editing}
        draft={creating}
        onClose={() => {
          setEditing(null);
          setCreating(null);
        }}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove “{deleting?.title}”?</DialogTitle>
            <DialogDescription>
              The assistant will stop using this knowledge immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleting && remove.mutate(deleting.id)}
              loading={remove.isPending}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KnowledgeDialog({
  document,
  draft,
  onClose,
}: {
  document: KnowledgeDocument | null;
  draft: { title: string; content: string } | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');

  const open = Boolean(document || draft);

  React.useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
    } else if (draft) {
      setTitle(draft.title);
      setContent(draft.content);
    }
  }, [document, draft]);

  const save = useMutation({
    mutationFn: () =>
      document
        ? patch(`/ai/knowledge/${document.id}`, { title, content })
        : post('/ai/knowledge', { title, content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai'] });
      onClose();
      toast.success(document ? 'Knowledge updated' : 'Added — Repliva is indexing it now');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{document ? 'Edit knowledge' : 'Add knowledge'}</DialogTitle>
          <DialogDescription>
            Write it the way you would explain it to a new team member. Repliva splits it into
            passages, indexes them, and the assistant quotes only from what you write here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FormField label="Topic" required>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Shipping & delivery"
              autoFocus
            />
          </FormField>

          <FormField label="What the assistant should know" required>
            <Textarea
              rows={12}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={
                'We ship worldwide. Domestic orders arrive in 2–4 business days, international in 5–9.\nShipping is a flat $12 and free over $150.\nEvery order includes tracking, sent by message when the parcel leaves our warehouse.'
              }
              className="font-normal"
            />
          </FormField>

          <p className="text-xs text-muted-foreground">
            {content.length.toLocaleString()} characters · roughly{' '}
            {Math.max(1, Math.ceil(content.length / 900))} passage
            {Math.ceil(content.length / 900) === 1 ? '' : 's'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => save.mutate()}
            loading={save.isPending}
            disabled={!title.trim() || !content.trim()}
          >
            {document ? 'Save changes' : 'Add to knowledge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
