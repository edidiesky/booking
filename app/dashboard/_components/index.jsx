import DashboardBanner from '@/components/common/dashboardBanner';
import React from 'react';
import Widget from './widget';
import ReservationList from './ReservationList';
import Statistics from './statistics';
const DashboardIndex = () => {
    return <div className='w-full py-8'>
        <div className="w-full flex flex-col gap-12">
            <h2 className=" text-3xl font-bold">
                <span className="block text-grey font-normal text-xl">Welcome Back</span>
                Davio Samuel
            </h2>
            <Widget/>
            <Statistics/>
            <ReservationList/>
            
        </div>
          {/* <DashboardBanner/> */}
    </div>;
}

export default DashboardIndex;