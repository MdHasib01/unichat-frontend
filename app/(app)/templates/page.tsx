'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, MessageSquareQuote, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, patch, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { useSession } from '@/hooks/use-session';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  Input,
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
import { EmptyState, TableSkeleton } from '@/components/shared/states';
import type { MessageTemplate } from '@/types';

const CATEGORIES = ['GREETING', 'SUPPORT', 'SALES', 'FOLLOW_UP', 'CLOSING', 'OTHER'] as const;

export default function TemplatesPage() {
  return (
    <React.Suspense fallback={null}>
      <TemplatesContent />
    </React.Suspense>
  );
}

function TemplatesContent() {
  const queryClient = useQueryClient();
  const { can } = useSession();
  const searchParams = useSearchParams();
  const manage = can('templates.manage');

  const [editing, setEditing] = React.useState<MessageTemplate | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<MessageTemplate | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: queryKeys.templates({}),
    queryFn: () => get<MessageTemplate[]>('/templates'),
  });

  // /templates/new and /templates/[id] redirect here with these params, so a
  // deep link opens the right editor instead of a duplicate page.
  React.useEffect(() => {
    if (searchParams.get('new')) {
      setCreating(true);
      return;
    }
    const editId = searchParams.get('edit');
    if (editId && templates) {
      const match = templates.find((template) => template.id === editId);
      if (match) setEditing(match);
    }
  }, [searchParams, templates]);

  const remove = useMutation({
    mutationFn: (id: string) => del(`/templates/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeleting(null);
      toast.success('Template deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const grouped = React.useMemo(() => {
    const map = new Map<string, MessageTemplate[]>();
    for (const template of templates ?? []) {
      map.set(template.category, [...(map.get(template.category) ?? []), template]);
    }
    return map;
  }, [templates]);

  return (
    <PageContainer>
      <PageHeader
        title="Message templates"
        description="Saved replies your team can insert in one click. Variables are filled from the real customer when sent."
        actions={
          manage ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              New template
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <Card>
          <TableSkeleton rows={4} columns={2} />
        </Card>
      ) : !templates?.length ? (
        <Card>
          <EmptyState
            icon={MessageSquareQuote}
            title="No templates yet"
            description="Save the replies your team types most often — greetings, order updates, closing lines."
            action={
              manage ? (
                <Button onClick={() => setCreating(true)}>Create your first template</Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {category.replace(/_/g, ' ').toLowerCase()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {items.map((template) => (
                    <div key={template.id} className="flex items-start gap-3 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{template.name}</p>
                          {!template.isActive ? <Badge variant="muted">Hidden</Badge> : null}
                          {template.usageCount > 0 ? (
                            <Badge variant="secondary" className="text-2xs">
                              used {template.usageCount}×
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                          {template.body}
                        </p>
                        {template.variables.length ? (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {template.variables.map((variable) => (
                              <code
                                key={variable}
                                className="rounded bg-secondary px-1.5 py-0.5 font-mono text-2xs"
                              >
                                {`{{${variable}}}`}
                              </code>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            void navigator.clipboard.writeText(template.body);
                            toast.success('Copied');
                          }}
                          aria-label="Copy"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {manage ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setEditing(template)}
                              aria-label="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleting(template)}
                              aria-label="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateDialog
        template={editing}
        open={creating || Boolean(editing)}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
            <DialogDescription>
              Automations that send this template will stop sending it.
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
              Delete template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function TemplateDialog({
  template,
  open,
  onClose,
}: {
  template: MessageTemplate | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');
  const [body, setBody] = React.useState('');
  const [category, setCategory] = React.useState<(typeof CATEGORIES)[number]>('OTHER');
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    if (template) {
      setName(template.name);
      setBody(template.body);
      setCategory(template.category);
      setIsActive(template.isActive);
    } else if (open) {
      setName('');
      setBody('');
      setCategory('OTHER');
      setIsActive(true);
    }
  }, [template, open]);

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), body: body.trim(), category, isActive };
      return template ? patch(`/templates/${template.id}`, payload) : post('/templates', payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['templates'] });
      onClose();
      toast.success(template ? 'Template updated' : 'Template created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Variables are derived from the body, exactly as the backend does it.
  const variables = Array.from(
    new Set(Array.from(body.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g), (m) => m[1])),
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit template' : 'New template'}</DialogTitle>
          <DialogDescription>
            Use <code className="font-mono text-xs">{'{{first_name}}'}</code>,{' '}
            <code className="font-mono text-xs">{'{{customer_name}}'}</code> or{' '}
            <code className="font-mono text-xs">{'{{business_name}}'}</code> and Unichat fills them
            in when the message is sent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FormField label="Name" required>
            <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
          </FormField>

          <FormField label="Category">
            <Select value={category} onValueChange={(value) => setCategory(value as typeof category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option} className="capitalize">
                    {option.replace(/_/g, ' ').toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Message" required>
            <Textarea
              rows={5}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Hi {{first_name}}, thanks for reaching out! How can we help?"
            />
          </FormField>

          {variables.length ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Variables:</span>
              {variables.map((variable) => (
                <code key={variable} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-2xs">
                  {`{{${variable}}}`}
                </code>
              ))}
            </div>
          ) : null}

          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm">Available in the composer</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => save.mutate()}
            loading={save.isPending}
            disabled={!name.trim() || !body.trim()}
          >
            {template ? 'Save changes' : 'Create template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
