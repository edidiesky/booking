"use client"
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

const Statistics = () => {
  const [options, setOptions] = useState({
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
  });

  const [series, setSeries] = useState([
    {
      name: "Rooms",
      data: [14, 22, 45, 15, 40, 18, 58, 16],
    },
    {
      name: "Reservations",
      data: [16, 23, 39, 26, 44, 25, 50, 28],
    },
  ]);

  //  useEffect(() => {
  //    if (typeof window !== "undefined") {
  //      const chart = new ApexCharts(document.getElementById("chart"), {
  //        options: options,
  //        series: series,
  //      });
  //      chart.render();
  //    }
  //  }, []);

  return (
    <div id="chart" className="w-full">
      <div className="p-8 w-full px-4 rounded-[30px] min-h-[600px] border bg-white flex gap-4">
        <div className="flex w-full flex-col gap-4">
          <h3 className="text-3xl font-booking_font4 font-medium">
            Customer Statistics
          </h3>
          <Chart
            options={options}
            series={series}
            type="line"
            width={"100%"}
            height={480}
          />
        </div>
      </div>
    </div>
  );
};

export default Statistics;
