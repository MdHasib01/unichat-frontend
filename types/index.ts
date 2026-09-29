export type Platform = 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP' | 'WEBCHAT' | 'INTERNAL';
export type MessagingPlatform = Exclude<Platform, 'INTERNAL'>;
export type MemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'AGENT';
export type MemberStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';
export type ConversationStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'SNOOZED';
export type ConversationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'FILE'
  | 'STICKER'
  | 'LOCATION'
  | 'TEMPLATE'
  | 'SYSTEM'
  | 'NOTE';
export type SenderType = 'CONTACT' | 'AGENT' | 'AI' | 'AUTOMATION' | 'SYSTEM';
export type AiMode = 'ENABLED' | 'PAUSED' | 'DISABLED';
export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'EXPIRED' | 'PENDING';
export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
export type ParcelStatus =
  | 'CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';
export type CallStatus = 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'FAILED' | 'VOICEMAIL';
export type CallDirection = 'INBOUND' | 'OUTBOUND';
export type KnowledgeStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
export type KnowledgeSourceType = 'MANUAL' | 'FAQ' | 'WEBSITE' | 'DOCUMENT' | 'PRODUCT';
export type AutomationTriggerType =
  | 'FIRST_MESSAGE'
  | 'KEYWORD'
  | 'MESSAGE_CONTAINS'
  | 'BUSINESS_HOURS'
  | 'CONVERSATION_CREATED'
  | 'CUSTOMER_TAGGED'
  | 'CONVERSATION_IDLE';
export type AutomationActionType =
  | 'SEND_MESSAGE'
  | 'SEND_TEMPLATE'
  | 'ASSIGN_AGENT'
  | 'ADD_TAG'
  | 'REMOVE_TAG'
  | 'CHANGE_STATUS'
  | 'INTERNAL_NOTE'
  | 'DELAY'
  | 'TRIGGER_AI'
  | 'WEBHOOK';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: {
    pagination?: Pagination;
    unread?: number;
    hasMore?: boolean;
    [key: string]: unknown;
  };
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string | null;
  timezone: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  industry: string | null;
  role: MemberRole;
  onboardingComplete: boolean;
  memberCount: number;
}

export interface BusinessHourRule {
  day: number;
  open: string;
  close: string;
  enabled: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  industry: string | null;
  website: string | null;
  description: string | null;
  timezone: string;
  currency: string;
  businessHours: BusinessHourRule[] | null;
  onboardingStep: number;
  onboardingComplete: boolean;
}

export interface SessionPayload {
  user: User;
  organizations: OrganizationSummary[];
  organization: Organization | null;
  role: MemberRole | null;
  permissions: string[];
  mockMode: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string | null;
  _count?: { conversations: number; contacts: number };
}

export interface MiniUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  email?: string;
}

export interface ContactSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  phone: string | null;
}

export interface Conversation {
  id: string;
  organizationId: string;
  platform: Platform;
  status: ConversationStatus;
  priority: ConversationPriority;
  unreadCount: number;
  messageCount: number;
  aiMode: AiMode;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
  updatedAt: string;
  contact: ContactSummary;
  socialAccount: { id: string; name: string; platform: Platform; avatarUrl: string | null } | null;
  tags: Array<{ tag: Tag }>;
  assignments: Array<{ assignee: MiniUser | null }>;
}

export interface ConversationDetail
  extends Omit<Conversation, 'contact' | 'assignments' | 'socialAccount'> {
  subject: string | null;
  contact: Contact;
  /** The detail endpoint also returns whether the channel is still live. */
  socialAccount: {
    id: string;
    name: string;
    platform: Platform;
    avatarUrl: string | null;
    isActive: boolean;
  } | null;
  assignments: Array<{ id: string; assignee: MiniUser | null }>;
  aiSessions: Array<{ id: string; replyCount: number; handedOff: boolean; lastConfidence: number | null }>;
}

export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'location';
  url: string;
  name?: string;
  mimeType?: string;
  size?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  platform: Platform;
  direction: MessageDirection;
  type: MessageType;
  status: MessageStatus;
  senderType: SenderType;
  body: string | null;
  attachments: Attachment[] | null;
  isInternal: boolean;
  aiGenerated: boolean;
  aiConfidence: number | null;
  errorMessage: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  /** Channel extras, e.g. { pageUrl } for website chat messages. */
  metadata?: Record<string, unknown> | null;
  user?: MiniUser | null;
  contact?: ContactSummary | null;
}

export interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  country: string | null;
  city: string | null;
  notes: string | null;
  isBlocked: boolean;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ tag: Tag }>;
  identifiers: Array<{ id: string; platform: Platform; externalId: string }>;
  fieldValues?: Array<{ id: string; value: string | null; field: CustomField }>;
  _count?: { conversations: number; orders: number };
}

