

## Google Cloud project
Go to console.cloud.google.com. Use an existing project if this app already has one for anything else, or create a new one, dev credentials don't need their own dedicated project, just their own dedicated OAuth client within it (separate from staging/prod clients, per the runbook's reasoning: don't reuse one client's redirect-URI allowlist across environments).

## Consent screen, which is only needed once per project, skip if already done
APIs & Services > OAuth consent screen:

1. User type: External
2. Scopes: add openid, .../auth/userinfo.email, .../auth/userinfo.profile, nothing broader, that's all loginWithGoogle actually reads
Test users: add your own dev Google account here explicitly. This is the step that specifically matters for local dev testing, while the app is in "Testing" publish status, only accounts on this list can complete the OAuth flow at all. Skip this and you'll hit access_blocked the moment you try to log in with your own account.

