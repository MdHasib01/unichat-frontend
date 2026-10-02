/**
 * Website chat widget.
 *
 *   <script async src="https://YOUR-DOMAIN/widget/v1.js" data-widget-key="wk_…"></script>
 *
 * Dependency-free and rendered in a Shadow DOM. Replies arrive over
 * Server-Sent Events, with polling as the fallback. All text is inserted with
 * textContent — nothing from the network is ever parsed as HTML.
 *
 * JS API (callable before the script loads, calls are queued):
 *   ChatWidget('open' | 'close' | 'toggle' | 'show' | 'hide')
 *   ChatWidget('identify', { name, email, phone })
 */
import { ApiError, WidgetApi } from './api';
import { STYLES } from './styles';
import type { ChatMessage, PreChatField, VisitorState, WidgetConfig } from './types';

type Command = 'open' | 'close' | 'toggle' | 'show' | 'hide' | 'identify';
type WidgetFn = ((command: Command, arg?: unknown) => void) & { q?: IArguments[] | unknown[][] };

declare global {
  interface Window {
    ChatWidget?: WidgetFn;
    __chatWidgetLoaded?: boolean;
  }
}

const ICONS: Record<string, string> = {
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.5"/><path d="M12 17.5h.01"/></svg>',
  message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4Z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

const FIELD_LABELS: Record<PreChatField, { label: string; type: string; autocomplete: string }> = {
  name: { label: 'Name', type: 'text', autocomplete: 'name' },
  email: { label: 'Email', type: 'email', autocomplete: 'email' },
  phone: { label: 'Phone', type: 'tel', autocomplete: 'tel' },
};

const PREVIEW_MESSAGES: ChatMessage[] = [
  { id: 'p1', clientMessageId: null, body: 'Hi! Do you ship internationally?', from: 'visitor', agent: null, status: 'READ', createdAt: '' },
  { id: 'p2', clientMessageId: null, body: 'We do — delivery takes 5–8 business days. Anything else I can help with?', from: 'agent', agent: { name: 'Alex', avatarUrl: null }, status: 'SENT', createdAt: '' },
];

// ---------------------------------------------------------------------------
// small DOM helpers
// ---------------------------------------------------------------------------

function h<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

/** Static, trusted SVG only. */
function icon(name: string): HTMLSpanElement {
  const span = h('span');
  span.style.display = 'contents';
  span.innerHTML = ICONS[name] ?? ICONS.chat;
  return span;
}

const URL_PATTERN = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])/g;

/** Text with clickable links — built node by node, never via innerHTML. */
function appendRichText(el: HTMLElement, text: string) {
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;
    el.append(text.slice(last, index));
    const a = h('a', undefined, match[0]);
    a.href = match[0];
    a.target = '_blank';
    a.rel = 'noopener noreferrer nofollow';
    el.append(a);
    last = index + match[0].length;
  }
  el.append(text.slice(last));
}

