/* Optional dependency check. Guarded, so boot.js can be deleted or
   commented out and this page still runs — a diagnostic must never
   be load-bearing. */
if (typeof __reportMissing === 'function') __reportMissing([['CallState', typeof CallState], ['renderSidebar', typeof renderSidebar], ['paintIcons', typeof paintIcons], ['el', typeof el]]);

/* ============================================================
   dashboard.js — DASHBOARD PAGE SCRIPT

   This exists because the init used to be an inline <script>, and
   a sane CSP (script-src 'self') blocks those outright. Inline
   scripts also can't be cached or linted. Every page keeps its
   entry point in a real file for that reason.
   ============================================================ */

renderSidebar(null);
paintIcons();
