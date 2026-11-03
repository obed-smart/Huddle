# Huddle client implementation

A reference for how this client is built and why: the structure, the data flow,
and the architectural decisions behind them. Read this when you come back to the
code and want the shape of the whole thing before diving in.

This is the implementation and architecture record. It is deliberately separate
from `DESIGN.md`, which is about design and styling (color, layout, motion
language, typography). When a decision is about how the code is organized, how
data moves, or how the app stays secure, it belongs here. When it is about how
the product looks and feels, it belongs in `DESIGN.md`.

The one rule that shapes everything: the client is a thin, typed, secure skin
over Obed's real backend. It owns rendering, motion, and session plumbing. It
owns no business truth. Every type the UI uses comes from one place, every
secret stays on the server, and every file stays small.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS
v4, zustand for state, socket.io client for realtime, motion (Framer) for
animation, ChatCN (shadcn chat registry) for the transcript primitives, and
sonner for toasts. Auth is an httpOnly session cookie, so there is no token in
JavaScript anywhere.

## Folder shape

Feature first. A screen and everything it needs lives together under
`features/`, and the shared plumbing lives under `lib/` and `stores/`.

```
app/            Routes only. Thin pages, layouts, and the file conventions
                (loading, error, not-found). Pages render a feature view.
features/       One folder per capability: auth, chat, conversations,
                dashboard, groups, group-info, requests, search, realtime,
                marketing. Each holds its components plus its own hooks.
components/ui/  Design system primitives (button, input, sheet, the vendored
                ChatCN pieces). Nothing feature aware.
lib/            Framework free logic: the API layer, contracts, message
                normalization, media, the socket module, motion springs, time.
lib/server/     Server only reads. Importing next/headers keeps this out of any
                client bundle.
stores/         zustand stores: session, conversations, messages, requests.
```

Every file stays under 200 lines. When one grows past that it is a signal to
split a hook out of a component, or a concern out of a module, not to raise the
limit. Logic goes in hooks, rendering goes in components, shapes go in
contracts.

## Contracts are the single source of truth

`lib/contracts/index.ts` declares every backend derived type the UI touches
(the user, a conversation, a message and its parts, group shapes, requests,
media presign). Nothing else in the app declares these shapes by hand. The old
locations (`lib/api/types.ts`, `lib/messages/types.ts`, and so on) are now thin
re export shims that point back here, so imports keep working while the truth
lives in one file.

Why: the shapes belong to the backend's Drizzle schema. When Obed generates
those types, they get pasted into this one file and the whole app updates at
once. `lib/contracts/README.md` explains the swap. If a shape is ever unclear,
the rule is to ask for the real one rather than invent a lookalike.

## The API layer

`lib/api/http.ts` is the only thing that talks to the backend over fetch. It:

- Sends the session cookie on every call (`credentials: "include"`).
- Unwraps the backend's `{ success, data, message }` envelope and returns
  `data`, or throws a typed `ApiError` carrying the status and machine code.
- Refreshes once on a 401 (a single in flight refresh shared by every parallel
  call) and retries; if the refresh also fails, it fires a session expired
  handler that signs the user out.

Each resource gets a small typed module beside it (`auth.ts`, `conversations.ts`,
`group.ts`, `media.ts`, `users.ts`, `requests.ts`). Components never call fetch;
they call a hook, the hook calls one of these.

## Talking to the backend (the BFF)

The client never talks to the backend directly. The Next server stands in front
as a Backend for Frontend, so the browser only ever sees our own origin. There
are three doors into the backend, all server side:

- **REST** goes to same-origin `/api/v1/*`, which the route handler at
  `app/api/v1/[...path]/route.ts` forwards to `BACKEND_ORIGIN`. It carries the
  incoming cookie upstream and passes any `Set-Cookie` back, so login and logout
  work. It is a plain forwarder today, and it is the one place to add request
  validation, shaping, or a server held secret later, without touching the
  client.
- **Socket** goes to same-origin `/socket.io`, proxied by a `next.config.ts`
  rewrite. A websocket cannot pass through a route handler, so this one stays a
  rewrite. Socket.IO's polling transport always works through it; the websocket
  upgrade works when the deployment forwards it, and otherwise Socket.IO stays on
  polling, which is fine.
- **First paint** reads happen in server components (`lib/server/data.ts`), which
  call `BACKEND_ORIGIN` directly and forward the incoming cookie.

`BACKEND_ORIGIN` is server only (never `NEXT_PUBLIC`), so the backend URL never
reaches the shipped bundle. Because everything is same origin from the browser's
side, the httpOnly session cookie stays first party: no CORS, no `SameSite=None`,
nothing to configure cross origin. The one backend expectation is that its
session cookie is host only (no explicit `Domain`), so the browser keeps it under
our origin as the BFF relays it. When `BACKEND_ORIGIN` is unset the forwarders
are inert, which suits a deployment that already serves the API on the same host.

### Env vars

- `BACKEND_ORIGIN` (server only): the backend origin the BFF route handler, the
  socket rewrite, and the server component reads forward to. For example
  `http://localhost:5000`.
- `BACKEND_WS_ORIGIN` (optional): a distinct socket origin for CSP `connect-src`,
  only if the socket is served from somewhere other than our own origin.

## State: zustand stores

Four small stores, each a module singleton:

