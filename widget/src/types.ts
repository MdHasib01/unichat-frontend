export type PreChatField = 'name' | 'email' | 'phone';

export interface WidgetConfig {
  key: string;
  position: 'BOTTOM_RIGHT' | 'BOTTOM_LEFT';
  offsetX: number;
  offsetY: number;
  primaryColor: string;
  logoUrl: string | null;
  launcherIcon: 'chat' | 'help' | 'message' | 'logo' | string;
  title: string;
  subtitle: string | null;
  welcomeMessage: string | null;
  inputPlaceholder: string;
  offlineMessage: string | null;
  showBranding: boolean;
  /** Product name for "Powered by", set by the domain serving the widget. */
  brandName?: string;
  businessName: string;
  isOnline: boolean;
  preChat: { mode: 'OFF' | 'OPTIONAL' | 'REQUIRED'; fields: PreChatField[] };
}

export interface VisitorProfile {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface VisitorState {
  profile: VisitorProfile;
  needsPreChat: boolean;
  hasConversation: boolean;
}

export interface SessionResponse extends VisitorState {
  visitorToken: string;
  visitorId: string;
}

export interface ChatMessage {
  id: string;
  clientMessageId: string | null;
  body: string | null;
  from: 'visitor' | 'agent' | 'bot';
  agent: { name: string; avatarUrl: string | null } | null;
  status: string;
  createdAt: string;
  /** Local-only: optimistic message state. */
  pending?: boolean;
  failed?: boolean;
}
