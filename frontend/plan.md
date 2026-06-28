Stage 1 — Scaffold & Config
1.1  npm create vite booking-frontend -- --template react-ts
1.2  Install all deps (see list below)
1.3  vite.config.ts          → path alias @/ → src/
1.4  tsconfig.json           → strict: true, paths alias
1.5  tailwind.config.ts      → CSS variable colours, Cabinet/Instrument fonts
1.6  src/index.css           → @font-face, :root CSS vars, base body styles
1.7  postcss.config.mjs
1.8  .env.example            → VITE_API_BASE_URL, VITE_CLOUDINARY_*

Stage 2 — Types (done)
2.1  src/types/api.ts         → all backend DTOs (User, Booking, Property, Payment, Escrow…)
2.2  src/types/form.ts        → form-specific input types (not DTOs)
2.3  src/types/ui.ts          → UI-only types (StepItem, NavGroup, StatBlock…)

Stage 3 — Redux Store (done)
3.1  src/redux/slices/authSlice.ts
       → AuthState, setCredentials, clearCredentials
       → onboarding step state (step, showVerify, pendingEmail)
       → localStorage hydration in setCredentials
       → all selectors at bottom

3.2  src/redux/slices/modalSlice.ts
       → openModal / closeModal keyed by modal name

3.3  src/redux/services/apiSlice.ts
       → createApi, reducerPath, tagTypes

3.4  src/redux/services/baseQueryWithReauth.ts
       → rawBaseQuery with Authorization: Bearer header
       → Mutex-protected 401 retry
       → POST /api/v1/auth/refresh with { refreshToken } in body
       → clearCredentials + redirectToLogin on exhausted retry

3.5  src/redux/store.ts
       → configureStore, persistReducer for auth only
       → RootState + AppDispatch exports

3.6  src/redux/middleware/errorMiddleware.ts
       → rtkQueryErrorLogger catching 403/500

Stage 4 — API Slices (one file per domain)
4.01  src/redux/services/authApi.ts
        → initiateOnboarding, confirmEmail, resendOtp
        → registerGuest, registerHost
        → login, logout, refresh

4.02  src/redux/services/propertyApi.ts
        → getProperties, getPropertyById
        → createProperty, updateProperty
        → createRoomType, seedCalendar
        → getAvailability, blockDates

4.03  src/redux/services/bookingApi.ts
        → initiateBooking, getBookingById
        → getMyBookings, getTenantBookings
        → cancelBooking, checkIn, checkOut

4.04  src/redux/services/paymentApi.ts
        → initializePayment
        → getPaymentByBooking, getTenantPayments

4.05  src/redux/services/escrowApi.ts
        → getTenantEscrow, getEscrowByBooking

4.06  src/redux/services/profileApi.ts
        → getMyProfile, updateMyProfile

4.07  src/redux/services/tenantApi.ts
        → getMyTenant, updateSettings, updateCancellationPolicy

4.08  src/redux/services/auditApi.ts
        → getTenantAuditLogs, getMyAuditLogs

4.09  src/redux/services/notificationApi.ts
        → getTenantNotifications, getMyNotifications

4.10  src/redux/services/roleApi.ts
        → listRoles, getTenantRoles, assignRole, revokeRole

4.11  src/redux/services/permissionApi.ts
        → listPermissions, getPermissionsByRole

Stage 5 — Route Guards & Router
5.1  src/routes/guards/ProtectRoute.tsx
       → checks accessToken + currentUser from store
       → Navigate to /login if missing

5.2  src/routes/guards/GuestOnlyRoute.tsx
       → redirects by userType:
         guest → /
         host:admin → /dashboard
         platform:admin → /admin

5.3  src/routes/guards/HostOnlyRoute.tsx
       → checks userType starts with "host:"
       → Navigate to / if guest

5.4  src/routes/authRoutes.tsx
5.5  src/routes/guestRoutes.tsx    (public landing, property listings, single)
5.6  src/routes/dashboardRoutes.tsx
5.7  src/routes/adminRoutes.tsx
5.8  src/routes/index.tsx          → createBrowserRouter merging all route arrays

