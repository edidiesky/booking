import { useState }                  from "react";
import { useParams, useNavigate }    from "react-router-dom";
import { useSelector }               from "react-redux";
import {
  useGetPropertyByIdQuery,
  useGetAvailabilityQuery,
}                                    from "@/redux/services/propertyApi";
import { useInitiateBookingMutation } from "@/redux/services/bookingApi";
import { selectIsAuthenticated }     from "@/redux/slices/authSlice";
import { showToast }                 from "@/components/common/Toast";

export function usePropertyDetail() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const isAuth       = useSelector(selectIsAuthenticated);

  const [checkIn,     setCheckIn]     = useState("");
  const [checkOut,    setCheckOut]    = useState("");
  const [roomsCount,  setRoomsCount]  = useState(1);
  const [guestCount,  setGuestCount]  = useState(1);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState("");

  const { data: propertyData, isLoading } = useGetPropertyByIdQuery(id ?? "", { skip: !id });

  const { data: availabilityData } = useGetAvailabilityQuery(
    { roomTypeId: selectedRoomTypeId, checkIn, checkOut },
    { skip: !selectedRoomTypeId || !checkIn || !checkOut }
  );

  const [initiateBooking, { isLoading: booking }] = useInitiateBookingMutation();

  const property    = propertyData?.data;
  const availability = availabilityData?.data ?? [];

  const handleBook = async () => {
    if (!isAuth) {
      navigate("/login", { state: { from: `/properties/${id}` } });
      return;
    }
    if (!id || !selectedRoomTypeId || !checkIn || !checkOut) {
      showToast("Please select dates and a room type.", "error");
      return;
    }
    try {
      const result = await initiateBooking({
        propertyId: id,
        roomTypeId: selectedRoomTypeId,
        checkIn,
        checkOut,
        roomsCount,
        guestCount,
      }).unwrap();
      navigate(`/trips/${result.data.bookingId}`);
    } catch { /* errorMiddleware handles toast */ }
  };

  return {
    property, isLoading, availability,
    checkIn,    setCheckIn,
    checkOut,   setCheckOut,
    roomsCount, setRoomsCount,
    guestCount, setGuestCount,
    selectedRoomTypeId, setSelectedRoomTypeId,
    handleBook, booking,
  };
}