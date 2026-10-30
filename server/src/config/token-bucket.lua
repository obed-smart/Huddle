-- bucketKey - The redis key for each buckect
-- maxTokens - The max buckect size (The maximum amount of token a buckect can hold)
-- refillPerSecond - The token token refill rate per soconds (number of token a bucket can get per second)
-- nowMs - a timestamp representing now in milliseconds (The time he request arrived from the node server)
-- keyTtlMs - (When to free up memory after the buckect has been fill to create space)


local bucketKey = KEYS[1]
local maxTokens = tonumber(ARGV[1])
local refillPerSecond = tonumber(ARGV[2])
local nowMs = tonumber(ARGV[3])
local keyTtlMs = tonumber(ARGV[4])

local saved = redis.call("HMGET", bucketKey, "tokens", "lastRefill")
local currentTokens = tonumber(saved[1])
local lastRefillMs = tonumber(saved[2])

if currentTokens == nil then
    currentTokens = maxTokens
    lastRefillMs = nowMs
end

-- this is a lazy refill it calulate the time from last request converte it to second and multiply the the refill per seconds

local elapsedMs = nowMs - lastRefillMs
if elapsedMs > 0 then
    local refill = (elapsedMs / 1000) * refillPerSecond
    currentTokens = math.min(maxTokens, currentTokens + refill)
    lastRefillMs = nowMs
end

local allowed = 0
if currentTokens >= 1 then
    currentTokens = currentTokens - 1
    allowed = 1
end

redis.call("HSET", bucketKey, "tokens", currentTokens, "lastRefill", lastRefillMs)
redis.call("PEXPIRE", bucketKey, keyTtlMs) -- PEXPIRE = expire in milliseconds

return {allowed, tostring(currentTokens)}
