/* ============================================================
   call-ui.js — AUTO-HIDE CONTROLS + EMOJI REACTIONS
   Shared by voice-call, video-call and meet.

   ── AUTO-HIDE ──
   Controls and the top bar fade out after a few idle seconds and
   come back on any tap, the way a video player or a phone call
   screen behaves. Without it the chrome permanently covers the
   video you're trying to look at.

   Two things it must NOT do:
   - hide while a panel (chat / participants) is open, or the user
     loses the close button
   - swallow the tap that reveals it (the tap only un-hides; it
     doesn't also press whatever is underneath)
   ============================================================ */

const CallUI = {
  hideAfterMs: 4000,
  timer: null,
  hidden: false,
  root: null,

  init(rootId) {
    this.root = document.getElementById(rootId);
    if (!this.root) return;

    // Any interaction wakes the chrome up and restarts the countdown.
    ['click', 'touchstart', 'mousemove', 'keydown'].forEach((ev) => {
      this.root.addEventListener(ev, () => this.wake(), { passive: true });
    });

    this.wake();
  },

  wake() {
    if (this.hidden) this.show();
    this.arm();
  },

  arm() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.hide(), this.hideAfterMs);
  },

  hide() {
    // Never hide while a panel is open — the close button would go
    // with it and leave the user stuck.
    if (document.querySelector('.panel.open')) { this.arm(); return; }
    this.hidden = true;
    this.root.classList.add('chrome-hidden');
  },

  show() {
    this.hidden = false;
    this.root.classList.remove('chrome-hidden');
  },
};

/* ============================================================
   REACTIONS — a quick emoji that floats up and disappears.

   Deliberately ephemeral: no state, no history, nothing stored.
   A call reaction is a moment, not a message. (The persistent kind
   that attaches to a chat message is a different feature with a
   different table — message_reactions.)

   Real wiring: broadcast over the data channel (or your socket) and
   call CallReactions.fly(emoji) on receipt so everyone sees it.
   ============================================================ */

const CallReactions = {
  SET: ['👍', '❤️', '😂', '🎉', '👏', '😮'],

  init({ buttonId, barId, layerId, onSend }) {
    this.bar = document.getElementById(barId);
    this.layer = document.getElementById(layerId);
    this.onSend = onSend;
    if (!this.bar) return;

    this.bar.innerHTML = this.SET.map(
      (e) => '<button class="react-btn" data-emoji="' + e + '">' + e + '</button>'
    ).join('');

    this.bar.querySelectorAll('[data-emoji]').forEach((b) => {
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const emoji = b.dataset.emoji;
        this.fly(emoji);
        this.close();
        // TODO: dataChannel.send(JSON.stringify({ kind:'reaction', emoji }))
        if (this.onSend) this.onSend(emoji);
      });
    });

    const btn = document.getElementById(buttonId);
    if (btn) {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.bar.classList.toggle('open');
      });
    }

    document.addEventListener('click', (ev) => {
      if (!this.bar.contains(ev.target) && ev.target !== btn) this.close();
    });
  },

  close() {
    if (this.bar) this.bar.classList.remove('open');
  },

  /** Float one emoji up the screen, then remove it. */
  fly(emoji) {
    if (!this.layer) return;
    const node = document.createElement('div');
    node.className = 'react-fly';
    node.textContent = emoji;
    // Slight horizontal scatter so several at once don't overlap.
    node.style.left = (35 + Math.random() * 30) + '%';
    this.layer.appendChild(node);
    // Remove after the animation so the DOM doesn't accumulate nodes.
    setTimeout(() => node.remove(), 2600);
  },
};
