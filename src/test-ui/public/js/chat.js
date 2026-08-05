/* Optional dependency check. Guarded, so boot.js can be deleted or
   commented out and this page still runs — a diagnostic must never
   be load-bearing. */
if (typeof __reportMissing === 'function') __reportMissing([['CallState', typeof CallState], ['ChatStore', typeof ChatStore], ['VoiceNote', typeof VoiceNote], ['renderSidebar', typeof renderSidebar], ['paintIcons', typeof paintIcons], ['el', typeof el]]);

/* ============================================================
   chat.js — THE HUB

   Calls are started here and announced here as a card in the
   transcript. Three rules matter:

   1. ONE CALL AT A TIME. Tapping the call button while a call runs
      is blocked. (UI only — the server must reject a second
      call:invite too; a second tab never sees this check.)

   2. EACH CARD HAS ITS OWN ID. A card is "live" only if it is THE
      active call — not merely because a call exists in this
      conversation. Otherwise every old card lights up again.

   3. HISTORY PERSISTS (chat-store.js). Cards have to still be there
      when you come back from the call screen, or there's nothing
      left to press Join on.
   ============================================================ */

const target = getTarget();
let messages = ChatStore.get(target.id, target.name);

el('chatName').textContent = target.name;
el('chatAv').textContent = (target.name || '?')[0].toUpperCase();
el('chatSub').textContent = 'online';

/* ---------- render ---------- */

function renderChat() {
  messages = ChatStore.get(target.id, target.name);
  const box = el('chatInner');
  box.innerHTML = '';
  messages.forEach((m) => {
    if (m.type === 'call') { box.appendChild(callCard(m)); return; }
    box.appendChild(bubble(m));
  });
  el('chatBody').scrollTop = el('chatBody').scrollHeight;
}

/**
 * A text message, an image attachment, or both — an image usually
 * arrives WITH a caption, so they share one bubble rather than
 * being two separate messages.
 */
function bubble(m) {
  const d = document.createElement('div');
  d.className = 'msg' + (m.mine ? ' mine' : '');

  let inner = '';

  if (m.audio) {
    // Voice note: play control, a static waveform, and the duration
    // WE recorded — not the file's metadata, which is often missing
    // from MediaRecorder WebM.
    inner +=
      '<div class="vn-msg">' +
      '<button class="vn-play" data-audio="' + m.audio + '">' + svg('play') + '</button>' +
      '<div class="vn-msg-wave">' + '<i></i>'.repeat(14) + '</div>' +
      '<span class="vn-msg-time">' + fmtDuration(m.seconds || 0) + '</span>' +
      '</div>';
  }

  if (m.file) {
    // A plain file: name, size, download. No preview attempted —
    // this is also where oversized videos land, so the recipient
    // downloads rather than the chat trying to stream them inline.
    const pending = m.uploadPct != null && m.uploadPct < 100;
    inner +=
      '<div class="file-att">' + svg('file') +
      '<div class="file-att-info">' +
        '<div class="file-att-name">' + esc(m.name) + '</div>' +
        (pending
          ? '<div class="file-bar"><div class="file-fill" style="width:' +
            m.uploadPct + '%"></div></div>' +
            '<div class="file-att-meta">Uploading ' + Math.round(m.uploadPct) + '%</div>'
          : '<div class="file-att-meta">' + bytes(m.size) +
            (m.note ? ' · ' + esc(m.note) : '') + '</div>') +
      '</div>' +
      (!pending && m.url
        ? '<a class="file-att-dl" href="' + m.url + '" download="' + esc(m.name) +
          '">' + svg('download') + '</a>'
        : '') +
      '</div>';
  }

  if (m.images && m.images.length) {
    inner += renderAlbum(m);
  } else if (m.image || m.video) {
    const pending = m.uploadPct != null && m.uploadPct < 100;
    const media = m.video
      // preload="metadata" loads the poster frame and duration without
      // pulling the whole file — a transcript of autoloading videos
      // will saturate a phone connection.
      ? '<video src="' + m.video + '" controls preload="metadata" playsinline></video>'
      : '<img src="' + m.image + '" alt="" />';

    inner +=
      '<div class="attach' + (pending ? ' uploading' : '') +
        (m.video ? ' is-video' : '') + '">' +
      media +
      (pending ? uploadOverlay(m.uploadPct) : '') +
      (m.expired ? '<div class="attach-gone">Video unavailable after reload</div>' : '') +
      '</div>';
  }

  if (m.text) inner += '<div class="bubble-text">' + esc(m.text) + '</div>';

  d.innerHTML = '<div class="bubble' + (m.image || m.video ? ' has-image' : '') +
                (m.audio ? ' has-audio' : '') +
                (m.file ? ' has-file' : '') + '">' + inner + '</div>';

  // One <audio> per bubble, created on demand so a long transcript
  // doesn't build dozens of media elements up front.
  const play = d.querySelector('.vn-play');
  if (play) {
    play.addEventListener('click', () => {
      if (!play._audio) {
        play._audio = new Audio(play.dataset.audio);
        play._audio.onended = () => { play.innerHTML = svg('play'); };
      }
      if (play._audio.paused) { play._audio.play(); play.innerHTML = svg('pause'); }
      else { play._audio.pause(); play.innerHTML = svg('play'); }
    });
  }

  return d;
}

