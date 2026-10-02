import { Search } from "lucide-react";

export default function BookingsTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a6af]"
          />
          <input
            type="search"
            placeholder="Search"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#e8e6e3] bg-white text-[13px] outline-none focus:border-[#c4c6ce]"
          />
        </div>
        <select className="h-9 px-3 rounded-lg border border-[#e8e6e3] bg-white text-[13px] text-[#777b86]">
          <option>Duration</option>
        </select>
        <select className="h-9 px-3 rounded-lg border border-[#e8e6e3] bg-white text-[13px] text-[#777b86]">
          <option>Status</option>
        </select>
      </div>

      <div className="bg-white border border-[#e8e6e3] rounded-2xl p-8 text-center">
        <p className="text-[13px] text-[#a3a6af]">
          Booking history will appear here.
        </p>
      </div>
    </div>
  );
}