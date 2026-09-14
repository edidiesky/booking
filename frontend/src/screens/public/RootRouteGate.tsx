import { lazy, Suspense } from "react";
import { useTenantContext } from "@/hooks/useTenantContext";
import PageLoader from "@/components/common/PageLoader";

const Landing = lazy(() => import("@/screens/public/Landing"));
const TenantStorefront = lazy(() => import("@/screens/public/Storefront"));

export default function RootRouteGate() {
  const { isSubdomainContext } = useTenantContext();
  return (
    <Suspense fallback={<PageLoader />}>
      {isSubdomainContext ? <TenantStorefront /> : <Landing />}
    </Suspense>
  );
}