- `session` holds the user and a status (`idle | loading | authed | anon`). It
  exposes `hydrate` (adopt a session the server already resolved), `load` (ask
  the backend, which can refresh), `signOut`, and `reset`.
- `conversations` holds the list, unread counts, and the ordering (bump to top
  on a new message). `hydrate` seeds it from a server render.
- `messages` holds messages per conversation with optimistic send and settle.
- `requests` holds the pings and group invites for the notification inbox.

Stores hold state and the actions that mutate it. They do not render and they do
not own the socket.

## Realtime: one socket, owned by a provider

`lib/socket.ts` is a module singleton with `connectSocket`, `disconnectSocket`,
`emitWithAck` (never rejects; resolves to a failure envelope on timeout so a send
settles as failed instead of hanging), and `onSocketConnected` (runs now if
already up, and again on every reconnect, which is what rejoins a room after a
network blip).

`features/realtime/socket-provider.tsx` owns the lifecycle. Mounted once at the
root, it connects when the session becomes authed and disconnects on sign out,
and hands the live instance down through React context. Feature hooks
(`use-chat`, `use-typing`, `use-conversation-realtime`, `use-request-realtime`)
read it with `useSocket()` and gate their listener effects on it, so they attach
the moment it connects and clean up on unmount. There is exactly one connection,
and reconnection logic is central.

## First paint comes from the server

`app/dashboard/layout.tsx` is an async Server Component. It resolves the session
and the conversation list on the server (`lib/server/data.ts`, forwarding the
httpOnly cookie to `BACKEND_ORIGIN`) and hands both to a client gate
(`features/dashboard/dashboard-gate.tsx`).

The gate has two paths:

- Server resolved the session: it seeds the stores during the first render, so
  the first paint already has the user and the list. No guard flicker, no client
  fetch waterfall.
- Server could not (for example an access token that expired): it falls back to
  the client, which calls `load` so it can refresh the token before deciding,
  and bounces a truly anonymous visitor to login.

The seed of the conversation list happens during render because nothing above it
subscribes to that store, so there is no cross component update warning. The
session is adopted in an effect so the socket provider, which watches session
status, reacts after mount rather than during a render. The dashboard is
`force-dynamic` since it depends on the request.

Because the cookie is first party to our origin (the reverse proxy keeps
everything same origin), the server component does receive it, so the server
prefetch path is the common one and the client fallback is only for an expired
token. The gate handles both.

## Security posture

- **Nonce based CSP.** `proxy.ts` (Next 16's renamed middleware) sets a per
  request Content Security Policy with a fresh nonce. `script-src` is
  `'self' 'nonce' 'strict-dynamic'` with no `unsafe-inline`, so an injected
  script cannot run. Styles are nonce gated as well, with no `unsafe-inline`
  anywhere: inline style attributes (Framer Motion, React style props) go
  through `style-src-attr`, and sonner's runtime stylesheet is allowed by exact
  hash. `connect-src` is our own origin plus our ws (the socket is same origin
  through the proxy). The root layout threads the nonce into next-themes so its
  anti flash script keeps running. Using a per request nonce makes every route
  dynamic, which is the accepted cost. In development the policy is relaxed
  (`unsafe-eval`, inline, no forced https upgrade) because `next dev` needs eval
  for hot reload and the error overlay; production stays strict.
- **Static security headers.** `next.config.ts` adds nosniff, frame deny,
  referrer policy, and a permissions policy that grants camera and microphone to
  this origin only (for calling) and nothing else.
- **No backend detail in the UI.** `app/error.tsx` logs the real error and shows
  a generic message. `ApiError` messages are safe to surface; stack traces and
  internal URLs are not, and never are.

## Messages

`lib/messages/normalize.ts` turns whatever shape arrives (REST history, a socket
event, a local optimistic echo) into one `Message`. `use-chat` loads history,
joins the room, streams new messages, and sends with an optimistic bubble that
the server echo later settles (success swaps in the real id, failure marks it
failed). `use-typing` tracks who is typing with an expiry, and throttles the
outbound typing ping.

## Media

Upload goes straight to Cloudflare R2 with a presigned URL: ask the backend to
presign (`lib/api/media.ts`), PUT the file to R2 (`lib/media/upload.ts`), then
send one message carrying the stored objects. `lib/media/policy.ts` caps size
and type per kind. The bubble shows local object URLs at once and swaps in the
stored attachments when the echo lands.

## Motion

`lib/springs.ts` holds the spring presets; components animate with motion and
respect reduced motion. The principles (modal task dims and pushes back, a
parallel panel uses translucency and an offset with no scrim, bottom sheets
slide up and dismiss down, time based progress uses linear timing on a transform)
live in `DESIGN.md`. The short version: motion is spatial and calm, one muted
iris violet, and copy never uses a dash.

## How to validate

There is no backend in this sandbox, so the loop is: `npx tsc --noEmit`,
`npm run lint`, `npm run build`, then `npx next start` with Playwright driving a
built page while mocking `**/api/v1/...` and aborting `**/socket.io/**`. That is
how the CSP was checked for zero violations and how the dashboard hydration was
checked for no React warnings.

## Known gaps

- Group info participants are waiting on the backend exposing `participants` and
  `myRole` on `GET /conversation/:id`. The shape is already documented in
  contracts.
- Calling (WebRTC) is the next large feature. The permissions policy already
  grants camera and microphone to this origin for it.
