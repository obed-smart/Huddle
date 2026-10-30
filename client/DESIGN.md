# Huddle — Design & Build Plan

How we build the Huddle client. The look is already set by the Huddle Design
System (one muted iris-violet on soft neutrals, light + dark). This doc is the
*feel*: the interaction, motion, and material language, plus the library stack
and the section roadmap — informed by Apple's design principles (WWDC
*Designing Fluid Interfaces* and *Principles of Great Design*).

**The emotion we design for: calm + confident.** Nothing shouts; everything
responds. We keep the quiet surface and make every interaction feel physical.

## Principles we build by

1. **Purpose** — it's a demo that showcases a backend. Build only what shows the
   backend off well; cut the rest.
2. **Agency** — easy undo over confirm dialogs. A dialog only for destructive,
   irreversible actions (leave group, delete).
3. **Responsibility** — httpOnly cookies, ask for mic/camera at the moment of
   use, never before.
4. **Familiarity** — chat conventions people know: bubbles, swipe, pull-to-refresh,
   a red end-call button. Don't reinvent.
5. **Flexibility** — phone is quick-touch, desktop is precise-pointer. Both first-class.
6. **Simplicity, not minimalism** — common path first, advanced one level deeper.
7. **Craft** — every spacing, timing, and alignment value is deliberate.
8. **Delight** — the result of the other seven, not confetti.

## Motion language

Add **motion** (Framer Motion) for anything a user can touch. Plain CSS
transitions stay fine for simple hover/fade.

- **Respond on pointer-down**, never on release. Buttons/rows get `:active`
  `scale(0.97)` at ~100ms. Zero input latency is the foundation.
- **Springs, not fixed durations**, for gesture-driven UI. Default is
  **critically damped** (`bounce: 0`, `duration: 0.3–0.4`). Add **bounce ~0.2
  only after a momentum gesture** (a flick, a drag release) — never on a plain fade.
- **Interruptible always.** Sheets, panels, and the call minimize animate from
  their live on-screen value, so they can be grabbed and reversed mid-flight.
- **1:1 direct manipulation** with Pointer Events + `setPointerCapture`,
  velocity handoff, and momentum projection for: bottom sheets, swipe on
  conversation rows, pull-to-dismiss on the media viewer, minimize-to-PiP on calls.
  (shadcn **Drawer** wraps Vaul and gives us this out of the box.)
- **Rubber-band** at boundaries (list top, over-dragged sheet) — resist, don't hard-stop.
- Apple's shipped spring values we reuse: move/reposition `damping 1.0 / response 0.4`;
  drawer/sheet `damping 0.8 / response 0.3`.
- **Reduced motion is a first-class path**, baked into each component: cross-fade
  instead of slide, drop overshoot. Also honor `prefers-reduced-transparency`
  (frost → solid) and `prefers-contrast` (near-solid + border).

## Materials & depth

Translucency is a functional layer that adds structure without stealing focus.

- **Chrome is translucent**: the app header, the call control bar, and sheets use
  `backdrop-filter: blur()` + a semi-transparent surface, with content scrolling
  under — not opaque bars. (The landing header already does this; make it systemic.)
- **Material weight encodes hierarchy** — heavier for structural regions (the
  conversation sidebar), lighter for interactive elements. Never stack two light
  translucent surfaces.
- **Dim to focus, separate to keep flow** — a modal task gets a scrim and pushes
  the background back; a parallel panel (chat beside the list) uses translucency
  and offset *without* a scrim.
- **Scroll edge effects, not hard dividers** — fade a small blur/gradient mask
  where content meets a sticky header, instead of a 1px line.
- **Materialize** — animate blur + scale together on sheet enter/exit, so it reads
  as a real surface arriving.

This adds **material tokens** to the design system: blur strengths, translucent
surface colors, and a scrim.

## Typography

