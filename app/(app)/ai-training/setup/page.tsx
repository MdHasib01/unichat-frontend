'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Info, Save, ShieldCheck, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { get, patch } from '@/services/api';
import { BrandName } from '@/components/brand-provider';
import { queryKeys } from '@/lib/query-keys';
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
  Label,
  Skeleton,
  Switch,
  Textarea,
} from '@/components/ui/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/overlays';
import type { AIAssistant, AIPayload } from '@/types';

export default function AISetupPage() {
  const queryClient = useQueryClient();
  const { can } = useSession();
  const readOnly = !can('ai.manage');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ai,
    queryFn: () => get<AIPayload>('/ai'),
  });

  const [form, setForm] = React.useState<Partial<AIAssistant>>({});
  const [keyword, setKeyword] = React.useState('');

  React.useEffect(() => {
    if (data?.assistant) setForm(data.assistant);
  }, [data?.assistant]);

  const save = useMutation({
    mutationFn: () =>
      patch('/ai', {
        name: form.name,
        persona: form.persona,
        systemPrompt: form.systemPrompt || null,
        language: form.language,
        provider: form.provider,
        model: form.model,
        temperature: form.temperature,
        maxTokens: form.maxTokens,
        autoReplyEnabled: form.autoReplyEnabled,
        confidenceThreshold: form.confidenceThreshold,
        businessHoursOnly: form.businessHoursOnly,
        outsideHoursOnly: form.outsideHoursOnly,
        maxRepliesPerConversation: form.maxRepliesPerConversation,
        handoffKeywords: form.handoffKeywords,
        fallbackMessage: form.fallbackMessage,
        handoffMessage: form.handoffMessage,
        suggestionsEnabled: form.suggestionsEnabled,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ai });
      toast.success('AI settings saved');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const activeProvider = data.providers.find((p) => p.id === form.provider);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Assistant identity
            </CardTitle>
            <CardDescription>How the assistant introduces itself and sounds to customers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Assistant name">
                <Input
                  value={form.name ?? ''}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  disabled={readOnly}
                />
              </FormField>
              <FormField label="Reply language">
                <Select
                  value={form.language ?? 'en'}
                  onValueChange={(value) => setForm({ ...form, language: value })}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      ['en', 'English'],
                      ['es', 'Spanish'],
                      ['fr', 'French'],
                      ['de', 'German'],
                      ['pt', 'Portuguese'],
                      ['ar', 'Arabic'],
                      ['bn', 'Bengali'],
                      ['hi', 'Hindi'],
                      ['id', 'Indonesian'],
                    ].map(([code, label]) => (
                      <SelectItem key={code} value={code}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField label="Tone" hint="For example: warm and concise, or formal and precise.">
              <Input
                value={form.persona ?? ''}
                onChange={(event) => setForm({ ...form, persona: event.target.value })}
                disabled={readOnly}
              />
            </FormField>

            <FormField
              label="Custom instructions"
              hint="Extra rules the assistant must follow — what to always mention, what never to promise."
            >
              <Textarea
                rows={4}
                value={form.systemPrompt ?? ''}
                onChange={(event) => setForm({ ...form, systemPrompt: event.target.value })}
                placeholder="Always mention that shipping is free over $150. Never quote delivery dates for custom orders."
                disabled={readOnly}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Auto reply
            </CardTitle>
            <CardDescription>
              When the assistant may answer a customer without a person reviewing it first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              label="Answer customers automatically"
              description="The assistant replies on its own when it is confident enough."
              checked={Boolean(form.autoReplyEnabled)}
              onChange={(autoReplyEnabled) => setForm({ ...form, autoReplyEnabled })}
              disabled={readOnly}
            />

            <ToggleRow
              label="Suggest replies to agents"
              description="Adds a one-click draft in the composer, without sending anything."
              checked={Boolean(form.suggestionsEnabled)}
              onChange={(suggestionsEnabled) => setForm({ ...form, suggestionsEnabled })}
              disabled={readOnly}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Confidence threshold</Label>
                <Badge variant="secondary">{Math.round((form.confidenceThreshold ?? 0.65) * 100)}%</Badge>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round((form.confidenceThreshold ?? 0.65) * 100)}
                onChange={(event) =>
                  setForm({ ...form, confidenceThreshold: Number(event.target.value) / 100 })
                }
                disabled={readOnly}
                className="w-full accent-[hsl(var(--primary))]"
              />
              <p className="text-xs text-muted-foreground">
                Below this, the assistant stays quiet and hands the conversation to your team.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Max AI replies per conversation"
                hint="Stops a loop if the customer keeps asking."
              >
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={form.maxRepliesPerConversation ?? 5}
                  onChange={(event) =>
                    setForm({ ...form, maxRepliesPerConversation: Number(event.target.value) })
                  }
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="When it may reply">
                <Select
                  value={
                    form.businessHoursOnly ? 'inside' : form.outsideHoursOnly ? 'outside' : 'always'
                  }
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      businessHoursOnly: value === 'inside',
                      outsideHoursOnly: value === 'outside',
                    })
                  }
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Any time</SelectItem>
                    <SelectItem value="inside">Only during business hours</SelectItem>
                    <SelectItem value="outside">Only outside business hours</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Human handoff
            </CardTitle>
            <CardDescription>
              What happens when the assistant is unsure, or a customer asks for a person.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField
              label="Handoff keywords"
              hint="If a customer's message contains one of these, the AI pauses and your team is alerted."
            >
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-input p-2">
                {(form.handoffKeywords ?? []).map((word) => (
                  <span
                    key={word}
                    className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
                  >
                    {word}
                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            handoffKeywords: (form.handoffKeywords ?? []).filter((w) => w !== word),
                          })
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    ) : null}
                  </span>
                ))}
                {!readOnly ? (
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && keyword.trim()) {
                        event.preventDefault();
                        setForm({
                          ...form,
                          handoffKeywords: Array.from(
                            new Set([...(form.handoffKeywords ?? []), keyword.trim().toLowerCase()]),
                          ),
                        });
                        setKeyword('');
                      }
                    }}
                    placeholder="Add a keyword and press Enter"
                    className="min-w-[12rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                ) : null}
              </div>
            </FormField>

            <FormField
              label="Message when the assistant doesn't know"
              hint="Sent instead of guessing."
            >
              <Textarea
                rows={2}
                value={form.fallbackMessage ?? ''}
                onChange={(event) => setForm({ ...form, fallbackMessage: event.target.value })}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Message when a customer asks for a person">
              <Textarea
                rows={2}
                value={form.handoffMessage ?? ''}
                onChange={(event) => setForm({ ...form, handoffMessage: event.target.value })}
                disabled={readOnly}
              />
            </FormField>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle>Model</CardTitle>
            <CardDescription><BrandName /> is not tied to one AI provider.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Provider">
              <Select
                value={form.provider ?? 'mock'}
                onValueChange={(value) => setForm({ ...form, provider: value })}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.label}
                      {provider.configured ? '' : ' (no API key)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {activeProvider && !activeProvider.configured ? (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-xs">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span>
                  No API key is configured for this provider, so <BrandName /> falls back to the built-in
                  offline assistant, which answers strictly from your knowledge base.
                </span>
              </div>
            ) : null}

            <FormField
              label="Model"
              hint={
                form.provider === 'anthropic'
                  ? 'Claude Opus 5.5 gives the best answers; Sonnet 5.5 and Haiku 4.5 are faster and cheaper. Claude sizes its own replies, so the creativity and max-token settings below apply to OpenAI only.'
                  : undefined
              }
            >
              <Input
                value={form.model ?? ''}
                onChange={(event) => setForm({ ...form, model: event.target.value })}
                placeholder={data.defaultModel}
                disabled={readOnly}
                list="ai-model-suggestions"
              />
              <datalist id="ai-model-suggestions">
                {form.provider === 'openai' ? (
                  <option value="gpt-4o-mini" />
                ) : (
                  <>
                    <option value="claude-opus-5-5">Claude Opus 5.5</option>
                    <option value="claude-sonnet-5-5">Claude Sonnet 5.5</option>
                    <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                  </>
                )}
              </datalist>
            </FormField>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Creativity" hint="Lower is more literal.">
                <Input
                  type="number"
                  step={0.1}
                  min={0}
                  max={1}
                  value={form.temperature ?? 0.3}
                  onChange={(event) => setForm({ ...form, temperature: Number(event.target.value) })}
                  disabled={readOnly}
                />
              </FormField>
              <FormField label="Max tokens">
                <Input
                  type="number"
                  min={50}
                  max={4000}
                  value={form.maxTokens ?? 600}
                  onChange={(event) => setForm({ ...form, maxTokens: Number(event.target.value) })}
                  disabled={readOnly}
                />
              </FormField>
            </div>

            {!readOnly ? (
              <Button onClick={() => save.mutate()} loading={save.isPending} className="w-full">
                <Save className="h-4 w-4" />
                Save AI settings
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Your role can view these settings but not change them.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <Row label="Documents" value={data.stats.documents} />
            <Row label="Indexed passages" value={data.stats.chunks} />
            <Row label="Ready" value={data.stats.ready} />
            {data.stats.failed > 0 ? <Row label="Failed" value={data.stats.failed} /> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