/* Spinner-style progress the sender sees over their own image —
   the picture is visible immediately, the bytes follow. */
function uploadOverlay(pct) {
  return '<div class="up-veil"><div class="up-ring" style="--pct:' +
         Math.round(pct) + '"></div>' +
         '<span class="up-pct">' + Math.round(pct) + '%</span></div>';
}

/**
 * An album: several images sent as ONE message.
 *
 * Layout follows what messaging apps settled on — 1 fills the width,
 * 2 split it, 3+ tile, and past 4 the last tile carries a "+N" so a
 * 20-image drop doesn't turn the transcript into a wall.
 *
 * RECEIVING SIDE
 * Incoming media is NOT auto-fetched. Each tile shows a skeleton with
 * a download control until the recipient asks for it. That's a real
 * courtesy on mobile data, and it's why `needsDownload` exists rather
 * than the image simply appearing.
 */
function renderAlbum(m) {
  const imgs = m.images;
  const shown = imgs.slice(0, 4);
  const extra = imgs.length - shown.length;

  const tiles = shown.map((im, i) => {
    const last = i === shown.length - 1 && extra > 0;
    let body;

    if (im.needsDownload) {
      // Skeleton + download affordance. No src is set at all, so
      // nothing is fetched until asked for.
      body = '<div class="skel"></div>' +
             (im.downloadPct != null
               ? '<div class="dl-ring" style="--pct:' + Math.round(im.downloadPct) + '"></div>'
               : '<button class="dl-btn" data-dl="' + m.id + ':' + i + '">' +
                 svg('download') + '</button>');
    } else {
      body = '<img src="' + im.url + '" alt="" />' +
             (im.uploadPct != null && im.uploadPct < 100 ? uploadOverlay(im.uploadPct) : '');
    }

    return '<div class="al-tile">' + body +
           (last ? '<div class="al-more">+' + extra + '</div>' : '') + '</div>';
  }).join('');

  return '<div class="album n' + Math.min(shown.length, 4) + '">' + tiles + '</div>';
}

