import React from "react";
const Loader = () => {
  return (
    <div
      className="flex items-center justify-center"
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
