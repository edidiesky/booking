import Image from "next/image";
import React from "react";
import { TfiGallery } from "react-icons/tfi";
import { useSelector } from "react-redux";
import Skeleton from "react-loading-skeleton";
import styled from "styled-components";
const Imagewrapper = ({ loading, room }) => {
  return (
    <>
      {loading ? (
        <Wrapper>
          <Skeleton width={"100%"} height={520} />
          <Wrapper className='hidden lg:grid'>
            <Skeleton width={"100%"} height={255} />
            <Skeleton width={"100%"} height={255} />
            <Skeleton width={"100%"} height={255} />
            <Skeleton width={"100%"} height={255} />
          </Wrapper>
        </Wrapper>
      ) : (
        <Wrapper className="relative">
          <div
            style={{ transition: "all .3s" }}
            className="absolute 
          bottom-0 left-0
           text-base p-4 px-4 hover:bg-[rgba(0,0,0,.6)]
            hover:text-white
            uppercase text-dark bg-white
             z-40 flex items-center justify-center gap-4"
          >
            <TfiGallery fontSize={'24px'} />
            photos
          </div>
          <div className="w-100 imagewrapper">
            <Image
              alt="Cotion"
              width={0}
              sizes="100vw"
              height={0}
              loading="lazy"
              src={room?.images[0]}
              className="image w-full h-full"
            />
            <div className="gradient"></div>
          </div>
          <Wrapper>
            {room?.images?.slice(1, 5)?.map((room, index) => {
              return (
                <div key={index} className="w-full imagewrapper images">
                  <Image
                    alt="Cotion"
                    width={0}
                    sizes="100vw"
                    height={0}
                    loading="lazy"
                    src={room}
                    className="image w-full h-full"
                  />

                  <div className="gradient"></div>
                </div>
              );
            })}
          </Wrapper>
        </Wrapper>
      )}
    </>
  );
};
export const Wrapper = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 6px;
  height: 32rem;
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
