import { apiSlice }       from "./apiSlice";
import { PROPERTY_URL }   from "@/constants/api";
import type {
  Property, CreatePropertyPayload, UpdatePropertyPayload,
  RoomType, CreateRoomTypePayload,
  SeedCalendarPayload, AvailabilitySlot, BlockDatesPayload,
  ApiSuccessResponse,
} from "@/types/api";

interface PropertiesResponse   { success: boolean; data: Property[];         }
interface PropertyResponse     { success: boolean; data: Property;           }
interface RoomTypeResponse     { success: boolean; data: RoomType;           }
interface AvailabilityResponse { success: boolean; data: AvailabilitySlot[]; }

export const propertyApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProperties: builder.query<PropertiesResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => ({ url: `${PROPERTY_URL}?page=${page}&limit=${limit}` }),
      providesTags: ["Property"],
    }),

    getPropertyById: builder.query<PropertyResponse, string>({
      query: (id) => ({ url: `${PROPERTY_URL}/${id}` }),
      providesTags: (_r, _e, id) => [{ type: "Property", id }],
    }),

    createProperty: builder.mutation<PropertyResponse, CreatePropertyPayload>({
      query: (body) => ({ url: PROPERTY_URL, method: "POST", body }),
      invalidatesTags: ["Property"],
    }),

    updateProperty: builder.mutation<PropertyResponse, { id: string; body: UpdatePropertyPayload }>({
      query: ({ id, body }) => ({ url: `${PROPERTY_URL}/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Property", id }, "Property"],
    }),

    createRoomType: builder.mutation<RoomTypeResponse, { propertyId: string; body: CreateRoomTypePayload }>({
      query: ({ propertyId, body }) => ({ url: `${PROPERTY_URL}/${propertyId}/room-types`, method: "POST", body }),
      invalidatesTags: ["RoomType"],
    }),

    seedCalendar: builder.mutation<ApiSuccessResponse, { roomTypeId: string; body: SeedCalendarPayload }>({
      query: ({ roomTypeId, body }) => ({
        url:    `${PROPERTY_URL}/room-types/${roomTypeId}/calendar`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Availability"],
    }),

    getAvailability: builder.query<AvailabilityResponse, { roomTypeId: string; checkIn: string; checkOut: string }>({
      query: ({ roomTypeId, checkIn, checkOut }) => ({
        url: `${PROPERTY_URL}/room-types/${roomTypeId}/availability?checkIn=${checkIn}&checkOut=${checkOut}`,
      }),
      providesTags: ["Availability"],
    }),

    blockDates: builder.mutation<ApiSuccessResponse, { roomTypeId: string; body: BlockDatesPayload }>({
      query: ({ roomTypeId, body }) => ({
        url:    `${PROPERTY_URL}/room-types/${roomTypeId}/block`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Availability"],
    }),
  }),
});

export const {
  useGetPropertiesQuery,
  useGetPropertyByIdQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useCreateRoomTypeMutation,
  useSeedCalendarMutation,
  useGetAvailabilityQuery,
  useBlockDatesMutation,
} = propertyApi;