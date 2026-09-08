# campaign-worker

Scheduled guest re-engagement email campaigns.

## Status

Runs **in-process** inside `backend`, not as a separate container,
same real migration as the other 5 in-process workers. Unlike the
other scheduler-based workers, this one didn't have its own
standalone start/stop functions cleanly separable, its real, exported
tick function (`runCampaignWorkerTick`) is wrapped in a real,
distributed-lock-backed scheduler at the call site in
`bootstrap.ts`:

```typescript
export const campaignScheduler = createLockedScheduler({
  lockKey:     "lock:campaign-worker:tick",
  lockTtlSec:  60,
  tickMs:      3_000,
  serviceName: "campaign-worker",
  onTick:      runCampaignWorkerTick,
});
```

Kept at module level specifically so `shutdown.ts` can reach the same
instance to stop it, the same real pattern the standalone worker
implementation used before migration (a scheduler object closed over
in the same file that started it).

## What it does

Ticks every 3 seconds, checking for campaigns that are due to send,
and dispatches guest re-engagement emails for the ones that are.

## Real, honest notes

- The distributed lock (`lock:campaign-worker:tick`, real Redis-backed,
  60s TTL) matters more here than for the other in-process workers:
  since this now runs inside the same process as everything else, the
  lock is what would prevent duplicate sends if this process were ever
  scaled to multiple instances, not a leftover from the old
  multi-container setup.
- Same real, unverified-build caveat as the other in-process workers:
  the deep package import was reasoned about as safe, not proven by
  an actual build and boot at migration time.