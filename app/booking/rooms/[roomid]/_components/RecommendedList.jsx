"use client";

import useRooms from "@/app/hooks/useRooms";
import RoomCard from "@/components/common/RoomCard";
import { apartmentDataList } from "@/constants/data/apartment";
import Skeleton from "react-loading-skeleton";

const RecommendedList = ({ currentUser, roomid }) => {
  const { loading, error, rooms } = useRooms();
  const newRooms = rooms?.filter((room, index) => room?.id !== roomid);
  return (
    <div className="w-full py-8 mt-8 flex flex-col gap-8">
      <div className="w-[90%]  max-w-custom mx-auto flex flex-col gap-12">
        <h3 className="text-4xl md:text-5xl font-booking_font4">
          Similar Rooms
          <span className="block pt-3 text-sm">
            Enjoy the comforts of home and beyond with these distinctive
            features.
          </span>
        </h3>

        <div className="w-full gap-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {loading ? (
            <>
              {apartmentDataList?.slice(0, 3).map((apartment, index) => {
                return (
                  <div key={index} className="w-full flex flex-col gap-2">
                    <Skeleton key={index} width={"100%"} height={200} />
                    <div className="border bg-white p-6 flex flex-col gap-3">
                      <Skeleton key={index} width={"30%"} height={10} />
                      <Skeleton key={index} width={"60%"} height={30} />
                      <Skeleton key={index} width={"30%"} height={10} />
                      <Skeleton key={index} width={"20%"} height={10} />
                      <Skeleton key={index} width={"10%"} height={10} />
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {newRooms?.slice(0, 3)?.map((apartment, index) => {
                return (
                  <RoomCard
                    index={index}
                    type={"Search"}
                    apartment={apartment}
                    currentUser={currentUser}
                    key={index}
                  />
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default RecommendedList;
