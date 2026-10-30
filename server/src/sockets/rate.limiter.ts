import { BucketConfig } from "../middlewares/rate.limiter";

const MESSAGE_LIMIT: BucketConfig = {
  maxTokens: 8,
  refillPerSecond: 1.5,
  keyTtlMs: 60_000,
};

const SESSION_MESSAGE_LIMIT: BucketConfig = {
  maxTokens: 20,
  refillPerSecond: 4,
  keyTtlMs: 60_000,
};

const GLOBAL_SOCKET_LIMIT: BucketConfig = {
  maxTokens: 50,
  refillPerSecond: 25,
  keyTtlMs: 60_000,
};