function callCard(m) {
  const live = CallState.isCard(m.cardId);
  const call = CallState.get();

  const card = document.createElement('div');
  card.className = 'call-card' + (live ? ' live' : '');

  const icon = m.callType === 'meet' ? 'users' : m.callType === 'voice' ? 'phone' : 'video';

  let html =
    '<div class="cc-top"><span class="cc-icon">' + svg(icon) + '</span>' +
    '<div class="cc-body">' +
    '<div class="cc-title">' + (m.mine ? 'You' : esc(m.from)) +
    ' started a ' + kindLabel(m.callType).toLowerCase() + ' call</div>' +
    '<div class="cc-meta">' + (live ? call.people.length + ' in call' : 'Ended') + '</div>' +
    '</div></div>';

  if (live) {
    const inIt = call.people.includes('You');
    html +=
      '<button class="cc-btn ' + (inIt ? 'btn-return' : 'btn-join') + '" data-act="' +
      (inIt ? 'return' : 'join') + '">' +
      svg(inIt ? 'arrow-left' : 'phone') +
      (inIt ? 'Return to call' : 'Join') + '</button>';
  }

  card.innerHTML = html;

  card.querySelectorAll('[data-act]').forEach((b) => {
    b.addEventListener('click', () => {
      if (b.dataset.act === 'join') CallState.join();
      go(callUrl(m.callType, target));
    });
  });

  return card;
}

/* ---------- sending text ---------- */

function sendMessage() {
  const input = el('msgInput');
  const text = input.value.trim();
  if (!text) return;
  // TODO: socket.emit('message:send', { conversationId: target.id, text })
  ChatStore.add(target.id, { from: 'You', text, mine: true });
  input.value = '';
  renderChat();
}
el('sendBtn').addEventListener('click', sendMessage);
el('msgInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

/* ---------- image attachments ----------
   Rendered inside the message bubble with an upload progress bar,
   because that's what a real attachment looks like: the message
   exists immediately, the bytes arrive after.

   REAL IMPLEMENTATION (when you build uploads):
     1. POST the file to your own endpoint or a signed S3 URL.
        Do NOT base64 it into the message row — you'd bloat the
        table and blow past payload limits.
     2. Store only the resulting URL/key on the message.
     3. Either emit the message once the upload resolves, or emit
        immediately with a pending flag and patch it after.
   Here it's a data URL purely so the demo needs no backend.        */

/* Paperclip opens a small anchored menu; each entry opens a picker
   restricted to one type. */
el('attachBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const btn = document.getElementById('attachBtn');
  const menu = el('attachMenu');
  const r = btn.getBoundingClientRect();
  menu.style.position = 'fixed';
  // Opens UPWARD — the composer sits at the bottom of the screen.
  menu.style.bottom = (window.innerHeight - r.top + 8) + 'px';
  menu.style.top = 'auto';
  menu.style.left = Math.max(12, r.left) + 'px';
  menu.style.right = 'auto';
  menu.style.transformOrigin = 'bottom left';
  menu.classList.add('open');
});

const ATTACH_INPUT = { image: 'imgInput', video: 'vidInput', file: 'fileAny' };

document.querySelectorAll('[data-attach]').forEach((row) => {
  row.addEventListener('click', () => {
    el('attachMenu').classList.remove('open');
    el(ATTACH_INPUT[row.dataset.attach] || 'imgInput').click();
  });
});

document.addEventListener('click', (e) => {
  const menu = el('attachMenu');
  const btn = document.getElementById('attachBtn');
  if (menu.classList.contains('open') && !menu.contains(e.target) &&
      btn && !btn.contains(e.target)) {
    menu.classList.remove('open');
  }
});

/* Images are read as data URLs so they survive a page navigation in
   this demo. Videos are NOT — see the note in attachFile(). */
const MAX_INLINE_IMAGE = 1.5 * 1024 * 1024;

['imgInput', 'vidInput', 'fileAny'].forEach((id) => {
  el(id).addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';

    // Several images become ONE album message rather than a burst of
    // separate bubbles — that's what makes a 6-photo drop readable.
    if (id === 'imgInput' && files.length > 1) {
      attachAlbum(files);
      return;
    }

    // Picking via "File" sends the original as an attachment even if
    // it happens to be an image or video — no preview, no re-encode.
    attachFile(files[0], id === 'fileAny' ? 'file' : 'auto');
  });
});

