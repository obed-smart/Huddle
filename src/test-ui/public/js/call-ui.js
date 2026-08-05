/* ============================================================
   call-ui.js — CALL CHROME, REACTIONS, VOICE→VIDEO UPGRADE
   Shared by voice-call, video-call and meet.
   ============================================================ */

/* ============================================================
   AUTO-HIDE CHROME
   Controls and the top bar fade after a few idle seconds and come
   back on any tap, like a video player. Without it the chrome
   permanently covers what you're trying to watch.
   ============================================================ */
const CallUI = {
  hideAfterMs: (typeof DEMO !== 'undefined' ? DEMO.chromeIdleMs : 4000),
  timer: null,
  hidden: false,
  root: null,

  init(rootId) {
    this.root = document.getElementById(rootId);
    if (!this.root) return;
    ['click', 'touchstart', 'mousemove', 'keydown'].forEach((ev) => {
      this.root.addEventListener(ev, () => this.wake(), { passive: true });
    });
    this.wake();
  },

  wake() { if (this.hidden) this.show(); this.arm(); },
  arm() { clearTimeout(this.timer); this.timer = setTimeout(() => this.hide(), this.hideAfterMs); },

  hide() {
    // Never hide while a panel or prompt is open — the close button
    // would go with it and strand the user.
    if (document.querySelector('.panel.open, .prompt.open')) { this.arm(); return; }
    this.hidden = true;
    this.root.classList.add('chrome-hidden');
  },

  show() { this.hidden = false; this.root.classList.remove('chrome-hidden'); },
};


/* ============================================================
   REACTIONS

   Each reaction carries a NAME. In a meet with six people an
   anonymous emoji tells you nothing — the name is what makes it
   information rather than decoration.

   ── WHY SOCKETS, NOT THE DATA CHANNEL ──
   Over a data channel the payload must include `from`, so identity
   is SELF-ASSERTED — any peer can send `from: "Chris"`. Over your
   socket the server already knows `socket.userId` from the
   handshake, so the client sends only `{ emoji }` and the SERVER
   stamps the sender. A client that lies is ignored.

   You already own `conversation:<id>` rooms, so the fanout exists.
   The data channel's only edge is ~30ms of latency, imperceptible
   on a floating emoji — a poor trade for spoofable identity.

   (File transfer is the opposite case: bulk binary shouldn't touch
   your server, and identity is already established by the session.
   Different requirements, different transport.)
   ============================================================ */
const CallReactions = {
  SET: ['👍', '❤️', '😂', '🎉', '👏', '😮'],

  init({ buttonId, barId, layerId, myName, onSend }) {
    this.bar = document.getElementById(barId);
    this.layer = document.getElementById(layerId);
    this.myName = myName || 'You';
    this.onSend = onSend;
    if (!this.bar) return;

    this.bar.innerHTML = this.SET.map(
      (e) => '<button class="react-btn" data-emoji="' + e + '">' + e + '</button>'
    ).join('');

    this.bar.querySelectorAll('[data-emoji]').forEach((b) => {
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const emoji = b.dataset.emoji;
        // Launch from the button you actually tapped, so the emoji
        // rises out of your finger rather than materialising at a
        // fixed point on screen.
        const r = b.getBoundingClientRect();
        this.fly(emoji, this.myName, r.left + r.width / 2, r.top);
        this.close();

        /* TRANSPORT NOTE — send this over your SOCKET, not the data
           channel. The client sends only { emoji }; the SERVER stamps
           who sent it from socket.userId. Over a data channel the
           payload would have to carry its own `from` field, which the
           sender controls — so anyone could react as anyone else, and
           in a six-person meet nobody would notice.

             socket.emit('call:reaction', { conversationId, emoji })

           Then on receipt, for everyone including yourself:
             socket.on('call:reaction', ({ fromDisplayName, emoji }) =>
               CallReactions.fly(emoji, fromDisplayName));
        */
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

  /**
   * Float one reaction up the screen with the sender's name attached,
   * fading out around 80% of the way up.
   *
   * The name matters: without it a meet reaction is anonymous, and
   * "someone clapped" is much less useful than "Obed clapped".
   *
   * @param {string} emoji
   * @param {string} name   display name, shown as a pill under the emoji
   * @param {number} [x]    launch x in px; defaults to a random centre spread
   */
  fly(emoji, name, x, y) {
    if (!this.layer) return;

    const node = document.createElement('div');
    node.className = 'react-fly';
    node.innerHTML =
      '<div class="rf-emoji">' + emoji + '</div>' +
      '<div class="rf-name">' + esc(name) + '</div>';

    const box = this.layer.getBoundingClientRect();
    // Launch point: where you tapped, else a spread near the centre.
    const left = x != null ? x - box.left : box.width * (0.35 + Math.random() * 0.3);
    const top  = y != null ? y - box.top  : box.height - 130;

    node.style.left = left + 'px';
    node.style.top = top + 'px';
    // Rise ~80% of the container height, then fade — it should clear
    // the frame without colliding with the top bar.
    node.style.setProperty('--rise', -(box.height * 0.8) + 'px');
    // Slight sideways drift so simultaneous reactions don't stack.
    node.style.setProperty('--drift', (Math.random() * 70 - 35) + 'px');

    this.layer.appendChild(node);
    // Remove after the animation, or the DOM accumulates dead nodes
    // over a long call.
    setTimeout(() => node.remove(), 2600);
  },
};
