
import { useGetHostProfileQuery } from "@/redux/services/tenantApi";
import Avatar from "@/components/common/Avatar";
import PropertyCard from "@/components/common/PropertyCard";

interface Props {
  tenantId: string;
}

export default function SellerSection({ tenantId }: Props) {
  const { data, isLoading } = useGetHostProfileQuery(tenantId, {
    skip: !tenantId,
  });

  if (isLoading) {
    return (
      <div className="h-40 w-full animate-pulse rounded-2xl bg-[#f4f3ee]" />
    );
  }
  if (!data?.data) return null;

  const { tenant, properties } = data.data;
  const hostSince = new Date(tenant.createdAt).getFullYear();
  const location = [tenant.city, tenant.state, tenant.country]
    .filter(Boolean)
    .join(", ");

  const dummyBio = "Hello, good day. I provide clean, comfortable shortlet apartments available for daily, weekly, and monthly booking in Lagos. All units are fully furnished with steady power, fast WiFi, and 24/7 security. Looking forward to hosting you."

  return (
    <div className="w-full flex flex-col gap-8">
      <div
        className="w-full flex flex-col gap-5 rounded-2xl border p-6"
        style={{ borderColor: "#e8e6e3" }}
      >
        <div className="flex items-center gap-4">
          <Avatar src={tenant.avatarUrl} name={tenant.name} size={60} />
          <div className="min-w-0">
            <p
              className="text-xs lg:text-smlg:text-lg bold truncate"
              style={{ color: "#171717" }}
            >
              {tenant.name}
            </p>
            <p className="text-xs lg:text-smtext-[#666]">
              Hosting since {hostSince}
              {location && ` · ${location}`}
            </p>
          </div>
        </div>

        
          <p className="text-xs lg:text-smtext-[#444] leading-relaxed">{tenant.bio ?? dummyBio}</p>
        

        {/* <div
          className="grid grid-cols-3 gap-3 pt-2 border-t"
          style={{ borderColor: "#eee" }}
        >
          <div className="flex flex-col items-center gap-1 pt-3">
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-[#F5A623] text-[#F5A623]" />
              <span className="text-xs lg:text-sm" style={{ color: "#171717" }}>
                {stats.avgRating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs lg:text-smtext-[#777]">
              {stats.totalReviews} reviews
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 pt-3">
            <div className="flex items-center gap-1">
              <Calendar size={14} style={{ color: "#171717" }} />
              <span className="text-xs lg:text-sm" style={{ color: "#171717" }}>
                {stats.totalBookings}
              </span>
            </div>
            <span className="text-xs lg:text-smtext-[#777]">Bookings hosted</span>
          </div>
          <div className="flex flex-col items-center gap-1 pt-3">
            <div className="flex items-center gap-1">
              <Home size={14} style={{ color: "#171717" }} />
              <span className="text-xs lg:text-sm" style={{ color: "#171717" }}>
                {properties.length}
              </span>
            </div>
            <span className="text-xs lg:text-smtext-[#777]">
              {properties.length === 1 ? "Property" : "Properties"}
            </span>
          </div>
        </div> */}
      </div>
      <div className="w-full">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
              {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
      </div>
    </div>
  );
}

