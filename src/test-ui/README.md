# test-ui — Huddle UI test harness

UI only. No sockets, no WebRTC peer connections, no real auth.
Drop-in replacement for your existing `test-ui/` folder — same
routes, same view names, same `public/` paths.

## CSP: no inline scripts, no inline styles

Every page's entry point lives in a real `.js` file. There is not a
single inline `<script>` or `onclick=` in this project, and no
`style=` attributes.

That's not stylistic. A sane CSP — `script-src 'self'`, which Helmet
sets by default — **blocks inline scripts outright**. The symptom is
brutal: external files load fine, static markup renders, and
everything JS-driven silently does nothing. It reads exactly like a
rendering bug, and the only place it says otherwise is the browser
console:

```
Executing inline script violates the following Content Security
Policy directive 'script-src 'self'. The action has been blocked.
```

If you add inline script later, that's what you'll see. Move it to a
file rather than weakening the policy — `'unsafe-inline'` defeats
most of what CSP is for.

Inline `style=` attributes fall to the same rule under a strict
`style-src`, so those are classes here too.

## If a page renders empty

`boot.js` loads first on every page and makes load failures visible
instead of silent. A missing script otherwise leaves a page that
*looks* fine — static markup renders, nothing JS-driven does — which
reads as a design bug rather than a 404.

If you see a **red banner** at the top of the page, it names either
the script that failed to load, the CSP directive that blocked
something, or the modules that never got defined. Then check
DevTools → Network for 404s under `/js/`.

### One subtlety worth knowing

`__reportMissing` takes `[name, typeof name]` pairs rather than bare
name strings. That's not fussiness:

```js
const CallState = { ... };   // top level of a classic script
window.CallState             // undefined!
typeof CallState             // "object"
```

Top-level `const`/`let`/`class` live in the **global lexical
environment**, not on `window` — only `var` and function
declarations become window properties. A checker that tests
`window[name]` reports every `const`-declared module as missing.
`typeof` reads the lexical binding correctly and is safe on
undeclared identifiers (returns `"undefined"` instead of throwing).
`eval()` would work too, but CSP blocks that as well.

**Most common cause:** unzipping over an existing `test-ui/` folder
without replacing `public/js/`. The views reference modules the old
folder doesn't have. Delete the old `test-ui/` first, then unzip —
don't merge.

**Second most common:** the zip contains `test-ui/` at its root. If
you unzip *inside* `src/test-ui/` you end up with
`src/test-ui/test-ui/…`. Unzip into `src/` instead.

Verify with:

```
ls src/test-ui/views     # 6 .ejs files
ls src/test-ui/public/js # 17 .js files, including boot.js and sidebar.js
```

## Install

Unzip so `test-ui/` sits inside `src/`, beside `app.ts`. Nothing in
your Express config changes:

```ts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'test-ui/views'));
app.use(express.static(path.join(__dirname, 'test-ui/public')));
```

## Routes (unchanged)

```
GET  /            -> render('login')
POST /demo-login  -> set cookie, redirect /dashboard
POST /auth/login  -> your real auth
POST /logout
GET  /dashboard   -> render('dashboard', { displayName })
GET  /chat        -> render('chat')
GET  /voice-call  -> render('voice-call')
GET  /video-call  -> render('video-call')
GET  /meet        -> render('meet')
```

The call screens take no render variables — they read `?id=&name=`
client-side.

## The flow

```
dashboard  →  chat  →  call button  →  voice / video / meet
```

Calls are **started from inside the chat**, not the conversation
list. Starting one posts a **call card** into the transcript.

## Two rules the code exists to enforce

**1. One call at a time.** `CallState` is a single object, not a map.
Tapping the call button while a call runs is blocked with a message.

This is **advisory only**. A second tab, or a user who clears
storage, walks straight past it. Reject a second `call:invite`
server-side the same way you already reject duplicate DM pings.

**2. A call survives navigation.** Back leaves the *screen*, not the
call. The dashboard then shows a green "in a call" bar, the
conversation row shows "in progress", and the chat card offers
**Return to call**. Only the red end button clears it.

`call-state.js` uses **sessionStorage** — survives navigation within
the tab, dies when the tab closes, which matches a call's lifetime.
`localStorage` would be wrong: a call outliving a browser restart is
a lie. In production the **server owns this**; reconcile on page load
or a crashed tab leaves a phantom bar nobody can clear.

