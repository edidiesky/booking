import { useParams }                    from "react-router-dom";
import { useGetBookingByIdQuery }       from "@/redux/services/bookingApi";
import { useInitializePaymentMutation } from "@/redux/services/paymentApi";

export function useBookingPayment() {
  const { bookingId } = useParams<{ bookingId: string }>();

  const { data, isLoading } = useGetBookingByIdQuery(bookingId ?? "", { skip: !bookingId });
  const [initializePayment, { isLoading: paying }] = useInitializePaymentMutation();

  const booking = data?.data ?? null;

  const handlePay = async (gateway: "paystack" | "flutterwave") => {
    if (!bookingId) return;
    try {
      const result = await initializePayment({
        bookingId,
        gateway,
        callbackUrl: `${window.location.origin}/booking-success`,
      }).unwrap();
      window.location.href = result.data.redirectUrl;
    } catch {
      /* errorMiddleware shows toast */
    }
  };

  return { booking, isLoading, handlePay, paying };
}