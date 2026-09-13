import { useGetDomainInfoQuery } from "@/redux/services/tenantDomainApi";
import SubdomainClaimForm from "./SubdomainClaimForm";
import CustomDomainSection from "./CustomDomainSection";

export default function DomainSettingsTab() {
  const { data, isLoading } = useGetDomainInfoQuery();

  if (isLoading || !data) {
    return <div className="p-6 text-xs text-[#a3a6af]">Loading domain settings...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <SubdomainClaimForm currentSubdomain={data.subdomain} />
      <CustomDomainSection info={data} />
    </div>
  );
}