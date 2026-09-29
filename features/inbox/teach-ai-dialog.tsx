'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { post } from '@/services/api';
import { Button } from '@/components/ui/button';
import { FormField, Textarea } from '@/components/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlays';

export interface TeachDraft {
  conversationId: string;
  messageId: string;
  question: string;
  answer: string;
  /** "improve" when correcting an AI reply. */
  mode: 'teach' | 'improve';
}

/**
 * Saves a customer question and the correct reply as an approved answer.
 * Teaching a question the assistant already knows replaces its answer.
 */
export function TeachAIDialog({ draft, onClose }: { draft: TeachDraft | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');

  React.useEffect(() => {
    setQuestion(draft?.question ?? '');
    setAnswer(draft?.answer ?? '');
  }, [draft]);

  const save = useMutation({
    mutationFn: () =>
      post('/ai/training', {
        question: question.trim(),
        answer: answer.trim(),
        source: 'INBOX',
        conversationId: draft!.conversationId,
        messageId: draft!.messageId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai'] });
      onClose();
      toast.success('Taught — the assistant will answer this way from now on');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            {draft?.mode === 'improve' ? 'Improve this answer' : 'Teach the AI'}
          </DialogTitle>
          <DialogDescription>
            {draft?.mode === 'improve'
              ? 'Correct the reply. The next time a customer asks this, the assistant uses your version.'
              : 'Save how this question should be answered. The assistant reuses it for the same and similar questions.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <FormField label="Customer asks" required hint="Tidy it into the question as customers usually phrase it.">
            <Textarea rows={2} value={question} maxLength={2000} onChange={(e) => setQuestion(e.target.value)} />
          </FormField>
          <FormField label="Correct answer" required>
            <Textarea rows={6} value={answer} maxLength={4000} onChange={(e) => setAnswer(e.target.value)} autoFocus />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!question.trim() || !answer.trim()}>
            Save to training
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
