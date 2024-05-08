import React from "react";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";

import styled from "styled-components";

export default function DateInput({ handleSelect, dateRange, type }) {
  return (
    <DateContainer>
      <div className="container w-100">
        <DateRange
          rangeColors={["var(--grey-1)"]}
          ranges={[dateRange.selection]}
          onChange={handleSelect}
          showDateDisplay={false}
          minDate={new Date()}
          months={2}
          showSelectionPreview={true}
          moveRangeOnFirstSelection={false}
          range={false}
          direction="horizontal"
          //   disabledDates={Date}
        />
      </div>
      <div className="container1 w-100">
        <DateRange
          rangeColors={["var(--grey-1)"]}
          ranges={[dateRange.selection]}
          onChange={handleSelect}
          showDateDisplay={false}
          minDate={new Date()}
          months={1}
          showSelectionPreview={true}
          moveRangeOnFirstSelection={false}
          range={false}
          direction="horizontal"
          //   disabledDates={Date}
        />
      </div>
    </DateContainer>
  );
}

const DateContainer = styled.div`
  width: 100%;
  .container1 {
    display: none;
    @media (max-width: 780px) {
      display: block;
    }
  }
  .container {
    display: block;
    @media (max-width: 780px) {
      display: none;
    }
  }
  /* @media (min-width: 450px) {
      display: none;
    }
  @media (max-width: 450px) {
      display: block;
    } */
`;