function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#111827' : '#ffffff';
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function timeLabel(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// persistence (localStorage can throw in private modes / blocked storage)
// ---------------------------------------------------------------------------

interface Stored {
  token?: string;
  formDismissed?: boolean;
}

function load(key: string): Stored {
  try {
    return JSON.parse(localStorage.getItem(`chatwidget:${key}`) || '{}') as Stored;
  } catch {
    return {};
  }
}

function save(key: string, value: Stored) {
  try {
    localStorage.setItem(`chatwidget:${key}`, JSON.stringify(value));
  } catch {
    /* storage unavailable — the session lasts for this page only */
  }
}

// ---------------------------------------------------------------------------
// widget
// ---------------------------------------------------------------------------

class ChatWidget {
  private config: WidgetConfig | null = null;
  private readonly api: WidgetApi;
  private stored: Stored;
  private visitor: VisitorState | null = null;
  private sessionPromise: Promise<void> | null = null;
  private messages: ChatMessage[] = [];
  private isOpen = false;
  private hidden = false;
  private unread = 0;
  private view: 'chat' | 'form' = 'chat';

  private stream: EventSource | null = null;
  private streamConnected = false;
  private pollTimer: number | null = null;
  /** Server cursor for incremental history syncs. */
  private cursor: string | null = null;
  private typingTimer: number | null = null;
  private lastTypingSent = 0;
  private readTimer: number | null = null;

  // DOM
  private readonly root: HTMLDivElement;
  private readonly launcher: HTMLButtonElement;
  private readonly badge: HTMLSpanElement;
  private readonly panel: HTMLDivElement;
  private readonly avatar: HTMLDivElement;
  private readonly titleEl: HTMLDivElement;
  private readonly subtitleEl: HTMLDivElement;
  private readonly content: HTMLDivElement;
  private readonly brand: HTMLDivElement;
  /** "Powered by" product name; the serving domain sends it with the config. */
  private readonly brandName = h('strong');
  private body: HTMLDivElement | null = null;
  private typingEl: HTMLDivElement | null = null;
  private input: HTMLTextAreaElement | null = null;
  private sendButton: HTMLButtonElement | null = null;

  constructor(
    private readonly key: string,
    private readonly apiBase: string,
    private readonly preview: boolean,
  ) {
    this.api = new WidgetApi(apiBase, key);
    this.stored = preview ? {} : load(key);
    this.api.token = this.stored.token ?? null;

    const host = h('div');
    host.id = 'chat-widget';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = h('style');
    style.textContent = STYLES;
    shadow.append(style);

    this.root = h('div', 'uc right');
    this.root.style.display = 'none';

    this.panel = h('div', 'panel');
    this.panel.setAttribute('role', 'dialog');

    const header = h('div', 'header');
    this.avatar = h('div', 'avatar');
    const titles = h('div', 'titles');
    this.titleEl = h('div', 'title');
    this.subtitleEl = h('div', 'subtitle');
    titles.append(this.titleEl, this.subtitleEl);
    const close = h('button', 'close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close chat');
    close.append(icon('chevron'));
    close.addEventListener('click', () => this.close());
    header.append(this.avatar, titles, close);

    this.content = h('div');
    this.content.style.cssText = 'flex:1;display:flex;flex-direction:column;min-height:0;';
    this.brand = h('div', 'brand');
    this.brand.append('Powered by ', this.brandName);
    this.panel.append(header, this.content, this.brand);

    this.launcher = h('button', 'launcher');
    this.launcher.type = 'button';
    this.launcher.setAttribute('aria-expanded', 'false');
    this.launcher.addEventListener('click', () => this.toggle());
    this.badge = h('span', 'badge');
    this.badge.hidden = true;

    this.root.append(this.panel, this.launcher);
    shadow.append(this.root);
    (document.body || document.documentElement).append(host);

    shadow.addEventListener('keydown', (event) => {
      if ((event as KeyboardEvent).key === 'Escape' && this.isOpen) this.close();
    });
  }

  // --- lifecycle -------------------------------------------------------------

  async start() {
    if (this.preview) {
      this.startPreview();
      return;
    }

    try {
      this.applyConfig(await this.api.config());
    } catch (error) {
      console.warn('[Chat widget] unavailable:', error instanceof Error ? error.message : error);
      return;
    }

    // Returning visitors reconnect in the background so a reply that arrived
    // while they were away shows up as an unread badge.
    if (this.api.token) {
      this.ensureSession()
        .then(() => {
          if (this.visitor?.hasConversation) {
            void this.loadHistory(true);
            this.connectStream();
          }
        })
        .catch(() => undefined);
    }
  }

  private startPreview() {
    this.messages = PREVIEW_MESSAGES.map((m) => ({ ...m, createdAt: new Date().toISOString() }));
    window.addEventListener('message', (event) => {
      if (event.source !== window.parent) return;
      const data = event.data as { type?: string; config?: WidgetConfig; view?: 'chat' | 'form'; open?: boolean };
      if (data?.type !== 'chatwidget:preview' || !data.config) return;
      this.applyConfig(data.config);
      this.view = data.view ?? 'chat';
      this.visitor = { profile: { name: null, email: null, phone: null }, needsPreChat: false, hasConversation: true };
      if (data.open === false) this.close();
      else this.setOpen(true);
      this.renderContent();
    });
    window.parent?.postMessage({ type: 'chatwidget:preview-ready' }, '*');
  }

  /** Our own uploads arrive site-relative; resolve them against the domain serving the widget. */
  private assetUrl(url: string): string {
    try {
      return new URL(url, this.apiBase).href;
    } catch {
      return url;
    }
  }

  private applyConfig(config: WidgetConfig) {
    this.config = config;
    const left = config.position === 'BOTTOM_LEFT';
    this.root.classList.toggle('left', left);
    this.root.classList.toggle('right', !left);
    this.root.style.setProperty('--uc-primary', config.primaryColor);
    this.root.style.setProperty('--uc-on-primary', readableOn(config.primaryColor));
    this.root.style.setProperty('--uc-offset-x', `${config.offsetX}px`);
    this.root.style.setProperty('--uc-offset-y', `${config.offsetY}px`);
    this.root.style.display = this.hidden ? 'none' : '';

    this.panel.setAttribute('aria-label', config.title);
    this.titleEl.textContent = config.title;
    this.subtitleEl.textContent = '';
    const dot = h('span', config.isOnline ? 'dot on' : 'dot');
    this.subtitleEl.append(dot, config.isOnline ? config.subtitle || 'Online' : 'Away — we will reply soon');

    this.avatar.textContent = '';
    if (config.logoUrl) {
      const img = h('img');
      img.src = this.assetUrl(config.logoUrl);
      img.alt = '';
      this.avatar.append(img);
    } else {
      this.avatar.textContent = (config.businessName || config.title).trim().charAt(0).toUpperCase();
    }

    // Config pushed over the live stream carries no brand name; keep the last one.
    if (config.brandName) this.brandName.textContent = config.brandName;
    this.brand.style.display = config.showBranding && this.brandName.textContent ? '' : 'none';
    this.renderLauncher();
    if (this.isOpen) this.renderContent();
  }

  private renderLauncher() {
    const config = this.config;
    this.launcher.textContent = '';
    this.launcher.setAttribute('aria-label', this.isOpen ? 'Close chat' : `Open chat: ${config?.title ?? 'chat'}`);
    if (this.isOpen) {
      this.launcher.append(icon('close'));
    } else if (config?.launcherIcon === 'logo' && config.logoUrl) {
      const img = h('img');
      img.src = this.assetUrl(config.logoUrl);
      img.alt = '';
      this.launcher.append(img);
    } else {
      this.launcher.append(icon(config?.launcherIcon ?? 'chat'));
    }
    this.badge.textContent = this.unread > 9 ? '9+' : String(this.unread);
    this.badge.hidden = this.unread === 0 || this.isOpen;
    this.launcher.append(this.badge);
  }

  // --- open / close ------------------------------------------------------------

  toggle() {
    if (this.isOpen) this.close();
    else void this.open();
  }

  async open() {
    if (!this.config) return;
    this.setOpen(true);
    this.renderContent();
    if (this.preview) return;

    try {
      await this.ensureSession();
    } catch {
      this.renderNotice('Chat is unavailable right now. Please try again in a moment.');
      return;
    }

    this.view = this.shouldShowForm() ? 'form' : 'chat';
    this.renderContent();

    if (this.view === 'chat' && this.visitor?.hasConversation) {
      await this.loadHistory(false);
      this.connectStream();
      // An open chat syncs faster than a closed one.
      if (this.pollTimer) this.restartPolling();
      this.markRead();
    }
    this.input?.focus();
  }

  close() {
    this.setOpen(false);
  }

  private setOpen(open: boolean) {
    this.isOpen = open;
    this.root.classList.toggle('open', open);
    this.launcher.setAttribute('aria-expanded', String(open));
    if (open) this.unread = 0;
    this.renderLauncher();
  }

  setHidden(hidden: boolean) {
    this.hidden = hidden;
    if (this.config) this.root.style.display = hidden ? 'none' : '';
  }

  // --- session & identity ---------------------------------------------------------

  private ensureSession(): Promise<void> {
    if (this.visitor) return Promise.resolve();
    this.sessionPromise ??= this.api
      .session()
      .then((session) => {
        this.api.token = session.visitorToken;
        this.stored.token = session.visitorToken;
        save(this.key, this.stored);
        this.visitor = session;
      })
      .finally(() => {
        this.sessionPromise = null;
      });
    return this.sessionPromise;
  }

  private shouldShowForm(): boolean {
    const mode = this.config?.preChat.mode;
    if (!this.visitor || mode === 'OFF' || !mode) return false;
    if (mode === 'REQUIRED') return this.visitor.needsPreChat;
    const profile = this.visitor.profile;
    const known = profile.name || profile.email || profile.phone;
    return !known && !this.visitor.hasConversation && !this.stored.formDismissed;
  }

  async identify(input: Partial<Record<PreChatField, string>>) {
    if (this.preview) return;
    await this.ensureSession();
    this.visitor = { ...(await this.api.identify(input)), hasConversation: this.visitor?.hasConversation ?? false };
    if (this.isOpen && this.view === 'form' && !this.shouldShowForm()) {
      this.view = 'chat';
      this.renderContent();
    }
  }

  // --- rendering -------------------------------------------------------------------

  private renderNotice(text: string) {
    this.content.textContent = '';
    this.content.append(h('div', 'notice', text));
  }

  private renderContent() {
    this.content.textContent = '';
    this.body = null;
    this.input = null;
    if (this.view === 'form') this.renderForm();
    else this.renderChat();
  }

  private renderForm() {
    const config = this.config!;
    const required = config.preChat.mode === 'REQUIRED';
    const form = h('form', 'form');
    form.noValidate = true;
    form.append(
      h('h3', undefined, 'Before we start'),
      h('p', undefined, required ? 'Tell us a little about you so we can help.' : 'Let us know how to reach you — or skip and start chatting.'),
    );

    const inputs: Partial<Record<PreChatField, HTMLInputElement>> = {};
    for (const field of config.preChat.fields) {
      const meta = FIELD_LABELS[field];
      if (!meta) continue;
      const label = h('label', undefined, meta.label + (required ? '' : ' (optional)'));
      const input = h('input');
      input.type = meta.type;
      input.setAttribute('autocomplete', meta.autocomplete);
      input.name = field;
      input.maxLength = field === 'name' ? 120 : 200;
      input.value = this.visitor?.profile[field] ?? '';
      label.append(input);
      inputs[field] = input;
      form.append(label);
    }

    const error = h('div', 'error');
    const submit = h('button', 'btn', 'Start chatting');
    submit.type = 'submit';
    form.append(error, submit);

    if (!required) {
      const skip = h('button', 'btn ghost', 'Skip');
      skip.type = 'button';
      skip.addEventListener('click', () => {
        this.stored.formDismissed = true;
        save(this.key, this.stored);
        this.view = 'chat';
        this.renderContent();
        this.input?.focus();
      });
      form.append(skip);
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (this.preview) return;
      const values: Partial<Record<PreChatField, string>> = {};
      for (const [field, input] of Object.entries(inputs) as Array<[PreChatField, HTMLInputElement]>) {
        values[field] = input.value.trim();
        if (required && !values[field]) {
          error.textContent = `Please enter your ${FIELD_LABELS[field].label.toLowerCase()}.`;
          input.focus();
          return;
        }
      }
      if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        error.textContent = 'Please enter a valid email address.';
        inputs.email?.focus();
        return;
      }

      submit.disabled = true;
      error.textContent = '';
      try {
        await this.identify(values);
        this.stored.formDismissed = true;
        save(this.key, this.stored);
        this.view = 'chat';
        this.renderContent();
        this.input?.focus();
      } catch (err) {
        error.textContent = err instanceof Error ? err.message : 'Something went wrong';
      } finally {
        submit.disabled = false;
      }
    });

    this.content.append(form);
    requestAnimationFrame(() => Object.values(inputs)[0]?.focus());
  }

  private renderChat() {
    const config = this.config!;
    const body = h('div', 'body');
    body.setAttribute('aria-live', 'polite');
    this.body = body;

    this.typingEl = h('div', 'typing');
    this.typingEl.append(h('span'), h('span'), h('span'));

    const composer = h('form', 'composer');
    const input = h('textarea');
    input.rows = 1;
    input.placeholder = config.inputPlaceholder;
    input.maxLength = 2000;
    input.setAttribute('aria-label', 'Message');
    const send = h('button', 'send');
    send.type = 'submit';
    send.disabled = true;
    send.setAttribute('aria-label', 'Send message');
    send.append(icon('send'));
    composer.append(input, send);
    this.input = input;
    this.sendButton = send;

    input.addEventListener('input', () => {
      send.disabled = !input.value.trim();
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
      this.sendTyping();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        composer.requestSubmit();
      }
    });
    composer.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      input.style.height = 'auto';
      send.disabled = true;
      void this.send(text);
    });

    this.content.append(body, composer);
    this.renderMessages(true);
  }

  private renderMessages(forceScroll = false) {
    const body = this.body;
    const config = this.config;
    if (!body || !config) return;

    const nearBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 80;
    body.textContent = '';

    if (!config.isOnline && config.offlineMessage) body.append(h('div', 'notice', config.offlineMessage));
    if (config.welcomeMessage) {
      body.append(this.bubble({
        id: 'welcome', clientMessageId: null, body: config.welcomeMessage, from: 'bot',
        agent: null, status: 'SENT', createdAt: '',
      }, undefined));
    }

    let previous: ChatMessage | undefined;
    for (const message of this.messages) {
      body.append(this.bubble(message, previous));
      previous = message;
    }
    if (this.typingEl) body.append(this.typingEl);

    if (forceScroll || nearBottom) body.scrollTop = body.scrollHeight;
  }

  private bubble(message: ChatMessage, previous: ChatMessage | undefined): HTMLDivElement {
    const mine = message.from === 'visitor';
    const row = h('div', `row ${mine ? 'me' : 'them'}${message.pending ? ' pending' : ''}`);

    const sameSender =
      previous && previous.from === message.from && previous.agent?.name === message.agent?.name;
    if (!mine && !sameSender) {
      const name = message.agent?.name ?? this.config?.businessName ?? '';
      if (name) row.append(h('div', 'sender', name));
    }

    const bubble = h('div', 'bubble');
    appendRichText(bubble, message.body ?? '');
    row.append(bubble);

    if (message.failed) {
      const meta = h('div', 'meta failed', 'Not sent — tap to retry');
      meta.addEventListener('click', () => void this.retry(message));
      row.append(meta);
    } else if (mine && message.pending) {
      row.append(h('div', 'meta', 'Sending…'));
    } else if (message.createdAt) {
      const label = mine && message.status === 'READ' ? `Seen · ${timeLabel(message.createdAt)}` : timeLabel(message.createdAt);
      row.append(h('div', 'meta', label));
    }
    return row;
  }

  // --- messages --------------------------------------------------------------------

  private upsert(message: ChatMessage) {
    const byId = this.messages.findIndex((m) => m.id === message.id);
    if (byId >= 0) {
      this.messages[byId] = { ...this.messages[byId], ...message, pending: false, failed: false };
    } else {
      const local = message.clientMessageId
        ? this.messages.findIndex((m) => m.clientMessageId === message.clientMessageId)
        : -1;
      if (local >= 0) this.messages[local] = { ...message, pending: false, failed: false };
      else {
        this.messages.push(message);
        if (message.from !== 'visitor') {
          this.hideTyping();
          if (!this.isOpen) {
            this.unread += 1;
            this.renderLauncher();
          } else {
            this.markRead();
          }
        }
      }
    }
    this.renderMessages(message.from === 'visitor');
  }

  /**
   * Syncs with the server. The first call loads the conversation; later calls
   * pass the cursor and get only rows created *or changed* since — a reply
   * delivered late, or a message that became "seen". The server only returns
   * business messages that were actually delivered.
   */
  private async loadHistory(silent: boolean) {
    try {
      const since = this.cursor ?? undefined;
      const { messages: fresh, cursor } = await this.api.messages(since);
      if (!since) {
        const locals = this.messages.filter((m) => m.pending || m.failed);
        this.messages = [...fresh, ...locals];
        this.renderMessages(true);
      } else {
        for (const message of fresh) this.upsert(message);
      }
      this.cursor = cursor;
    } catch (error) {
      if (!silent && error instanceof ApiError && error.status === 401) this.resetSession();
    }
  }

  private async send(text: string) {
    const clientMessageId = uuid();
    const message: ChatMessage = {
      id: `local-${clientMessageId}`,
      clientMessageId,
      body: text,
      from: 'visitor',
      agent: null,
      status: 'QUEUED',
      createdAt: new Date().toISOString(),
      pending: true,
    };
    this.messages.push(message);
    this.renderMessages(true);
    await this.deliver(message);
  }

  private async deliver(message: ChatMessage) {
    try {
      const stored = await this.api.send(message.body ?? '', message.clientMessageId!);
      this.upsert(stored);
      if (this.visitor && !this.visitor.hasConversation) {
        this.visitor.hasConversation = true;
        this.connectStream();
      }
    } catch (error) {
      const target = this.messages.find((m) => m.clientMessageId === message.clientMessageId);
      if (target) {
        target.pending = false;
        target.failed = true;
      }
      this.renderMessages();
      if (error instanceof ApiError && error.code === 'PRE_CHAT_REQUIRED') {
        this.visitor = this.visitor ? { ...this.visitor, needsPreChat: true } : this.visitor;
        this.view = 'form';
        this.renderContent();
      } else if (error instanceof ApiError && error.status === 401) {
        this.resetSession();
      }
    }
  }

  private async retry(message: ChatMessage) {
    message.failed = false;
    message.pending = true;
    this.renderMessages();
    if (!this.visitor) await this.ensureSession().catch(() => undefined);
    await this.deliver(message);
  }

  private resetSession() {
    this.visitor = null;
    this.cursor = null;
    this.api.token = null;
    delete this.stored.token;
    save(this.key, this.stored);
    this.disconnectStream();
  }

  // --- typing & read receipts ---------------------------------------------------------

  private sendTyping() {
    const now = Date.now();
    if (this.preview || !this.visitor?.hasConversation || now - this.lastTypingSent < 3000) return;
    this.lastTypingSent = now;
    this.api.typing().catch(() => undefined);
  }

  private showTyping() {
    if (!this.typingEl) return;
    this.typingEl.classList.add('on');
    this.renderMessages();
    if (this.typingTimer) window.clearTimeout(this.typingTimer);
    this.typingTimer = window.setTimeout(() => this.hideTyping(), 6000);
  }

  private hideTyping() {
    this.typingEl?.classList.remove('on');
    if (this.typingTimer) window.clearTimeout(this.typingTimer);
    this.typingTimer = null;
  }

  private markRead() {
    if (this.preview || !this.isOpen) return;
    if (this.readTimer) window.clearTimeout(this.readTimer);
    this.readTimer = window.setTimeout(() => this.api.read().catch(() => undefined), 600);
  }

  // --- real-time ----------------------------------------------------------------------

  private connectStream() {
    if (this.preview || this.stream || !this.api.token) return;
    // Polling always runs: fast while there is no live stream, and as a slow
    // safety net while there is one.
    this.startPolling();
    if (typeof EventSource === 'undefined') return;

    const stream = new EventSource(this.api.streamUrl());
    this.stream = stream;

    stream.addEventListener('ready', () => {
      this.streamConnected = true;
      // Anything sent while we were disconnected.
      void this.loadHistory(true);
    });
    stream.addEventListener('message', (event) => {
      try {
        this.upsert(JSON.parse((event as MessageEvent).data) as ChatMessage);
      } catch {
        /* ignore malformed event */
      }
    });
    stream.addEventListener('typing', () => this.showTyping());
    stream.addEventListener('config', (event) => {
      try {
        const config = JSON.parse((event as MessageEvent).data) as WidgetConfig | null;
        if (config) this.applyConfig(config);
      } catch {
        /* ignore */
      }
    });
    stream.onerror = () => {
      const wasConnected = this.streamConnected;
      this.streamConnected = false;
      // Switch to fast polling right away rather than after the slow interval.
      if (wasConnected || !this.pollTimer) this.restartPolling();
      if (stream.readyState === EventSource.CLOSED) {
        this.stream = null;
        // The browser gave up (e.g. a proxy refused the stream); try again later.
        window.setTimeout(() => this.connectStream(), 30_000);
      }
    };
  }

  private disconnectStream() {
    this.stream?.close();
    this.stream = null;
    this.streamConnected = false;
    this.stopPolling();
  }

  /** Poll delay: fast without a live stream, a slow reconcile with one. */
  private pollDelay(): number {
    if (this.streamConnected) return this.isOpen ? 30_000 : 60_000;
    return this.isOpen ? 4_000 : 20_000;
  }

  private startPolling() {
    if (this.pollTimer || this.preview) return;
    const tick = async () => {
      if (this.api.token) await this.loadHistory(true);
      this.pollTimer = window.setTimeout(tick, this.pollDelay());
    };
    this.pollTimer = window.setTimeout(tick, this.pollDelay());
  }

  private restartPolling() {
    this.stopPolling();
    this.startPolling();
  }

  private stopPolling() {
    if (this.pollTimer) window.clearTimeout(this.pollTimer);
    this.pollTimer = null;
  }
}

