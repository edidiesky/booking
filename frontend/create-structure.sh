#!/usr/bin/env bash
set -euo pipefail

ROOT="src"

# ─── Types ────────────────────────────────────────────────────────────────────
mkdir -p "$ROOT/types"

# ─── Redux ────────────────────────────────────────────────────────────────────
mkdir -p "$ROOT/redux/slices"
mkdir -p "$ROOT/redux/services"
mkdir -p "$ROOT/redux/middleware"

# ─── Constants ────────────────────────────────────────────────────────────────
mkdir -p "$ROOT/constants"

# ─── Routes ───────────────────────────────────────────────────────────────────
mkdir -p "$ROOT/routes/guards"

# ─── Providers ────────────────────────────────────────────────────────────────
mkdir -p "$ROOT/providers"

# ─── Hooks ────────────────────────────────────────────────────────────────────
mkdir -p "$ROOT/hooks"

# ─── Utils ────────────────────────────────────────────────────────────────────
mkdir -p "$ROOT/utils"

# ─── UI primitives ────────────────────────────────────────────────────────────
mkdir -p "$ROOT/components/ui"

# ─── Common components ────────────────────────────────────────────────────────
mkdir -p "$ROOT/components/common"

# ─── Charts ───────────────────────────────────────────────────────────────────
mkdir -p "$ROOT/components/charts"

# ─── Dashboard shell components ───────────────────────────────────────────────
mkdir -p "$ROOT/components/dashboard/common"

# ─── Auth screens ─────────────────────────────────────────────────────────────
mkdir -p "$ROOT/screens/auth/login/hooks"
mkdir -p "$ROOT/screens/auth/login/schema"
mkdir -p "$ROOT/screens/auth/onboarding/hooks"
mkdir -p "$ROOT/screens/auth/onboarding/schema"
mkdir -p "$ROOT/screens/auth/onboarding/steps"
mkdir -p "$ROOT/screens/auth/shared"

# ─── Public screens ───────────────────────────────────────────────────────────
mkdir -p "$ROOT/screens/public/Landing"
mkdir -p "$ROOT/screens/public/Properties/hooks"
mkdir -p "$ROOT/screens/public/PropertyDetail/hooks"

# ─── Guest screens ────────────────────────────────────────────────────────────
mkdir -p "$ROOT/screens/guest/MyBookings/hooks"
mkdir -p "$ROOT/screens/guest/BookingDetail/hooks"
mkdir -p "$ROOT/screens/guest/Profile/hooks"

# ─── Dashboard screens ────────────────────────────────────────────────────────
mkdir -p "$ROOT/screens/dashboard/Home/hooks"
mkdir -p "$ROOT/screens/dashboard/Properties/hooks"
mkdir -p "$ROOT/screens/dashboard/Bookings/hooks"
mkdir -p "$ROOT/screens/dashboard/Payments/hooks"
mkdir -p "$ROOT/screens/dashboard/Escrow/hooks"
mkdir -p "$ROOT/screens/dashboard/Roles/hooks"
mkdir -p "$ROOT/screens/dashboard/Account/hooks"

# ─── Touch placeholder files so the tree is visible ──────────────────────────

# types
touch "$ROOT/types/api.ts"
touch "$ROOT/types/form.ts"
touch "$ROOT/types/ui.ts"

# redux
touch "$ROOT/redux/slices/authSlice.ts"
touch "$ROOT/redux/slices/modalSlice.ts"
touch "$ROOT/redux/services/apiSlice.ts"
touch "$ROOT/redux/services/baseQueryWithReauth.ts"
touch "$ROOT/redux/services/authApi.ts"
touch "$ROOT/redux/services/propertyApi.ts"
touch "$ROOT/redux/services/bookingApi.ts"
touch "$ROOT/redux/services/paymentApi.ts"
touch "$ROOT/redux/services/escrowApi.ts"
touch "$ROOT/redux/services/profileApi.ts"
touch "$ROOT/redux/services/tenantApi.ts"
touch "$ROOT/redux/services/auditApi.ts"
touch "$ROOT/redux/services/notificationApi.ts"
touch "$ROOT/redux/services/roleApi.ts"
touch "$ROOT/redux/services/permissionApi.ts"
touch "$ROOT/redux/middleware/errorMiddleware.ts"
touch "$ROOT/redux/store.ts"

# constants
touch "$ROOT/constants/api.ts"
touch "$ROOT/constants/routes.ts"
touch "$ROOT/constants/nav.ts"
touch "$ROOT/constants/status.ts"
touch "$ROOT/constants/mocks.ts"

