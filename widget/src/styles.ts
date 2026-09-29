/**
 * Widget styles. Everything lives inside a Shadow DOM, so these rules cannot
 * leak into the host page and the host page's CSS cannot reach in.
 */
export const STYLES = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }

.uc {
  --uc-primary: #4f46e5;
  --uc-on-primary: #ffffff;
  --uc-bg: #ffffff;
  --uc-surface: #f4f4f6;
  --uc-text: #18181b;
  --uc-muted: #6b7280;
  --uc-border: #e4e4e7;
  --uc-radius: 16px;
  position: fixed;
  z-index: 2147483000;
  bottom: var(--uc-offset-y, 20px);
  font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--uc-text);
  -webkit-font-smoothing: antialiased;
}
.uc.right { right: var(--uc-offset-x, 20px); }
.uc.left { left: var(--uc-offset-x, 20px); }

@media (prefers-color-scheme: dark) {
  .uc {
    --uc-bg: #18181b;
    --uc-surface: #27272a;
    --uc-text: #f4f4f5;
    --uc-muted: #a1a1aa;
    --uc-border: #3f3f46;
  }
}

.launcher {
  width: 60px; height: 60px; border-radius: 50%;
  border: 0; cursor: pointer; padding: 0;
  background: var(--uc-primary); color: var(--uc-on-primary);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.12);
  transition: transform .18s ease, box-shadow .18s ease;
  position: relative; overflow: visible;
}
.launcher:hover { transform: translateY(-2px) scale(1.03); }
.launcher:focus-visible { outline: 3px solid color-mix(in srgb, var(--uc-primary) 40%, transparent); outline-offset: 3px; }
.launcher svg { width: 28px; height: 28px; }
.launcher img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.badge {
  position: absolute; top: -2px; right: -2px; min-width: 20px; height: 20px; padding: 0 6px;
  border-radius: 10px; background: #ef4444; color: #fff; font-size: 12px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; border: 2px solid var(--uc-bg);
}
.badge[hidden] { display: none; }

.panel {
  position: absolute; bottom: 76px;
  width: 370px; height: min(600px, calc(100vh - 110px));
  background: var(--uc-bg); border-radius: var(--uc-radius);
  box-shadow: 0 16px 48px rgba(0,0,0,.2), 0 2px 8px rgba(0,0,0,.08);
  display: flex; flex-direction: column; overflow: hidden;
  opacity: 0; transform: translateY(12px) scale(.98); pointer-events: none;
  transition: opacity .18s ease, transform .18s ease;
}
.uc.right .panel { right: 0; transform-origin: bottom right; }
.uc.left .panel { left: 0; transform-origin: bottom left; }
.uc.open .panel { opacity: 1; transform: none; pointer-events: auto; }

.header {
  background: var(--uc-primary); color: var(--uc-on-primary);
  padding: 16px; display: flex; align-items: center; gap: 12px; flex-shrink: 0;
}
.avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 16px; overflow: hidden;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.titles { flex: 1; min-width: 0; }
.title { font-weight: 600; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.subtitle { font-size: 12.5px; opacity: .85; display: flex; align-items: center; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #9ca3af; flex-shrink: 0; }
.dot.on { background: #22c55e; }
.close {
  background: transparent; border: 0; color: inherit; cursor: pointer;
  width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
}
.close:hover { background: rgba(255,255,255,.15); }
.close svg { width: 20px; height: 20px; }

.body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 6px; background: var(--uc-bg); }
.notice { font-size: 12.5px; color: var(--uc-muted); text-align: center; padding: 4px 8px 8px; }

.row { display: flex; flex-direction: column; max-width: 82%; }
.row.me { align-self: flex-end; align-items: flex-end; }
.row.them { align-self: flex-start; align-items: flex-start; }
.sender { font-size: 11.5px; color: var(--uc-muted); margin: 6px 4px 2px; }
.bubble {
  padding: 9px 13px; border-radius: 18px; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: anywhere;
}
.me .bubble { background: var(--uc-primary); color: var(--uc-on-primary); border-bottom-right-radius: 6px; }
.them .bubble { background: var(--uc-surface); color: var(--uc-text); border-bottom-left-radius: 6px; }
.bubble a { color: inherit; text-decoration: underline; }
.meta { font-size: 11px; color: var(--uc-muted); margin: 2px 6px 0; }
.meta.failed { color: #ef4444; cursor: pointer; }
.pending .bubble { opacity: .7; }

.typing { align-self: flex-start; background: var(--uc-surface); border-radius: 18px; padding: 12px 14px; display: none; gap: 4px; }
.typing.on { display: inline-flex; }
.typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--uc-muted); animation: uc-bounce 1.2s infinite; }
.typing span:nth-child(2) { animation-delay: .15s; }
.typing span:nth-child(3) { animation-delay: .3s; }
@keyframes uc-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: .5 } 30% { transform: translateY(-4px); opacity: 1 } }

.composer { border-top: 1px solid var(--uc-border); padding: 10px; display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0; background: var(--uc-bg); }
.composer textarea {
  flex: 1; resize: none; border: 1px solid var(--uc-border); border-radius: 12px; padding: 9px 12px;
  font: inherit; color: var(--uc-text); background: var(--uc-bg); max-height: 120px; min-height: 40px; outline: none;
}
.composer textarea:focus { border-color: var(--uc-primary); }
.send {
  width: 40px; height: 40px; border-radius: 12px; border: 0; cursor: pointer; flex-shrink: 0;
  background: var(--uc-primary); color: var(--uc-on-primary); display: flex; align-items: center; justify-content: center;
}
.send:disabled { opacity: .45; cursor: default; }
.send svg { width: 18px; height: 18px; }

.form { padding: 20px 16px; display: flex; flex-direction: column; gap: 12px; }
.form h3 { margin: 0; font-size: 15px; }
.form p { margin: 0; color: var(--uc-muted); font-size: 13px; }
.form label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; font-weight: 500; }
.form input {
  border: 1px solid var(--uc-border); border-radius: 10px; padding: 9px 12px; font: inherit;
  color: var(--uc-text); background: var(--uc-bg); outline: none;
}
.form input:focus { border-color: var(--uc-primary); }
.form .error { color: #ef4444; font-size: 12.5px; min-height: 1em; }
.btn {
  border: 0; border-radius: 10px; padding: 10px 14px; font: inherit; font-weight: 600; cursor: pointer;
  background: var(--uc-primary); color: var(--uc-on-primary);
}
.btn.ghost { background: transparent; color: var(--uc-muted); font-weight: 500; }
.btn:disabled { opacity: .6; cursor: default; }

.brand { text-align: center; font-size: 11px; color: var(--uc-muted); padding: 0 0 8px; background: var(--uc-bg); }
.brand a { color: inherit; text-decoration: none; font-weight: 600; }

@media (max-width: 480px) {
  .uc.open { inset: 0; }
  .uc.open .launcher { display: none; }
  .uc.open .panel { position: fixed; inset: 0; width: 100%; height: 100%; border-radius: 0; bottom: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .panel, .launcher { transition: none; }
  .typing span { animation: none; }
}
`;