### Card identity

Each call card carries its own `cardId`, and a card renders as live
only when `CallState.isCard(cardId)` matches. Checking "is there a
call in this conversation" instead makes **every old card in the room
light up** the moment a new call starts.

## Layout

**Mobile** shows one pane at a time — list, then chat. **Desktop
(≥900px)** shows sidebar + main side by side, like any real
messaging client. Both remain separate routes; CSS decides which
pane is visible, and `sidebar.js` renders the list on both pages.

## Call chrome

Controls and the top bar **auto-hide after 4 idle seconds** and
return on any tap — otherwise they permanently cover the video.
They never hide while a panel is open, or the close button would
vanish with them.

## Transport: sockets vs data channel

Decide **per event**, not per app.

| event | transport | why |
|---|---|---|
| reactions | **socket** | the server stamps who sent it |
| typing, presence, call state | **socket** | same, plus rooms already exist |
| upgrade request/accept | **socket** | must work before media connects |
| file transfer | **data channel** | bulk binary shouldn't touch your server |

The deciding factor for reactions is identity. Over a data channel
the payload must carry its own `from` field — which the sender
controls, so anyone can react as anyone else. In a 1:1 call you'd
notice; in a six-person meet you would not. Over a socket the client
sends only `{ emoji }` and the server attaches `socket.userId`.

The data channel's only advantage is ~30–100ms of latency, which
nobody can perceive on a floating emoji. It wins decisively for
files: bandwidth you don't pay for, storage you don't manage, and no
identity problem because the transfer is inside an already
authenticated session.

## Reactions

`call-ui.js` floats an emoji up from where you tapped, **with the
sender's name attached**, fading out around 80% of the way up.

The name is the whole point — an anonymous emoji in a six-person
meet tells you nothing. `CallReactions.fly(emoji, name)` is exactly
what your `socket.on('call:reaction')` handler should call.

Deliberately **ephemeral**: nothing stored, no history. A call
reaction is a moment. The persistent kind that attaches to a chat
message is a different feature backed by `message_reactions`.

## Voice → video upgrade

`upgrade.js`. Not a toggle — a **request the other side can refuse**.
They answered a voice call; they may not want to be seen.

```
you tap 📹 → "Asking Chris for video…"
              ├─ accept  → both go to video
              └─ decline → stays voice
```

Works both directions. Demo auto-accepts after ~2s; `they ask video`
in the dev panel simulates the incoming direction.

**Accepting is the start of negotiation, not the end.** Adding a
video track to a live peer connection means renegotiation — new
offer, answer, ICE — and it can fail. Only flip the UI to video once
the track is actually flowing, or you'll show a video call that
never arrives.

## Screen sharing does not survive navigation

`getDisplayMedia` needs a fresh user gesture and picker every time,
by design — so a capture cannot silently resume after a page load.
`CallState.clearSharing()` runs on entering the meet, so the banner
can't claim you're sharing a capture that already died.

## Chat history persists

`chat-store.js`. In a multi-page app, anything you expect to still
be there after navigating has to be **stored**, not held in a
variable.

This was a real bug: messages were a plain array rebuilt on every
page load, so starting a call posted a card, and coming back from
the call screen the array was re-initialised and the card was gone —
nothing left to press **Join** on.

Message shapes:

```
{ from, text, mine }                      plain text
{ from, text, mine, image, uploadPct }    attachment (+ optional caption)
{ type:'call', callType, cardId, from }   call announcement
```

## Albums and download-on-demand

Selecting several photos creates **one album message**, not a burst
of bubbles. Layout: 1 fills the width, 2 split it, 3+ tile, and past
4 the last tile carries a **+N** so a 20-photo drop doesn't become a
wall of transcript.

Each image uploads on **its own timeline** — they don't finish
together in reality, and one shared bar would hide that.

### The receiving side never auto-downloads

Incoming media renders as a **skeleton with a download button**, and
no `src` is set at all until the recipient taps it. That's real data
saved on a phone plan, and it's why `needsDownload` exists rather
than the image simply appearing.

Use **simulate incoming photos** in the chat to test it: a random
1–5 photo album arrives as skeletons; tap any tile to watch it
stream in. That handler is exactly what your `socket.on('message:new')`
should do — store the URLs, mark them `needsDownload`, fetch nothing.

## Attachments: Photo · Video · File

