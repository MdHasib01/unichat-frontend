import type { ChatMessage, SessionResponse, VisitorState, WidgetConfig } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

/** Thin client for the public widget API. No cookies, ever. */
export class WidgetApi {
  token: string | null = null;

  constructor(
    private readonly base: string,
    private readonly key: string,
  ) {}

  private url(path: string) {
    return `${this.base}/api/widget/${encodeURIComponent(this.key)}${path}`;
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const response = await fetch(this.url(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'omit',
      mode: 'cors',
    });

    if (response.status === 204) return undefined as T;

    let payload: { success?: boolean; data?: T; message?: string; code?: string } = {};
    try {
      payload = await response.json();
    } catch {
      /* non-JSON error */
    }

    if (!response.ok || payload.success === false) {
      throw new ApiError(payload.message || 'Request failed', response.status, payload.code || 'ERROR');
    }
    return payload.data as T;
  }

  config() {
    return this.request<WidgetConfig>('GET', '/config');
  }

  session() {
    return this.request<SessionResponse>('POST', '/session', {});
  }

  identify(input: Partial<Record<'name' | 'email' | 'phone', string>>) {
    return this.request<VisitorState>('POST', '/identify', input);
  }

  /** Full history, or with `since` only rows created or changed after that cursor. */
  messages(since?: string) {
    return this.request<{ messages: ChatMessage[]; cursor: string }>(
      'GET',
      since ? `/messages?since=${encodeURIComponent(since)}` : '/messages',
    );
  }

  send(text: string, clientMessageId: string) {
    return this.request<ChatMessage>('POST', '/messages', {
      text,
      clientMessageId,
      pageUrl: location.href.slice(0, 1000),
    });
  }

  typing() {
    return this.request<void>('POST', '/typing', {});
  }

  read() {
    return this.request<void>('POST', '/read', {});
  }

  streamUrl() {
    return this.url(`/stream?token=${encodeURIComponent(this.token ?? '')}`);
  }
}
