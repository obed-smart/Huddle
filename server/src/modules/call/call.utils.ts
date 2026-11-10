import AppError from "../../shared/utils/apiError";
import { callCursor } from "./call.types";

export function encodeCursor(cursorObj: callCursor): string {
  return Buffer.from(JSON.stringify(cursorObj)).toString("base64");
}

export function decodeCursor(base64String: string): callCursor | undefined {
  try {
    const jsonString = Buffer.from(base64String, "base64").toString("utf-8");
    return JSON.parse(jsonString) as callCursor;
  } catch {
    throw new AppError("manipulated/malformed cursor string", 400);
  }
}



const sessionQueues = new Map<string, Promise<unknown>>();
 
export function withSessionLock<T>(
  rtcSessionId: string,
  task: () => Promise<T>,
): Promise<T> {
  const previous = sessionQueues.get(rtcSessionId) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(task);
 
  sessionQueues.set(rtcSessionId, next);
 
  next
    .finally(() => {
      if (sessionQueues.get(rtcSessionId) === next) {
        sessionQueues.delete(rtcSessionId);
      }
    })
    .catch(() => {});
 
  return next;
}