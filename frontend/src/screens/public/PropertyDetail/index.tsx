import { motion }              from "framer-motion";
import { ArrowLeft }           from "lucide-react";
import { useNavigate }         from "react-router-dom";
import Header                  from "@/components/common/Header";
import Footer                  from "@/components/common/Footer";
import PropertyGallery         from "./PropertyGallery";
import PropertyHeader          from "./PropertyHeader";
import PropertyDescription     from "./PropertyDescription";
import PropertyAmenities       from "./PropertyAmenities";
import PropertyCalendar        from "./PropertyCalendar";
import ProductReview           from "./ProductReview";
import BookingForm             from "./BookingForm";
import { usePropertyDetail }   from "./hooks/usePropertyDetail";
import SellerSection from "./SellerSection";

function Skeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="w-full h-[420px] rounded-xl bg-[#f2f0ed]" />
      <div className="h-10 w-2/3 rounded bg-[#f2f0ed]" />
      <div className="h-4  w-1/2 rounded bg-[#f2f0ed]" />
      <div className="h-32 w-full rounded bg-[#f2f0ed]" />
    </div>
  );
}

export default function PropertyDetail() {
  const navigate = useNavigate();
  const {
    property, isLoading,
    dateRange, setDateRange,
    nights,
    selectedRoomType, setSelectedRoomType,
    guestCount, setGuestCount,
    totalAmount,
    handleBook, 
    booking,
    liveEvent,
    availabilitySnapshot
  } = usePropertyDetail();

  const roomTypes = property?.roomTypes ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
      <Header />

      <main className="flex-1 pb-24 lg:pb-0">
        <div className="w-full max-w-screen-xl mx-auto py-6 px-4 md:px-0">

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs text-[#777b86] mb-6 hover:text-[#17191c] transition-colors"
          >
            <ArrowLeft size={16} /> Back to properties
          </button>

          {isLoading || !property ? (
            <Skeleton />
          ) : (
            <>
              {/* gallery - full width */}
              <div className="w-full mb-10">
                <PropertyGallery
                  images={[
                    ...(property.images ?? []),
                    ...(roomTypes.flatMap((r) => r.images ?? [])),
                  ]}
                  name={property.name}
                />
              </div>

              {/* two-column layout */}
              <div className="w-full z-40 flex flex-col-reverse lg:grid lg:grid-cols-[1fr_400px] items-start gap-16">

                {/* ── left column ── */}
                <div className="flex flex-col gap-12 w-full">
                  <PropertyHeader
                    property={property}
                    roomTypes={roomTypes}
                  />

                  <PropertyDescription property={property} />

                  <PropertyAmenities property={property} />

                 <PropertyCalendar
                    nights={nights}
                    name={property.name}
                    dateRange={dateRange}
                    onChange={setDateRange}
                    liveEvent={liveEvent}
                    availabilitySnapshot={availabilitySnapshot}
                  />

                  {selectedRoomType && (
                    <ProductReview roomTypeId={selectedRoomType.id} />
                  )}
                  <SellerSection
                    tenantId={property.tenant_id}
                  />
                </div>

                {/* ── right column ── */}
                <BookingForm
                  roomTypes={roomTypes}
                  selectedRoomType={selectedRoomType}
                  onSelectRoomType={setSelectedRoomType}
                  dateRange={dateRange}
                  onDateChange={setDateRange}
                  guestCount={guestCount}
                  onGuestCount={setGuestCount}
                  nights={nights}
                  totalAmount={totalAmount}
                  onBook={handleBook}
                  isBooking={booking}
                />
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}