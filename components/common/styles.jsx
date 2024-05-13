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
      /* width: 100%; */
      /* max-width: 1100px; */
      @media (max-width: 1080px) {
        max-width: 900px;
      }
      @media (max-width: 780px) {
        max-width: 500px;
      }

      thead {
        tr {
          text-align: start;
          z-index: 200;
          text-align: start;
          transition: all 0.4s;
          background-color: #f9f9f9;
          border-radius: 40px;
          padding: 1rem 2rem;
          &:hover {
            background-color: rgba(0, 0, 0, 0.1);
          }
          th {
            font-size: 1rem;
            font-weight: 600;
            text-align: center;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            padding: 1.7rem 2rem;
            font-family: "Proxima_Regular", sans-serif;
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
            padding: 2rem 1rem;
            margin-bottom: 1;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            font-family: "Proxima_Regular", sans-serif;

            span {
              &.danger {
                color: #840a0a;
                padding: 0.8rem 1.2rem;
                border-radius: 40px;
                background: #F3EFE5;
              }
              &.success {
                color: #28a745;
                padding: 0.8rem 1.2rem;
                border-radius: 40px;
                background: #EDFFEB;
              }
            }
          }

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
        }
      }
    }
  }
`;