export interface ContactDetail extends Contact {
  contactNotes: Array<{ id: string; body: string; createdAt: string; author: MiniUser | null }>;
  conversations: Array<{
    id: string;
    platform: Platform;
    status: ConversationStatus;
    lastMessageAt: string | null;
    lastMessagePreview: string | null;
    messageCount: number;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: string;
    currency: string;
    placedAt: string;
  }>;
}

export interface CustomField {
  id: string;
  entity: 'CONTACT' | 'CONVERSATION';
  key: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'URL';
  options: string[];
  isRequired: boolean;
  order: number;
}

export interface SocialAccount {
  id: string;
  type: 'FACEBOOK_PAGE' | 'INSTAGRAM_ACCOUNT' | 'WHATSAPP_NUMBER';
  platform: Platform;
  externalId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  status: IntegrationStatus;
  isActive: boolean;
  subscribed: boolean;
  lastError: string | null;
  createdAt: string;
  _count: { conversations: number };
}

export interface IntegrationsPayload {
  meta: {
    id: string;
    status: IntegrationStatus;
    displayName: string | null;
    scopes: string[];
    tokenExpiresAt: string | null;
    lastSyncedAt: string | null;
    lastError: string | null;
    createdAt: string;
  } | null;
  accounts: SocialAccount[];
  mockMode: boolean;
  capabilities: Record<
    string,
    { available: boolean; requiresReview: string[]; note?: string }
  >;
}

export interface AvailableAccounts {
  integrationId: string;
  availablePages: Array<{
    externalId: string;
    name: string;
    avatarUrl?: string;
    category?: string;
    instagram?: { externalId: string; username?: string; name?: string; avatarUrl?: string };
  }>;
  availableWhatsApp: Array<{
    externalId: string;
    wabaId: string;
    displayPhoneNumber: string;
    verifiedName: string;
  }>;
}

export interface AIAssistant {
  id: string;
  name: string;
  persona: string;
  systemPrompt: string | null;
  language: string;
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  autoReplyEnabled: boolean;
  confidenceThreshold: number;
  businessHoursOnly: boolean;
  outsideHoursOnly: boolean;
  maxRepliesPerConversation: number;
  handoffKeywords: string[];
  fallbackMessage: string;
  handoffMessage: string;
  suggestionsEnabled: boolean;
}

export interface AIPayload {
  assistant: AIAssistant;
  stats: { documents: number; chunks: number; ready: number; failed: number; training: number };
  providers: Array<{ id: string; label: string; configured: boolean }>;
  defaultModel: string;
}

export interface AIAnswerSource {
  type: 'training' | 'knowledge';
  id: string;
  documentId?: string;
  title: string;
  score: number;
}

export type TrainingSource = 'MANUAL' | 'INBOX' | 'IMPORT';
export type TrainingStatus = 'ACTIVE' | 'DISABLED';

