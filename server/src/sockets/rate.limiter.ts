import { BucketConfig } from "../middlewares/rate.limiter";

export const MESSAGE_LIMIT: BucketConfig = {
  maxTokens: 8,
  refillPerSecond: 1.5,
  keyTtlMs: 60_000,
};

// export const SESSION_MESSAGE_LIMIT: BucketConfig = {
//   maxTokens: 20,
//   refillPerSecond: 4,
//   keyTtlMs: 60_000,
// };

export const GLOBAL_SOCKET_LIMIT: BucketConfig = {
  maxTokens: 50,
  refillPerSecond: 25,
  keyTtlMs: 60_000,
};
