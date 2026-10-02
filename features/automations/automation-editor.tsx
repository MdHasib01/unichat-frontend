'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, GripVertical, Plus, Save, Trash2, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { get, patch, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
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
  Separator,
  Switch,
  Textarea,
} from '@/components/ui/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/overlays';
import {
  ACTION_LABELS,
  ACTION_OPTIONS,
  AUTOMATION_PRESETS,
  TRIGGER_LABELS,
  TRIGGER_OPTIONS,
} from './labels';
import type {
  Automation,
  AutomationActionType,
  AutomationTriggerType,
  ConversationStatus,
  MessageTemplate,
  MiniUser,
  Tag,
} from '@/types';

interface TriggerDraft {
  type: AutomationTriggerType;
  keywords: string[];
  matchType: 'any' | 'all' | 'exact';
  inHours: boolean;
  idleMinutes: number;
}

interface ActionDraft {
  type: AutomationActionType;
  message: string;
  templateId: string;
  agentId: string;
  tagId: string;
  status: ConversationStatus;
  note: string;
  delaySeconds: number;
  url: string;
}

const emptyTrigger = (type: AutomationTriggerType = 'FIRST_MESSAGE'): TriggerDraft => ({
  type,
  keywords: [],
  matchType: 'any',
  inHours: false,
  idleMinutes: 60,
});

const emptyAction = (type: AutomationActionType = 'SEND_MESSAGE'): ActionDraft => ({
  type,
  message: '',
  templateId: '',
  agentId: '',
  tagId: '',
  status: 'PENDING',
  note: '',
  delaySeconds: 60,
  url: '',
});

