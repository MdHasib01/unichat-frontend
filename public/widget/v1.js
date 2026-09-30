/* Unichat website chat widget */
"use strict";(()=>{var L=Object.defineProperty;var P=(a,e,t)=>e in a?L(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var l=(a,e,t)=>P(a,typeof e!="symbol"?e+"":e,t);var v=class extends Error{constructor(t,i,n){super(t);this.status=i;this.code=n}},y=class{constructor(e,t){this.base=e;this.key=t;l(this,"token",null)}url(e){return`${this.base}/api/widget/${encodeURIComponent(this.key)}${e}`}async request(e,t,i){let n={};i!==void 0&&(n["Content-Type"]="application/json"),this.token&&(n.Authorization=`Bearer ${this.token}`);let r=await fetch(this.url(t),{method:e,headers:n,body:i===void 0?void 0:JSON.stringify(i),credentials:"omit",mode:"cors"});if(r.status===204)return;let o={};try{o=await r.json()}catch{}if(!r.ok||o.success===!1)throw new v(o.message||"Request failed",r.status,o.code||"ERROR");return o.data}config(){return this.request("GET","/config")}session(){return this.request("POST","/session",{})}identify(e){return this.request("POST","/identify",e)}messages(e){return this.request("GET",e?`/messages?since=${encodeURIComponent(e)}`:"/messages")}send(e,t){return this.request("POST","/messages",{text:e,clientMessageId:t,pageUrl:location.href.slice(0,1e3)})}typing(){return this.request("POST","/typing",{})}read(){return this.request("POST","/read",{})}streamUrl(){var e;return this.url(`/stream?token=${encodeURIComponent((e=this.token)!=null?e:"")}`)}};var C=`
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
`;var T={chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z"/></svg>',help:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.5"/><path d="M12 17.5h.01"/></svg>',message:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4Z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',chevron:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'},E={name:{label:"Name",type:"text",autocomplete:"name"},email:{label:"Email",type:"email",autocomplete:"email"},phone:{label:"Phone",type:"tel",autocomplete:"tel"}},O=[{id:"p1",clientMessageId:null,body:"Hi! Do you ship internationally?",from:"visitor",agent:null,status:"READ",createdAt:""},{id:"p2",clientMessageId:null,body:"We do \u2014 delivery takes 5\u20138 business days. Anything else I can help with?",from:"agent",agent:{name:"Alex",avatarUrl:null},status:"SENT",createdAt:""}];function s(a,e,t){let i=document.createElement(a);return e&&(i.className=e),t!==void 0&&(i.textContent=t),i}function b(a){var t;let e=s("span");return e.style.display="contents",e.innerHTML=(t=T[a])!=null?t:T.chat,e}var H=/(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])/g;function A(a,e){var i;let t=0;for(let n of e.matchAll(H)){let r=(i=n.index)!=null?i:0;a.append(e.slice(t,r));let o=s("a",void 0,n[0]);o.href=n[0],o.target="_blank",o.rel="noopener noreferrer nofollow",a.append(o),t=r+n[0].length}a.append(e.slice(t))}function R(a){let e=/^#?([0-9a-f]{6})$/i.exec(a);if(!e)return"#ffffff";let t=parseInt(e[1],16),[i,n,r]=[t>>16&255,t>>8&255,t&255].map(o=>{let p=o/255;return p<=.03928?p/12.92:((p+.055)/1.055)**2.4});return .2126*i+.7152*n+.0722*r>.45?"#111827":"#ffffff"}function D(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`}function S(a){if(!a)return"";try{return new Date(a).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}catch{return""}}function I(a){try{return new URL(a).hostname.toLowerCase()==="unichat.nuktatechnologies.com"?"Unichat":"Repliva"}catch{return"Repliva"}}function U(a){try{return JSON.parse(localStorage.getItem(`unichat:${a}`)||"{}")}catch{return{}}}function x(a,e){try{localStorage.setItem(`unichat:${a}`,JSON.stringify(e))}catch{}}var k=class{constructor(e,t,i){this.key=e;this.preview=i;l(this,"config",null);l(this,"api");l(this,"stored");l(this,"visitor",null);l(this,"sessionPromise",null);l(this,"messages",[]);l(this,"isOpen",!1);l(this,"hidden",!1);l(this,"unread",0);l(this,"view","chat");l(this,"stream",null);l(this,"streamConnected",!1);l(this,"pollTimer",null);l(this,"cursor",null);l(this,"typingTimer",null);l(this,"lastTypingSent",0);l(this,"readTimer",null);l(this,"root");l(this,"launcher");l(this,"badge");l(this,"panel");l(this,"avatar");l(this,"titleEl");l(this,"subtitleEl");l(this,"content");l(this,"brand");l(this,"body",null);l(this,"typingEl",null);l(this,"input",null);l(this,"sendButton",null);var c;this.api=new y(t,e),this.stored=i?{}:U(e),this.api.token=(c=this.stored.token)!=null?c:null;let n=s("div");n.id="unichat-widget";let r=n.attachShadow({mode:"open"}),o=s("style");o.textContent=C,r.append(o),this.root=s("div","uc right"),this.root.style.display="none",this.panel=s("div","panel"),this.panel.setAttribute("role","dialog");let p=s("div","header");this.avatar=s("div","avatar");let h=s("div","titles");this.titleEl=s("div","title"),this.subtitleEl=s("div","subtitle"),h.append(this.titleEl,this.subtitleEl);let d=s("button","close");d.type="button",d.setAttribute("aria-label","Close chat"),d.append(b("chevron")),d.addEventListener("click",()=>this.close()),p.append(this.avatar,h,d),this.content=s("div"),this.content.style.cssText="flex:1;display:flex;flex-direction:column;min-height:0;",this.brand=s("div","brand"),this.brand.append("Powered by ",s("strong",void 0,I(t))),this.panel.append(p,this.content,this.brand),this.launcher=s("button","launcher"),this.launcher.type="button",this.launcher.setAttribute("aria-expanded","false"),this.launcher.addEventListener("click",()=>this.toggle()),this.badge=s("span","badge"),this.badge.hidden=!0,this.root.append(this.panel,this.launcher),r.append(this.root),(document.body||document.documentElement).append(n),r.addEventListener("keydown",f=>{f.key==="Escape"&&this.isOpen&&this.close()})}async start(){if(this.preview){this.startPreview();return}try{this.applyConfig(await this.api.config())}catch(e){console.warn("[Unichat] chat widget unavailable:",e instanceof Error?e.message:e);return}this.api.token&&this.ensureSession().then(()=>{var e;(e=this.visitor)!=null&&e.hasConversation&&(this.loadHistory(!0),this.connectStream())}).catch(()=>{})}startPreview(){var e;this.messages=O.map(t=>({...t,createdAt:new Date().toISOString()})),window.addEventListener("message",t=>{var n;if(t.source!==window.parent)return;let i=t.data;(i==null?void 0:i.type)!=="unichat:preview"||!i.config||(this.applyConfig(i.config),this.view=(n=i.view)!=null?n:"chat",this.visitor={profile:{name:null,email:null,phone:null},needsPreChat:!1,hasConversation:!0},i.open===!1?this.close():this.setOpen(!0),this.renderContent())}),(e=window.parent)==null||e.postMessage({type:"unichat:preview-ready"},"*")}applyConfig(e){this.config=e;let t=e.position==="BOTTOM_LEFT";this.root.classList.toggle("left",t),this.root.classList.toggle("right",!t),this.root.style.setProperty("--uc-primary",e.primaryColor),this.root.style.setProperty("--uc-on-primary",R(e.primaryColor)),this.root.style.setProperty("--uc-offset-x",`${e.offsetX}px`),this.root.style.setProperty("--uc-offset-y",`${e.offsetY}px`),this.root.style.display=this.hidden?"none":"",this.panel.setAttribute("aria-label",e.title),this.titleEl.textContent=e.title,this.subtitleEl.textContent="";let i=s("span",e.isOnline?"dot on":"dot");if(this.subtitleEl.append(i,e.isOnline?e.subtitle||"Online":"Away \u2014 we will reply soon"),this.avatar.textContent="",e.logoUrl){let n=s("img");n.src=e.logoUrl,n.alt="",this.avatar.append(n)}else this.avatar.textContent=(e.businessName||e.title).trim().charAt(0).toUpperCase();this.brand.style.display=e.showBranding?"":"none",this.renderLauncher(),this.isOpen&&this.renderContent()}renderLauncher(){var t,i;let e=this.config;if(this.launcher.textContent="",this.launcher.setAttribute("aria-label",this.isOpen?"Close chat":`Open chat: ${(t=e==null?void 0:e.title)!=null?t:"chat"}`),this.isOpen)this.launcher.append(b("close"));else if((e==null?void 0:e.launcherIcon)==="logo"&&e.logoUrl){let n=s("img");n.src=e.logoUrl,n.alt="",this.launcher.append(n)}else this.launcher.append(b((i=e==null?void 0:e.launcherIcon)!=null?i:"chat"));this.badge.textContent=this.unread>9?"9+":String(this.unread),this.badge.hidden=this.unread===0||this.isOpen,this.launcher.append(this.badge)}toggle(){this.isOpen?this.close():this.open()}async open(){var e,t;if(this.config&&(this.setOpen(!0),this.renderContent(),!this.preview)){try{await this.ensureSession()}catch{this.renderNotice("Chat is unavailable right now. Please try again in a moment.");return}this.view=this.shouldShowForm()?"form":"chat",this.renderContent(),this.view==="chat"&&((e=this.visitor)!=null&&e.hasConversation)&&(await this.loadHistory(!1),this.connectStream(),this.pollTimer&&this.restartPolling(),this.markRead()),(t=this.input)==null||t.focus()}}close(){this.setOpen(!1)}setOpen(e){this.isOpen=e,this.root.classList.toggle("open",e),this.launcher.setAttribute("aria-expanded",String(e)),e&&(this.unread=0),this.renderLauncher()}setHidden(e){this.hidden=e,this.config&&(this.root.style.display=e?"none":"")}ensureSession(){var e;return this.visitor?Promise.resolve():((e=this.sessionPromise)!=null||(this.sessionPromise=this.api.session().then(t=>{this.api.token=t.visitorToken,this.stored.token=t.visitorToken,x(this.key,this.stored),this.visitor=t}).finally(()=>{this.sessionPromise=null})),this.sessionPromise)}shouldShowForm(){var n;let e=(n=this.config)==null?void 0:n.preChat.mode;if(!this.visitor||e==="OFF"||!e)return!1;if(e==="REQUIRED")return this.visitor.needsPreChat;let t=this.visitor.profile;return!(t.name||t.email||t.phone)&&!this.visitor.hasConversation&&!this.stored.formDismissed}async identify(e){var t,i;this.preview||(await this.ensureSession(),this.visitor={...await this.api.identify(e),hasConversation:(i=(t=this.visitor)==null?void 0:t.hasConversation)!=null?i:!1},this.isOpen&&this.view==="form"&&!this.shouldShowForm()&&(this.view="chat",this.renderContent()))}renderNotice(e){this.content.textContent="",this.content.append(s("div","notice",e))}renderContent(){this.content.textContent="",this.body=null,this.input=null,this.view==="form"?this.renderForm():this.renderChat()}renderForm(){var p,h;let e=this.config,t=e.preChat.mode==="REQUIRED",i=s("form","form");i.noValidate=!0,i.append(s("h3",void 0,"Before we start"),s("p",void 0,t?"Tell us a little about you so we can help.":"Let us know how to reach you \u2014 or skip and start chatting."));let n={};for(let d of e.preChat.fields){let c=E[d];if(!c)continue;let f=s("label",void 0,c.label+(t?"":" (optional)")),u=s("input");u.type=c.type,u.setAttribute("autocomplete",c.autocomplete),u.name=d,u.maxLength=d==="name"?120:200,u.value=(h=(p=this.visitor)==null?void 0:p.profile[d])!=null?h:"",f.append(u),n[d]=u,i.append(f)}let r=s("div","error"),o=s("button","btn","Start chatting");if(o.type="submit",i.append(r,o),!t){let d=s("button","btn ghost","Skip");d.type="button",d.addEventListener("click",()=>{var c;this.stored.formDismissed=!0,x(this.key,this.stored),this.view="chat",this.renderContent(),(c=this.input)==null||c.focus()}),i.append(d)}i.addEventListener("submit",async d=>{var f,u;if(d.preventDefault(),this.preview)return;let c={};for(let[m,g]of Object.entries(n))if(c[m]=g.value.trim(),t&&!c[m]){r.textContent=`Please enter your ${E[m].label.toLowerCase()}.`,g.focus();return}if(c.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)){r.textContent="Please enter a valid email address.",(f=n.email)==null||f.focus();return}o.disabled=!0,r.textContent="";try{await this.identify(c),this.stored.formDismissed=!0,x(this.key,this.stored),this.view="chat",this.renderContent(),(u=this.input)==null||u.focus()}catch(m){r.textContent=m instanceof Error?m.message:"Something went wrong"}finally{o.disabled=!1}}),this.content.append(i),requestAnimationFrame(()=>{var d;return(d=Object.values(n)[0])==null?void 0:d.focus()})}renderChat(){let e=this.config,t=s("div","body");t.setAttribute("aria-live","polite"),this.body=t,this.typingEl=s("div","typing"),this.typingEl.append(s("span"),s("span"),s("span"));let i=s("form","composer"),n=s("textarea");n.rows=1,n.placeholder=e.inputPlaceholder,n.maxLength=2e3,n.setAttribute("aria-label","Message");let r=s("button","send");r.type="submit",r.disabled=!0,r.setAttribute("aria-label","Send message"),r.append(b("send")),i.append(n,r),this.input=n,this.sendButton=r,n.addEventListener("input",()=>{r.disabled=!n.value.trim(),n.style.height="auto",n.style.height=`${Math.min(n.scrollHeight,120)}px`,this.sendTyping()}),n.addEventListener("keydown",o=>{o.key==="Enter"&&!o.shiftKey&&!o.isComposing&&(o.preventDefault(),i.requestSubmit())}),i.addEventListener("submit",o=>{o.preventDefault();let p=n.value.trim();p&&(n.value="",n.style.height="auto",r.disabled=!0,this.send(p))}),this.content.append(t,i),this.renderMessages(!0)}renderMessages(e=!1){let t=this.body,i=this.config;if(!t||!i)return;let n=t.scrollHeight-t.scrollTop-t.clientHeight<80;t.textContent="",!i.isOnline&&i.offlineMessage&&t.append(s("div","notice",i.offlineMessage)),i.welcomeMessage&&t.append(this.bubble({id:"welcome",clientMessageId:null,body:i.welcomeMessage,from:"bot",agent:null,status:"SENT",createdAt:""},void 0));let r;for(let o of this.messages)t.append(this.bubble(o,r)),r=o;this.typingEl&&t.append(this.typingEl),(e||n)&&(t.scrollTop=t.scrollHeight)}bubble(e,t){var p,h,d,c,f,u,m;let i=e.from==="visitor",n=s("div",`row ${i?"me":"them"}${e.pending?" pending":""}`),r=t&&t.from===e.from&&((p=t.agent)==null?void 0:p.name)===((h=e.agent)==null?void 0:h.name);if(!i&&!r){let g=(u=(f=(d=e.agent)==null?void 0:d.name)!=null?f:(c=this.config)==null?void 0:c.businessName)!=null?u:"";g&&n.append(s("div","sender",g))}let o=s("div","bubble");if(A(o,(m=e.body)!=null?m:""),n.append(o),e.failed){let g=s("div","meta failed","Not sent \u2014 tap to retry");g.addEventListener("click",()=>void this.retry(e)),n.append(g)}else if(i&&e.pending)n.append(s("div","meta","Sending\u2026"));else if(e.createdAt){let g=i&&e.status==="READ"?`Seen \xB7 ${S(e.createdAt)}`:S(e.createdAt);n.append(s("div","meta",g))}return n}upsert(e){let t=this.messages.findIndex(i=>i.id===e.id);if(t>=0)this.messages[t]={...this.messages[t],...e,pending:!1,failed:!1};else{let i=e.clientMessageId?this.messages.findIndex(n=>n.clientMessageId===e.clientMessageId):-1;i>=0?this.messages[i]={...e,pending:!1,failed:!1}:(this.messages.push(e),e.from!=="visitor"&&(this.hideTyping(),this.isOpen?this.markRead():(this.unread+=1,this.renderLauncher())))}this.renderMessages(e.from==="visitor")}async loadHistory(e){var t;try{let i=(t=this.cursor)!=null?t:void 0,{messages:n,cursor:r}=await this.api.messages(i);if(i)for(let o of n)this.upsert(o);else{let o=this.messages.filter(p=>p.pending||p.failed);this.messages=[...n,...o],this.renderMessages(!0)}this.cursor=r}catch(i){!e&&i instanceof v&&i.status===401&&this.resetSession()}}async send(e){let t=D(),i={id:`local-${t}`,clientMessageId:t,body:e,from:"visitor",agent:null,status:"QUEUED",createdAt:new Date().toISOString(),pending:!0};this.messages.push(i),this.renderMessages(!0),await this.deliver(i)}async deliver(e){var t;try{let i=await this.api.send((t=e.body)!=null?t:"",e.clientMessageId);this.upsert(i),this.visitor&&!this.visitor.hasConversation&&(this.visitor.hasConversation=!0,this.connectStream())}catch(i){let n=this.messages.find(r=>r.clientMessageId===e.clientMessageId);n&&(n.pending=!1,n.failed=!0),this.renderMessages(),i instanceof v&&i.code==="PRE_CHAT_REQUIRED"?(this.visitor=this.visitor?{...this.visitor,needsPreChat:!0}:this.visitor,this.view="form",this.renderContent()):i instanceof v&&i.status===401&&this.resetSession()}}async retry(e){e.failed=!1,e.pending=!0,this.renderMessages(),this.visitor||await this.ensureSession().catch(()=>{}),await this.deliver(e)}resetSession(){this.visitor=null,this.cursor=null,this.api.token=null,delete this.stored.token,x(this.key,this.stored),this.disconnectStream()}sendTyping(){var t;let e=Date.now();this.preview||!((t=this.visitor)!=null&&t.hasConversation)||e-this.lastTypingSent<3e3||(this.lastTypingSent=e,this.api.typing().catch(()=>{}))}showTyping(){this.typingEl&&(this.typingEl.classList.add("on"),this.renderMessages(),this.typingTimer&&window.clearTimeout(this.typingTimer),this.typingTimer=window.setTimeout(()=>this.hideTyping(),6e3))}hideTyping(){var e;(e=this.typingEl)==null||e.classList.remove("on"),this.typingTimer&&window.clearTimeout(this.typingTimer),this.typingTimer=null}markRead(){this.preview||!this.isOpen||(this.readTimer&&window.clearTimeout(this.readTimer),this.readTimer=window.setTimeout(()=>this.api.read().catch(()=>{}),600))}connectStream(){if(this.preview||this.stream||!this.api.token||(this.startPolling(),typeof EventSource=="undefined"))return;let e=new EventSource(this.api.streamUrl());this.stream=e,e.addEventListener("ready",()=>{this.streamConnected=!0,this.loadHistory(!0)}),e.addEventListener("message",t=>{try{this.upsert(JSON.parse(t.data))}catch{}}),e.addEventListener("typing",()=>this.showTyping()),e.addEventListener("config",t=>{try{let i=JSON.parse(t.data);i&&this.applyConfig(i)}catch{}}),e.onerror=()=>{let t=this.streamConnected;this.streamConnected=!1,(t||!this.pollTimer)&&this.restartPolling(),e.readyState===EventSource.CLOSED&&(this.stream=null,window.setTimeout(()=>this.connectStream(),3e4))}}disconnectStream(){var e;(e=this.stream)==null||e.close(),this.stream=null,this.streamConnected=!1,this.stopPolling()}pollDelay(){return this.streamConnected?this.isOpen?3e4:6e4:this.isOpen?4e3:2e4}startPolling(){if(this.pollTimer||this.preview)return;let e=async()=>{this.api.token&&await this.loadHistory(!0),this.pollTimer=window.setTimeout(e,this.pollDelay())};this.pollTimer=window.setTimeout(e,this.pollDelay())}restartPolling(){this.stopPolling(),this.startPolling()}stopPolling(){this.pollTimer&&window.clearTimeout(this.pollTimer),this.pollTimer=null}},w=document.currentScript;function M(){var o,p;if(window.__unichatWidget)return;let a=w!=null?w:document.querySelector("script[data-unichat-key]"),e=a==null?void 0:a.dataset.unichatKey;if(!a||!e){console.warn('[Unichat] add data-unichat-key="\u2026" to the widget <script> tag');return}window.__unichatWidget=!0;let t=(a.dataset.api||new URL(a.src,location.href).origin).replace(/\/$/,""),i=new k(e,t,a.dataset.preview==="true"),n=(p=(o=window.Unichat)==null?void 0:o.q)!=null?p:[],r=(h,d)=>{switch(h){case"open":i.open();break;case"close":i.close();break;case"toggle":i.toggle();break;case"show":i.setHidden(!1);break;case"hide":i.setHidden(!0);break;case"identify":i.identify(d!=null?d:{}).catch(()=>{});break;default:console.warn("[Unichat] unknown command",h)}};window.Unichat=r,i.start().then(()=>{for(let h of n)r(...Array.from(h))})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",M):M();})();
