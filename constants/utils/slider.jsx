import React from "react";
import styled from "styled-components";
var $ = require("jquery");
if (typeof window !== "undefined") {
  window.$ = window.jQuery = require("jquery");
}
import "owl.carousel/dist/assets/owl.carousel.css";
import "owl.carousel/dist/assets/owl.theme.default.css";
import dynamic from "next/dynamic";

const OwlCarousel = dynamic(() => import("react-owl-carousel"), { ssr: false });
const Slider = () => {
  return <OwlCarousel className="owl-theme" loop margin={10} nav></OwlCarousel>;
};

// #endregion

export default Slider;