export function AutomationEditor({ automationId }: { automationId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = !automationId;

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);
  const [runOnce, setRunOnce] = React.useState(false);
  const [triggers, setTriggers] = React.useState<TriggerDraft[]>([emptyTrigger()]);
  const [actions, setActions] = React.useState<ActionDraft[]>([emptyAction()]);
  const [keywordInput, setKeywordInput] = React.useState('');

  const { data: automation } = useQuery({
    queryKey: queryKeys.automation(automationId ?? ''),
    queryFn: () => get<Automation>(`/automations/${automationId}`),
    enabled: Boolean(automationId),
  });

  const { data: tags } = useQuery({ queryKey: queryKeys.tags, queryFn: () => get<Tag[]>('/tags') });
  const { data: agents } = useQuery({
    queryKey: queryKeys.agents,
    queryFn: () => get<Array<MiniUser & { role: string }>>('/team/agents'),
  });
  const { data: templates } = useQuery({
    queryKey: queryKeys.templates({}),
    queryFn: () => get<MessageTemplate[]>('/templates'),
  });

  // Hydrate the editor from the saved automation.
  React.useEffect(() => {
    if (!automation) return;
    setName(automation.name);
    setDescription(automation.description ?? '');
    setIsActive(automation.isActive);
    setRunOnce(automation.runOncePerContact);
    setTriggers(
      automation.triggers.map((trigger) => {
        const config = (trigger.config ?? {}) as Partial<TriggerDraft>;
        return {
          ...emptyTrigger(trigger.type),
          ...config,
          keywords: (config.keywords as string[] | undefined) ?? [],
        };
      }),
    );
    setActions(
      automation.actions.map((action) => {
        const config = (action.config ?? {}) as Partial<ActionDraft>;
        return { ...emptyAction(action.type), ...config };
      }),
    );
  }, [automation]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        isActive,
        runOncePerContact: runOnce,
        triggers: triggers.map((trigger) => ({
          type: trigger.type,
          config:
            trigger.type === 'KEYWORD' || trigger.type === 'MESSAGE_CONTAINS'
              ? { keywords: trigger.keywords, matchType: trigger.matchType }
              : trigger.type === 'BUSINESS_HOURS'
                ? { inHours: trigger.inHours }
                : trigger.type === 'CONVERSATION_IDLE'
                  ? { idleMinutes: trigger.idleMinutes }
                  : {},
        })),
        actions: actions.map((action, index) => ({
          type: action.type,
          order: index,
          config: actionConfig(action),
        })),
      };

      return automationId
        ? patch(`/automations/${automationId}`, payload)
        : post<Automation>('/automations', payload);
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.automations });
      toast.success(isNew ? 'Automation created' : 'Automation saved');
      if (isNew && result && typeof result === 'object' && 'id' in result) {
        router.push(`/automations/${(result as Automation).id}`);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const applyPreset = (preset: (typeof AUTOMATION_PRESETS)[number]) => {
    setName(preset.name);
    setDescription(preset.description);
    setRunOnce(preset.runOncePerContact);
    setTriggers([
      {
        ...emptyTrigger(preset.trigger),
        keywords: 'keywords' in preset ? [...preset.keywords] : [],
      },
    ]);
    setActions([
      { ...emptyAction(preset.action), message: 'message' in preset ? preset.message : '' },
    ]);
  };

  const valid =
    name.trim().length > 0 &&
    triggers.length > 0 &&
    actions.length > 0 &&
    actions.every((action) => actionIsComplete(action));

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/automations">
          <ArrowLeft className="h-4 w-4" />
          All automations
        </Link>
      </Button>

      {isNew ? (
        <Card>
          <CardHeader>
            <CardTitle>Start from a common rule</CardTitle>
            <CardDescription>Pick one and adjust it, or build from scratch below.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {AUTOMATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary"
              >
                <p className="text-sm font-medium">{preset.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{preset.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FormField label="Name" required>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Welcome new customers"
              autoFocus={isNew}
            />
          </FormField>

          <FormField label="Description">
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What this rule does and why"
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between rounded-lg border border-border p-3">
              <span>
                <span className="block text-sm font-medium">Active</span>
                <span className="block text-xs text-muted-foreground">Run this rule on new events</span>
              </span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-border p-3">
              <span>
                <span className="block text-sm font-medium">Only once per customer</span>
                <span className="block text-xs text-muted-foreground">
                  Stops a welcome message repeating
                </span>
              </span>
              <Switch checked={runOnce} onCheckedChange={setRunOnce} />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              When this happens
            </CardTitle>
            <CardDescription>Any one of these triggers starts the rule.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTriggers([...triggers, emptyTrigger('KEYWORD')])}
          >
            <Plus className="h-3.5 w-3.5" />
            Add trigger
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {triggers.map((trigger, index) => (
            <div key={index} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Select
                  value={trigger.type}
                  onValueChange={(value) =>
                    setTriggers(
                      triggers.map((t, i) =>
                        i === index ? { ...t, type: value as AutomationTriggerType } : t,
                      ),
                    )
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {TRIGGER_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {triggers.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setTriggers(triggers.filter((_, i) => i !== index))}
                    aria-label="Remove trigger"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                ) : null}
              </div>

              {trigger.type === 'KEYWORD' || trigger.type === 'MESSAGE_CONTAINS' ? (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-1.5 rounded-lg border border-input p-2">
                    {trigger.keywords.map((word) => (
                      <span
                        key={word}
                        className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
                      >
                        {word}
                        <button
                          type="button"
                          onClick={() =>
                            setTriggers(
                              triggers.map((t, i) =>
                                i === index
                                  ? { ...t, keywords: t.keywords.filter((k) => k !== word) }
                                  : t,
                              ),
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={keywordInput}
                      onChange={(event) => setKeywordInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && keywordInput.trim()) {
                          event.preventDefault();
                          setTriggers(
                            triggers.map((t, i) =>
                              i === index
                                ? {
                                    ...t,
                                    keywords: Array.from(
                                      new Set([...t.keywords, keywordInput.trim().toLowerCase()]),
                                    ),
                                  }
                                : t,
                            ),
                          );
                          setKeywordInput('');
                        }
                      }}
                      placeholder="Type a keyword and press Enter"
                      className="min-w-[12rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>

                  <Select
                    value={trigger.matchType}
                    onValueChange={(value) =>
                      setTriggers(
                        triggers.map((t, i) =>
                          i === index ? { ...t, matchType: value as TriggerDraft['matchType'] } : t,
                        ),
                      )
                    }
                  >
                    <SelectTrigger className="h-8 w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Match any keyword</SelectItem>
                      <SelectItem value="all">Match all keywords</SelectItem>
                      <SelectItem value="exact">Match the message exactly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {trigger.type === 'BUSINESS_HOURS' ? (
                <Select
                  value={trigger.inHours ? 'inside' : 'outside'}
                  onValueChange={(value) =>
                    setTriggers(
                      triggers.map((t, i) => (i === index ? { ...t, inHours: value === 'inside' } : t)),
                    )
                  }
                >
                  <SelectTrigger className="mt-3 h-8 w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inside">During business hours</SelectItem>
                    <SelectItem value="outside">Outside business hours</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}

              {trigger.type === 'CONVERSATION_IDLE' ? (
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={trigger.idleMinutes}
                    onChange={(event) =>
                      setTriggers(
                        triggers.map((t, i) =>
                          i === index ? { ...t, idleMinutes: Number(event.target.value) } : t,
                        ),
                      )
                    }
                    className="h-8 w-24"
                  />
                  <span className="text-sm text-muted-foreground">minutes without a reply</span>
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              Then do this
            </CardTitle>
            <CardDescription>Actions run in order, top to bottom.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setActions([...actions, emptyAction()])}>
            <Plus className="h-3.5 w-3.5" />
            Add action
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {actions.map((action, index) => (
            <div key={index} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>

                <Select
                  value={action.type}
                  onValueChange={(value) =>
                    setActions(
                      actions.map((a, i) =>
                        i === index ? { ...emptyAction(value as AutomationActionType) } : a,
                      ),
                    )
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {ACTION_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {actions.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setActions(actions.filter((_, i) => i !== index))}
                    aria-label="Remove action"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                ) : null}
              </div>

              <div className="mt-3 pl-8">
                <ActionFields
                  action={action}
                  tags={tags ?? []}
                  agents={agents ?? []}
                  templates={templates ?? []}
                  onChange={(next) =>
                    setActions(actions.map((a, i) => (i === index ? { ...a, ...next } : a)))
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>

        <Separator />

        <div className="flex items-center justify-between p-4">
          <p className="text-xs text-muted-foreground">
            Variables you can use: <code className="font-mono">{'{{first_name}}'}</code>,{' '}
            <code className="font-mono">{'{{customer_name}}'}</code>,{' '}
            <code className="font-mono">{'{{business_name}}'}</code>
          </p>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!valid}>
            <Save className="h-4 w-4" />
            {isNew ? 'Create automation' : 'Save changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ActionFields({
  action,
  tags,
  agents,
  templates,
  onChange,
}: {
  action: ActionDraft;
  tags: Tag[];
  agents: Array<MiniUser & { role: string }>;
  templates: MessageTemplate[];
  onChange: (next: Partial<ActionDraft>) => void;
}) {
  switch (action.type) {
    case 'SEND_MESSAGE':
      return (
        <Textarea
          rows={3}
          value={action.message}
          onChange={(event) => onChange({ message: event.target.value })}
          placeholder="Hi {{first_name}}! Thanks for contacting {{business_name}}. How can we help?"
        />
      );

    case 'INTERNAL_NOTE':
      return (
        <Textarea
          rows={2}
          value={action.note}
          onChange={(event) => onChange({ note: event.target.value })}
          placeholder="A note only your team will see"
        />
      );

    case 'SEND_TEMPLATE':
      return (
        <Select value={action.templateId} onValueChange={(templateId) => onChange({ templateId })}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'ADD_TAG':
    case 'REMOVE_TAG':
      return (
        <Select value={action.tagId} onValueChange={(tagId) => onChange({ tagId })}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a tag" />
          </SelectTrigger>
          <SelectContent>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'ASSIGN_AGENT':
      return (
        <Select value={action.agentId} onValueChange={(agentId) => onChange({ agentId })}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a team member" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.firstName} {agent.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'CHANGE_STATUS':
      return (
        <Select
          value={action.status}
          onValueChange={(status) => onChange({ status: status as ConversationStatus })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>
      );

    case 'DELAY':
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={86400}
            value={action.delaySeconds}
            onChange={(event) => onChange({ delaySeconds: Number(event.target.value) })}
            className="w-28"
          />
          <span className="text-sm text-muted-foreground">seconds before the next action</span>
        </div>
      );

    case 'WEBHOOK':
      return (
        <Input
          type="url"
          value={action.url}
          onChange={(event) => onChange({ url: event.target.value })}
          placeholder="https://your-system.example.com/webhook"
        />
      );

    case 'TRIGGER_AI':
      return (
        <p className="text-sm text-muted-foreground">
          The assistant answers from your knowledge base, subject to your confidence threshold and
          auto-reply settings.
        </p>
      );

    default:
      return null;
  }
}

function actionConfig(action: ActionDraft): Record<string, unknown> {
  switch (action.type) {
    case 'SEND_MESSAGE':
      return { message: action.message };
    case 'INTERNAL_NOTE':
      return { note: action.note };
    case 'SEND_TEMPLATE':
      return { templateId: action.templateId };
    case 'ADD_TAG':
    case 'REMOVE_TAG':
      return { tagId: action.tagId };
    case 'ASSIGN_AGENT':
      return { agentId: action.agentId };
    case 'CHANGE_STATUS':
      return { status: action.status };
    case 'DELAY':
      return { delaySeconds: action.delaySeconds };
    case 'WEBHOOK':
      return { url: action.url, method: 'POST' };
    default:
      return {};
  }
}

/** Blocks saving an action that would do nothing at runtime. */
function actionIsComplete(action: ActionDraft): boolean {
  switch (action.type) {
    case 'SEND_MESSAGE':
      return action.message.trim().length > 0;
    case 'INTERNAL_NOTE':
      return action.note.trim().length > 0;
    case 'SEND_TEMPLATE':
      return Boolean(action.templateId);
    case 'ADD_TAG':
    case 'REMOVE_TAG':
      return Boolean(action.tagId);
    case 'ASSIGN_AGENT':
      return Boolean(action.agentId);
    case 'WEBHOOK':
      return /^https?:\/\//.test(action.url);
    default:
      return true;
  }
}
