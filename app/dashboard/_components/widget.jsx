import React from 'react';
import { MdHotel } from "react-icons/md";
const Widget = () => {
    return (
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          style={{ transition: "all .3s" }}
          className="p-8 w-full rounded-[30px] hover:shadow-xl justify-between cursor-pointer border bg-white flex items-center gap-4 h-56"
        >
          <div className="flex flex-col">
            <h3 className="text-5xl font-bold">
              <span className="text-grey pb-4 block text-base font-normal">
                New Booking
              </span>
              25
            </h3>
          </div>
          <div className="w-14 bg-[#5B5DB4] text-white text-2xl h-14 rounded-full flex items-center justify-center">
            <MdHotel />
          </div>
        </div>
        <div
          style={{ transition: "all .3s" }}
          className="p-8 rounded-[30px] hover:shadow-xl cursor-pointer justify-between border bg-white flex items-center gap-4 h-56"
        >
          <div className="flex flex-col">
            <h3 className="text-5xl font-bold">
              <span className="text-grey pb-4 block text-base font-normal">
                Total Revenue
              </span>
              $13.599
            </h3>
          </div>
          <div className="w-14 bg-[#FF7F5C] text-white text-2xl h-14 rounded-full flex items-center justify-center">
            <MdHotel />
          </div>
        </div>
        <div
          style={{ transition: "all .3s" }}
          className="p-8 rounded-[30px] hover:shadow-xl cursor-pointer justify-between border bg-white flex items-center gap-4 h-56"
        >
          <div className="flex flex-col">
            <h3 className="text-5xl font-bold">
              <span className="text-grey pb-4 block text-base font-normal">
                Total Reserved
              </span>
              90
            </h3>
          </div>
          <div className="w-14 bg-[#FF7F5C] text-white text-2xl h-14 rounded-full flex items-center justify-center">
            <MdHotel />
          </div>
        </div>
      </div>
    );
}


export default Widget;