export interface TrainingExample {
  id: string;
  question: string;
  answer: string;
  source: TrainingSource;
  status: TrainingStatus;
  conversationId: string | null;
  messageId: string | null;
  useCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingStats {
  total: number;
  active: number;
  disabled: number;
  manual: number;
  inbox: number;
  imported: number;
}

export interface TrainingImportPreview {
  format: 'pairs' | 'transcripts' | 'unknown';
  count: number;
  skipped: number;
  preview: Array<{ question: string; answer: string }>;
  errors: Array<{ index: number; message: string }>;
}

export interface TrainingImport {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileName: string | null;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  createdAt: string;
  completedAt: string | null;
}

export type WidgetPosition = 'BOTTOM_RIGHT' | 'BOTTOM_LEFT';
export type PreChatMode = 'OFF' | 'OPTIONAL' | 'REQUIRED';
export type PreChatField = 'name' | 'email' | 'phone';

export interface ChatWidget {
  id: string;
  publicKey: string;
  name: string;
  isActive: boolean;
  allowedDomains: string[];
  position: WidgetPosition;
  offsetX: number;
  offsetY: number;
  primaryColor: string;
  logoUrl: string | null;
  launcherIcon: 'chat' | 'help' | 'message' | 'logo';
  title: string;
  subtitle: string | null;
  welcomeMessage: string | null;
  inputPlaceholder: string;
  offlineMessage: string | null;
  showBranding: boolean;
  preChatMode: PreChatMode;
  preChatFields: PreChatField[];
  lastSeenAt: string | null;
  lastSeenOrigin: string | null;
  createdAt: string;
  updatedAt: string;
  conversationCount?: number;
  scriptUrl: string;
  snippet: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  sourceType: KnowledgeSourceType;
  sourceUrl: string | null;
  status: KnowledgeStatus;
  chunkCount: number;
  tokenCount: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AITestResult {
  answer: string;
  confidence: number;
  threshold: number;
  wouldAutoReply: boolean;
  wouldHandoff: boolean;
  handoffReason?: string;
  exactMatch?: boolean;
  sources: AIAnswerSource[];
  model: string;
  tokensUsed: number;
}

export interface Automation {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  runOncePerContact: boolean;
  priority: number;
  platforms: Platform[];
  executionCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
  triggers: Array<{ id: string; type: AutomationTriggerType; config: Record<string, unknown> | null }>;
  actions: Array<{
    id: string;
    type: AutomationActionType;
    order: number;
    config: Record<string, unknown> | null;
  }>;
  _count?: { executions: number };
}

export interface AutomationExecution {
  id: string;
  automationId: string;
  conversationId: string | null;
  triggerType: AutomationTriggerType;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  automation: { id: string; name: string };
}

export interface TeamMember {
  id: string;
  role: MemberRole;
  status: MemberStatus;
  title: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  user: MiniUser & { lastLoginAt?: string | null };
  permissions: string[];
  activeConversations: number;
}

export interface Invitation {
  id: string;
  email: string;
  role: MemberRole;
  expiresAt: string;
  createdAt: string;
  invitedBy: { id: string; firstName: string; lastName: string } | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  currency: string;
  stock: number;
  trackInventory: boolean;
  category: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: string;
  total: string;
  product?: { id: string; name: string; imageUrl: string | null } | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotal: string;
  discount: string;
  shippingFee: string;
  tax: string;
  total: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  shippingAddress: string | null;
  city: string | null;
  postalCode: string | null;
  note: string | null;
  placedAt: string;
  items: OrderItem[];
  contact: ContactSummary | null;
  conversation: { id: string; platform: Platform } | null;
  parcels: Parcel[];
}

export interface Parcel {
  id: string;
  orderId: string | null;
  trackingNumber: string;
  courier: string;
  status: ParcelStatus;
  recipientName: string | null;
  recipientPhone: string | null;
  address: string | null;
  city: string | null;
  weightKg: string | null;
  codAmount: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  note: string | null;
  history: Array<{ status: string; at: string; note?: string }> | null;
  createdAt: string;
  order?: { id: string; orderNumber: string; status?: OrderStatus } | null;
}

export interface CallRecord {
  id: string;
  direction: CallDirection;
  status: CallStatus;
  fromNumber: string | null;
  toNumber: string | null;
  durationSeconds: number;
  provider: string | null;
  recordingUrl: string | null;
  recordingMime: string | null;
  transcript: string | null;
  summary: string | null;
  startedAt: string;
  endedAt: string | null;
  contact: ContactSummary | null;
  conversation: { id: string; platform: Platform } | null;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'GREETING' | 'SUPPORT' | 'SALES' | 'FOLLOW_UP' | 'CLOSING' | 'OTHER';
  body: string;
  variables: string[];
  platforms: Platform[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalConversations: number;
  newConversations: number;
  openConversations: number;
  resolvedConversations: number;
  messagesReceived: number;
  messagesSent: number;
  aiMessages: number;
  automationRuns: number;
  newContacts: number;
  averageResponseSeconds: number;
  aiResolutionRate: number;
  aiHandoffs: number;
}

export interface SeriesPoint {
  date: string;
  conversations: number;
  resolved: number;
  inbound: number;
  outbound: number;
  ai: number;
}

export interface PlatformBreakdown {
  platform: MessagingPlatform;
  conversations: number;
  messages: number;
}

export interface SalesSummary {
  orders30d: number;
  revenue30d: number;
  pendingOrders: number;
  activeProducts: number;
  parcelsInTransit: number;
}

export interface DashboardPayload {
  overview: AnalyticsOverview;
  trends: { conversations: number; messages: number; resolved: number; responseTime: number };
  platforms: PlatformBreakdown[];
  series: SeriesPoint[];
  recentConversations: Array<{
    id: string;
    platform: Platform;
    status: ConversationStatus;
    unreadCount: number;
    lastMessageAt: string | null;
    lastMessagePreview: string | null;
    contact: { id: string; displayName: string; avatarUrl: string | null };
  }>;
  channels: Array<{
    id: string;
    platform: Platform;
    name: string;
    status: IntegrationStatus;
    isActive: boolean;
    avatarUrl: string | null;
  }>;
  sales: SalesSummary;
}

export interface InsightsPayload {
  range: { from: string; to: string; days: number };
  overview: AnalyticsOverview;
  platforms: PlatformBreakdown[];
  series: SeriesPoint[];
  agents: Array<{
    user: MiniUser;
    role: MemberRole;
    assigned: number;
    resolved: number;
    messagesSent: number;
    resolutionRate: number;
  }>;
  automations: Array<{
    id: string;
    name: string;
    isActive: boolean;
    runs: number;
    failed: number;
    successRate: number;
    lastExecutedAt: string | null;
  }>;
}

export interface ConversationCounts {
  OPEN: number;
  PENDING: number;
  RESOLVED: number;
  SNOOZED: number;
  unread: number;
  unassigned: number;
  total: number;
}
