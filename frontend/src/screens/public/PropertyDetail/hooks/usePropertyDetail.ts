import { useEffect, useState }                    from "react";
import { useParams, useNavigate }      from "react-router-dom";
import { useSelector }                 from "react-redux";
import { addDays }                     from "date-fns";
import { useGetAvailabilityQuery, useGetPropertyByIdQuery }     from "@/redux/services/propertyApi";
import { useInitiateBookingMutation }  from "@/redux/services/bookingApi";
import { selectIsAuthenticated }       from "@/redux/slices/authSlice";
import { showToast }                   from "@/components/common/Toast";
import type { RoomType }               from "@/types/api";
import { useAvailabilityStream } from "@/hooks/useAvailabilityStream";

export function usePropertyDetail() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const isAuth    = useSelector(selectIsAuthenticated);
  const today = new Date();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: today,
    to:   addDays(today, 3),
  });
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [guestCount,       setGuestCount]        = useState(2);

  const { data, isLoading } = useGetPropertyByIdQuery(id ?? "", { skip: !id });
  const property             = data?.data ?? null;

  const [initiateBooking, { isLoading: booking }] = useInitiateBookingMutation();
  useEffect(() => {
    if (!selectedRoomType && property?.roomTypes && property.roomTypes.length > 0) {
      setSelectedRoomType(property.roomTypes[0]);
    }
  }, [property, selectedRoomType]);
  const nights = Math.max(
    0,
    Math.round(
      (dateRange.to.getTime() - dateRange.from.getTime()) / 86_400_000
    )
  );

  const totalAmount = selectedRoomType
    ? Number(selectedRoomType.base_price_ngn) * nights
    : 0;


  const handleBook = async () => {
    if (!isAuth) {
      navigate("/login", { state: { from: `/properties/${id}` } });
      return;
    }
    if (!selectedRoomType) {
      showToast("Please select a room type.", "error");
      return;
    }
    if (nights < 1) {
      showToast("Minimum stay is 1 night.", "error");
      return;
    }
    try {
      const result = await initiateBooking({
        propertyId: id!,
        roomTypeId: selectedRoomType.id,
        checkIn:    dateRange.from.toISOString().split("T")[0],
        checkOut:   dateRange.to.toISOString().split("T")[0],
        roomsCount: 1,
        guestCount,
      }).unwrap();
      navigate(`/trips/${result.data.bookingId}`);
    } catch { /* errorMiddleware */ }
  };


  const availabilityWindow = {
    checkIn:  today.toISOString().split("T")[0],
    checkOut: addDays(today, 90).toISOString().split("T")[0],
  };

   const { data: availabilityData } = useGetAvailabilityQuery(
    { roomTypeId: selectedRoomType?.id ?? "", ...availabilityWindow },
    { skip: !selectedRoomType?.id },
  );

    const liveEvent = useAvailabilityStream(selectedRoomType?.id);

  return {
    property, isLoading,
    dateRange, setDateRange,
    nights,
    selectedRoomType, setSelectedRoomType,
    guestCount, setGuestCount,
    totalAmount,
    handleBook, 
    booking,
    liveEvent,
    availabilitySnapshot: availabilityData?.data ?? [],
  };
}