import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import Link from "next/link";
import { slide, opacity, perspective } from "./anim";
import Navbar from "../common/Navbar";

const anim = (variants) => {
  return {
    initial: "initial",
    animate: "enter",
    exit: "exit",
    variants,
  };
};

const opacityVariants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
  exit: {
    opacity: 1,
  },
};

export default function Layout({ children }) {
  return (
    <LayOutStyles>
      <Navbar />
      {children}
    </LayOutStyles>
  );
}

const LayOutStyles = styled.div`
  /* background-color: black; */
  position: relative;
  .page {
    background-color: white;
  }
  .slide {
    height: 100vh;
    width: 100%;
    position: fixed;
    left: 0;
    top: 0;
    background-color: white;
    z-index: 1;
  }
`;
