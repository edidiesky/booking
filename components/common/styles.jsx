import styled from "styled-components";

export const Table = styled.div`
  width: 100%;
  padding: 1rem 0;
  background: #ffff;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  .TableContainer {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 100%;
    overflow-x: auto;
    &::-webkit-scrollbar {
      width: 7px;
      height: 7px;
      background: #bdbbbb;
      border-radius: 10px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--grey-1);
      border-radius: 10px;
      transition: all 0.5s;
      &:hover {
        background: #333;
      }
    }

    .tableWrapper {
      border-collapse: collapse;
      overflow-x: auto;
      border-collapse: collapse;
      table-layout: fixed;
      width:100%;

      thead {
        tr {
          text-align: start;
          z-index: 200;
          text-align: start;
          transition: all 0.4s;
          background-color: #f9f9f9;
          &:hover {
            background-color: rgba(0, 0, 0, 0.1);
          }
          th {
            font-size: 1rem;
            font-weight: 600;
            text-align: center;
            border-bottom: 1px solid rgba(0, 0, 0, 0.2);
            padding: 1.7rem 2rem;
            font-family: "Barlow", sans-serif;
          }
        }
      }
      .btn {
        padding: 0.4rem 1.3rem !important;
      }
      tbody {
        tr {
          transition: all 0.5s;
          z-index: 200;
          &:hover {
            background-color: rgba(0, 0, 0, 0.09);
          }
          td {
            font-size: 1;
            font-weight: 500;
            text-align: center;
            padding: 1rem;
            margin-bottom: 1;
            border-bottom: 1px solid rgba(0, 0, 0, 0.2);
            font-family: "Barlow", sans-serif;

            .true {
              color: #e72d2d;
            }

            .tablespan {
              padding: 1;
              border-radius: 40px;
              color: #333;
              text-align: center;
              &.true {
                color: #28a745;
                background: #10e24129;
              }
              &.tablespan_withdrawal {
                background: #28a745;
                color: #fff;
              }
              &.false {
                color: #840a0a;
                background: rgba(255, 3, 3, 0.071);
              }
            }

            .true {
              color: var(--green);
              font-size: 1.3rem;
            }
            .false {
              color: var(--red);
              font-size: 1.3rem;
            }
          }

          .action {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1.8rem;
            .icons {
              width: 4rem;
              height: 4rem;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              svg {
                font-size: 1.7rem;
                cursor: pointer;
              }
              &:hover {
                background: #ddd;
              }
            }
            .details {
              padding: 0.8rem 1.3rem;
              background: #ddd;
              border-radius: 5px;
            }
          }
        }
      }
    }
  }
`;
