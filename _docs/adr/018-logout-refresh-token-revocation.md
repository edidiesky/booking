# ADR 018: Logout Must Revoke the Refresh Token Server-Side, Not Just Blocklist the Access Token

**Status**: Accepted
**Date**: 2026-08-04

## Context

Found via a real incident, not a code review: after logging out, `POST
/api/v1/auth/refresh` continued succeeding with the pre-logout refresh
token, issuing valid new access tokens for a session the user believed
was ended. The same stale credential also caused a confusing cascade,
`favorites/ids` 401ing on an unrelated stale token triggered the
frontend's global 401 handler, which read as "Google OAuth is broken"
before the actual cause, a session that was never really terminated,
was identified.

`logout()`'s existing behavior: on logout, the access token's `userId`
gets written to `blocklist:<userId>` in Redis with a TTL matching the
token's own remaining lifetime. `authenticate` middleware checks this
key on every request and rejects if present. This correctly stops the
*access token* from working again. **It does nothing to the refresh
token.** The refresh token is looked up by its own random value
(`refreshKey(token)`), a completely separate Redis key with its own
7-day TTL, and nothing in the logout path ever touched it.

## Decision

`logout()` accepts the refresh token (already sent by the frontend in
the logout request body, the controller just wasn't reading it) and
deletes it from Redis directly:
```ts
if (refreshToken) {
  await redisClient.del(refreshKey(refreshToken));
}
```
Both the access-token blocklist and the refresh-token deletion happen
on every logout, not one or the other.

## Why both are necessary, not just one

| Revoke only access token (previous behavior) | Revoke only refresh token | Revoke both (chosen) |
|---|---|---|
| Access token stops working within its own short TTL (15 min in this system), but the refresh token survives untouched for up to 7 days. Anyone holding that refresh token, a browser tab that never got the logout signal, a token copied out of dev tools, a stolen `localStorage` dump, can mint a fresh, fully valid access token at any point in that window, logout accomplishes nothing against that threat. | Stops future refreshes immediately, but the current access token, if one is still outstanding somewhere, keeps working until its own natural expiry, up to 15 minutes of continued access after "logout." | Closes both windows. The already-issued access token dies within its own short remaining TTL regardless (the blocklist entry), and no new one can be minted after that (the deleted refresh token). |

The 15-minute access-token TTL makes the blocklist-only gap look small
in isolation, and it was already partially mitigated by that short
expiry. The refresh-token gap was the real exposure: a 7-day window
where "logged out" was cosmetic on the client but not actually true
server-side. Access-token-only revocation without refresh-token
revocation is a common, easy mistake specifically because the shorter
TTL masks how long the underlying session actually persists.

## Consequences

- Logout now requires the frontend to actually send `refreshToken` in
  the request body. It already did, confirmed against `Sidebar.tsx`,
  the controller simply wasn't reading it, no frontend change was
  needed for this half of the fix.
- `refreshToken` is optional in the validator, not required, a logout
  call that's missing it (a token already lost from storage, a client
  bug) still blocklists the access token rather than hard-failing the
  whole logout attempt. Partial revocation is treated as strictly
  better than none, not worth rejecting the request over.
- This does not address every token-persistence edge case on its own,
  a token copied out of the browser *before* logout and stored
  elsewhere is unaffected by anything server-side, revocation only
  reaches tokens the server can identify and act on at logout time.
  Out of scope for this decision, a device/session management feature
  (list and individually revoke active sessions) would be the real
  answer to that broader case, not attempted here.
- Frontend also needed a companion fix, unrelated to the server-side
  gap but surfaced by the same incident: `clearCredentials()` alone
  left RTK Query's own cache holding stale data/headers independent of
  the auth slice. `apiSlice.util.resetApiState()` added to logout
  alongside it. Two different caches (Redux auth state, RTK Query
  cache) both needed clearing, fixing only one was why manually
  clearing browser storage was required to actually resolve the
  incident, clearing the Redux slice alone hadn't been enough even
  before this ADR's server-side fix landed.