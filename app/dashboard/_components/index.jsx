
import React from 'react';
import Widget from './widget';
import ReservationList from './ReservationList';
import Statistics from './statistics';
const DashboardIndex = ({ currentUser }) => {
  return (
    <div className="w-full py-8">
      <div className="w-full flex flex-col gap-12">
        <h2 className="text-4xl font-booking_font_bold font-bold">
          <span className="block font-booking_font text-grey font-normal text-lg">
            Welcome Back
          </span>
          {currentUser?.name}
        </h2>
        <Widget />
        <Statistics />
        <ReservationList />
      </div>
      {/* <DashboardBanner/> */}
    </div>
  );
};

export default DashboardIndex;