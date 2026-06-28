import { useParams, useNavigate }      from "react-router-dom";
import { useGetBookingByIdQuery }      from "@/redux/services/bookingApi";
import { useGetPaymentByBookingQuery } from "@/redux/services/paymentApi";
import { useInitializePaymentMutation } from "@/redux/services/paymentApi";
import { useSelector }                 from "react-redux";
import { selectCurrentUser }           from "@/redux/slices/authSlice";

export function useBookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate      = useNavigate();
  const currentUser   = useSelector(selectCurrentUser);

  const { data: bookingData, isLoading } = useGetBookingByIdQuery(bookingId ?? "", {
    skip: !bookingId,
  });

  const { data: paymentData } = useGetPaymentByBookingQuery(bookingId ?? "", {
    skip: !bookingId,
  });

  const [initializePayment, { isLoading: paying }] = useInitializePaymentMutation();

  const booking = bookingData?.data;
  const payment = paymentData?.data;

  const handlePay = async (gateway: "paystack" | "flutterwave") => {
    if (!bookingId || !currentUser) return;
    try {
      const result = await initializePayment({
        bookingId,
        gateway,
        callbackUrl: `${window.location.origin}/trips/${bookingId}`,
      }).unwrap();
      window.location.href = result.data.redirectUrl;
    } catch { /* errorMiddleware */ }
  };

  return {
    booking, payment, isLoading, paying,
    handlePay,
    goBack: () => navigate("/trips"),
  };
}