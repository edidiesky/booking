import Image from "next/image";
import React from "react";
import { useSelector } from "react-redux";

import styled from "styled-components";
const Imagewrapper = () => {
  // const { GigsDetails } = useSelector((store) => store.gigs);
  const GigsDetails = {
    listing_image: [
      "/apartment_1.jpg",
      "/apartment_2.png",
      "/apartment_3.png",
      "/apartment_4.png",
      "/apartment_5.png",
      "/apartment_6.png",
      "/apartment_7.png",
      "/apartment_8.png",
    ],
  };
  // console.log(GigsDetails?.listing_image)

  return (
    <Wrapper>
      <div className="w-100 imagewrapper">
        <Image
          alt="Cotion"
          width={0}
          sizes="100vw"
          height={0}
          loading="lazy"
          src={GigsDetails?.listing_image[0]}
          className="image w-full h-full"
        />
        <div className="gradient"></div>
      </div>
      <Wrapper>
        <div className="w-full imagewrapper images">
          {GigsDetails?.listing_image[1] && (
            <Image
              alt="Cotion"
              width={0}
              sizes="100vw"
              height={0}
              loading="lazy"
              src={GigsDetails?.listing_image[1]}
              className="image w-full h-full"
            />
          )}

          <div className="gradient"></div>
        </div>{" "}
        <div className="w-full imagewrapper images">
          {GigsDetails?.listing_image[2] ? (
            <Image
              alt="Cotion"
              width={0}
              sizes="100vw"
              height={0}
              loading="lazy"
              src={GigsDetails?.listing_image[2]}
              className="image w-full h-full"
            />
          ) : (
            <Image
              alt="Cotion"
              width={0}
              sizes="100vw"
              height={0}
              loading="lazy"
              src={GigsDetails?.listing_image[1]}
              className="image w-full h-full"
            />
          )}

          <div className="gradient"></div>
        </div>{" "}
        <div className="w-full imagewrapper images">
          {GigsDetails?.listing_image[3] ? (
            <Image
              alt="Cotion"
              width={0}
              sizes="100vw"
              height={0}
              loading="lazy"
              src={GigsDetails?.listing_image[3]}
              className="image w-full h-full"
            />
          ) : (
            <Image
              alt="Cotion"
              width={0}
              sizes="100vw"
              height={0}
              loading="lazy"
              src={GigsDetails?.listing_image[1]}
              className="image w-full h-full"
            />
          )}

          <div className="gradient"></div>
        </div>{" "}
        <div className="w-full imagewrapper images">
          {GigsDetails?.listing_image[4] ? (
            <Image
              alt="Cotion"
              width={0}
              sizes="100vw"
              height={0}
              loading="lazy"
              src={GigsDetails?.listing_image[4]}
              className="image w-full h-full"
            />
          ) : (
            <Image
              alt="Cotion"
              width={0}
              sizes="100vw"
              height={0}
              loading="lazy"
              src={GigsDetails?.listing_image[1]}
              className="image w-full h-full"
            />
          )}

          <div className="gradient"></div>
        </div>
      </Wrapper>
    </Wrapper>
  );
};
export const Wrapper = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 12px;
  height: 30rem;
  /* background:red; */
  @media (max-width: 480px) {
    min-height: 25rem;
  }
  .images {
    @media (max-width: 980px) {
      display: none;
    }
  }
  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    height: 100%;
    min-height: 100%;
  }
  .imagewrapper {
    position: relative;
    height: 100%;
    &:nth-child(2),
    &:nth-child(3) {
      img {
        border-radius: 0;
      }
      .gradient {
        border-radius: 0;
      }
    }
    &:nth-child(2),
    &:nth-child(5) {
      img {
        border-radius: 0;
        border-top-right-radius: 10px;
        border-bottom-right-radius: 10px;
      }
      .gradient {
        border-radius: 0;
        border-bottom-right-radius: 10px;
        border-top-right-radius: 10px;
      }
    }
    min-height: 100%;
    @media (max-width: 980px) {
      min-height: 25rem;
      img {
        border-radius: none;
      }
    }

    @media (max-width: 580px) {
      min-height: 20rem;
      img {
        border-radius: none;
      }
    }
    &:hover {
      .gradient {
        opacity: 1;
        visibility: visible;
      }
    }
    .gradient {
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.3);
      opacity: 0;
      visibility: hidden;
      border-radius: 10px;
      transition: all 0.5s;
    }
  }
  .image {
    border-radius: 6px;
    position: absolute;
    object-fit: cover;
  }
`;

export default Imagewrapper;