Stage 6 — Providers & App Shell
6.1  src/providers/StoreProvider.tsx    → <Provider store={store}>
6.2  src/providers/ToasterProvider.tsx  → react-hot-toast <Toaster> config
6.3  src/providers/ModalProvider.tsx    → renders all portal modals from modalSlice
6.4  src/main.tsx                       → StoreProvider → ToasterProvider → RouterProvider
6.5  src/App.tsx                        → <RouterProvider router={router} />

Stage 7 — Shared UI Primitives (src/components/ui/)
7.01  input.tsx         → label, icon, error, password toggle — ≤120 lines
7.02  button.tsx        → variant (primary/ghost/outline), size, loading state
7.03  select.tsx        → Radix Select, __all__ sentinel for empty value
7.04  textarea.tsx
7.05  label.tsx
7.06  badge.tsx         → status colours for BookingStatus, PaymentStatus
7.07  modal.tsx         → Radix Dialog wrapper, framer-motion scale-in
7.08  dropdown.tsx      → Radix DropdownMenu
7.09  tabs.tsx          → Radix Tabs
7.10  avatar.tsx        → initials fallback, Cloudinary src
7.11  spinner.tsx       → size-aware SVG spinner
7.12  empty-state.tsx   → icon + heading + description + optional CTA
7.13  pagination.tsx    → prev/next + page numbers, receives meta object
7.14  card.tsx          → surface card with optional border/shadow

Stage 8 — Common Layout Components (src/components/common/)
8.1  Header.tsx            → public nav, logo, login CTA
8.2  Footer.tsx            → links, copyright
8.3  AuthLayout.tsx        → two-column grid: left panel (step checklist) + right panel
                             → StepChecklist subcomponent in same file if ≤120 lines
                             → split into AuthLayout/StepChecklist.tsx if over
8.4  DataTable.tsx         → headers[], children <tr>, search, skeleton rows,
                             → empty state, pagination — if >120 split header/body/footer
8.5  PageLoader.tsx        → full-screen spinner
8.6  SectionTitle.tsx      → h2 + description text block
8.7  StatusBadge.tsx       → maps booking/payment status → colour
8.8  PropertyCard.tsx      → 4:5 portrait image, price, nights, navigate to /property/:id

Stage 9 — Dashboard Shell (src/components/dashboard/common/)
9.1  Sidebar.tsx            → grouped NAV_GROUPS, NavLink active state,
                              user avatar + signout at bottom
                              → if >120 lines: NavGroup.tsx + SidebarFooter.tsx
9.2  Header.tsx             → mobile menu toggle, notification bell, avatar dropdown
9.3  Title.tsx              → page title + description line
9.4  TourButton.tsx         → driver.js trigger

Stage 10 — Auth Screens
10.1  src/screens/auth/login/
        index.tsx            → useForm + useLogin hook, AuthLayout wrapper
        hooks/useLogin.ts    → RTK mutation, setCredentials dispatch, navigate

10.2  src/screens/auth/onboarding/
        index.tsx            → orchestrator, reads step from Redux
        steps/StepInitiate.tsx   → email + password, calls initiateOnboarding
        steps/StepConfirmOtp.tsx → 6-digit OTP input, calls confirmEmail
        steps/StepGuestDetails.tsx → firstName, lastName, phone
        steps/StepHostDetails.tsx  → firstName, lastName, tenantName, tenantSlug
        steps/VerifyInterstitial.tsx → "check your email" screen + resend
        hooks/useOnboarding.ts   → all mutation calls, step advancement logic
        schema/onboarding.schema.ts → zod schemas for each step

10.3  src/screens/auth/SelectUserType.tsx
        → guest vs host choice before registration details

Stage 11 — Public Screens
11.1  src/screens/public/Landing/
        index.tsx           → orchestrator <Hero> <Features> <HowItWorks> <CTA>
        Hero.tsx            → headline, search input, CTA button
        Features.tsx        → 3-column feature cards
        HowItWorks.tsx      → 3-step numbered list

