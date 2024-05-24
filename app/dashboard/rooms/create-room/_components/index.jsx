"use client";
import React, { useState } from "react";
import RoomForms from "./roomsform";
import RoomDetail from "./roomdetail";
const DashboardIndex = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState("");
  const [features, setFeatures] = useState([]);
  const [rooms, setRooms] = useState(0);
  const [bathrooms, setBathRooms] = useState(0);
  const [description, setDescription] = useState("");
  const [shortdescription, setShortDescription] = useState("");
  return (
    <div className="w-full relative">
      <div className="w-full relative pb-20 flex flex-col gap-12">
        <div className="w-full grid lg:grid-cols-2 lg:items-center gap-4 justify-between">
          <h3 className="text-4xl font-booking_font4 font-bold">
            Add Your Room
            <span className="block pt-6 text-sm font-booking_font font-normal">
              The most important idea about this section is that it gives u
              ability to add your rooms. When adding your room product idea do
              not forget to fill out the forms else errors are bound to occur
            </span>
          </h3>
        </div>
        <div className="w-full relative grid items-start md:grid-cols-custom gap-6">
          <RoomForms
            description={description}
            setTitle={setTitle}
            title={title}
            setDescription={setDescription}
            setShortDescription={setShortDescription}
            shortdescription={shortdescription}
            setPrice={setPrice}
            price={price}
            rooms={rooms}
            setRooms={setRooms}
            setBathRooms={setBathRooms}
            bathrooms={bathrooms}
            setImages={setImages}
            images={images}
            features={features}
            setFeatures={setFeatures}
          />
          <div className="w-full md:w-[350px] sticky top-[15%] left-0">
            <RoomDetail title={title} shortdescription={shortdescription} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardIndex;
