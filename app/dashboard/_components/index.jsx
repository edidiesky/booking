import DashboardBanner from '@/components/common/dashboardBanner';
import React from 'react';
const DashboardIndex = () => {
    return <div className='w-full p-8'>
        <div className="w-full flex flex-col gap-8">
            <h2 className=" text-3xl font-bold">
                Admin Reservation Dashboard
            </h2>
        </div>
          {/* <DashboardBanner/> */}
    </div>;
}

export default DashboardIndex;