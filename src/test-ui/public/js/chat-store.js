/* ============================================================
   chat-store.js — CHAT HISTORY THAT SURVIVES NAVIGATION

   THE BUG THIS FIXES
   Messages used to be a plain array rebuilt on every page load. So
   you'd start a call, a card would appear in the transcript, you'd
   navigate to the call screen — and coming back, the array was
   re-initialised and the card was gone. There was nothing left to
   press "Join" or "Return to call" on.

   In a multi-page app anything you expect to still be there after
   navigating has to be stored, not held in a variable.

   sessionStorage for the same reason as CallState: survives
   navigation within the tab, dies with the tab. In production this
   is obviously your database — GET /api/conversations/:id/messages.

   MESSAGE SHAPES
     { from, text, mine }                       plain text
     { from, text, mine, image }                text + attachment
     { type:'call', callType, cardId, from }    a call announcement
   ============================================================ */

const ChatStore = {
  KEY: 'huddle:chats',

  _all() {
    try {
      return JSON.parse(sessionStorage.getItem(this.KEY) || '{}');
    } catch {
      return {};
    }
  },

  _save(map) {
    try {
      sessionStorage.setItem(this.KEY, JSON.stringify(map));
    } catch (e) {
      // Quota is the realistic failure here: base64 images are large
      // and sessionStorage caps out around 5MB. Your real backend
      // won't have this problem, but the demo can.
      console.warn('[chat-store] could not persist:', e);
    }
  },

  /** Messages for one conversation, seeded on first visit. */
  get(convId, peerName) {
    const all = this._all();
    if (!all[convId]) {
      all[convId] = [
        { from: peerName, text: 'Hey 👋', mine: false },
        { from: 'You', text: "Hey! what's up", mine: true },
      ];
      this._save(all);
    }
    return all[convId];
  },

  add(convId, msg) {
    const all = this._all();
    if (!all[convId]) all[convId] = [];
    all[convId].push(msg);
    this._save(all);
    return msg;
  },

  /** Overwrite one conversation's list (used for bulk fixes on load). */
  setAll(convId, list) {
    const all = this._all();
    all[convId] = list;
    this._save(all);
  },

  /** Replace a message in place (used to update upload progress). */
  update(convId, predicate, patch) {
    const all = this._all();
    const list = all[convId] || [];
    const m = list.find(predicate);
    if (!m) return null;
    Object.assign(m, patch);
    this._save(all);
    return m;
  },
};
