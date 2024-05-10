"use client"
import React, {useState} from 'react';
import Chart from "react-apexcharts";
const Statistics = () => {
   const [data, setData] = useState({
     series: [
       {
         name: "Series A",
         data: [14, 22, 45, 15, 40, 18, 58, 16],
       },
       {
         name: "Series B",
         data: [20, 29, 37, 36, 44, 45, 50, 58],
       },
     ],
     options: {
       chart: {
         height: 350,
         type: "line",
         fontFamily: "var(--font-work)",
         foreColor: "#333",
         fontSize: "30px",
         textTransform: "capitalize",
         zoom: {
           enabled: false,
         },
       },
       dataLabels: {
         enabled: false,
       },
       colors: ["#FF1654", "#247BA0"],
       stroke: {
         curve: "smooth",
       },
       xaxis: {
         categories: [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016],
       },
     },
   });
    return (
      <div className="w-full">
        <div className="p-8 w-full px-12 rounded-[30px] min-h-[600px] border bg-white flex gap-4">
          <div className="flex w-full flex-col gap-4">
            <h3 className="text-3xl font-booking_font font-medium">Customer Statitics</h3>

            <Chart
              options={data.options}
              series={data.series}
              type="line"
              width={"100%"}
              height={480}
            />
          </div>
        </div>
      </div>
    );
}


export default Statistics;