# routes
touch "$ROOT/routes/guards/ProtectRoute.tsx"
touch "$ROOT/routes/guards/GuestOnlyRoute.tsx"
touch "$ROOT/routes/guards/HostOnlyRoute.tsx"
touch "$ROOT/routes/authRoutes.tsx"
touch "$ROOT/routes/guestRoutes.tsx"
touch "$ROOT/routes/dashboardRoutes.tsx"
touch "$ROOT/routes/index.tsx"

# providers
touch "$ROOT/providers/StoreProvider.tsx"
touch "$ROOT/providers/ToasterProvider.tsx"
touch "$ROOT/providers/ModalProvider.tsx"

# hooks
touch "$ROOT/hooks/useAppDispatch.ts"
touch "$ROOT/hooks/useAppSelector.ts"
touch "$ROOT/hooks/useDebounce.ts"
touch "$ROOT/hooks/useMediaQuery.ts"
touch "$ROOT/hooks/usePagination.ts"
touch "$ROOT/hooks/useDashboardTour.ts"
touch "$ROOT/hooks/useScrollToTop.ts"

# utils
touch "$ROOT/utils/formatCurrency.ts"
touch "$ROOT/utils/formatDate.ts"
touch "$ROOT/utils/formatStatus.ts"
touch "$ROOT/utils/cn.ts"
touch "$ROOT/utils/jwt.ts"
touch "$ROOT/utils/buildQueryString.ts"

# ui primitives
touch "$ROOT/components/ui/input.tsx"
touch "$ROOT/components/ui/button.tsx"
touch "$ROOT/components/ui/select.tsx"
touch "$ROOT/components/ui/textarea.tsx"
touch "$ROOT/components/ui/label.tsx"
touch "$ROOT/components/ui/badge.tsx"
touch "$ROOT/components/ui/modal.tsx"
touch "$ROOT/components/ui/dropdown.tsx"
touch "$ROOT/components/ui/tabs.tsx"
touch "$ROOT/components/ui/avatar.tsx"
touch "$ROOT/components/ui/spinner.tsx"
touch "$ROOT/components/ui/empty-state.tsx"
touch "$ROOT/components/ui/pagination.tsx"
touch "$ROOT/components/ui/card.tsx"

# common
touch "$ROOT/components/common/Header.tsx"
touch "$ROOT/components/common/Footer.tsx"
touch "$ROOT/components/common/AuthLayout.tsx"
touch "$ROOT/components/common/DataTable.tsx"
touch "$ROOT/components/common/PageLoader.tsx"
touch "$ROOT/components/common/SectionTitle.tsx"
touch "$ROOT/components/common/StatusBadge.tsx"
touch "$ROOT/components/common/PropertyCard.tsx"

# charts
touch "$ROOT/components/charts/BarChartStacked.tsx"
touch "$ROOT/components/charts/LineChart.tsx"
touch "$ROOT/components/charts/RadialChart.tsx"
touch "$ROOT/components/charts/HorizontalBar.tsx"
touch "$ROOT/components/charts/ChartCard.tsx"
touch "$ROOT/components/charts/ChartSelect.tsx"

# dashboard common
touch "$ROOT/components/dashboard/common/Sidebar.tsx"
touch "$ROOT/components/dashboard/common/Header.tsx"
touch "$ROOT/components/dashboard/common/Title.tsx"
touch "$ROOT/components/dashboard/common/TourButton.tsx"

# auth screens
touch "$ROOT/screens/auth/login/index.tsx"
touch "$ROOT/screens/auth/login/hooks/useLogin.ts"
touch "$ROOT/screens/auth/login/schema/login.schema.ts"
touch "$ROOT/screens/auth/onboarding/index.tsx"
touch "$ROOT/screens/auth/onboarding/hooks/useOnboarding.ts"
touch "$ROOT/screens/auth/onboarding/schema/onboarding.schema.ts"
touch "$ROOT/screens/auth/onboarding/steps/StepInitiate.tsx"
touch "$ROOT/screens/auth/onboarding/steps/StepConfirmOtp.tsx"
touch "$ROOT/screens/auth/onboarding/steps/StepGuestDetails.tsx"
touch "$ROOT/screens/auth/onboarding/steps/StepHostDetails.tsx"
touch "$ROOT/screens/auth/onboarding/steps/VerifyInterstitial.tsx"
touch "$ROOT/screens/auth/shared/AuthLayout.tsx"
touch "$ROOT/screens/auth/SelectUserType.tsx"