11.2  src/screens/public/Properties/
        index.tsx           → orchestrator
        hooks/useProperties.ts   → RTK query, filters state
        PropertyFilters.tsx      → type, price range, date pickers
        PropertyGrid.tsx         → maps data → <PropertyCard>

11.3  src/screens/public/PropertyDetail/
        index.tsx            → orchestrator
        hooks/usePropertyDetail.ts
        PropertyImages.tsx   → image gallery
        PropertyInfo.tsx     → name, description, amenities
        BookingForm.tsx      → date picker, rooms count, initiate booking CTA
        AvailabilityCalendar.tsx → read-only slot grid

Stage 12 — Guest Screens (protected, userType: guest)
12.1  src/screens/guest/MyBookings/
        index.tsx
        hooks/useMyBookings.ts
        BookingCard.tsx         → status badge, property name, dates, cancel CTA
        CancelBookingModal.tsx  → confirm + reason input

12.2  src/screens/guest/BookingDetail/
        index.tsx
        hooks/useBookingDetail.ts
        BookingDetailCard.tsx
        PaymentSection.tsx     → initialize payment CTA → redirectUrl

12.3  src/screens/guest/Profile/
        index.tsx
        hooks/useGuestProfile.ts
        ProfileForm.tsx

Stage 13 — Dashboard Screens (protected, userType: host:*)
13.1  src/screens/dashboard/Home/
        index.tsx
        hooks/useDashboardHome.ts   → queries bookings count, payments sum
        StatsGrid.tsx               → 3 stat blocks (revenue, bookings, occupancy)
        RecentBookings.tsx          → last 5 bookings table

13.2  src/screens/dashboard/Properties/
        index.tsx
        hooks/useProperties.ts
        PropertyTableRow.tsx        → name, type, status, actions
        CreatePropertyModal.tsx
        CreateRoomTypeModal.tsx

13.3  src/screens/dashboard/Bookings/
        index.tsx
        hooks/useTenantBookings.ts
        BookingTableRow.tsx         → ref, guest, dates, status, checkin/out actions
        BookingFilters.tsx

13.4  src/screens/dashboard/Payments/
        index.tsx
        hooks/useTenantPayments.ts
        PaymentTableRow.tsx

13.5  src/screens/dashboard/Escrow/
        index.tsx
        hooks/useTenantEscrow.ts
        EscrowTableRow.tsx          → held, released, refunded status

13.6  src/screens/dashboard/Roles/
        index.tsx
        hooks/useRoles.ts
        AssignRoleModal.tsx

13.7  src/screens/dashboard/Account/
        index.tsx
        hooks/useAccount.ts
        ProfileSection.tsx
        TenantSettingsSection.tsx
        CancellationPolicySection.tsx

Stage 14 — Chart & Analytics Components
14.1  src/components/charts/BarChartStacked.tsx   → recharts, hideHeader prop
14.2  src/components/charts/LineChart.tsx
14.3  src/components/charts/RadialChart.tsx
14.4  src/components/charts/HorizontalBar.tsx
14.5  src/components/charts/ChartCard.tsx         → wrapper with title + ChartSelect
14.6  src/components/charts/ChartSelect.tsx       → Radix Select, __all__ sentinel

Stage 15 — Hooks Library (src/hooks/)
15.1  useAppDispatch.ts    → typed dispatch
15.2  useAppSelector.ts    → typed selector
15.3  useDebounce.ts       → search input debounce
15.4  useMediaQuery.ts     → responsive breakpoint detection
15.5  usePagination.ts     → page, limit state + handlers
15.6  useDashboardTour.ts  → driver.js step definitions
15.7  useScrollToTop.ts    → on route change

Stage 16 — Utils
16.1  src/utils/formatCurrency.ts    → ₦ Intl.NumberFormat
16.2  src/utils/formatDate.ts        → "Dec 01, 2025" display format
16.3  src/utils/formatStatus.ts      → BookingStatus → human label
16.4  src/utils/cn.ts                → clsx + tailwind-merge
16.5  src/utils/jwt.ts               → decodeToken (no verify — server handles)
16.6  src/utils/buildQueryString.ts  → object → ?key=val&…

