import { useParams } from "react-router-dom";
import { useGetPropertyDetailQuery } from "@/redux/services/propertyApi";

export function usePropertyDetail() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { data, isLoading } = useGetPropertyDetailQuery(propertyId ?? "", { skip: !propertyId });

  return {
    propertyId,
    property: data?.data.property,
    roomTypes: data?.data.roomTypes ?? [],
    summary: data?.data.summary,
    isLoading,
  };
}