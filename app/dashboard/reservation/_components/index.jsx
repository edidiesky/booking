import React from 'react';
const DashboardIndex = () => {
    return (
      <div className="w-full">
        <div className="w-full flex flex-col gap-12">
          <div className="w-full flex items-center justify-between">
            <h3 className="text-3xl font-booking_font font-normal">My Reservation</h3>
            <div className="p-4 cursor-pointer text-base
             bg-[#000] px-8 font-booking_font rounded-[40px] font-bold text-white">
              Start Your Search
            </div>
          </div>
        </div>
      </div>
    );
}

export default DashboardIndex;