/**
 * Several images as one message.
 *
 * Object URLs, not data URLs: a handful of photos as base64 would
 * blow the demo's storage in one go. They render instantly and die
 * with the page, which is the same trade already made for video.
 */
function attachAlbum(files) {
  const caption = el('msgInput').value.trim();
  el('msgInput').value = '';

  const capped = files.slice(0, 10);
  const id = 'alb-' + Date.now();

  ChatStore.add(target.id, {
    id, from: 'You', mine: true, text: caption,
    images: capped.map((f) => ({ url: URL.createObjectURL(f), uploadPct: 0 })),
  });
  renderChat();

  // Each image uploads on its own timeline — they don't finish
  // together in reality, and a single shared bar would hide that.
  capped.forEach((f, i) => simulateAlbumUpload(id, i, f.size));
}

function simulateAlbumUpload(msgId, index, sizeBytes) {
  const steps = Math.max(4, Math.min(30, Math.round(sizeBytes / 200000)));
  const per = 100 / steps;
  const tick = () => {
    const list = ChatStore.get(target.id, target.name);
    const m = list.find((x) => x.id === msgId);
    if (!m || !m.images || !m.images[index]) return;
    m.images[index].uploadPct = Math.min(100, (m.images[index].uploadPct || 0) + per);
    ChatStore.setAll(target.id, list);
    renderChat();
    if (m.images[index].uploadPct < 100) setTimeout(tick, 160 + Math.random() * 120);
  };
  setTimeout(tick, 150 + index * 120);
}

/* ---------- receiving: download on demand ----------
   Incoming media is never auto-fetched. The tile is a skeleton with
   a download button; tapping it streams the image in. */
document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('[data-dl]');
  if (!btn) return;
  const [msgId, idxStr] = btn.dataset.dl.split(':');
  downloadAlbumImage(msgId, Number(idxStr));
});

function downloadAlbumImage(msgId, index) {
  const list = ChatStore.get(target.id, target.name);
  const m = list.find((x) => x.id === msgId);
  if (!m || !m.images || !m.images[index]) return;
  const im = m.images[index];
  if (im.downloadPct != null) return;      // already downloading

  im.downloadPct = 0;
  ChatStore.setAll(target.id, list);
  renderChat();

  const tick = () => {
    const l2 = ChatStore.get(target.id, target.name);
    const m2 = l2.find((x) => x.id === msgId);
    if (!m2) return;
    const t = m2.images[index];
    t.downloadPct = Math.min(100, (t.downloadPct || 0) + 12 + Math.random() * 16);
    if (t.downloadPct >= 100) {
      // Arrived — swap the skeleton for the real image.
      t.needsDownload = false;
      delete t.downloadPct;
    }
    ChatStore.setAll(target.id, l2);
    renderChat();
    if (t.needsDownload) setTimeout(tick, 170);
  };
  setTimeout(tick, 200);
}

/**
 * Attach an image or a video.
 *
 * ── WHY THE TWO ARE HANDLED DIFFERENTLY ──
 * An image becomes a base64 data URL, which sessionStorage can hold,
 * so it survives navigating to a call and back.
 *
 * A video cannot. sessionStorage caps around 5MB and base64 inflates
 * a file by ~33%, so a single phone clip would blow the quota and
 * take the whole chat history down with it. Videos therefore use an
 * object URL: it plays immediately, but it dies on reload — which is
 * honest, because that's exactly the state a real app is in before
 * the upload finishes. Once you have real uploads, the message
 * stores a CDN URL and the problem disappears for both types.
 */
/**
 * Attach anything.
 *
 * @param {File} file
 * @param {'auto'|'file'} mode  'file' forces a plain attachment even
 *        for an image or video — useful for sending an original
 *        without the chat re-encoding or preview-ing it.
 */
