/* ============================================================
   call-state.js — THE ONE ACTIVE CALL

   Two rules this file exists to enforce:

   1. ONE CALL AT A TIME. This is a single object, not a map —
      you cannot be in two calls at once.

   2. A CALL SURVIVES NAVIGATION. Backing out of the call screen
      does NOT end it; the dashboard then shows an "in a call" bar
      and the chat card offers "Return to call". Only the end
      button clears it.

   Because this is a multi-page app, that state has to outlive the
   page. sessionStorage is the right fit: it survives navigation
   within the tab but dies when the tab closes, which matches a
   call's natural lifetime. localStorage would be wrong — a call
   surviving a browser restart is a lie.

   ── IMPORTANT ──
   In production the SERVER owns this. The one-call rule here is
   advisory: a second tab, or a user who clears storage, walks
   straight past it. Reject a second call:invite server-side the
   same way you already reject duplicate DM pings, and reconcile
   this cache against the server on page load — otherwise a crashed
   tab leaves a phantom "in a call" bar nobody can clear.
   ============================================================ */

const CallState = {
  KEY: 'huddle:activeCall',

  /** @returns {{convId:string,convName:string,type:string,people:string[],cardId:string}|null} */
  get() {
    try {
      return JSON.parse(sessionStorage.getItem(this.KEY) || 'null');
    } catch {
      return null;
    }
  },

  _save(call) {
    try {
      if (call) sessionStorage.setItem(this.KEY, JSON.stringify(call));
      else sessionStorage.removeItem(this.KEY);
    } catch (e) {
      console.warn('[call-state] persist failed:', e);
    }
  },

  /** Is a call running at all? */
  isActive() {
    return !!this.get();
  },

  /** Is the active call the one this card announced? */
  isCard(cardId) {
    const c = this.get();
    return !!c && c.cardId === cardId;
  },

  /** Is the active call in this conversation? */
  inConversation(convId) {
    const c = this.get();
    return !!c && c.convId === convId;
  },

  /**
   * Begin a call. Returns the new cardId so the chat can tag the
   * card it just posted — that tag is what keeps OLD cards showing
   * "Ended" instead of every card in the room lighting up.
   */
  start(convId, convName, type) {
    const cardId = 'call-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    this._save({ convId, convName, type, people: ['You'], cardId });
    // TODO: socket.emit('call:start', { conversationId: convId, type })
    return cardId;
  },

  /** You tapped Join on someone else's live call. */
  join() {
    const c = this.get();
    if (!c || c.people.includes('You')) return;
    c.people.push('You');
    this._save(c);
  },

  /** Call is over. */
  end() {
    this._save(null);
    // TODO: socket.emit('call:end', ...)
  },

  addPerson(name) {
    const c = this.get();
    if (!c || c.people.includes(name)) return;
    c.people.push(name);
    this._save(c);
  },

  removePerson(name) {
    const c = this.get();
    if (!c) return;
    c.people = c.people.filter((p) => p !== name);
    this._save(c);
  },

  /** Upgrading a voice call to video changes its type in place. */
  setType(type) {
    const c = this.get();
    if (!c) return;
    c.type = type;
    this._save(c);
  },

  /**
   * Screen sharing does NOT survive navigation.
   *
   * Leaving the page tears down the display stream — the browser
   * ends the capture and there's no way to silently resume it
   * (getDisplayMedia requires a fresh user gesture and picker every
   * time, by design). So when you come back, you are genuinely not
   * sharing any more.
   *
   * The bug this fixes: the flag used to persist, so returning to
   * the meet showed "Sharing your screen" over a capture that had
   * already stopped. Clearing it on entry keeps the UI honest.
   */
  setSharing(on) {
    const c = this.get();
    if (!c) return;
    c.sharing = !!on;
    this._save(c);
  },

  clearSharing() {
    const c = this.get();
    if (!c || !c.sharing) return;
    c.sharing = false;
    this._save(c);
  },
};