- **Size-specific tracking** — tighten large headings (`-0.02em`), body near `0`,
  tiny labels slightly positive. One fixed `letter-spacing` is wrong somewhere.
- **Leading inverse to size** — tight on display, looser on body (the token scale
  already does this).
- **`font-optical-sizing: auto`** on our variable faces (Inter, Plus Jakarta Sans).
- Build hierarchy from **weight + size + leading as a set**, not size alone.
- Spacing in `rem`/`em` so a larger text setting scales the layout, not breaks it.

## Feedback & wayfinding

- **Four kinds of feedback**: status, completion, warning, error. Validate inline
  (on blur), not on submit — the auth forms get this treatment.
- **Toasts (Sonner)** for completion/status; **AlertDialog** only before
  destructive actions; optional **haptics** (Vibration API) on commit/snap
  (call answer, message send) — reserved for meaningful moments only.
- **Every screen answers**: Where am I? Where can I go? What's here? How do I get
  out? Never trap the user.
- **Direct nav labels** — "Chats", "Calls", "Meet", "Requests" — not "Home".

## Library stack

Taste-driven picks (Emil Kowalski's list); most arrive through shadcn.

| Concern | Library | Status |
| --- | --- | --- |
| Accessible primitives (dialog, popover, menu, select, tabs…) | base-ui via shadcn | in use |
| Conditional classes / variant styling | clsx + cva | in use |
| Toasts | Sonner | installed |
| Icons | lucide-react | in use |
| Verification-code input | input-otp (shadcn) | add at verify-email |
| ⌘K search (users, conversations) | cmdk (shadcn Command) | add at app shell |
| Bottom sheets / drawers | Vaul (shadcn Drawer) | add at app shell |
| Springs, gestures, enter/exit | motion | add at foundation |
| Dark mode without flash | next-themes | add at foundation |
| Shared client state (user, socket, active call, unread) | zustand | add at app shell |
| Virtualized long lists (messages, conversations) | Virtuoso | add at chat |
| Animated counters / call timer | NumberFlow | optional |

Not needed for a chat app: charts (recharts/liveline), drag-and-drop (dnd kit) —
skip unless a feature asks for them.

## Section roadmap

Each section ships with its fluid details, small files (<200 lines), as its own
set of commits.

- **Done** — landing, auth (login/register/Google), new-message toast.
- **0 · Foundation** — `next-themes` (dark toggle, no flash), `motion`, spring
  presets, material tokens, the reduced-motion story. Retrofit pointer-down
  feedback and inline validation onto the landing + auth.
- **1 · App shell + conversation list** — translucent header; `zustand` for
  session/socket/unread; `cmdk` search over `/user/search`; `Virtuoso` list;
  conversation rows with swipe-to-archive / mark-read (1:1 + projection);
  spring on the selected row; wayfinding nav.
- **2 · Chat thread** — `Virtuoso` with stick-to-bottom; send = pointer-down +
  optimistic bubble that springs in; scroll-edge fade under the header;
  attachment picker as a Drawer (Vaul); voice note press-and-hold with a haptic.
- **3 · Media & voice** — media viewer with pull-to-dismiss (1:1 + rubber-band);
  waveform playback.
- **4 · Pings & requests** — the notifications inbox (incoming pings, group
  invites, join requests) with completion feedback on accept/decline.
- **5 · Calls** — dark translucent control bar; answer/decline with motion +
  haptic; minimize-to-PiP as a draggable spring (`damping 1.0 / response 0.4`);
  fully interruptible.
- **6 · Meet** — participant grid; active-speaker spring ring; side panel
  (translucent, no scrim).
- **Slots in** — verify-email + unverified-login (`input-otp`) with auth;
  auth→backend wiring (same-origin or a Next route-handler proxy).

## What does not change

The calm single-hue palette, the soft neutrals, the muted signals, files under
200 lines, and section-by-section PRs on the feature branch. Apple-grade feel is
added *on top of* the calm — it never makes the UI louder.