function attachFile(file, mode) {
  const forceFile = mode === 'file';
  const isVideo = !forceFile && file.type.startsWith('video/');
  const isImage = !forceFile && file.type.startsWith('image/');

  // Hard ceiling regardless of type. A client check is a courtesy —
  // the SERVER is what actually stops a 2GB upload.
  if (file.size > DEMO.maxFileMB * 1024 * 1024) {
    toast('File too large (over ' + DEMO.maxFileMB + 'MB)');
    return;
  }

  const caption = el('msgInput').value.trim();
  el('msgInput').value = '';

  if (isVideo) {
    // Duration is only readable once metadata loads, so the check is
    // async — a long clip still sends, but as a FILE rather than an
    // inline player.
    probeVideoDuration(file, (seconds) => {
      const tooLong = seconds > DEMO.maxVideoMinutes * 60;
      if (tooLong) {
        sendAsFile(file, caption,
          'Sent as file · ' + Math.round(seconds / 60) + ' min');
      } else {
        const id = 'vid-' + Date.now();
        ChatStore.add(target.id, {
          id, from: 'You', mine: true, text: caption,
          video: URL.createObjectURL(file), uploadPct: 0,
        });
        renderChat();
        simulateUpload(id, file.size);
      }
    });
    return;
  }

  if (isImage) {
    if (file.size > MAX_INLINE_IMAGE) {
      // Too big to inline in the demo's storage — send it as a file
      // rather than refusing.
      sendAsFile(file, caption, 'Sent as file');
      return;
    }
    const id = 'img-' + Date.now();
    const reader = new FileReader();
    reader.onload = () => {
      ChatStore.add(target.id, {
        id, from: 'You', mine: true, text: caption,
        image: reader.result, uploadPct: 0,
      });
      renderChat();
      simulateUpload(id, file.size);
    };
    reader.readAsDataURL(file);
    return;
  }

  sendAsFile(file, caption);
}

/** A plain file attachment — no preview, just name, size, download. */
function sendAsFile(file, caption, note) {
  const id = 'file-' + Date.now();
  ChatStore.add(target.id, {
    id, from: 'You', mine: true, text: caption,
    file: true, name: file.name, size: file.size, note,
    url: URL.createObjectURL(file), uploadPct: 0,
  });
  renderChat();
  simulateUpload(id, file.size);
}

/**
 * Read a video's duration without playing it.
 *
 * Needs a real <video> element and a metadata load — there's no way
 * to get duration from a File directly. Falls back to 0 (i.e. treat
 * as short) if metadata never arrives, rather than blocking the send.
 */
function probeVideoDuration(file, cb) {
  const url = URL.createObjectURL(file);
  const v = document.createElement('video');
  v.preload = 'metadata';
  let done = false;
  const finish = (secs) => {
    if (done) return;
    done = true;
    URL.revokeObjectURL(url);
    cb(secs);
  };
  v.onloadedmetadata = () => finish(v.duration || 0);
  v.onerror = () => finish(0);
  setTimeout(() => finish(0), 4000);   // don't hang on a codec the browser can't parse
  v.src = url;
}

/**
 * Stand-in for upload progress. Bigger files take longer, which is
 * the one property worth simulating — it's what makes the pending
 * state visible long enough to test.
 *
 * Real: XHR upload.onprogress, or fetch with a stream reader.
 */
function simulateUpload(id, sizeBytes) {
  const steps = Math.max(4, Math.min(40, Math.round(sizeBytes / 200000)));
  const perStep = 100 / steps;

  const tick = () => {
    const list = ChatStore.get(target.id, target.name);
    const m = list.find((x) => x.id === id);
    if (!m) return;
    const next = Math.min(100, (m.uploadPct || 0) + perStep);
    ChatStore.update(target.id, (x) => x.id === id, { uploadPct: next });
    renderChat();
    if (next < 100) setTimeout(tick, 180);
  };
  setTimeout(tick, 200);
}

/* An object URL only lives as long as the page that created it. Any
   blob: URL still in storage came from a PREVIOUS load and is
   already dead, so mark it — the bubble then explains itself instead
   of rendering a broken player.

   This runs once, before anything new is attached, so videos added
   during this session are untouched. */
