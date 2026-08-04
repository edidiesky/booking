// import { describe, it, expect } from "vitest";
// import { renderHook, act } from "@testing-library/react";
// import { Provider } from "react-redux";
// import { MemoryRouter } from "react-router-dom";
// import { configureStore } from "@reduxjs/toolkit";
// import { propertyApi } from "@/redux/services/propertyApi";
// import { useSearch } from "../useSearch";

// function makeStore() {
//   return configureStore({
//     reducer: { [propertyApi.reducerPath]: propertyApi.reducer },
//     middleware: (gdm) => gdm().concat(propertyApi.middleware),
//   });
// }

// function wrapper(initialEntries: string[]) {
//   return ({ children }: { children: React.ReactNode }) => (
//     <Provider store={makeStore()}>
//       <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
//     </Provider>
//   );
// }

// describe("useSearch", () => {
//   it("reads initial state from real URL query params, not useState defaults", () => {
//     const { result } = renderHook(() => useSearch(), {
//       wrapper: wrapper(["/search?q=villa&city=Abuja&minPrice=50000"]),
//     });

//     expect(result.current.search).toBe("villa");
//     expect(result.current.city).toBe("Abuja");
//     expect(result.current.minPrice).toBe(50000);
//     expect(result.current.isDefaultCity).toBe(false);
//   });

//   it("defaults city to Lagos, not geolocation, when no city param is present", () => {
//     const { result } = renderHook(() => useSearch(), { wrapper: wrapper(["/search"]) });

//     expect(result.current.city).toBe("Lagos");
//     expect(result.current.isDefaultCity).toBe(true);
//   });

//   it("setSearch actually writes back to the URL, this is the exact bug that was fixed", () => {
//     const { result } = renderHook(() => useSearch(), { wrapper: wrapper(["/search"]) });

//     act(() => { result.current.setSearch("beachfront"); });

//     expect(result.current.search).toBe("beachfront");
//   });

//   it("setSearch resets page, setSort does not", () => {
//     const { result } = renderHook(() => useSearch(), { wrapper: wrapper(["/search?page=3"]) });

//     act(() => { result.current.setSort("price_asc"); });
//     expect(result.current.page).toBe(3);

//     act(() => { result.current.setSearch("new query"); });
//     expect(result.current.page).toBe(1);
//   });
// });