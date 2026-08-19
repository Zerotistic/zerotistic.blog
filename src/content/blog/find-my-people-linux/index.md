---
title: "Reverse-engineering Find My People to stalk ~~my ex~~ a friend, cause I can"
description: "How I registered a Linux machine with Apple's private services, received an existing Find My People key over IDS, and decrypted the live location without a Mac."
date: 2026-08-19
authors:
  - zerotistic
tags:
  - reverse-engineering
  - apple
  - protocols
facts:
  category: "protocol reverse engineering"
  target: "Apple Find My People / IDS"
  tools: [Python, FindMy.py, pypush, cryptography, decompilation]
---

As it can often be, I was bored. I wanted to look into a complex system, and had no idea which. Me and a friend have been sharing our locations to each other's through Apple's "Find My". I asked if he was okay with me piping it into some dumb automations. He said yes, so the plan was to draw a few geofences around places he goes and make Discord announce whenever he arrived or left.

*totally accurate and not made up dms (thanks [es3n1n](https://blog.es3n1n.eu/) for the UI inspiration)*
<section class="discord-consent" data-consent-chat aria-label="Recreated Discord direct-message conversation about consent">
  <header class="discord-consent__header">
    <div class="discord-consent__channel">
      <span class="discord-consent__at" aria-hidden="true">@</span>
      <strong>Lymdun</strong>
      <span class="discord-consent__presence" title="Online"><span aria-hidden="true"></span>Online</span>
    </div>
    <div class="discord-consent__header-actions" aria-label="Conversation actions">
      <button type="button" data-action="header" data-tooltip="Start Voice Call" data-message="Voice calls aren't wired up here." aria-label="Start Voice Call">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 16.4c-1.2 0-2.4-.2-3.5-.6a1 1 0 0 0-1 .2l-2.2 1.7a15.7 15.7 0 0 1-7.5-7.5L8 8a1 1 0 0 0 .2-1c-.4-1.1-.6-2.3-.6-3.5a1 1 0 0 0-1-1H3.5a1 1 0 0 0-1 1A18 18 0 0 0 20.5 21a1 1 0 0 0 1-1v-2.6a1 1 0 0 0-1-1Z"/></svg>
      </button>
      <button type="button" data-action="header" data-tooltip="Start Video Call" data-message="Video calls aren't wired up here." aria-label="Start Video Call">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h11a2 2 0 0 1 2 2v2.2l3.2-2a.5.5 0 0 1 .8.4v8.8a.5.5 0 0 1-.8.4l-3.2-2V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>
      </button>
      <button type="button" data-action="header" data-tooltip="Pinned Messages" data-message="No pinned messages. Just vibes." aria-label="Pinned Messages">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.8 3 6.2 6.2-2 2-1.2-1.3-3.6 4.7.7 2.3-1.5 1.5-3.3-3.3L5 20.2 3.8 19l5.1-5.1-3.3-3.3 1.5-1.5 2.3.7 4.7-3.6L12.8 5l2-2Z"/></svg>
      </button>
      <button type="button" data-action="header" data-tooltip="Add Friends to DM" data-message="Absolutely not. This DM is already crowded enough." aria-label="Add Friends to DM">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 4.5V20h10.2a5.5 5.5 0 0 1-.2-1.5c0-2.1 1.2-4 3-4.9A12.7 12.7 0 0 0 9 13Zm10-1h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3Z"/></svg>
      </button>
    </div>
  </header>
  <div class="discord-consent__messages" role="log" aria-label="Consent conversation">
    <article class="discord-message" tabindex="0" data-author="zerotistic">
      <img class="discord-avatar discord-avatar--zerotistic" src="/static/find-my-people-linux/zerotistic-avatar.webp" alt="zerotistic" width="40" height="40">
      <div class="discord-message__body">
        <div class="discord-message__meta">
          <strong class="discord-message__author discord-message__author--zerotistic">zerotistic</strong>
          <time datetime="2026-08-17T18:42:00">Today at 18:42</time>
        </div>
        <p>yo dumb question: are you okay with me using the Find My location you're sharing with me in a little Linux automation thing?</p>
        <p>mostly geofences and Discord messages when you arrive or leave places</p>
      </div>
      <div class="discord-message__actions" aria-label="Message actions">
        <button type="button" data-action="react" data-tooltip="Add reaction" aria-label="Add reaction" aria-pressed="false">☺</button>
        <button type="button" data-action="reply" data-tooltip="Reply" aria-label="Reply to zerotistic">↩</button>
        <button type="button" data-action="more" data-tooltip="More" aria-label="More options">•••</button>
      </div>
    </article>
    <article class="discord-message" tabindex="0" data-author="Lymdun">
      <img class="discord-avatar discord-avatar--lymdun" src="/static/find-my-people-linux/lymdun-avatar.webp" alt="Lymdun" width="40" height="40">
      <div class="discord-message__body">
        <div class="discord-message__meta">
          <button class="discord-message__author discord-profile-trigger" type="button" data-action="profile" aria-expanded="false">Lymdun</button>
          <time datetime="2026-08-17T18:43:00">Today at 18:43</time>
        </div>
        <aside class="discord-profile-popout" data-profile-popover hidden>
          <div class="discord-profile-popout__banner"></div>
          <img class="discord-profile-popout__avatar" src="/static/find-my-people-linux/lymdun-avatar.webp" alt="" width="64" height="64">
          <div class="discord-profile-popout__body">
            <strong>Lymdun</strong>
            <span>lymdun</span>
            <div class="discord-profile-popout__status"><small>ABOUT ME</small><p>the goat 🐐</p></div>
          </div>
        </aside>
        <div class="discord-message__reply-preview"><span aria-hidden="true">↳</span><strong>zerotistic</strong><span>are you okay with me using…</span></div>
        <p>yeah lmao go for it</p>
        <p>just don't publish where I live obviously 💀</p>
        <button class="discord-reaction" type="button" data-action="reaction-pill" aria-pressed="false"><span aria-hidden="true">👍</span><span data-reaction-count>1</span></button>
      </div>
      <div class="discord-message__actions" aria-label="Message actions">
        <button type="button" data-action="react" data-tooltip="Add reaction" aria-label="Add reaction" aria-pressed="false">☺</button>
        <button type="button" data-action="reply" data-tooltip="Reply" aria-label="Reply to Lymdun">↩</button>
        <button type="button" data-action="more" data-tooltip="More" aria-label="More options">•••</button>
      </div>
    </article>
    <article class="discord-message discord-message--compact" tabindex="0" data-author="zerotistic">
      <time class="discord-message__gutter" datetime="2026-08-17T18:43:20">18:43</time>
      <div class="discord-message__body">
        <p>deal 🤝</p>
      </div>
      <div class="discord-message__actions" aria-label="Message actions">
        <button type="button" data-action="react" data-tooltip="Add reaction" aria-label="Add reaction" aria-pressed="false">☺</button>
        <button type="button" data-action="reply" data-tooltip="Reply" aria-label="Reply to zerotistic">↩</button>
        <button type="button" data-action="more" data-tooltip="More" aria-label="More options">•••</button>
      </div>
    </article>
  </div>
  <div class="discord-consent__composer-shell">
    <div class="discord-consent__replying" data-replying hidden>Replying to <strong data-reply-author></strong><button type="button" data-action="cancel-reply" aria-label="Cancel reply">×</button></div>
    <div class="discord-consent__composer">
      <button type="button" aria-label="Add attachment" data-tooltip="Add attachment">+</button>
      <div class="discord-consent__input" contenteditable="true" role="textbox" aria-label="Fake message input" data-placeholder="Message @Lymdun"></div>
      <span aria-hidden="true">☺</span>
    </div>
  </div>
  <div class="discord-consent__toast" role="status" aria-live="polite" hidden>Nothing to see here.</div>
</section>

<style>
.discord-consent{--dc-bg:#313338;--dc-bg-deep:#2b2d31;--dc-hover:#2e3035;--dc-input:#383a40;--dc-text:#dbdee1;--dc-muted:#949ba4;--dc-faint:#6d6f78;--dc-blurple:#5865f2;position:relative;margin:1.5rem 0 1.75rem;overflow:visible;border:1px solid #1e1f22;border-radius:10px;background:var(--dc-bg);box-shadow:0 16px 42px rgb(0 0 0/.2);color:var(--dc-text);font-family:Arial,"Helvetica Neue",sans-serif;font-size:16px;line-height:1.375;text-wrap:wrap}
.discord-consent *{box-sizing:border-box;letter-spacing:normal}
.discord-consent__header{display:flex;min-height:48px;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid rgb(0 0 0/.3);background:var(--dc-bg);box-shadow:0 1px 0 rgb(0 0 0/.2)}
.discord-consent__channel{display:flex;align-items:center;gap:8px}.discord-consent__channel strong{font-size:15px;color:#f2f3f5}.discord-consent__at{font-size:25px;font-weight:400;color:#80848e}
.discord-consent__presence{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--dc-muted)}.discord-consent__presence>span{width:7px;height:7px;border-radius:50%;background:#23a55a}
.discord-consent__header-actions{display:flex;align-items:center;gap:12px}.discord-consent__header-actions button{position:relative;display:grid;width:22px;height:30px;padding:0;place-items:center;border:0;background:transparent;color:#b5bac1;cursor:pointer}.discord-consent__header-actions button:hover,.discord-consent__header-actions button:focus-visible{color:#f2f3f5;outline:none}.discord-consent__header-actions svg{display:block;width:21px;height:21px;fill:currentColor}
.discord-consent__header-actions button::after{content:attr(data-tooltip);position:absolute;z-index:20;top:calc(100% + 7px);left:50%;padding:5px 7px;border-radius:4px;background:#111214;color:#fff;font-size:10px;font-weight:600;white-space:nowrap;opacity:0;transform:translate(-50%,-3px);pointer-events:none;transition:.12s}.discord-consent__header-actions button:last-child::after{right:0;left:auto;transform:translateY(-3px)}.discord-consent__header-actions button:hover::after,.discord-consent__header-actions button:focus-visible::after{opacity:1;transform:translate(-50%,0)}.discord-consent__header-actions button:last-child:hover::after,.discord-consent__header-actions button:last-child:focus-visible::after{transform:none}
.discord-consent__messages{padding:14px 0 5px}
.discord-message{position:relative;display:grid;grid-template-columns:56px minmax(0,1fr);min-height:44px;padding:3px 48px 3px 16px;outline:none;transition:background .12s ease}
.discord-message:hover,.discord-message:focus-within{background:var(--dc-hover)}
.discord-message+.discord-message{margin-top:13px}.discord-message--compact{margin-top:1px!important;min-height:26px;padding-block:1px}.discord-message--compact .discord-message__body{grid-column:2}.discord-message--compact .discord-message__gutter{display:block}
.discord-avatar{grid-column:1;grid-row:1;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:15px;font-weight:700;color:white;user-select:none}.discord-avatar--zerotistic,.discord-avatar--lymdun{display:block;object-fit:cover;background:#1e1f22}
.discord-message__body{position:relative;grid-column:2;grid-row:1;min-width:0}.discord-message__meta{display:flex;align-items:baseline;gap:8px;height:22px}.discord-message__meta>time{font-size:11px;color:var(--dc-muted)}.discord-message__author{padding:0;border:0;background:transparent;color:#f2f3f5;font:700 15px Arial,sans-serif;text-align:left}.discord-profile-trigger{cursor:pointer}.discord-profile-trigger:hover,.discord-profile-trigger:focus-visible{text-decoration:underline;outline:none}
.discord-profile-popout{position:absolute;z-index:15;top:24px;left:0;width:240px;overflow:hidden;border:1px solid #111214;border-radius:8px;background:#111214;box-shadow:0 12px 32px rgb(0 0 0/.5);color:#f2f3f5}.discord-profile-popout[hidden]{display:none}.discord-profile-popout__banner{height:58px;background:linear-gradient(135deg,#5865f2,#9b59b6)}.discord-profile-popout__avatar{position:absolute;top:25px;left:15px;width:64px;height:64px;border:5px solid #111214;border-radius:50%;object-fit:cover;background:#111214}.discord-profile-popout__body{padding:38px 15px 15px}.discord-profile-popout__body>strong{display:block;font-size:18px;line-height:1.2}.discord-profile-popout__body>span{display:block;margin-top:1px;color:#b5bac1;font-size:12px}.discord-profile-popout__status{margin-top:13px;padding-top:11px;border-top:1px solid #2b2d31}.discord-profile-popout__status small{display:block;color:#b5bac1;font-size:10px;font-weight:700}.discord-profile-popout__status p{margin-top:4px!important;font-size:13px!important}
.discord-message p{margin:0!important;color:var(--dc-text)!important;font-size:15px;line-height:1.375}.discord-message p+p{margin-top:2px!important}
.discord-message__gutter{position:absolute;left:4px;top:5px;width:48px;text-align:right;font-size:9px;color:var(--dc-faint);opacity:0;transition:opacity .12s}.discord-message:hover .discord-message__gutter,.discord-message:focus-within .discord-message__gutter{opacity:1}
.discord-message__reply-preview{display:flex;align-items:center;gap:6px;margin:-4px 0 2px;color:var(--dc-muted);font-size:11px;white-space:nowrap;overflow:hidden}.discord-message__reply-preview strong{color:#b5bac1}.discord-message__reply-preview span:last-child{overflow:hidden;text-overflow:ellipsis}
.discord-message__actions{position:absolute;z-index:3;top:-17px;right:14px;display:flex;padding:2px;border:1px solid #1e1f22;border-radius:5px;background:var(--dc-bg-deep);box-shadow:0 4px 8px rgb(0 0 0/.25);opacity:0;transform:translateY(3px);pointer-events:none;transition:opacity .12s,transform .12s}
.discord-message:hover .discord-message__actions,.discord-message:focus-within .discord-message__actions{opacity:1;transform:none;pointer-events:auto}
.discord-message__actions button,.discord-consent__composer button{position:relative;display:grid;place-items:center;width:30px;height:28px;padding:0;border:0;border-radius:3px;background:transparent;color:#b5bac1;font:600 14px Arial,sans-serif;cursor:pointer}.discord-message__actions button:hover,.discord-message__actions button:focus-visible,.discord-consent__composer button:hover{background:#3f4147;color:#f2f3f5;outline:none}
.discord-message__actions button[data-tooltip]::after,.discord-consent__composer button[data-tooltip]::after{content:attr(data-tooltip);position:absolute;z-index:5;left:50%;bottom:calc(100% + 7px);padding:5px 7px;border-radius:4px;background:#111214;color:white;font-size:10px;font-weight:600;white-space:nowrap;opacity:0;transform:translate(-50%,3px);pointer-events:none;transition:.12s}.discord-message__actions button[data-tooltip]:hover::after,.discord-message__actions button[data-tooltip]:focus-visible::after,.discord-consent__composer button[data-tooltip]:hover::after{opacity:1;transform:translate(-50%,0)}
.discord-reaction{display:flex;align-items:center;gap:5px;margin-top:5px;padding:3px 7px;border:1px solid transparent;border-radius:8px;background:#2b2d31;color:#b5bac1;font:600 12px Arial,sans-serif;cursor:pointer}.discord-reaction:hover{border-color:#5865f2}.discord-reaction[aria-pressed="true"]{border-color:#5865f2;background:rgb(88 101 242/.15);color:#c9cdfb}
.discord-consent__composer-shell{margin:12px 16px 16px}.discord-consent__replying{position:relative;padding:8px 38px 7px 14px;border-radius:8px 8px 0 0;background:#2b2d31;color:var(--dc-muted);font-size:11px}.discord-consent__replying strong{color:var(--dc-text)}.discord-consent__replying button{position:absolute;right:10px;top:4px;border:0;background:transparent;color:var(--dc-muted);font-size:18px;cursor:pointer}
.discord-consent__composer{display:flex;align-items:center;min-height:44px;padding:0 8px;border-radius:8px;background:var(--dc-input)}.discord-consent__replying:not([hidden])+.discord-consent__composer{border-radius:0 0 8px 8px}.discord-consent__input{flex:1;min-width:0;max-height:110px;overflow:auto;padding:11px 7px;color:var(--dc-text);font-size:14px;outline:none}.discord-consent__input:empty::before{content:attr(data-placeholder);color:#6d6f78;pointer-events:none}.discord-consent__composer>span{padding:0 7px;color:#b5bac1}
.discord-consent__toast{position:absolute;right:14px;bottom:72px;max-width:280px;padding:8px 10px;border-radius:5px;background:#111214;box-shadow:0 6px 18px rgb(0 0 0/.35);color:#f2f3f5;font-size:11px}
@media(max-width:560px){.discord-consent__header-actions{gap:8px}.discord-consent__header-actions button:nth-child(3),.discord-consent__header-actions button:nth-child(4){display:none}.discord-message{grid-template-columns:44px minmax(0,1fr);padding-left:10px;padding-right:18px}.discord-avatar{width:34px;height:34px}.discord-message__actions{right:6px}.discord-message__meta>time{display:none}.discord-consent__composer-shell{margin-inline:10px}.discord-profile-popout{width:min(240px,calc(100vw - 110px))}}
@media(prefers-reduced-motion:reduce){.discord-consent *{transition:none!important}}
</style>

<script>
(function(){
document.querySelectorAll('[data-consent-chat]').forEach(function(chat){
var replying=chat.querySelector('[data-replying]');
var replyAuthor=chat.querySelector('[data-reply-author]');
var input=chat.querySelector('.discord-consent__input');
var toast=chat.querySelector('.discord-consent__toast');
var profilePopover=chat.querySelector('[data-profile-popover]');
var profileButton=chat.querySelector('[data-action="profile"]');
var toastTimer;
function cancelReply(){replying.hidden=true;replyAuthor.textContent='';}
function closeProfile(){if(!profilePopover)return;profilePopover.hidden=true;profileButton.setAttribute('aria-expanded','false');}
function showToast(message){clearTimeout(toastTimer);toast.textContent=message;toast.hidden=false;toastTimer=setTimeout(function(){toast.hidden=true;},2600);}
chat.addEventListener('click',function(event){
var button=event.target.closest('button[data-action]');
if(!button||!chat.contains(button))return;
var action=button.dataset.action;
if(action==='reply'){
var message=button.closest('.discord-message');
replyAuthor.textContent=message.dataset.author||'user';
replying.hidden=false;
input.focus();
}else if(action==='cancel-reply'){
cancelReply();input.focus();
}else if(action==='reaction-pill'){
var selected=button.getAttribute('aria-pressed')==='true';
button.setAttribute('aria-pressed',String(!selected));
button.querySelector('[data-reaction-count]').textContent=selected?'1':'2';
}else if(action==='react'){
button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));
button.textContent=button.getAttribute('aria-pressed')==='true'?'👍':'☺';
}else if(action==='profile'){
var opening=profilePopover.hidden;
profilePopover.hidden=!opening;
button.setAttribute('aria-expanded',String(opening));
}else if(action==='header'){
showToast(button.dataset.message||'That button is just for show.');
}else if(action==='more'){
showToast('No more options. You found all of them.');
}
});
document.addEventListener('click',function(event){
if(!profilePopover.hidden&&!event.target.closest('[data-profile-popover]')&&!event.target.closest('[data-action="profile"]'))closeProfile();
});
input.addEventListener('keydown',function(event){
if(event.key==='Escape'){cancelReply();closeProfile();input.blur();}
if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();input.textContent='';showToast('Nice try. This box does not actually send anything.');}
});
});
})();
</script>

I already had a tiny Steam tracker doing basically the same thing with game activity, so I assumed Find My would be another authenticated request, some JSON, and an evening of work *(epic foreshadowing)*.

I started with the normal iCloud web API and it happily returned my own Apple devices and their locations, but Find My People was nowhere in it. I thought I'd be smart and look into what other people have done. Turns out things aren't easy as it looks like nobody has done this before (or well, not fully, you'll see what I mean).

I did not have a Mac to run or instrument `FindMy.app`, so I started from existing open-source clients and requests against Apple. Later, when guessing field names stopped being funny, I also worked through decompilations of `fmfd`, `findmylocated`, and `searchpartyd`. I'll link the exact source whenever one of the open-source clients comes up. The loop was mostly: keep the session fixed, change one field or encoding, and see whether Apple's status code moved.

:::warning[Scope]
The client only reads an already accepted share on my Apple Account. It has no methods for sending invitations, changing shares, adding family members, creating geofences on Apple, or performing device actions. The geofencing happens locally after decryption.
:::

## Starting with the Friends API

The first thing that looked useful was an old `initClient` call used by `fmfd`:

```text
/fmipservice/friends/fmfd/<dsid>/<device>/initClient
```

For context, `fmfd` is the Find My Friends daemon. Even though the app is called Find My now, this API still lives under Apple's old MobileMe namespace. The `dsid` in the URL is just the account's numeric Directory Services ID.

Logging into iCloud gave me a pile of MobileMe tokens for different services. A few of them sounded right, so I tried the obvious ones:

```console
mmeFMFAppToken:401
mmeAuthToken:401
searchPartyToken:401
```

Three tokens, three `401`s. Looking at the [MobileMe delegate exchange](https://github.com/malmeloo/FindMy.py/blob/v0.10.1/findmy/reports/account.py#L891-L929) made the reason pretty clear: the login acts as a token broker and gives each iCloud service its own credentials. Apparently, having "Find My" somewhere in the name wasn't enough.

Even with the correct token, the request still wasn't complete. `initClient` wanted the account's Find My Friends (FMF) host, the courier token for this client's Apple Push Notification service (APNs) connection, a fairly detailed client context, and a weird bundle of headers called **anisette**. The courier token identifies this client to APNs, and the topic tokens used to filter pushes are derived from it.

Anisette is basically extra proof that the request came from a provisioned Apple-like client. Some values stay tied to the emulated machine and another looks like a short-lived one-time code. It isn't the password or a Find My token, but Apple rejects the request without it. [FindMy.py generates those headers here](https://github.com/malmeloo/FindMy.py/blob/v0.10.1/findmy/reports/anisette.py#L128-L166) and [keeps the provisioned identity here](https://github.com/malmeloo/FindMy.py/blob/v0.10.1/findmy/reports/anisette.py#L288-L414). The `deviceUDID` below is just the Unique Device Identifier (UDID) I assigned to the emulated receiver.

```json title="reduced initClient request"
{
  "clientContext": {
    "appName": "findmylocated",
    "apsToken": "<APNs courier token>",
    "callerHandleId": "<signed-in Apple Account>",
    "contextBundleApp": "com.apple.findmy.findmylocated",
    "currentTime": 1787130000000,
    "deviceUDID": "<receiver UDID>",
    "productType": "MacBookPro18,3",
    "osVersion": "14.6"
  },
  "serverContext": {
    "authToken": "<base64 MobileMe token>",
    "clientId": "<base64 friends/fmfd client ID>",
    "prsId": "<DSID>"
  }
}
```

The route still says `friends/fmfd`, but current clients build that context in `findmylocated`. `currentTime` is Unix milliseconds, and subsequent refreshes also echo the model version Apple returned in `X-FMF-Model-Version`.

Once I had all of that matching what the native daemons send, Apple finally returned the accepted share:

```json title="initClient response"
{
  "following": [{
    "id": "<opaque fmId>",
    "invitationAcceptedHandles": ["<redacted>"],
    "secureLocationsCapable": true,
    "fallbackToLegacyAllowed": false
  }],
  "locations": []
}
```

`following` is basically the list of people sharing their location with me. Great, I could now find my friend and get his opaque `fmId`, but that was about it: no location and no key. The two flags, `secureLocationsCapable: true` and `fallbackToLegacyAllowed: false`, were a pretty good sign that this share had moved to the newer encrypted location path. :sob:

At first I thought getting this response meant the client was set up properly, but clearly it didn't :(. Those boring context fields only became important later, when I needed Apple to notice this was a new client and send it the existing key.

So I kept `initClient` for finding the relationship and moved on to pretending to be an actual Apple device, because that is what normal people do.

## Becoming an IDS device

Finding the relationship was really the easy part. The encrypted path goes through IDS, Apple's private device-identity and encrypted-messaging layer. IDS ties an account handle to its registered devices, certificates, push tokens, and message keys; the actual packets travel over APNs. My browser session proved I was logged in, but it didn't make the Linux client one of those devices.

I found most of the older IDS and APNs code in a [pre-rewrite pypush commit](https://github.com/JJTech0130/pypush/tree/6336bba82697b838497ffd774f23e5640c877a85). Its login sent a password plist straight to `profile.ess.apple.com`. Apple accepted the password, asked for 2FA, and then rejected the code:

```console
[password] Apple status 5000
[2fa] Apple status 5068
```

So the old pypush login was dead. The path that worked was [**GrandSlam**](https://theapplewiki.com/wiki/Grand_Slam_Authentication), Apple's account login protocol, which [FindMy.py already implements](https://github.com/malmeloo/FindMy.py/blob/v0.10.1/findmy/reports/account.py#L794-L885). After a Secure Remote Password (SRP) exchange and two-factor authentication (2FA), I got an ADSID, another opaque identifier for the authenticated account, and a short-lived password-equivalent token (PET). I used that PET to ask `signin/v2` for the `com.apple.private.ids` delegate instead of trying the password again.

The anisette values from earlier also travelled with that login. These are the interesting ones:

```http title="anisette headers"
X-Apple-I-MD: <short-lived OTP-like value>
X-Apple-I-MD-M: <provisioned machine value>
X-Apple-I-MD-RINFO: <routing integer>
X-Mme-Device-Id: <stable client UUID>
X-Apple-I-Client-Time: 2026-08-18T...Z
X-Mme-Client-Info: <model> <OS;version;build> <framework/app>
```

Then I sent the PET to `setup.icloud.com/setup/signin/v2/login`:

```http title="IDS delegate request"
POST /setup/signin/v2/login HTTP/1.1
Authorization: Basic <Apple Account>:<PET>
X-Apple-ADSID: <ADSID>
X-Apple-I-MD: <anisette OTP>
X-Apple-I-MD-M: <anisette machine>
X-Mme-Nas-Qualify: <short-lived validation data>
Content-Type: application/x-apple-plist
```

```xml title="reduced signin/v2 request"
<key>delegates</key>
<dict>
  <key>com.apple.private.ids</key>
  <dict><key>protocol-version</key><string>4</string></dict>
</dict>
```

There is one extra bit in there: `X-Mme-Nas-Qualify`. It contains short-lived native validation data. The open-source implementations call the blob NAC; the name is less useful than the fact that Apple expects it to match the emulated hardware profile and be fresh. The [pypush generator](https://github.com/JJTech0130/pypush/blob/6336bba82697b838497ffd774f23e5640c877a85/generatenac.py) builds it, and Apple asks for another one during registration.

Apple returned zero for both the outer request and `com.apple.private.ids`, plus a profile ID and delegate token. Progress!

### Certificate request

Next I had to exchange that delegate token for an IDS authentication certificate through `authenticateDS`. That meant sending a certificate signing request (CSR), basically a request for Apple to sign this client's public key. Annoyingly, every attempt returned HTTP `200` as Apple hid the real result inside the response plist.

From there it was a lot of changing one thing, running it again, and still getting `6001`:

```text
legacy password credential plist          → 5068
GrandSlam + RSA/SHA-256 CSR               → 6001
GrandSlam + RSA/SHA-1 CSR                 → 6001
RSA/SHA-1 + XML plist + gzip              → 0, certificate returned
```

The error body wasn't exactly helpful either:

```xml
<dict>
  <key>message</key>
  <string>&lt;[insert Apple diagnostic]&gt;</string>
  <key>status</key>
  <integer>6001</integer>
</dict>
```

What finally worked is pretty specific: the CSR had to use PKCS#10, the standard certificate-request format, with a 2048-bit RSA key and a SHA-1 signature. Its common name had to be the uppercase SHA-1 of the IDS profile ID. Then I had to put it in an **XML** plist as `Data` and gzip the whole thing:

```python title="accepted authenticateDS body"
body = plistlib.dumps({
    "authentication-data": {"auth-token": delegate_token},
    "csr": csr_der,
    "realm-user-id": profile_id,
}, fmt=plistlib.FMT_XML)

body = gzip.compress(body, mtime=0)
```

I ended up building the PKCS#10 object manually so I could control the exact bytes, including the empty attributes field and `sha1WithRSAEncryption` identifier:

```python title="manual PKCS#10 construction"
common_name = hashlib.sha1(user_id.encode()).hexdigest().upper()
subject = x509.Name([
    x509.NameAttribute(NameOID.COMMON_NAME, common_name)
]).public_bytes()
request_info = _der(
    0x30, b"\x02\x01\x00" + subject + public_key_der + b"\xa0\x00"
)
signature = private_key.sign(request_info, padding.PKCS1v15(), hashes.SHA1())
SHA1_WITH_RSA = bytes.fromhex("300d06092a864886f70d0101050500")
csr = _der(
    0x30, request_info + SHA1_WITH_RSA + _der(0x03, b"\x00" + signature)
)
```

```console
[auth-cert] prepared XML+gzip enrollment: CSR=636 bytes, body=1613 bytes
[IDS authentication certificate] HTTP 200; decoding Apple property list
[IDS authentication certificate] Apple response fields: cert, status, user-id
[IDS authentication certificate] Apple diagnostic status=0
```

My best guess is that the SHA-1 and XML requirements are just old compatibility baggage. `authenticateDS` is a legacy profile-enrollment endpoint and the accepted request still advertises IDS protocol `1660`.

The endpoint itself came from Apple's signed IDS bag. I hit one more stupid problem here: some of its hosts chained through Apple roots missing from Linux's `certifi` bundle. I added fingerprint-pinned copies of Apple Root CA and Apple Root CA G3 from [Apple PKI](https://www.apple.com/certificateauthority/) and kept TLS verification enabled.

## Getting Find My registration accepted

Having the authentication certificate meant I could finally sign IDS requests. I used it with the APNs identity to ask for the account's registered handles. Apple returned two usable URIs, although both somehow had status `5051` while the outer response said zero:

```console
[IDS handle lookup] Apple diagnostic handles[0].status=5051
[IDS handle lookup] Apple diagnostic handles[1].status=5051
[IDS handle lookup] Apple diagnostic status=0
[handles] received 2 handle(s)
```

I ignored the inner `5051`s since Apple had still given me the handles and tried registering the device. Another `6001`.

[rustpush's service definition](https://github.com/stek29/rustpush/blob/82dc6f8342176e4f9171b62354cbdd13eaa18b38/src/findmy.rs#L26-L45) showed what I had wrong. I was registering FMF directly, but Apple registers an alloy multiplexer and puts six Find My topics under it:

```python title="accepted service registration"
service = {
    "service": "com.apple.private.alloy.multiplex1",
    "sub-services": [
        "com.apple.private.alloy.fmf",
        "com.apple.private.alloy.fmd",
        "com.apple.private.alloy.status.keysharing",
        "com.apple.private.alloy.status.personal",
        "com.apple.private.alloy.findmy.itemsharing-crossaccount",
        "com.apple.private.alloy.kcsharing.invite",
    ],
    "users": [{
        "user-id": profile_id,
        "uris": account_handles,
        "client-data": find_my_capabilities,
        "kt-loggable-data": ngm_identity,
    }],
}
```

The `client-data` was another rabbit hole. It advertised both the old IDS message identity and **NGM** v13, Apple's newer device-to-device message format built around a P-256 device key and signed prekey. NGM is the envelope that will carry the location key later; it is not the encryption used for the location report itself. The registration also included Key Transparency v5 metadata and the Find My capability flags. [rustpush's registration code](https://github.com/stek29/rustpush/blob/82dc6f8342176e4f9171b62354cbdd13eaa18b38/src/ids/user.rs#L1035-L1074) was the most readable reference I found for this.

Around that, the request needed the APNs token, some native device metadata, and another fresh validation blob. The encoding mattered again too: XML plist, gzip, then IDS signatures over the compressed bytes. The final request carried both the account certificate and the APNs push certificate:

```http title="id-register request"
POST <IDS bag: id-register> HTTP/1.1
Content-Type: application/x-apple-plist
Content-Encoding: gzip
x-protocol-version: 1660
x-auth-user-id-0: <IDS profile ID>
x-auth-cert-0: <authentication certificate>
x-auth-nonce-0: <timestamped nonce>
x-auth-sig-0: <signature>
x-push-cert: <APNs certificate>
x-push-token: <APNs token>
x-push-sig: <signature>
```

The signature wasn't over some normal HTTP canonicalization either. Apple wanted a binary concatenation of the nonce, bag key (`id-register`), query string, compressed body, and push token, with every variable field prefixed by a four-byte length. [pypush has the exact routine here](https://github.com/JJTech0130/pypush/blob/6336bba82697b838497ffd774f23e5640c877a85/ids/signing.py#L40-L110).

One signature uses the IDS key and the other uses the APNs push key, so the registration is tied to both identities.

I wish I had a clean “this one field fixed it” answer here, but I changed the layout, service list, and encoding together. I didn't go back and bisect which one finally made Apple happy.

```console
[registration] prepared XML+gzip body=1911 bytes; services=1, subservices=6, handles=2
[IDS device registration] Apple diagnostic services[0].status=0
[IDS device registration] Apple diagnostic status=0
[registration] Find My service Apple status 0
[registration] registration certificate received
```

At that point the Linux client finally had everything it needed to exist as a Find My device: an APNs identity, an IDS authentication certificate, registered handles, message keys, and a Find My service certificate. I saved all of it so it could come back up without another login, which to be honest had started worrying me. It may sound silly, but at that point I logged in (or tried to) a lot and I wasn't sure if Apple's security features would kick in and lock my account.

## Listening for Find My messages

With registration done, I could move on to actually listening for something. The client connects to private APNs and declares interest in the six Find My subservices, the SearchParty container topic, **and** `com.apple.private.ids`. Each push contains an IDS plist with a command, sender handle, sender push token, encryption mode, and payload.

Private APNs isn't the public API normal app servers use. I had to activate the device certificate, open the binary connection implemented by [pypush's `APNSConnection`](https://github.com/JJTech0130/pypush/blob/6336bba82697b838497ffd774f23e5640c877a85/apns.py#L90), get a base push token, and tell APNs which topics I cared about. The packets only identify their topic by a SHA-1 hash, so I mapped those hashes back to the service names from registration.

That parent IDS topic caused a particularly stupid failure. I initially subscribed only to the concrete Find My subtopics because those are the topics present in registration. Nothing arrived. Native clients also express interest in `com.apple.private.ids`: it acts like a courier gate for peer delivery, even though the packet still arrives labelled with its concrete subservice. The moment I added the parent interest, Find My packets started arriving on `com.apple.private.alloy.fmd`.

Decrypting the payload wasn't as simple as looking up the sender's email and grabbing a key. One handle can have several registered devices, each with its own identity. Before touching the payload I query Apple's current IDS directory and find the identity whose push token matches the packet:

```python title="binding an IDS packet to its sender device"
directory = user.lookup([sender_handle], topic=message_topic)
identities = directory[sender_handle]["identities"]

delivery = next(
    identity for identity in identities
    if identity["push-token"] == packet_sender_token
)
```

The current IDS envelope is called `pair-ec`. It comes with the ciphertext, an ephemeral P-256 key, an ECDSA signature, and a short validator tying the sender, receiver, and prekey together. To open it I do ECDH with my registered prekey, verify the sender's signature, and derive the AES-CTR key and IV using HKDF-SHA-256 and a salt named `LastPawn-MessageKeys`.

Here's the actual decryption code, minus the protobuf parsing and shitty error handling:

```python title="pair-ec / NGM decryption"
secret = receiver_prekey.exchange(ECDH(), ephemeral_key)

expected_validator = (
    sender_device_x[:2]
    + receiver_device_x[:2]
    + receiver_prekey_x[:2]
    + b"\x0c"
)
assert compare_digest(validator, expected_validator)

signed = secret + receiver_prekey_x + ephemeral_x + receiver_device_x + encrypted
sender_device.verify(signature, signed, ECDSA(SHA256()))

material = HKDF(
    algorithm=SHA256(), length=48,
    salt=b"LastPawn-MessageKeys", info=b"",
).derive(secret)
plaintext = AES_CTR(material[:32], material[32:]).decrypt(encrypted)
```

[rustpush uses the same](https://github.com/stek29/rustpush/blob/82dc6f8342176e4f9171b62354cbdd13eaa18b38/src/ids/user.rs#L396-L400) salt and the same 32-byte key / 16-byte IV split. The validator is only six bytes taken from the three public keys, while the ECDSA signature covers the full message.

The directory lookup is not optional decoration here. I only acknowledge and parse the application payload after the token-selected directory identity verifies the `pair-ec` envelope. Otherwise an arbitrary packet on the connection could hand the location parser a plausible-looking private key.

## Asking an existing share to send its key

This was the part I misunderstood for the longest. My first working Friends request discovered the relationship but did not make the sharing device send anything. I assumed the key only travelled when a share was created. That would have meant stopping and recreating the share, which felt wrong for a fairly obvious reason: if I bought another iPhone, Apple would have to give it the keys for my existing relationships somehow. It cannot require every friend to unshare and reshare whenever I add a device.

Looking at the decompilation I ended up figuring what I was missing. The old daemon calls the request context `SecureLocationsClientContext`, and its coding keys are not guesses:

```text
apsToken · clientId · contextApp · shallowStats · liveStats
```

Current builds add an empty `nearbyWatchIdentifiers` array as well. The other important type is `SPSecureLocationsSubscriptionContext`. Its default constructor uses subscription mode `0` and fetch mode `1`; following the no-cache branch from that context eventually builds a gateway fetch whose wire strings are `proactive` and `distributeKeys`.

The no-cache request is a `SubscribeAndFetch` with a **fetch array**, even when it contains one relationship:

```json title="missing-key SubscribeAndFetch request"
{
  "fetch": [{
    "fmId": "<existing accepted share>",
    "intent": "distributeKeys",
    "mode": "proactive",
    "ids": []
  }],
  "clientContext": {
    "apsToken": "<APNs courier token>",
    "clientId": "<receiver UDID>",
    "contextApp": "com.apple.findmy.findmylocated",
    "shallowStats": {},
    "liveStats": {},
    "nearbyWatchIdentifiers": []
  }
}
```

There were several wonderfully unhelpful almost-correct variants. An object instead of the `fetch` array could get an empty HTTP `200` without dispatching anything. Using the FMF-derived topic token instead of the base courier token did the same. Sending the internal integer enum values instead of their custom `Codable` strings produced HTTP `400`. `heal` was not the missing-key path either: it expects a real location identifier that might have gone stale, while the whole point here was that this client had none.

Before that secure request, the native sequence is:

```text
initClient
  → minCallback/refreshClient
  → minCallback/selFriend/refreshClient
  → SubscribeAndFetch(distributeKeys, proactive, ids=[])
```

The two `refreshClient` calls carry forward Apple's `serverContext`, `dataContext`, and model version. The selected-friend refresh names the existing `fmId`; it does not edit or recreate the relationship. With that sequence running while the IDS receiver was online, Apple's service asked the already-sharing device to distribute its current key to the new registered identity.

Then the thing actually arrived:

```console title="live verified key delivery"
[message] received an APNs push on com.apple.private.alloy.fmd
[message] received IDS command 242 using pair-ec
[lookup] received the matching IDS directory response
[message] unwrapping Find My message type 10 version 1
[message] decrypted application plist root: array[1]
[message] acknowledged the verified Find My message
[message] verified a key envelope matching the selected share
```

The application plist was an array containing this object shape:

```text
entityIdentifier: string
hashedAdvertisement.key.data: 32 bytes
identifier: string
index: integer
privateKey.key.data: 85 bytes
```

`entityIdentifier` is the `fmId`, and `hashedAdvertisement.key.data` is the advertised location identifier SearchParty expects. The 85-byte private-key blob was the last surprise. I had assumed P-256 because the NGM identity above uses P-256. It actually doesn't, probably because its a different layer, the People location key is **P-224**. Its serialized form is a 57-byte uncompressed public point (`04 || X || Y`) followed by the 28-byte private scalar. I also derive the public point from that scalar and compare it with the first 57 bytes before accepting the key.

[rustpush independently uses `SECP224R1` for these shared reports](https://github.com/stek29/rustpush/blob/82dc6f8342176e4f9171b62354cbdd13eaa18b38/src/findmy.rs#L1266-L1292), which would have been a useful detail for me to notice approximately one day earlier.

I only save an envelope after the IDS sender verifies and `entityIdentifier` matches the `fmId` selected earlier. Anything else is acknowledged or ignored according to the protocol, but never dumped into the location state. Most importantly, this worked with the original existing share. **No stop/restart or resharing was required.**

:::note[One requirement that remains]
The friend's sharing device still has to be online long enough to process Apple's asynchronous `distributeKeys` command. The relationship does not need to change, but some device holding its current key has to answer.
:::

## Fetching and decrypting the location

Once that message gave me the advertised location ID and private key, I could finally talk to **SearchParty**, the service that stores and returns encrypted Find My reports. It gives me the ciphertext for an ID, but not the key to read it. That's why the IDS handoff above was important.

The request goes to `gateway.icloud.com/findmyservice/fetch` with the `searchPartyToken` from the very first login, fresh anisette headers, the `fmId`, and the same APNs/client context. Now that I have an advertised identifier, the fetch changes from `distributeKeys`/`proactive` to `startLocationUpdates`/`shallow`:

```json title="SearchParty request"
{
  "fetch": [{
    "fmId": "<selected share>",
    "intent": "startLocationUpdates",
    "mode": "shallow",
    "ids": ["<advertised location identifier>"]
  }],
  "clientContext": {
    "apsToken": "<APNs courier token>",
    "clientId": "<receiver UDID>",
    "contextApp": "com.apple.findmy.findmylocated",
    "shallowStats": {},
    "liveStats": {},
    "nearbyWatchIdentifiers": []
  }
}
```

Authentication is HTTP Basic with the numeric DSID and scoped SearchParty token. The response keeps the advertised ID outside the ciphertext, which lets me pick the right key without trying every report:

```json title="SearchParty response shape"
{
  "locationPayload": [{
    "id": "<advertised location identifier>",
    "locationInfo": [{
      "location": "<base64 ECIES ciphertext>",
      "locationTs": 807000000
    }]
  }]
}
```

Each `locationInfo` entry is encrypted and starts with a 57-byte uncompressed P-224 public key. From there I do ECDH with the per-share private key, run X9.63 SHA-256 with that public key as shared info, and split the result into a 16-byte AES key and 16-byte GCM IV:

```python title="location report decryption"
ephemeral = ciphertext[:57]
secret = private_key.exchange(ECDH(), decode_point(ephemeral))
material = x963_sha256(secret, 32, shared_info=ephemeral)
plaintext = AESGCM(material[:16]).decrypt(
    material[16:32], ciphertext[57:], None
)
```

There are two encryption layers here and they are easy to mix up. NGM protects the key handoff between IDS devices. SearchParty then serves reports encrypted with that per-share key. Once I have the key locally, fetching another report doesn't need another IDS round trip.

Apple documents a similar end-to-end encrypted setup for the [Find My offline-finding network](https://support.apple.com/guide/security/find-my-security-sec6cbc80fd0/web), but that documentation is for devices and items not People. My guess is that the extra per-share key lets Apple revoke one relationship without replacing every Find My key on both accounts.

The plaintext is JSON or a plist containing the coordinate, accuracy, and timestamp. The outer timestamp uses Apple's 2001 epoch. I added fixtures for the exact P-224 envelope, point/scalar validation, picking the matching advertised ID, stale reports, and selecting the newest location.

And, finally, the live report decrypted. I can't tell you how satisfied I was to not see another HTTP 200 that really was a "skill issue, try harder". The existing People share produced a current coordinate, accuracy, and timestamp on Linux.

```console
$ python scripts/apple_people_modern.py key-status
ready
$ python scripts/apple_people_modern.py probe --wait 120
Modern People location updated.
```

So that is the whole pipeline exercised end-to-end. GrandSlam authenticates the Apple Account and obtains the IDS delegate. `authenticateDS` and `id-register` turn the Linux process into a registered Apple messaging identity. The Friends sequence attaches that identity to the existing accepted relationship. A missing-key `SubscribeAndFetch` makes the sharing device deliver its current P-224 key over APNs/IDS, inside a sender-verified P-256 NGM envelope. A second SearchParty fetch returns the encrypted report, and the P-224 key opens it locally.

So yeah, in one sentence: authenticate to Apple's private services, register the Linux machine as an IDS client, receive the existing Find My share key, and use it to fetch and decrypt a consented friend's latest location.

This was a short (less than a week) but fun project. I'll probably work on something else like this again in the near future, but I can't say whether I'll write a blog for it or not. Anyway, thanks for the read and bye!