(function markDeadObjectUrls() {
  const list = ChatStore.get(target.id, target.name);
  let changed = false;
  list.forEach((m) => {
    if (m.video && String(m.video).startsWith('blob:') && !m.expired) {
      m.expired = true;
      changed = true;
    }
  });
  if (changed) ChatStore.setAll(target.id, list);
})();

/* ---------- starting a call ---------- */

el('callBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const call = CallState.get();
  if (call) {
    toast(call.convId === target.id
      ? 'You are already in this call'
      : 'End your call with ' + call.convName + ' first');
    return;
  }
  openCallMenu();
});

/**
 * Position the menu under the call button and open it.
 *
 * Anchored rather than fixed: the button sits in a different place
 * on mobile vs desktop (and shifts with the sidebar), so hard-coded
 * coordinates would land wrong on one of them.
 */
function openCallMenu() {
  const btn = document.getElementById('callBtn');
  const menu = el('sheet');
  const r = btn.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = (r.bottom + 8) + 'px';
  menu.style.right = Math.max(12, window.innerWidth - r.right) + 'px';
  menu.style.left = 'auto';
  menu.classList.add('open');
}

document.querySelectorAll('[data-start]').forEach((row) => {
  row.addEventListener('click', () => {
    el('sheet').classList.remove('open');
    startCall(row.dataset.start);
  });
});

/* An anchored menu goes stale if the layout moves under it. */
window.addEventListener('resize', () => el('sheet').classList.remove('open'));

document.addEventListener('click', (e) => {
  const sheet = el('sheet');
  const btn = document.getElementById('callBtn');
  if (sheet.classList.contains('open') && !sheet.contains(e.target) &&
      btn && !btn.contains(e.target)) {
    sheet.classList.remove('open');
  }
});

function startCall(type) {
  const cardId = CallState.start(target.id, target.name, type);
  // Persisted, so the card is still here when you come back and can
  // offer "Return to call".
  ChatStore.add(target.id, {
    type: 'call', callType: type, from: 'You', mine: true, cardId,
  });
  renderChat();
  go(callUrl(type, target));
}

/* ---------- voice notes ---------- */
VoiceNote.init({
  onSend: ({ url, seconds }) => {
    // TODO for real: POST the blob and store the returned key.
    ChatStore.add(target.id, { from: 'You', mine: true, audio: url, seconds });
    renderChat();
  },
});

/* DEV: simulate an incoming album so the receiving side is testable
   without a second device. Real: this is what your
   socket.on('message:new') handler builds when the payload carries
   attachments — note it stores URLs and marks them needsDownload
   rather than fetching anything. */
el('devReceive').addEventListener('click', () => {
  const n = 1 + Math.floor(Math.random() * 5);
  const imgs = [];
  for (let i = 0; i < n; i++) {
    // Placeholder art so there's something to reveal after download.
    imgs.push({ url: placeholderImage(i), needsDownload: true });
  }
  ChatStore.add(target.id, {
    id: 'rx-' + Date.now(),
    from: target.name,
    mine: false,
    text: n > 1 ? n + ' photos' : '',
    images: imgs,
  });
  renderChat();
});

/* Tiny inline SVG so the demo needs no network or asset files. */
function placeholderImage(i) {
  const hues = [210, 280, 150, 25, 340, 190];
  const h = hues[i % hues.length];
  const svgStr =
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">' +
    '<rect width="400" height="400" fill="hsl(' + h + ',40%,28%)"/>' +
    '<circle cx="200" cy="160" r="70" fill="hsl(' + h + ',45%,42%)"/>' +
    '<rect y="250" width="400" height="150" fill="hsl(' + h + ',38%,20%)"/>' +
    '</svg>';
  return 'data:image/svg+xml;base64,' + btoa(svgStr);
}

renderSidebar(target.id);
renderChat();
paintIcons();
