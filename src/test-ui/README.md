# test-ui — Huddle UI test harness

UI only. No sockets, no WebRTC peer connections, no real auth.
Drop-in replacement for your existing `test-ui/` folder — same
routes, same view names, same `public/` paths.

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

## Reactions

`call-ui.js` adds a quick emoji that floats up and disappears.
Deliberately **ephemeral** — nothing stored, no history. A call
reaction is a moment. (The persistent kind that attaches to a chat
message is a different feature backed by `message_reactions`.)

## Screen sharing does not survive navigation

`getDisplayMedia` needs a fresh user gesture and picker every time,
by design — so a capture cannot silently resume after a page load.
`CallState.clearSharing()` runs on entering the meet, so the banner
can't claim you're sharing a capture that already died.

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

## Demo behaviour to delete later

- 1:1 calls auto-answer ~2.5s after dialling (`setTimeout` marked
  with the real `socket.on` it stands in for)
- `+ peer` / `− peer` dev buttons
- Dummy conversation lists in `dashboard.js`
- The file-transfer progress bar is simulated; the real chunked
  send loop is written out in the comment in `meet.js`

## Testing over ngrok

`getUserMedia` needs a **secure context**. ngrok's https works;
`http://192.168.x.x` silently fails and falls back to initials.
