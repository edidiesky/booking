import { useState }                  from "react";
import {
  useCreatePropertyMutation,
  useCreateRoomTypeMutation,
} from "@/redux/services/propertyApi";
import { showToast }                 from "@/components/common/Toast";
import type { CreatePropertyPayload, CreateRoomTypePayload } from "@/types/api";
import { useGetMyPropertiesQuery } from "../../../../redux/services/propertyApi";

export function useProperties() {
  const [page, setPage]                         = useState(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const { data, isLoading } = useGetMyPropertiesQuery({ page, limit: 20 });
  const [createProperty, { isLoading: creating }] = useCreatePropertyMutation();
  const [createRoomType, { isLoading: creatingRoom }] = useCreateRoomTypeMutation();

  const properties = data?.data ?? [];

  const handleCreateProperty = async (payload: CreatePropertyPayload) => {
    try {
      await createProperty(payload).unwrap();
      showToast("Property created.", "success");
      return true;
    } catch {
      return false;
    }
  };

  const handleCreateRoomType = async (propertyId: string, payload: CreateRoomTypePayload) => {
    try {
      await createRoomType({ propertyId, body: payload }).unwrap();
      showToast("Room type created.", "success");
      return true;
    } catch {
      return false;
    }
  };

  return {
    properties, isLoading,
    page, setPage,
    selectedPropertyId, setSelectedPropertyId,
    handleCreateProperty, creating,
    handleCreateRoomType, creatingRoom,
  };
}