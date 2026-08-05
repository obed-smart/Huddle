/* ============================================================
   boot.js — MAKE FAILURES VISIBLE

   A missing or broken script leaves a page that looks "fine" —
   static markup renders, nothing JS-driven does, and you get an
   empty list with no explanation. That's the worst kind of failure
   because it looks like a design bug rather than a load error.

   This file loads FIRST and does two things:
     1. catches uncaught errors and prints them on the page
     2. checks that every module it expects actually defined itself

   Delete it once the harness is stable — or keep it, adapted, since
   the same trick is useful in a real app's staging build.
   ============================================================ */

// (function () {
//   function banner(msg, detail) {
//     let box = document.getElementById('__boot_err');
//     if (!box) {
//       box = document.createElement('div');
//       box.id = '__boot_err';
//       box.style.cssText =
//         'position:fixed;left:0;right:0;top:0;z-index:99999;' +
//         'background:#7f1d1d;color:#fee2e2;font:12px/1.5 ui-monospace,monospace;' +
//         'padding:10px 14px;white-space:pre-wrap;max-height:45vh;overflow:auto;' +
//         'border-bottom:1px solid #b91c1c';
//       (document.body || document.documentElement).appendChild(box);
//     }
//     box.textContent += msg + (detail ? '\n  ' + detail : '') + '\n';
//   }

//   window.addEventListener('error', (e) => {
//     // A failed <script src> fires an error event on the element.
//     if (e.target && e.target.tagName === 'SCRIPT') {
//       banner('FAILED TO LOAD: ' + e.target.src,
//              'Check the path and that express.static points at test-ui/public');
//       return;
//     }
//     banner('ERROR: ' + (e.message || e.error),
//            e.filename ? e.filename + ':' + e.lineno : '');
//   }, true);

//   window.addEventListener('unhandledrejection', (e) => {
//     banner('UNHANDLED PROMISE: ' + (e.reason && e.reason.message || e.reason));
//   });

//   /* CSP violations are NOT script errors — they fire their own
//      event. Without this listener a blocked inline script fails
//      completely silently, which is how the "empty page, no error"
//      mystery happened. */
//   document.addEventListener('securitypolicyviolation', (e) => {
//     banner('CSP BLOCKED: ' + e.violatedDirective,
//            (e.blockedURI || 'inline') + ' — move it to a file rather than ' +
//            'weakening the policy.');
//   });

//   /**
//    * Report missing modules.
//    *
//    * Takes a list of [name, typeofResult] pairs, NOT bare names.
//    *
//    * Why: a module declared `const Foo = {...}` at the top level of a
//    * classic script does NOT become window.Foo — top-level const/let
//    * live in the global lexical environment, and only var and
//    * function declarations land on window. Checking window[name]
//    * therefore reports every const-declared module as missing.
//    *
//    * `typeof Foo` reads the lexical binding correctly AND is safe on
//    * an undeclared identifier (it returns "undefined" instead of
//    * throwing), so the caller evaluates it and passes the result.
//    * eval() would also work but CSP blocks that too.
//    */
//   window.__reportMissing = function (pairs) {
//     const missing = pairs.filter((p) => p[1] === 'undefined').map((p) => p[0]);
//     if (!missing.length) return true;
//     banner('MISSING: ' + missing.join(', '),
//            'Those scripts did not load or threw while loading. ' +
//            'Open DevTools > Network and look for 404s under /js/.');
//     return false;
//   };
// })();