// ---------------------------------------------------------------------------
// bootstrap
// ---------------------------------------------------------------------------

// currentScript is only set while the script first runs, so capture it now.
const loadingScript = document.currentScript as HTMLScriptElement | null;

function boot() {
  if (window.__chatWidgetLoaded) return;

  const script = loadingScript ?? document.querySelector<HTMLScriptElement>('script[data-widget-key]');
  const key = script?.dataset.widgetKey;
  if (!script || !key) {
    console.warn('[Chat widget] add data-widget-key="…" to the widget <script> tag');
    return;
  }
  window.__chatWidgetLoaded = true;

  const apiBase = (script.dataset.api || new URL(script.src, location.href).origin).replace(/\/$/, '');
  const widget = new ChatWidget(key, apiBase, script.dataset.preview === 'true');

  const queued = (window.ChatWidget?.q ?? []) as unknown[][];
  const api: WidgetFn = (command: Command, arg?: unknown) => {
    switch (command) {
      case 'open':
        void widget.open();
        break;
      case 'close':
        widget.close();
        break;
      case 'toggle':
        widget.toggle();
        break;
      case 'show':
        widget.setHidden(false);
        break;
      case 'hide':
        widget.setHidden(true);
        break;
      case 'identify':
        void widget.identify((arg ?? {}) as Partial<Record<PreChatField, string>>).catch(() => undefined);
        break;
      default:
        console.warn('[Chat widget] unknown command', command);
    }
  };
  window.ChatWidget = api;

  void widget.start().then(() => {
    for (const call of queued) api(...(Array.from(call) as [Command, unknown]));
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
