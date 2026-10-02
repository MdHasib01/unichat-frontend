'use client';

import * as React from 'react';
import type { ChatWidget } from '@/types';
import { useBrand } from '@/components/brand-provider';

export type PreviewDraft = Pick<
  ChatWidget,
  | 'position'
  | 'offsetX'
  | 'offsetY'
  | 'primaryColor'
  | 'logoUrl'
  | 'launcherIcon'
  | 'title'
  | 'subtitle'
  | 'welcomeMessage'
  | 'inputPlaceholder'
  | 'offlineMessage'
  | 'showBranding'
  | 'preChatMode'
  | 'preChatFields'
>;

/**
 * Renders the real widget script (in preview mode — no network calls) inside
 * a sandboxed iframe, and streams unsaved settings into it. What you see here
 * is exactly what visitors will see.
 */
export function WidgetPreview({
  draft,
  businessName,
  view,
  online,
  open,
}: {
  draft: PreviewDraft;
  businessName: string;
  view: 'chat' | 'form';
  online: boolean;
  open: boolean;
}) {
  const frame = React.useRef<HTMLIFrameElement>(null);
  const brandName = useBrand().name;
  const [ready, setReady] = React.useState(false);

  const srcDoc = React.useMemo(() => {
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;font-family:system-ui,sans-serif;background:#f1f5f9;height:100vh;overflow:hidden}
  .bar{height:48px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:10px;padding:0 20px}
  .dot{width:10px;height:10px;border-radius:50%;background:#cbd5e1}
  .line{height:12px;border-radius:6px;background:#e2e8f0;margin:14px 24px}
  .hero{height:120px;border-radius:12px;background:#e2e8f0;margin:24px}
</style></head><body>
<div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
<div class="hero"></div><div class="line" style="width:60%"></div><div class="line" style="width:80%"></div><div class="line" style="width:40%"></div>
<script src="${origin}/widget/v1.js" data-widget-key="preview" data-preview="true"></script>
</body></html>`;
  }, []);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow && event.data?.type === 'chatwidget:preview-ready') {
        setReady(true);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    frame.current?.contentWindow?.postMessage(
      {
        type: 'chatwidget:preview',
        view,
        open,
        config: {
          key: 'preview',
          ...draft,
          businessName,
          brandName,
          isOnline: online,
          preChat: { mode: draft.preChatMode, fields: draft.preChatFields },
        },
      },
      '*',
    );
  }, [ready, draft, businessName, brandName, view, online, open]);

  return (
    <iframe
      ref={frame}
      title="Website chat preview"
      srcDoc={srcDoc}
      // Scripts only: the preview can't touch this page, its cookies or storage.
      sandbox="allow-scripts"
      className="h-[640px] w-full rounded-xl border border-border bg-muted"
    />
  );
}
