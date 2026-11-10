"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { useCall } from "./call-store";
import { AudioCallScreen } from "./audio-call-screen";
import { CallBanner } from "./call-banner";
import { IncomingToast } from "./incoming-toast";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const noopSubscribe = () => () => {};
/** False through SSR and the first hydration render, true once on the client.
    Keeps the body portal from mismatching the server HTML, no effect needed. */
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** The one call overlay for the whole app. Mounted once at the root so a call
    outlives route changes: the full screen when open, a floating pill when
    minimized. Enter is a calm scale and fade; exit is quicker, per our motion
    rules. Reduced motion keeps the fade and drops the movement. */
export function CallRoot() {
  const call = useCall((s) => s.call);
  const reduce = useReducedMotion();
  const isClient = useIsClient();

  if (!isClient) return null;

  // An inbound ring is a toast (keep reading until you answer). The caller's
  // own calling screen and the connected call are full screen. Minimized is the
  // pill. These never overlap, so the top slot shows the toast or the pill.
  const incoming = call?.phase === "incoming";
  const showScreen = !!call && !incoming && !call.minimized && call.media === "audio";
  const topCard = incoming ? "incoming" : call?.minimized ? "banner" : null;

  return createPortal(
    <>
      <AnimatePresence>
        {showScreen ? (
          <motion.div
            key="call-screen"
            className="fixed inset-0 z-50"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, transition: { duration: 0.18 } }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
          >
            <AudioCallScreen />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <AnimatePresence mode="wait">
          {topCard ? (
            <motion.div
              key={topCard}
              className="pointer-events-auto"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16, transition: { duration: 0.16 } }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
            >
              {topCard === "incoming" ? <IncomingToast /> : <CallBanner />}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>,
    document.body,
  );
}
