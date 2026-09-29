'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bot, BookOpen, CornerDownLeft, Send, ShieldAlert, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Textarea,
} from '@/components/ui/primitives';
import { EmptyState } from '@/components/shared/states';
import type { AIPayload, AITestResult } from '@/types';

interface Exchange {
  question: string;
  result: AITestResult;
}

const SAMPLE_QUESTIONS = [
  'How much is your premium package?',
  'Do you ship internationally?',
  'Can I return something after 20 days?',
  'Are you open on Sundays?',
  'I want to talk to a human please.',
];

export default function AITestPage() {
  const [question, setQuestion] = React.useState('');
  const [history, setHistory] = React.useState<Exchange[]>([]);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const { data: ai } = useQuery({ queryKey: queryKeys.ai, queryFn: () => get<AIPayload>('/ai') });

  const test = useMutation({
    mutationFn: (message: string) => post<AITestResult>('/ai/test', { message }),
    onSuccess: (result, message) => {
      setHistory((current) => [...current, { question: message, result }]);
      setQuestion('');
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const ask = (message: string) => {
    if (!message.trim() || test.isPending) return;
    test.mutate(message.trim());
  };

  const noKnowledge = (ai?.stats.ready ?? 0) === 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="flex h-[calc(100vh-16rem)] min-h-[28rem] flex-col lg:col-span-2">
        <CardHeader className="shrink-0 border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Playground
          </CardTitle>
          <CardDescription>
            Ask what your customers ask. Nothing here is sent to a customer — this is a dry run
            against your real knowledge base.
          </CardDescription>
        </CardHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {noKnowledge ? (
            <EmptyState
              icon={BookOpen}
              title="Add knowledge first"
              description="The assistant answers only from what you have taught it. Add a few topics and come back."
              action={
                <Button asChild size="sm">
                  <Link href="/ai-training/train-content">Add knowledge</Link>
                </Button>
              }
            />
          ) : history.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_QUESTIONS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => ask(sample)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-secondary"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            history.map((exchange, index) => (
              <ExchangeBlock key={index} exchange={exchange} />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  ask(question);
                }
              }}
              rows={1}
              placeholder="Ask the assistant a customer question…"
              className="max-h-32 min-h-[38px] resize-none py-2"
            />
            <Button onClick={() => ask(question)} loading={test.isPending} disabled={!question.trim()}>
              <Send className="h-4 w-4" />
              Ask
            </Button>
          </div>
          <p className="mt-1.5 px-1 text-2xs text-muted-foreground">
            <CornerDownLeft className="mr-1 inline h-3 w-3" />
            Enter to ask · Shift+Enter for a new line
          </p>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Current settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <SettingRow
              label="Auto reply"
              value={ai?.assistant.autoReplyEnabled ? 'On' : 'Off'}
              variant={ai?.assistant.autoReplyEnabled ? 'success' : 'muted'}
            />
            <SettingRow
              label="Confidence threshold"
              value={`${Math.round((ai?.assistant.confidenceThreshold ?? 0.65) * 100)}%`}
            />
            <SettingRow label="Provider" value={ai?.assistant.provider ?? 'mock'} />
            <SettingRow label="Knowledge passages" value={String(ai?.stats.chunks ?? 0)} />

            <Button asChild variant="outline" size="sm" className="mt-2 w-full">
              <Link href="/ai-training/setup">Change settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to read the results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Confidence</strong> is the assistant&apos;s own
              certainty. Below your threshold it stays quiet rather than guessing.
            </p>
            <p>
              <strong className="text-foreground">Sources</strong> show which knowledge passages the
              answer came from. An answer with no sources means the knowledge base did not cover it.
            </p>
            <p>
              <strong className="text-foreground">Handoff</strong> means a real customer would be
              passed to your team instead, and the AI would pause on that conversation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ExchangeBlock({ exchange }: { exchange: Exchange }) {
  const { question, result } = exchange;
  const confident = result.confidence >= result.threshold;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="flex max-w-[80%] items-start gap-2">
          <div className="bubble bubble-out">{question}</div>
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
            <User className="h-3 w-3" />
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="h-3 w-3" />
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <div className={cn('bubble', result.wouldHandoff ? 'bubble-note' : 'bubble-ai')}>
            {result.answer || 'No answer — this question is not covered by your knowledge base.'}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={confident ? 'success' : 'warning'}>
              {Math.round(result.confidence * 100)}% confident
            </Badge>

            {result.wouldAutoReply ? (
              <Badge variant="default">Would send automatically</Badge>
            ) : result.wouldHandoff ? (
              <Badge variant="warning">
                <ShieldAlert className="h-3 w-3" />
                Would hand off
                {result.handoffReason ? ` · ${result.handoffReason.replace(/_/g, ' ')}` : ''}
              </Badge>
            ) : (
              <Badge variant="secondary">Would wait for an agent</Badge>
            )}

            {result.exactMatch ? (
              <Badge variant="success">Approved answer · exact match, no AI cost</Badge>
            ) : (
              <Badge variant="muted">{result.tokensUsed} tokens</Badge>
            )}
          </div>

          {result.sources.length ? (
            <div className="rounded-lg border border-border bg-secondary/50 p-2.5">
              <p className="mb-1 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                Answered from
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.sources.map((source) => (
                  <span
                    key={`${source.type}:${source.id}`}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-2xs',
                      source.type === 'training' ? 'bg-primary/10 text-primary' : 'bg-card',
                    )}
                    title={`Relevance ${Math.round(source.score * 100)}%`}
                  >
                    {source.type === 'training' ? 'Approved answer: ' : ''}
                    {source.title.length > 60 ? `${source.title.slice(0, 60)}…` : source.title} ·{' '}
                    {Math.round(source.score * 100)}%
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-2xs text-muted-foreground">
              No matching knowledge — add a topic under Knowledge, or an approved answer under Train Messages.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: 'success' | 'muted';
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {variant ? (
        <Badge variant={variant}>{value}</Badge>
      ) : (
        <span className="font-medium capitalize">{value}</span>
      )}
    </div>
  );
}
