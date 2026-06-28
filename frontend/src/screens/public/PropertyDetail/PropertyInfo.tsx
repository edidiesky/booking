import { motion }              from "framer-motion";
import { ArrowLeft }           from "lucide-react";
import { useNavigate }         from "react-router-dom";
import Header                  from "@/components/common/Header";
import Footer                  from "@/components/common/Footer";
import PropertyImages          from "./PropertyImages";
import PropertyInfo            from "./PropertyInfo";
import BookingForm             from "./BookingForm";
import AvailabilityCalendar    from "./AvailabilityCalendar";
import { usePropertyDetail }   from "./hooks/usePropertyDetail";

function PropertyDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
      <div className="flex flex-col gap-6">
        <div className="w-full h-[420px] rounded-2xl animate-pulse"
             style={{ backgroundColor: "#f2f0ed" }} />
        <div className="h-8 w-2/3 rounded animate-pulse"
             style={{ backgroundColor: "#f2f0ed" }} />
        <div className="h-4 w-1/2 rounded animate-pulse"
             style={{ backgroundColor: "#f2f0ed" }} />
      </div>
      <div className="h-[400px] rounded-2xl animate-pulse"
           style={{ backgroundColor: "#f2f0ed" }} />
    </div>
  );
}

export default function PropertyDetail() {
  const navigate = useNavigate();
  const {
    property, isLoading, availability,
    checkIn,    setCheckIn,
    checkOut,   setCheckOut,
    roomsCount, setRoomsCount,
    guestCount, setGuestCount,
    selectedRoomTypeId, setSelectedRoomTypeId,
    handleBook, booking,
  } = usePropertyDetail();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
      <Header />

      <main className="flex-1">
        <div className="mx-auto px-6 lg:px-8 py-10" style={{ maxWidth: "1280px" }}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-60"
            style={{ color: "var(--color-muted-stone)" }}
          >
            <ArrowLeft size={16} /> Back to properties
          </button>

          {isLoading || !property ? (
            <PropertyDetailSkeleton />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">

              {/* ── left column ── */}
              <div className="flex flex-col gap-10">
                <PropertyImages images={property.images} name={property.name} />

                <PropertyInfo property={property} />

                {/* calendar appears only once a room type is selected */}
                {selectedRoomTypeId && (
                  <AvailabilityCalendar
                    slots={availability}
                    checkIn={checkIn}
                    checkOut={checkOut}
                  />
                )}
              </div>

              {/* ── right column ── sticky booking form */}
              <BookingForm
                roomTypes={[]}
                selectedRoomTypeId={selectedRoomTypeId}
                onSelectRoomType={setSelectedRoomTypeId}
                checkIn={checkIn}      onCheckIn={setCheckIn}
                checkOut={checkOut}    onCheckOut={setCheckOut}
                roomsCount={roomsCount} onRoomsCount={setRoomsCount}
                guestCount={guestCount} onGuestCount={setGuestCount}
                onBook={handleBook}
                isBooking={booking}
              />

            </div>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}