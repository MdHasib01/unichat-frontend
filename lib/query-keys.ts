/**
 * Centralised query keys.
 *
 * Every tenant-scoped key is a plain path key — the active organization lives
 * on the server session, so switching organizations invalidates the whole
 * cache at once rather than threading an org id through every key.
 */
export const queryKeys = {
  session: ['session'] as const,
  organizations: ['organizations'] as const,
  organization: ['organization'] as const,

  dashboard: ['dashboard'] as const,
  insights: (days: number) => ['insights', days] as const,

  conversations: (filters: Record<string, unknown>) => ['conversations', filters] as const,
  conversationCounts: ['conversations', 'counts'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  messages: (id: string) => ['messages', id] as const,

  contacts: (filters: Record<string, unknown>) => ['contacts', filters] as const,
  contact: (id: string) => ['contact', id] as const,

  integrations: ['integrations'] as const,
  metaAccounts: ['integrations', 'meta', 'accounts'] as const,
  webhookEvents: (page: number) => ['integrations', 'webhook-events', page] as const,

  ai: ['ai'] as const,
  knowledge: (filters: Record<string, unknown>) => ['ai', 'knowledge', filters] as const,

  automations: ['automations'] as const,
  automation: (id: string) => ['automation', id] as const,
  automationExecutions: (filters: Record<string, unknown>) => ['automations', 'executions', filters] as const,

  team: ['team'] as const,
  teamMember: (id: string) => ['team', id] as const,
  agents: ['team', 'agents'] as const,
  invitations: ['team', 'invitations'] as const,

  products: (filters: Record<string, unknown>) => ['products', filters] as const,
  product: (id: string) => ['product', id] as const,
  orders: (filters: Record<string, unknown>) => ['orders', filters] as const,
  order: (id: string) => ['order', id] as const,
  parcels: (filters: Record<string, unknown>) => ['parcels', filters] as const,
  parcel: (id: string) => ['parcel', id] as const,
  salesSummary: ['sales', 'summary'] as const,

  calls: (filters: Record<string, unknown>) => ['calls', filters] as const,
  call: (id: string) => ['call', id] as const,
  callStats: ['calls', 'stats'] as const,

  templates: (filters: Record<string, unknown>) => ['templates', filters] as const,
  template: (id: string) => ['template', id] as const,
  tags: ['tags'] as const,
  customFields: ['custom-fields'] as const,

  notifications: (filters: Record<string, unknown>) => ['notifications', filters] as const,
  auditLogs: (page: number) => ['audit-logs', page] as const,
  sessions: ['auth', 'sessions'] as const,
};
