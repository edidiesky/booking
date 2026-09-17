# Session Device Management

## Core tracking
1. A real, persistent session record per login, not just a JWT.
   The JWT can reference a session ID, but the session itself lives
   server-side, so it can be inspected, listed, and killed
   independently of the token's own lifetime.
2. Device metadata per session: device type, OS, browser, IP,
   approximate location (IP geolocation), a human-readable label
   ("Chrome on Windows, Lagos"), not just a device ID nobody can
   recognize.
3. Created-at and last-active timestamps, updated on real activity,
   not just at login.

## Multi-device management, user-facing
4. "Manage devices": list every real, currently active session for
   the logged-in user.
5. Revoke one specific device/session.
6. "Log out everywhere else" (every session except the current one).
7. "Log out everywhere" (including the current one, forces
   re-login).
8. Revocation takes effect on the very next request, not at token
   expiry, this is the real gap the session-version work closes.

## Security-facing
9. New-device/new-location login alert (email: "New sign-in from
   X"), the single highest real-world-value item on this list, it's
   the thing that actually catches account takeover in practice.
10. Absolute session lifetime (force re-login after N days
    regardless of activity) and idle timeout (force re-login after
    N minutes of inactivity), two real, separate policies, not one
    setting.
11. Step-up re-authentication for sensitive actions (changing
    payment details, adding a new payout method) even inside an
    already-valid session, a valid session shouldn't mean
    unconditional trust forever.
12. Trusted-device marking, skip repeated 2FA prompts on a device
    the user has already verified recently.

## Presence, real-time
13. Online/offline/last-seen status per session, not just "session
    exists".
14. Real-time presence updates, this platform already has a real,
    proven pattern for this (the SSE availability stream), the same
    shape applies here.

## Admin/support-facing
15. An admin can view a user's active sessions (support diagnosing
    a locked-out or compromised account).
16. An admin can force-revoke sessions (matches the real,
    already-built SuspendTenantHandler flow, and should extend to
    individual users too, not just tenant suspension).
17. Every session event (login, logout, revoke, failed login) feeds
    the real, already-existing audit_events system, this isn't new
    infrastructure, it's a new event source for something already
    built.