The paperclip opens a menu with three entries. **File** sends the
original as a plain attachment even if it's an image or video — no
preview, no re-encode — which is what you want for sending an
untouched original.

### Limits (`demo.js`)

| rule | value | what happens |
|---|---|---|
| video duration | 20 min | still sends, but **as a file** |
| any file | 100MB | refused |
| inline image | 1.5MB | falls back to a file attachment |

Note the pattern: the limits **degrade** rather than refuse. A
40-minute clip becomes a download instead of a chat trying to stream
it inline. Only the hard ceiling refuses outright.

Duration can't be read from a `File` — it needs a real `<video>`
element and a metadata load, so the check is async (`probeVideoDuration`).
It times out after 4s and treats the video as short rather than
hanging on a codec the browser can't parse.

**Enforce all of this server-side too.** A client check is a
courtesy; the server is what stops someone posting a 2GB file.

## Streaming large files over a data channel

Yes, and it's the data channel's best use case — bandwidth you don't
pay for, no storage to manage, and no identity problem since the
transfer is inside an already-authenticated session.

Not as one object, though. Slice into ~16KB chunks and send them in
order, watching `bufferedAmount` and pausing when it climbs, or you
overflow the send buffer and kill the channel. Send a small header
first (name, size, chunk count) so the far side can reassemble and
show progress. The loop is written out in `meet-chat`'s file handler.

The catch: it's peer-to-peer, so both sides must be online at the
same time. Anything that has to be there when the recipient logs in
tomorrow still needs a server upload.

## Old image notes

One attach button takes both. They're stored differently on purpose:

| | how it's held | survives navigation? |
|---|---|---|
| image | base64 data URL | yes |
| video | object URL (`URL.createObjectURL`) | no |

**Why the split.** sessionStorage caps around 5MB and base64 inflates
a file by ~33%. A single phone clip would blow the quota and take the
entire chat history down with it. An object URL costs nothing to
create and plays instantly, but it dies with the page that made it —
so on reload the bubble says "unavailable after reload" instead of
rendering a broken player.

That limitation is the demo's, not a design flaw to carry forward.
Once you have real uploads, the message stores a CDN URL and both
types persist identically. Images are capped at 1.5MB here purely so
the demo can't blow its own quota.

`preload="metadata"` on the video element is worth keeping: it loads
the poster frame and duration without pulling the whole file. A
transcript full of autoloading videos will saturate a phone
connection.

## Old image notes

The bubble tightens around the image with the caption underneath,
and a progress bar overlays while bytes are still uploading — the
message exists immediately, the file arrives after.

**When you build real uploads:** POST the file to your own endpoint
or a signed S3 URL and store only the resulting key on the message.
Do NOT base64 it into the row — you'd bloat the table and blow past
payload limits. The demo uses a data URL purely so it needs no
backend.

## Browser history: why back kept returning to dead calls

Every `location.href = ...` **pushes** a history entry — including
the UI's own back arrow. So a session accumulated:

```
dashboard → chat → call → chat → dashboard → chat → meet → chat → ...
                    ↑ dead, but still in history
```

Ending a call clears `CallState`, but the browser knows nothing
about that. Hardware-back landed on a dead call URL, and the page
started a fresh call because it assumed it should.

**Two fixes, both needed:**

1. **`goReplace()` when leaving a call** (`location.replace`). It
   swaps the current entry instead of adding one, so the call URL is
   *removed* from history rather than buried.
2. **`requireActiveCall()` guard on every call page.** `replace()`
   covers the normal path, but a bookmark, refresh, or stale entry
   can still land on a call URL. No matching live call → redirect to
   the chat instead of silently starting a new one.

Fix 1 handles the common case; fix 2 catches everything else. Ship
both — the guard is what makes the page correct regardless of how
someone arrived.

## Voice notes

`voice-note.js`, using the real `MediaRecorder` API — same
permission prompt, same blob, same failure modes as production.
States: idle → recording → **review** → send.

The review step exists because a voice note is the one message type
you can't skim before sending.

Four things that bite when you build this for real:

1. **Format isn't universal.** Chrome/Firefox give
   `audio/webm;codecs=opus`, Safari gives `audio/mp4`. Check
   `MediaRecorder.isTypeSupported()` and store the mime type with
   the file, or playback breaks across browsers.
2. **Upload it like a file.** Same rule as images — POST the blob,
   store the key. Voice notes are routinely 100KB+.
