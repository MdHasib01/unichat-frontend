'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Link2, Loader2, Paperclip, Send, Smile, Sparkles, StickyNote, X } from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge, Input, Textarea } from '@/components/ui/primitives';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/overlays';
import { useRealtime } from '@/hooks/use-realtime';
import type { Attachment, MessageTemplate } from '@/types';

const EMOJIS = [
  '😊', '👍', '🙏', '🎉', '❤️', '😂', '🔥', '✅', '👋', '🤝',
  '😅', '🙌', '💡', '📦', '🚚', '⏰', '💬', '⭐', '😍', '🤔',
];

export function Composer({
  conversationId,
  aiEnabled,
  disabled,
  disabledReason,
}: {
  conversationId: string;
  aiEnabled: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const queryClient = useQueryClient();
  const { sendTyping } = useRealtime();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const [body, setBody] = React.useState('');
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [noteMode, setNoteMode] = React.useState(false);
  const [attachOpen, setAttachOpen] = React.useState(false);

  const { data: templates } = useQuery({
    queryKey: queryKeys.templates({}),
    queryFn: () => get<MessageTemplate[]>('/templates'),
  });

  const sendMessage = useMutation({
    mutationFn: () =>
      post(`/conversations/${conversationId}/messages`, {
        body: body.trim() || undefined,
        attachments: attachments.length ? attachments : undefined,
      }),
    onSuccess: () => {
      setBody('');
      setAttachments([]);
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addNote = useMutation({
    mutationFn: () => post(`/conversations/${conversationId}/notes`, { body: body.trim() }),
    onSuccess: () => {
      setBody('');
      setNoteMode(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
      toast.success('Note added for your team');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const suggest = useMutation({
    mutationFn: () =>
      post<{ suggestion: string | null; confidence: number; recommendHandoff: boolean }>(
        `/conversations/${conversationId}/ai-suggestion`,
      ),
    onSuccess: (result) => {
      if (!result.suggestion) {
        toast.info('The assistant could not answer this from your knowledge base');
        return;
      }
      setBody(result.suggestion);
      textareaRef.current?.focus();
      if (result.recommendHandoff) {
        toast.warning('Low confidence — review this before sending');
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSend = Boolean(body.trim() || attachments.length) && !disabled;
  const busy = sendMessage.isPending || addNote.isPending;

  const submit = () => {
    if (!canSend || busy) return;
    if (noteMode) {
      if (body.trim()) addNote.mutate();
      return;
    }
    sendMessage.mutate();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter adds a newline.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  if (disabled) {
    return (
      <div className="border-t border-border bg-secondary/40 px-4 py-4 text-center text-sm text-muted-foreground">
        {disabledReason ?? 'You cannot reply to this conversation.'}
      </div>
    );
  }

  return (
    <div className={cn('border-t border-border bg-card p-3', noteMode && 'bg-warning/5')}>
      {attachments.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <span
              key={index}
              className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 text-xs"
            >
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[12rem] truncate">{attachment.name ?? attachment.url}</span>
              <button
                type="button"
                onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <div className="flex shrink-0 items-center gap-0.5">
          <AttachmentDialog
            open={attachOpen}
            onOpenChange={setAttachOpen}
            onAdd={(attachment) => setAttachments([...attachments, attachment])}
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Insert emoji">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2" align="start">
              <div className="grid grid-cols-8 gap-0.5">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setBody((current) => current + emoji)}
                    className="rounded p-1 text-lg transition-colors hover:bg-secondary"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {templates?.length ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Insert template">
                  <StickyNote className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-1" align="start">
                <p className="px-2 py-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Templates
                </p>
                <div className="max-h-64 space-y-0.5 overflow-y-auto">
                  {templates
                    .filter((t) => t.isActive)
                    .map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setBody(template.body)}
                        className="block w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary"
                      >
                        <span className="block text-sm font-medium">{template.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {template.body}
                        </span>
                      </button>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}

          {aiEnabled ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => suggest.mutate()}
              disabled={suggest.isPending}
              aria-label="Draft a reply with AI"
              title="Draft a reply with AI"
            >
              {suggest.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
            </Button>
          ) : null}
        </div>

        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            sendTyping(conversationId);
          }}
          onKeyDown={handleKeyDown}
          placeholder={noteMode ? 'Write a note only your team can see…' : 'Type a message…'}
          rows={1}
          className="max-h-40 min-h-[38px] flex-1 resize-none py-2"
        />

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant={noteMode ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setNoteMode((current) => !current)}
            title="Toggle internal note"
          >
            <StickyNote className="h-4 w-4" />
            <span className="hidden sm:inline">Note</span>
          </Button>

          <Button onClick={submit} disabled={!canSend} loading={busy} size="icon" aria-label="Send">
            {busy ? null : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between px-1">
        <p className="text-2xs text-muted-foreground">
          <kbd className="rounded border border-border px-1">Enter</kbd> to send ·{' '}
          <kbd className="rounded border border-border px-1">Shift</kbd>+
          <kbd className="rounded border border-border px-1">Enter</kbd> for a new line
        </p>
        {noteMode ? (
          <Badge variant="warning" className="h-4 text-2xs">
            Internal — not sent to the customer
          </Badge>
        ) : aiEnabled ? (
          <span className="flex items-center gap-1 text-2xs text-muted-foreground">
            <Bot className="h-3 w-3" />
            AI assistance available
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Attachments are referenced by URL. Meta's Send API fetches media from a
 * public URL, so this keeps the flow honest instead of faking an uploader
 * that has nowhere to store files.
 */
function AttachmentDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (attachment: Attachment) => void;
}) {
  const [url, setUrl] = React.useState('');
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<Attachment['type']>('image');

  const submit = () => {
    if (!url.trim()) return;
    onAdd({ type, url: url.trim(), name: name.trim() || undefined });
    setUrl('');
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Attach">
          <Paperclip className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Attach a file</DialogTitle>
          <DialogDescription>
            Meta fetches attachments from a public URL, so paste a link to the image, video or
            document you want to send.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {(['image', 'video', 'audio', 'file'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                    type === option
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-secondary',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">File URL</label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://cdn.example.com/photo.jpg"
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Display name (optional)</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Product photo"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!url.trim()}>
            Attach
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
