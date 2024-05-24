"use client";
import React, { useState } from "react";
import { BiSearch, BiUpload } from "react-icons/bi";
import Loader from "@/components/loader";
import Link from "next/link";
import { RoomFeaturesList, RoomFeaturesList2 } from "@/constants/data/feature";

const RoomForms = ({
  title,
  setRooms,
  rooms,
  setBathRooms,
  bathrooms,
  setTitle,
  description,
  setDescription,
  price,
  setPrice,
  setImages,
  images,
  setFeatures,
  features,
  amenities,
  setAmenities,
  setAddress,
  city,
  setCity,
  address
}) => {
  const handleFeatureSelection = (data) => {
    if (features.includes(data)) {
      const newdata = features.filter((x) => x?.title !== data?.title);
      setFeatures(newdata);
    } else {
      setFeatures([...features, data]);
    }
  };

  const handleRoomAmenitiesSelection = (data) => {
    if (amenities.includes(data)) {
      const newdata = amenities.filter((x) => x?.title !== data?.title);
      setAmenities(newdata);
    } else {
      setAmenities([...amenities, data]);
    }
  };
  // console.log(features);
  return (
    <div className="w-full flex flex-col gap-8">
      {/* title */}
      <div className="w-full shadow-xl bg-[#fff] border p-6 px-2 rounded-md">
        <div className="w-[95%] md:w-[90%] mx-auto flex flex-col gap-8">
          <div className="w-full flex items-center justify-between">
            <h4 className="text-2xl font-booking_font4 font-bold">
              Name & Description
            </h4>
            <div className="flex items-center justify-end">
              <Link
                href={"/dashboard/rooms"}
                className="p-3 px-4 cursor-pointer hover:bg-[#fafafa] border rounded-lg font-booking_font_bold text-base flex items-center justify-center gap-2"
              >
                Go Back
              </Link>
            </div>
          </div>
          <div className="pt-4 w-full flex flex-col gap-4">
            <label
              htmlFor="title"
              className="text-sm font-bold flex flex-col gap-2 font-booking_font_bold"
            >
              Product Title
              <input
                name="title"
                value={title}
                id="title"
                type="text"
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm w-full input"
              />
            </label>
            <label
              htmlFor="description"
              className="text-sm font-bold flex flex-col gap-2 font-booking_font_bold"
            >
              Product Description
              <textarea
                name="description"
                value={description}
                id="description"
                type="text"
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm w-full h-[250px]"
              />
            </label>
          </div>
        </div>
      </div>
      {/* price */}
      <div className="w-full shadow-xl bg-[#fff] border p-6 px-2 rounded-md">
        <div className="w-[95%] md:w-[90%] mx-auto flex flex-col gap-8">
          <div className="w-full flex items-center justify-between">
            <h4 className="text-2xl font-booking_font4 font-bold">
              Price & Room Capacity
              <span className="font-normal font-booking_font text-base block">
                Share what makes your place special.
              </span>
            </h4>
          </div>
          <div className="pt-2 w-full flex flex-col gap-4">
            <label
              htmlFor="titlprice"
              className="text-sm font-bold flex flex-col gap-2 font-booking_font_bold"
            >
              Room Amount
              <input
                name="price"
                value={price}
                id="price"
                type="text"
                onChange={(e) => setPrice(e.target.value)}
                className="text-sm w-full input"
              />
            </label>
            <div className="w-full grid md:grid-cols-2 gap-4">
              <label
                htmlFor="rooms"
                className="text-sm font-bold flex flex-col gap-2 font-booking_font_bold"
              >
                Room Count
                <input
                  name="rooms"
                  value={rooms}
                  id="rooms"
                  type="number"
                  onChange={(e) => setRooms(e.target.value)}
                  className="text-sm w-full input"
                />
              </label>
              <label
                htmlFor="bathrooms"
                className="text-sm font-bold flex flex-col gap-2 font-booking_font_bold"
              >
                Bath-Room Count
                <input
                  name="bathrooms"
                  value={bathrooms}
                  id="bathrooms"
                  type="number"
                  onChange={(e) => setBathRooms(e.target.value)}
                  className="text-sm w-full input"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* location, address, city */}
      <div className="w-full shadow-xl bg-[#fff] border p-6 px-2 rounded-md">
        <div className="w-[95%] md:w-[90%] mx-auto flex flex-col gap-8">
          <div className="w-full flex items-center justify-between">
            <h4 className="text-2xl font-booking_font4 font-bold">
              Room Location
              <span className="font-normal font-booking_font text-base block">
                Share where your room is located.
              </span>
            </h4>
          </div>
          <div className="pt-2 w-full flex flex-col gap-4">
            <div className="w-full grid md:grid-cols-2 gap-4">
              <label
                htmlFor="city"
                className="text-sm font-bold flex flex-col gap-2 font-booking_font_bold"
              >
                Room City
                <input
                  name="city"
                  value={city}
                  id="city"
                  type="text"
                  onChange={(e) => setCity(e.target.value)}
                  className="text-sm w-full input"
                />
              </label>
              <label
                htmlFor="bathrooms"
                className="text-sm font-bold flex flex-col gap-2 font-booking_font_bold"
              >
                Room Address
                <input
                  name="address"
                  value={address}
                  id="address"
                  type="text"
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-sm w-full input"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* images */}
      <div className="w-full shadow-xl bg-[#fff] border p-6 px-2 rounded-md">
        <div className="w-[95%] md:w-[90%] mx-auto flex flex-col gap-8">
          <div className="w-full flex items-center justify-between">
            <h4 className="text-2xl font-booking_font4 font-bold">
              Room Images
              <span className="font-normal font-booking_font text-base block">
                Share what makes your rooms images special.
              </span>
            </h4>
          </div>
          <div className="w-full flex flex-col gap-4">
            <div className="w-full flex flex-col gap-4 text-sm font-booking_font_bold">
              <span>Photos</span>
              <div className="w-full bg-[#fafafa] rounded-lg flex items-center justify-center h-[300px]">
                <label
                  htmlFor="titlprice"
                  className="text-sm font-bold cursor-pointer flex items-center shadow-xl border rounded-lg justify-center bg-white p-4 gap-3 font-booking_font_bold"
                >
                  <BiUpload /> Select the photos for your room
                  {/* <input
                    name="price"
                    value={price}
                    id="price"
                    type="text"
                    onChange={(e) => setPrice(e.target.value)}
                    className="text-sm w-full input"
                  /> */}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Attributes and Features */}
      <div className="w-full shadow-xl bg-[#fff] border p-6 px-2 rounded-md">
        <div className="w-[95%] md:w-[90%] mx-auto flex flex-col gap-8">
          <div className="w-full flex items-center justify-between">
            <h4 className="text-2xl font-booking_font4 font-bold">
              Room Attributes & Features
              <span className="font-normal font-booking_font text-base block">
                Share what makes your place special.
              </span>
            </h4>
          </div>
          <div className="pt-2 w-full flex flex-col gap-8">
            <div className="flex gap-4 flex-col w-full">
              <span className="font-bold font-booking_font_bold text-base block">
                Room Features
              </span>
              <div className="w-full grid grid-cols-3 lg:grid-cols-4 gap-3">
                {RoomFeaturesList?.map((x, index) => {
                  const active = features.includes(x);
                  return (
                    <div
                      onClick={() => handleFeatureSelection(x)}
                      className={`${
                        active
                          ? "border-[rgba(0,0,0,.7)] bg-[#fafafa] border-2"
                          : "border-[rgba(0,0,0,.08)] border"
                      } flex w-full cursor-pointer hover:bg-[#fafafa] p-4 rounded-lg flex-col gap-2`}
                    >
                      {x?.icon}
                      <span className="text-xs font-booking_font_bold font-bold">
                        {x?.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 flex-col w-full">
              <span className="font-bold font-booking_font_bold text-base block">
                Room Amenities
              </span>
              <div className="w-full grid grid-cols-3 lg:grid-cols-4 gap-3">
                {RoomFeaturesList2?.map((x, index) => {
                  const active = amenities.includes(x);
                  return (
                    <div
                      onClick={() => handleRoomAmenitiesSelection(x)}
                      className={`${
                        active
                          ? "border-[rgba(0,0,0,.7)] bg-[#fafafa] border-2"
                          : "border-[rgba(0,0,0,.08)] border"
                      } flex w-full cursor-pointer hover:bg-[#fafafa] p-4 rounded-lg flex-col gap-2`}
                    >
                      {x?.icon}
                      <span className="text-xs font-booking_font_bold font-bold">
                        {x?.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomForms;
