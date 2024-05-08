
"use client"
import styled from "styled-components";
import { RxCross1 } from "react-icons/rx";
import { FaBars } from "react-icons/fa6";
import { TiHome, TiMessage } from "react-icons/ti"
import { GiMoneyStack } from "react-icons/gi";
import {
  FaRegUser,
  FaHotel,
} from "react-icons/fa";
import { RxTimer } from "react-icons/rx";
import { BiChevronDown, BiChevronUp, BiSupport } from "react-icons/bi";
import Link from "next/link";
import React, { useState } from "react";
const AdminSidebarData = [
  {
    id: 1,
    tab: {
      title: "Dashboard",
      path: "",
      icon: <TiHome fontSize={"26px"} />,
    },
    list: [],
  },
  {
    id: 6,
    tab: {
      icon: <FaHotel fontSize={"20px"} />,
      title: "Manage Reservation",
      path: "reservation",
    },
    list: [],
  },
  {
    id: 4,
    tab: {
      icon: <FaRegUser fontSize={"20px"} />,
      title: "Manage Clients",
      path: "customers",
    },
    list: [],
  },
];


const DashboardHeader = ({ sidebar, setSidebar }) => {
    // const { userInfo } = useAppSelector(store => store.auth)
    const userInfo = {}
    // const dispatch = useAppDispatch()
    const [bar, setBar] = React.useState(false);
    const [activeindex, setActiveIndex] = useState(0)

    const handleLogOut = () => {
        // dispatch(ClearUserInfo("any"));
        window.location.reload();
    };
    return (
      <HeaderStyles className="w-full z-[3000] flex border-b border-[rgba(0,0,0,.08)] relative items-center flex-col gap-2">
        <div className="Header_wrapper w-[95%] mx-auto flex item-center justify-between">
          <div className="flex w-full items-center gap-3">
            <div
              onClick={() => setBar(!bar)}
              className="flex flex-1 lg:hidden gap-4 items-center justify-start text-dark"
            >
              {bar ? (
                <RxCross1 fontSize={"30px"} />
              ) : (
                <FaBars fontSize={"30px"} />
              )}
            </div>
          </div>
          <div className="flex w-full auto item-center justify-end gap-1">
            <div className="flex profile_wrapper relative items-center gap-2">
              <div className="flex items-center gap-2">
                <img
                  src="https://fundednext.fra1.digitaloceanspaces.com/dashboard/demo-avatar.jpg"
                  alt=""
                  className="w-10 rounded-full"
                />
                <h4 className="text-base text-dark font-bold family1">
                  {userInfo?.fullname || "Jermiah frim"}
                  <span className="block font-normal text-sm text-dark">
                    {userInfo?.email || "jerrme@gmail.com"}
                  </span>
                </h4>
              </div>
              <div className="profile_dropdown shadow-2xl absolute">
                <div className="w-full flex flex-col">
                  <div className="flex profile_dropdown_bottom flex-col w-full">
                    <Link
                      href={"/dashboard"}
                      className="font-medium text-xl p-2 family1 w-full profile_list text-dark block"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={"/dashboard/settings"}
                      className="font-medium text-xl p-2 family1 w-full profile_list text-dark block"
                    >
                      Profile
                    </Link>
                    <div
                      onClick={handleLogOut}
                      className="font-medium text-xl p-2 family1 w-full profile_list text-dark block"
                    >
                      Log Out
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          style={{ zIndex: "200" }}
          className={`${
            bar ? "left-0" : "-left-[100%]"
          } w-[300px] h-full transition-all ease duration-700 fixed flex lg:hidden top-0 flex-col gap-2`}
        >
          <div
            onClick={() => setBar(!bar)}
            style={{ zIndex: "200" }}
            className={`${
              bar ? "left-0" : "-left-[100%]"
            } w-full h-full transition-all ease duration-300 fixed flex lg:hidden top-0 bg-[#42424227] flex-col gap-2`}
          ></div>
          <img
            src="https://images.unsplash.com/photo-1554110397-9bac083977c6"
            alt=""
            className="w-full z-20 h-full absolute object-cover"
          />
          <div className="w-full h-full absolute bg-[#000] opacity-[.6] z-[24] object-cover" />
          <div
            style={{ zIndex: "200" }}
            className="w-full Header_wrapper py-4 flex item-center flex-col justify-space gap-2"
          >
            <div className="w-full my-4 flex flex-col gap-2">
              {AdminSidebarData?.map((x, index) => {
                return (
                  <div key={index} className="w-[90%] mx-auto">
                    {x?.list?.length === 0 ? (
                      <Link
                        href={`/dashboard/${x.tab.path}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="w-12 h-12 text-xm rounded-xl flex items-center text-blue justify-center">
                            {" "}
                            {x.tab.icon}
                          </span>
                          {<span>{x.tab?.title}</span>}
                        </div>
                      </Link>
                    ) : (
                      <div
                        onClick={() =>
                          setActiveIndex(activeindex === x?.id ? false : x?.id)
                        }
                        className="overflow-hidden"
                      >
                        <div className="tab text-3xl font-booking_font2 text-dark font-normal cursor-pointer family1 justify-between w-full">
                          <div className="flex items-center gap-1">
                            <span className="w-12 h-12 text-xm rounded-xl flex items-center text-blue justify-center">
                              {x?.tab?.icon}
                            </span>
                            {<h4>{x?.tab?.title}</h4>}
                          </div>
                          {/* {activeindex ? <BiChevronDown /> : <BiChevronUp />} */}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </HeaderStyles>
    );
}


export const HeaderStyles = styled.div`
    padding:1rem 0;
    min-height: 6rem;
    width:100%;
    background-color: #fff;
    position: sticky;
    top: 0;
    left:0;
    border-bottom: 1px solid rgba(0,0,0,.09);

      .profile_wrapper:hover  .profile_dropdown {
            opacity:1;
            transform:scale(1);
            visibility: visible;
        }
    .profile_dropdown{
     width:150px;
         opacity:0;
        transform:scale(0.8);
        transition:all .3s;
        overflow:hidden;
        visibility:hidden;
        box-shadow:0 2px 4px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.08);
        z-index:220;
        background:#fff;
        top:100%;
        right:0%;
        border-radius: 10px;
        .profile_card{
            padding:1.3rem 1.5rem;

            cursor:pointer;
        }
    }
        .profile_list{
          padding:1rem 2rem;
          font-size: 14px;
            transition:all .3s;
            cursor:pointer;

            &:nth-last-child() {
               border-bottom:none;
            }
        &:hover {
            background: #eee;
        }
    }
       .dropdown {
        max-height: 0;
        transition: all .7s;
        /* min-height: 0; */
        &.active {
             max-height: 450px;
        /* min-height: 100px; */

        }
    }
    a,.tab {
        padding: 7px 14px;
        min-height: 4rem;
        font-weight: normal;
        margin: 0 auto;
        font-size: 14px;
        border-radius:10px;
        width: 100%;
        display: flex;
        align-items: center;
        gap: 1rem;
        position: relative;

         @media (max-width: 1080px) {
         justify-content:space-between;
           padding:14px 10px;
            font-size: 1.3rem;
             gap: 1rem;
        }

         svg {
                color:#Fff;
            }

        &:hover {
          background: #635BFF;
           svg {
                color:#Fff;
            }
        }
        &.active {
          position: relative;
           background:#635BFF;

           span {
            svg {
                color:#Fff;
            }
           }
        }
      }
`;



export default DashboardHeader