Stage 17 — Constants
17.1  src/constants/routes.ts     → route path string constants
17.2  src/constants/api.ts        → AUTH_URL, BOOKING_URL, PROPERTY_URL…
17.3  src/constants/nav.ts        → NAV_GROUPS for sidebar
17.4  src/constants/status.ts     → BookingStatus colour map, PaymentStatus map
17.5  src/constants/mocks.ts      → placeholder stat blocks for skeleton state

Code Rules (enforced throughout)
File size
Hard limit: 120 lines per file.

When a file approaches the limit:
  - Extract the hook → useX.ts
  - Extract each major JSX section → ComponentSection.tsx
  - The index.tsx becomes only an orchestrator (imports + compose)

Example — a screen that would be 200 lines:
  screens/dashboard/Bookings/
    index.tsx              ← orchestrator only (~20 lines)
    BookingFilters.tsx     ← filter bar (~60 lines)
    BookingTableRow.tsx    ← single row (~40 lines)
    hooks/
      useTenantBookings.ts ← query + derived state (~50 lines)
TypeScript
- No any. Ever.
- Backend DTOs defined in src/types/api.ts
- Form types in src/types/form.ts
- Unknown payloads narrowed with type guards before use
- All RTK Query endpoints fully typed: ResultType + QueryArg
API layer
- One apiSlice.ts base, every domain injects via apiSlice.injectEndpoints
- Response always typed — never pass raw wrapper to components
- Extract the nested array before returning: data.bookings not data
- Tags follow: providesTags: ["Booking"], invalidatesTags: ["Booking"]
Redux
- authSlice: setCredentials writes to localStorage, clearCredentials clears it
- modalSlice: open/close by string key
- No other global state — server state lives in RTK Query cache
Forms
- react-hook-form + zodResolver on every form
- Schema in schema/name.schema.ts next to the screen
- Errors shown inline under each field via error prop on <Input>
- No form submit without disabled={isLoading} on the button
Components
- No bare <select> — use ChartSelect or ui/select.tsx (Radix)
- No any type in props interfaces
- framer-motion on page entry: opacity 0→1, y 24→0, duration 0.4
- All status colours from CSS variables, never hardcoded hex in JSX
- rounded-full for CTA buttons, rounded-md for inputs, rounded-2xl for modals
Routing
- All routes lazy-loaded with lazy() + <Suspense fallback={<PageLoader />}>
- ProtectRoute wraps every authenticated screen
- GuestOnlyRoute wraps /login and /onboarding
- HostOnlyRoute wraps all /dashboard/* screens
CSS / Theming
CSS variables (defined in index.css :root):
  --color-ink:          #17191c
  --color-canvas:       #ffffff
  --color-fog:          #f7f7f8
  --color-muted-stone:  #4c4c4c
  --color-light-steel:  #777b86
  --color-hint-of-grey: #a3a6af
  --color-warm-mist:    #fbe1d1
  --color-terracotta:   #5d2a1a
  --shadow-steep:       rgba(4,23,43,0.05) 0 0 0 1px, ...

Fonts:
  font-family: 'Medium'   (Cabinet Grotesk Medium)   — body default
  font-family: 'Bold'     (Cabinet Grotesk Bold)      — headings
  font-family: 'Regular'  (Cabinet Grotesk Regular)   — labels
  font-family: 'Instrument' (Instrument Sans Variable) — secondary
Git discipline (per stage)
Each stage = one commit per file using the pattern already established:
  git add src/path/to/file.ts
  git commit -m "feat(scope): description"
  git push origin main

Dependency List
bashnpm install \
  @reduxjs/toolkit react-redux \
  react-router-dom \
  react-hook-form @hookform/resolvers zod \
  framer-motion \
  react-hot-toast \
  async-mutex \
  lucide-react react-icons \
  recharts \
  @radix-ui/react-select \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-tabs \
  @radix-ui/react-popover \
  @radix-ui/react-switch \
  @radix-ui/react-checkbox \
  @radix-ui/react-avatar \
  driver.js \
  clsx tailwind-merge \
  date-fns

npm install -D \
  tailwindcss postcss autoprefixer \
  @types/react @types/react-dom \
  typescript