# public screens
touch "$ROOT/screens/public/Landing/index.tsx"
touch "$ROOT/screens/public/Landing/Hero.tsx"
touch "$ROOT/screens/public/Landing/Features.tsx"
touch "$ROOT/screens/public/Landing/HowItWorks.tsx"
touch "$ROOT/screens/public/Properties/index.tsx"
touch "$ROOT/screens/public/Properties/hooks/useProperties.ts"
touch "$ROOT/screens/public/Properties/PropertyFilters.tsx"
touch "$ROOT/screens/public/Properties/PropertyGrid.tsx"
touch "$ROOT/screens/public/PropertyDetail/index.tsx"
touch "$ROOT/screens/public/PropertyDetail/hooks/usePropertyDetail.ts"
touch "$ROOT/screens/public/PropertyDetail/PropertyImages.tsx"
touch "$ROOT/screens/public/PropertyDetail/PropertyInfo.tsx"
touch "$ROOT/screens/public/PropertyDetail/BookingForm.tsx"
touch "$ROOT/screens/public/PropertyDetail/AvailabilityCalendar.tsx"

# guest screens
touch "$ROOT/screens/guest/MyBookings/index.tsx"
touch "$ROOT/screens/guest/MyBookings/hooks/useMyBookings.ts"
touch "$ROOT/screens/guest/MyBookings/BookingCard.tsx"
touch "$ROOT/screens/guest/MyBookings/CancelBookingModal.tsx"
touch "$ROOT/screens/guest/BookingDetail/index.tsx"
touch "$ROOT/screens/guest/BookingDetail/hooks/useBookingDetail.ts"
touch "$ROOT/screens/guest/BookingDetail/BookingDetailCard.tsx"
touch "$ROOT/screens/guest/BookingDetail/PaymentSection.tsx"
touch "$ROOT/screens/guest/Profile/index.tsx"
touch "$ROOT/screens/guest/Profile/hooks/useGuestProfile.ts"
touch "$ROOT/screens/guest/Profile/ProfileForm.tsx"

# dashboard screens
touch "$ROOT/screens/dashboard/Home/index.tsx"
touch "$ROOT/screens/dashboard/Home/hooks/useDashboardHome.ts"
touch "$ROOT/screens/dashboard/Home/StatsGrid.tsx"
touch "$ROOT/screens/dashboard/Home/RecentBookings.tsx"
touch "$ROOT/screens/dashboard/Properties/index.tsx"
touch "$ROOT/screens/dashboard/Properties/hooks/useProperties.ts"
touch "$ROOT/screens/dashboard/Properties/PropertyTableRow.tsx"
touch "$ROOT/screens/dashboard/Properties/CreatePropertyModal.tsx"
touch "$ROOT/screens/dashboard/Properties/CreateRoomTypeModal.tsx"
touch "$ROOT/screens/dashboard/Bookings/index.tsx"
touch "$ROOT/screens/dashboard/Bookings/hooks/useTenantBookings.ts"
touch "$ROOT/screens/dashboard/Bookings/BookingTableRow.tsx"
touch "$ROOT/screens/dashboard/Bookings/BookingFilters.tsx"
touch "$ROOT/screens/dashboard/Payments/index.tsx"
touch "$ROOT/screens/dashboard/Payments/hooks/useTenantPayments.ts"
touch "$ROOT/screens/dashboard/Payments/PaymentTableRow.tsx"
touch "$ROOT/screens/dashboard/Escrow/index.tsx"
touch "$ROOT/screens/dashboard/Escrow/hooks/useTenantEscrow.ts"
touch "$ROOT/screens/dashboard/Escrow/EscrowTableRow.tsx"
touch "$ROOT/screens/dashboard/Roles/index.tsx"
touch "$ROOT/screens/dashboard/Roles/hooks/useRoles.ts"
touch "$ROOT/screens/dashboard/Roles/AssignRoleModal.tsx"
touch "$ROOT/screens/dashboard/Account/index.tsx"
touch "$ROOT/screens/dashboard/Account/hooks/useAccount.ts"
touch "$ROOT/screens/dashboard/Account/ProfileSection.tsx"
touch "$ROOT/screens/dashboard/Account/TenantSettingsSection.tsx"
touch "$ROOT/screens/dashboard/Account/CancellationPolicySection.tsx"

echo ""
echo "✅ Structure created. $(find $ROOT -type f | wc -l) files across $(find $ROOT -type d | wc -l) directories."
echo ""
echo "Next: fill the touched files starting with Stage 3 redux files."