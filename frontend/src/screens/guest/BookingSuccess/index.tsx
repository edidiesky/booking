import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  CalendarDays,
  MapPin,
  Users,
  Moon,
  Receipt,
  Home,
  MessageCircle,
  ChevronRight,
  PartyPopper,
} from "lucide-react";
import { useGetBookingByIdQuery } from "@/redux/services/bookingApi";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import LazyImage from "@/components/common/LazyImage";

const JOURNEY_STEPS = [
  { key: "select", label: "Selected your stay" },
  { key: "dates", label: "Chose dates & guests" },
  { key: "review", label: "Reviewed price & details" },
  { key: "pay", label: "Completed payment" },
  { key: "confirm", label: "Booking confirmed" },
] as const;

type StepStatus = "done" | "active" | "pending";

function JourneyChecklist({
  steps,
}: {
  steps: { label: string; status: StepStatus }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-[10px] px-3 py-2.5"
        >
          {step.status === "done" && (
            <CheckCircle2 size={18} className="shrink-0 text-[#17191c]" />
          )}
          {step.status === "active" && (
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[#17191c]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#17191c]" />
            </span>
          )}
          {step.status === "pending" && (
            <Circle size={18} className="shrink-0 text-[#d1d5db]" />
          )}
          <span
            className="text-[13px]"
            style={{
              color: step.status === "pending" ? "#9ca3af" : "#17191c",
              fontWeight: step.status === "active" ? 600 : 400,
              textDecoration: step.status === "done" ? "line-through" : "none",
            }}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-[#777b86]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-[#a3a6af]">{label}</p>
        <p className="text-[14px] font-medium text-[#17191c]">{value}</p>
      </div>
    </div>
  );
}

export default function BookingSuccess() {
  const navigate = useNavigate();
  const { bookingId: routeId } = useParams<{ bookingId?: string }>();
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (routeId) {
      setBookingId(routeId);
      return;
    }
    const stored = sessionStorage.getItem("pending_booking_id");
    if (stored) setBookingId(stored);
  }, [routeId]);

  const { data, isLoading } = useGetBookingByIdQuery(bookingId ?? "", {
    skip: !bookingId,
  });
  const booking = data?.data;

  const checklist = useMemo(
    () =>
      JOURNEY_STEPS.map((s) => ({
        label: s.label,
        status: "done" as StepStatus,
      })),
    [],
  );

  const cover =
    booking?.roomTypeImage ?? booking?.room_type_images?.[0] ?? null;
  const guestName = [booking?.guestFirstName, booking?.guestLastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen grid lg:grid-cols-[420px_1fr] bg-white">
      {/* Left — journey (onboarding pattern) */}
      <aside className="hidden lg:flex flex-col justify-between border-r border-[#ebebeb] bg-[#fafaf9] p-10">
        <div className="flex flex-col gap-8">
          <Link
            to="/"
            className="text-[15px] font-semibold tracking-tight text-[#17191c]"
          >
            Bukkings
          </Link>
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight text-[#17191c]">
              You’re all set
            </h2>
            <p className="mt-1 text-[13px] text-[#777b86]">
              Here’s everything you completed to lock in this stay.
            </p>
          </div>
          <JourneyChecklist steps={checklist} />
        </div>
        <div className="rounded-2xl border border-[#e8e6e3] bg-white p-4">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#17191c]">
            <PartyPopper size={16} />
            What happens next
          </div>
          <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-[#777b86]">
            <li>Host is notified and prepping your room.</li>
            <li>You’ll get a confirmation email with the receipt.</li>
            <li>Message the host anytime from My Bookings.</li>
          </ul>
        </div>
      </aside>

      {/* Right — success + summary */}
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[520px] flex flex-col gap-6"
        >
          <div className="lg:hidden rounded-2xl border border-[#e8e6e3] bg-[#fafaf9] p-4">
            <p className="mb-2 text-[12px] font-medium text-[#777b86]">
              Your booking journey
            </p>
            <JourneyChecklist steps={checklist} />
          </div>

          <div className="text-center lg:text-left">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7] lg:mx-0">
              <CheckCircle2 size={28} className="text-[#166534]" />
            </div>
            <h1 className="text-[24px] lg:text-[28px] font-semibold tracking-tight text-[#17191c]">
              Booking confirmed
            </h1>
            <p className="mt-1.5 text-[14px] text-[#777b86]">
              {booking?.propertyName ? (
                <>
                  <span className="font-medium text-[#17191c]">
                    {booking.propertyName}
                  </span>{" "}
                  is locked in. A receipt is on its way to your email.
                </>
              ) : (
                "Your stay is locked in. A receipt is on its way to your email."
              )}
            </p>
            {booking?.bookingRef && (
              <p className="mt-2 text-[12px] text-[#a3a6af]">
                Reference{" "}
                <span className=" font-medium text-[#17191c]">
                  {booking.bookingRef}
                </span>
              </p>
            )}
          </div>

          {isLoading && (
            <div className="h-48 animate-pulse rounded-2xl bg-[#f2f0ed]" />
          )}

          {!isLoading && booking && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/properties/${booking.propertyId}`)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[#e8e6e3] p-3 text-left hover:bg-[#fafaf9]"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f2f0ed]">
                  {cover ? (
                    <LazyImage
                      src={cover}
                      alt={booking.propertyName ?? "Stay"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#a3a6af]">
                      <Home size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-[#17191c]">
                    {booking.propertyName ?? "Your stay"}
                  </p>
                  <p className="truncate text-[13px] text-[#777b86]">
                    {booking.roomTypeName}
                    {booking.propertyCity ? ` · ${booking.propertyCity}` : ""}
                  </p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-[#a3a6af]" />
              </button>

              <div className="rounded-2xl border border-[#e8e6e3] px-4 divide-y divide-[#f0eeeb]">
                <DetailRow
                  icon={<CalendarDays size={16} />}
                  label="Check-in → Check-out"
                  value={
                    <>
                      {formatDate(booking.checkIn)} →{" "}
                      {formatDate(booking.checkOut)}
                    </>
                  }
                />
                <DetailRow
                  icon={<Moon size={16} />}
                  label="Nights"
                  value={`${booking.nights} night${booking.nights === 1 ? "" : "s"}`}
                />
                <DetailRow
                  icon={<Users size={16} />}
                  label="Guests & rooms"
                  value={`${booking.guestCount} guest${booking.guestCount === 1 ? "" : "s"} · ${booking.roomsCount} room${booking.roomsCount === 1 ? "" : "s"}`}
                />
                {guestName && (
                  <DetailRow
                    icon={<Users size={16} />}
                    label="Booked for"
                    value={guestName}
                  />
                )}
                {booking.propertyCity && (
                  <DetailRow
                    icon={<MapPin size={16} />}
                    label="Location"
                    value={booking.propertyCity}
                  />
                )}
                <DetailRow
                  icon={<Receipt size={16} />}
                  label="Total paid"
                  value={formatCurrency(booking.totalAmountNgn)}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem("pending_booking_id");
                    navigate(
                      bookingId ? `/bookings/${bookingId}` : "/guest/bookings",
                    );
                  }}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[#17191c] text-[14px] font-medium text-white hover:bg-black"
                >
                  View booking details
                </button>
                <div className="grid grid-cols-2 gap-2.5">
                  {booking.receiptUrl && (
                    <a
                      href={booking.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#e8e6e3] text-[13px] font-medium text-[#17191c] hover:bg-[#fafaf9]"
                    >
                      <Receipt size={15} />
                      Receipt
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate("/messages")}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#e8e6e3] text-[13px] font-medium text-[#17191c] hover:bg-[#fafaf9]"
                  >
                    <MessageCircle size={15} />
                    Message host
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem("pending_booking_id");
                    navigate("/search");
                  }}
                  className="h-11 text-[13px] font-medium text-[#777b86] hover:text-[#17191c] hover:underline"
                >
                  Continue browsing
                </button>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
