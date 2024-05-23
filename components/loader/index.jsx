import React from "react";
import { ThreeDots } from "react-loader-spinner";
const Loader = ({type, color}) => {
  if (type === "dots") {
    return (
      <ThreeDots
        height="27"
        width="27"
        radius="9"
        color={color?color:"#fff"}
        ariaLabel="three-dots-loading"
        wrapperStyle={{}}
        wrapperClassName=""
        visible={true}
      />
    );
  }
  return (
    <div
      className="flex items-center z-[10000000] justify-center"
      style={{
        width: "100vw",
        position: "fixed",
        height: "100vh",
        background: "#ffffffc3",
      }}
    >
      <div className="loading"></div>
    </div>
  );
};

export default Loader;
