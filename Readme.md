# Booking App

git add backend/src/middleware/auth.middleware.ts
git commit -m "fix(auth): resolve tenantId from JWT in requireTenantMember, remove x-tenant-slug dependency"

git add backend/src/domains/tenant/tenant.routes.ts
git commit -m "fix(tenant): resolve GET /me via JWT tenantId, drop requireTenantMember guard"

git add backend/src/domains/property/property.routes.ts backend/src/domains/property/property.controller.ts backend/src/domains/property/property.service.ts
git commit -m "feat(property): split routes into public listing and tenant-scoped endpoints, extract service layer"

git add Dockerfile
git commit -m "fix(docker): copy HTML email templates into dist after tsc build"

git add backend/src/server/bootstrap.ts backend/src/migrations/migrate.ts
git commit -m "fix(bootstrap): run migrations before seed_rbac to ensure schema exists on fresh DB"

git add backend/src/domains/notification/templates/booking.confirmed.html backend/src/notifications/providers/resend.provider.ts
git commit -m "fix(notifications): correct FROM address construction, split EMAIL_FROM and EMAIL_FROM_NAME env vars"

git add frontend/src/redux/slices/authSlice.ts
git commit -m "fix(auth): persist and rehydrate tenantSlug in localStorage, add setTenantSlug action"

git add frontend/src/screens/auth/login/hooks/useLogin.ts
git commit -m "fix(login): await tenant slug fetch before navigating, fix AuthTokens response shape mismatch"

git add frontend/src/screens/auth/onboarding/index.tsx frontend/src/screens/auth/onboarding/steps/StepSelectUserType.tsx
git commit -m "feat(onboarding): embed user type selection as step 0, replace location.state with local state"

git add frontend/src/screens/auth/onboarding/index.tsx frontend/src/redux/slices/authSlice.ts
git commit -m "fix(onboarding): clear showVerify flag when advancing from interstitial to OTP step"

git add frontend/src/components/dashboard/common/Header.tsx
git commit -m "fix(dashboard): rewrite Header to use booking platform APIs, remove stale storeApi and store imports"

git add frontend/src/screens/dashboard/index.tsx
git commit -m "refactor(dashboard): rebrand barrel exports to booking platform screens, remove e-commerce leftovers"

git add frontend/src/screens/dashboard/home/StatsGrid.tsx
git commit -m "fix(dashboard/home): rewrite StatsGrid to accept real booking props, remove mock data dependency"

git add frontend/src/screens/dashboard/Payment/index.tsx
git commit -m "fix(dashboard/payments): fix field names to match Payment type, replace stale useGetPaymentHistoryQuery"

git add frontend/src/screens/dashboard/Properties/index.tsx frontend/src/screens/dashboard/Properties/CreatePropertyModal.tsx frontend/src/screens/dashboard/Properties/CreateRoomTypeModal.tsx frontend/src/screens/dashboard/Properties/PropertyTableRow.tsx frontend/src/screens/dashboard/Properties/hooks/useProperties.ts
git commit -m "feat(dashboard/properties): build properties page with create property and room type modals"

git add frontend/src/screens/dashboard/Roles/index.tsx frontend/src/screens/dashboard/Roles/AssignRoleModal.tsx frontend/src/screens/dashboard/Roles/hooks/useRoles.ts
git commit -m "feat(dashboard/roles): build roles and access page with assign and revoke flow"

git add frontend/src/screens/dashboard/analytics/index.tsx
git commit -m "feat(dashboard/analytics): rewrite analytics with booking, revenue, payments, escrow tabs using real API data"

git add frontend/src/redux/services/authApi.ts
git commit -m "feat(auth): add requestPasswordReset and confirmPasswordReset endpoints"

git add frontend/src/redux/services/tenantApi.ts
git commit -m "feat(tenant): build complete tenantApi with getMyTenant, settings, policy, and admin endpoints"

git add frontend/src/routes/dashboardRoutes.tsx
git commit -m "fix(routes): correct import casing for dashboard screens to match filesystem folder names"

git add frontend/src/redux/services/baseQueryWithReauth.ts
git commit -m "fix(baseQuery): use relative path for refresh-token URL to prevent doubled base URL"