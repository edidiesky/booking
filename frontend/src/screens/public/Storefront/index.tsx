import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import PropertyGrid from "@/screens/public/Properties/PropertyGrid";
import { useTenantContext } from "@/hooks/useTenantContext";
import { useGetPropertiesQuery } from "@/redux/services/propertyApi";

export default function TenantStorefront() {
  const {
    tenantId,
    tenantName,
    isLoading: tenantLoading,
    isUnresolvedSubdomain,
  } = useTenantContext();

  const { data, isLoading: propertiesLoading } = useGetPropertiesQuery(
    { tenantId: tenantId ?? undefined, page: 1, limit: 24 },
    { skip: !tenantId },
  );

  if (tenantLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-[#a3a6af]">Loading...</p>
        </div>
      </div>
    );
  }

  if (isUnresolvedSubdomain) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-24">
          <h1 className="text-lg font-semibold text-[#17171A]">
            This storefront doesn't exist
          </h1>
          <p className="text-sm text-[#777b86]">
            The subdomain you're on isn't linked to a seller. Check the link and
            try again.
          </p>
        </div>
      </div>
    );
  }

  const properties = data?.data ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#17171A]">
            {tenantName}
          </h1>
          <p className="text-sm text-[#777b86] mt-1">
            {properties.length} propert{properties.length === 1 ? "y" : "ies"}{" "}
            available
          </p>
        </div>
        <PropertyGrid
          properties={properties}
          isLoading={propertiesLoading}
          search=""
          typeFilter=""
          onClear={() => {}}
        />
      </div>
      <Footer />
    </div>
  );
}