3. **Duration comes from you.** WebM from MediaRecorder often has no
   duration metadata, so `<audio>` reports `Infinity`. Count the
   seconds while recording (this file does) and store them.
4. **Release the mic.** Stopping the recorder does *not* stop the
   stream — call `.stop()` on every track or the recording
   indicator stays on.

## Files

| CSS | owns |
|---|---|
| `base.css` | tokens, icons, avatars, toast |
| `shell.css` | scrolling pages: login, dashboard, chat |
| `call.css` | fullscreen call + meet |

| JS | owns |
|---|---|
| `icons.js` | inline SVG icon set (no CDN) |
| `common.js` | utils: query params, escaping, urls, timer, toast |
| `call-state.js` | the one active call, persisted |
| `media.js` | `getUserMedia` / `getDisplayMedia` only |
| `stage.js` | **1:1 layout** — one fullscreen + PIP cards |
| `grid.js` | **meet layout** — bento grid + tap-to-fullscreen |
| `dashboard.js`, `chat.js`, `voice-call.js`, `video-call.js`, `meet.js` | per-screen wiring |

### Two layout engines on purpose

- **1:1** (`stage.js`): one person fullscreen, the other floats as a
  PIP card. Tap to swap. A call has a subject.
- **Meet** (`grid.js`): everyone at once in a bento grid; tap a tile's
  expand button to fullscreen one. A room has no subject.

Don't unify them — they're different interactions.

### The rule both engines share

Each participant owns **one persistent DOM element**, moved with
`appendChild`, never rebuilt. A `<video>` holds its stream on
`.srcObject`; rebuilding on every swap re-binds it, flashes black,
and can drop frames.

## Simulated timings — all in `demo.js`

Nothing here talks to a server, so anything that would arrive as a
socket event is faked with a timer. They're all in one file so you
can find, tune, and delete them together.

| what | delay | real event it stands in for |
|---|---|---|
| outgoing call answered | 2.5s | `socket.on('call:accepted')` |
| invited person joins | 2.5s | `call:accepted` for that invitee |

Set `DEMO.enabled = false` to turn all of it off and see the raw
states — a call that rings forever, an upgrade nobody answers. Worth
doing at least once: it's how you check your timeout handling.

Four timers in that file are **real product behaviour**, not
simulation, and should survive into production: the 30s ring
timeout, the **20s video-upgrade expiry**, the 4s chrome auto-hide,
and the 5-minute voice note cap.

**There is deliberately no auto-accept for the video upgrade.**
Silence must never turn someone's camera on. If they don't actively
agree within 20s the request expires, and the initiator is told
they *declined* — identical wording and outcome to an explicit
decline. That symmetry is the point: the initiator learns "not now"
and nothing about whether the other person tapped decline, was away
from their phone, or ignored it. Reporting "they ignored you" would
leak their behaviour; reporting nothing would leave a request
hanging with a camera about to switch on.

Use **they accept** in the dev panel to exercise the happy path
while testing alone.

## Old demo notes

- 1:1 calls auto-answer ~2.5s after dialling (`setTimeout` marked
  with the real `socket.on` it stands in for)
- `+ peer` / `− peer` dev buttons
- Dummy conversation lists in `dashboard.js`
- The file-transfer progress bar is simulated; the real chunked
  send loop is written out in the comment in `meet.js`

## Testing over ngrok

`getUserMedia` needs a **secure context**. ngrok's https works;
`http://192.168.x.x` silently fails and falls back to initials.

## If you edit files and the browser ignores you

Two separate caches bite here, and they need different fixes.

**Static assets (js/css).** Already handled: every asset URL carries
`?v=<%= Date.now() %>`, so each render produces a fresh URL the
browser cannot have cached. Strip this (or swap `Date.now()` for a
build hash) before production, where caching is what you want.

**The HTML itself.** Not fixable from inside the template — the page
has to be fetched before its contents matter. Add this above your
routes while developing:

```ts
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
```

`unzip` preserving archive timestamps makes this worse: files can
land on disk *older* than the browser's cached copy, so nothing looks
stale to it.

### VS Code Ctrl+Click on `/js/foo.js` says the file doesn't exist

Expected. VS Code resolves that from the workspace root; it knows
nothing about the `express.static` mapping. Only the browser resolves
it correctly. Not a bug, and not a sign anything is misconfigured.
