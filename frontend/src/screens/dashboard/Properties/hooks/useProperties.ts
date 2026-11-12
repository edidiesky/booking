import { useState } from "react";
import {
  useCreatePropertyMutation,
  useCreateRoomTypeMutation,
  useGetMyPropertiesQuery,
  useGetTenantPropertyStatsQuery,
} from "@/redux/services/propertyApi";
import { showToast } from "@/components/common/Toast";
import type {
  CreatePropertyPayload,
  CreateRoomTypePayload,
  PropertyStatus,
} from "@/types/api";
import { useClampPage, usePagination } from "@/hooks/usePagination";

const PAGE_SIZE = 7;

export function useProperties() {
  const { page, setPage, resetPage } = usePagination();
  const [statusFilter, setStatusFilterRaw] = useState<PropertyStatus | "">("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );

  const { data, isLoading, isFetching } = useGetMyPropertiesQuery({
    page,
    limit: PAGE_SIZE,
    status: statusFilter || undefined,
  });
  const { data: statsData, isLoading: isStatsLoading } =
    useGetTenantPropertyStatsQuery();
  const [createProperty, { isLoading: creating }] = useCreatePropertyMutation();
  const [createRoomType, { isLoading: creatingRoom }] =
    useCreateRoomTypeMutation();

  useClampPage(data?.meta, page, setPage);

  const setStatusFilter = (value: PropertyStatus | "") => {
    setStatusFilterRaw(value);
    resetPage();
  };

  const handleCreateProperty = async (payload: CreatePropertyPayload) => {
    try {
      await createProperty(payload).unwrap();
      showToast("Property created.", "success");
      return true;
    } catch {
      return false;
    }
  };

  const handleCreateRoomType = async (
    propertyId: string,
    payload: CreateRoomTypePayload,
  ) => {
    try {
      await createRoomType({ propertyId, body: payload }).unwrap();
      showToast("Room type created.", "success");
      return true;
    } catch {
      return false;
    }
  };

  return {
    properties: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    isFetching,
    page,
    setPage,
    statusFilter,
    setStatusFilter,
    selectedPropertyId,
    setSelectedPropertyId,
    handleCreateProperty,
    creating,
    handleCreateRoomType,
    creatingRoom,
    stats: statsData?.data,
    isStatsLoading,
  };
}