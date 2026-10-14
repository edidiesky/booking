# Service Decomposition POC

## Implemented

| Item | Location |
|------|----------|
| HMAC / verif-hash webhooks | `payment-service/src/webhookSignatures.ts` |
| Lost-wakeup signals | `saga_resume_signals` + consume on pause |
| Lease sweeper + pause timeout | `orchestration-service/src/services/sagaSweeper.ts` |
| Gateway refund API | `refundPayment` in resilience + `requestRefund` |
| Contract DTO + tests | `packages/shared/src/contracts`, mapper/signature tests |
| Comment residue strip | `// Real,` lines removed from service sources |
| P0 boot | shared package, compose mounts, Dockerfiles |

## Configure

```bash
cp docker/.env.example docker/.env
# set PAYSTACK_SECRET_KEY, FLW_SECRET_KEY, FLW_SECRET_HASH
```

## Tests

```bash
cd payment-service && npm i && npm test
cd ../booking-service && npm i && npm test
cd ../orchestration-service && npm i && npm test
```

## Still limited

- Testcontainers against real Postgres not in this archive (needs Docker-in-CI)
- Full Pact broker not added; shared DTO + unit contract tests instead
- Refund assumes Paystack/Flutterwave network availability
