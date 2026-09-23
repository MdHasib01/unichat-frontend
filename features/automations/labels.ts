import type { AutomationActionType, AutomationTriggerType } from '@/types';

export const TRIGGER_LABELS: Record<AutomationTriggerType, string> = {
  FIRST_MESSAGE: 'A customer messages for the first time',
  KEYWORD: 'A message contains a keyword',
  MESSAGE_CONTAINS: 'A message contains text',
  BUSINESS_HOURS: 'Inside or outside business hours',
  CONVERSATION_CREATED: 'A new conversation opens',
  CUSTOMER_TAGGED: 'A customer is tagged',
  CONVERSATION_IDLE: 'A conversation goes quiet',
};

export const TRIGGER_SHORT: Record<AutomationTriggerType, string> = {
  FIRST_MESSAGE: 'First message',
  KEYWORD: 'Keyword',
  MESSAGE_CONTAINS: 'Message contains',
  BUSINESS_HOURS: 'Business hours',
  CONVERSATION_CREATED: 'Conversation created',
  CUSTOMER_TAGGED: 'Customer tagged',
  CONVERSATION_IDLE: 'Conversation idle',
};

export const ACTION_LABELS: Record<AutomationActionType, string> = {
  SEND_MESSAGE: 'Send a message',
  SEND_TEMPLATE: 'Send a template',
  ASSIGN_AGENT: 'Assign an agent',
  ADD_TAG: 'Add a tag',
  REMOVE_TAG: 'Remove a tag',
  CHANGE_STATUS: 'Change the status',
  INTERNAL_NOTE: 'Leave an internal note',
  DELAY: 'Wait',
  TRIGGER_AI: 'Let the AI answer',
  WEBHOOK: 'Call a webhook',
};

export const TRIGGER_OPTIONS: AutomationTriggerType[] = [
  'FIRST_MESSAGE',
  'KEYWORD',
  'MESSAGE_CONTAINS',
  'CONVERSATION_CREATED',
  'BUSINESS_HOURS',
  'CUSTOMER_TAGGED',
  'CONVERSATION_IDLE',
];

export const ACTION_OPTIONS: AutomationActionType[] = [
  'SEND_MESSAGE',
  'SEND_TEMPLATE',
  'ADD_TAG',
  'REMOVE_TAG',
  'ASSIGN_AGENT',
  'CHANGE_STATUS',
  'INTERNAL_NOTE',
  'TRIGGER_AI',
  'DELAY',
  'WEBHOOK',
];

/** Ready-made rules businesses reach for first. */
export const AUTOMATION_PRESETS = [
  {
    id: 'welcome',
    name: 'Welcome new customers',
    description: 'Greets someone the first time they message, once per person.',
    runOncePerContact: true,
    trigger: 'FIRST_MESSAGE' as AutomationTriggerType,
    action: 'SEND_MESSAGE' as AutomationActionType,
    message: 'Hi {{first_name}}! Thanks for contacting {{business_name}}. How can we help you today?',
  },
  {
    id: 'pricing',
    name: 'Pricing questions',
    description: 'Tags pricing questions and lets the assistant answer them.',
    runOncePerContact: false,
    trigger: 'KEYWORD' as AutomationTriggerType,
    action: 'TRIGGER_AI' as AutomationActionType,
    keywords: ['price', 'pricing', 'cost', 'how much'],
  },
  {
    id: 'after-hours',
    name: 'After-hours acknowledgement',
    description: 'Lets customers know when your team will be back.',
    runOncePerContact: false,
    trigger: 'BUSINESS_HOURS' as AutomationTriggerType,
    action: 'SEND_MESSAGE' as AutomationActionType,
    message:
      "Thanks for your message! Our team is offline right now, but we'll get back to you first thing on the next working day.",
  },
] as const;
