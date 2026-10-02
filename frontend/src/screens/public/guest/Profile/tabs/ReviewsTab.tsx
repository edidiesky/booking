export default function ReviewsTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-[#e8e6e3] rounded-2xl p-5 flex flex-wrap items-end gap-8">
        <div>
          <p className="text-[11px] text-[#a3a6af] mb-1">Rating</p>
          <p className="text-4xl font-bold text-[#17191c] leading-none">—</p>
          <p className="text-[12px] text-[#a3a6af] mt-1">No reviews yet</p>
        </div>
        <div className="flex-1 min-w-[180px] space-y-1.5 text-[12px] text-[#777b86]">
          {[5, 4, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <span className="w-14">{n} · —</span>
              <div className="flex-1 h-1.5 rounded-full bg-[#f2f0ed] overflow-hidden">
                <div className="h-full w-0 bg-[#17191c] rounded-full" />
              </div>
              <span className="w-8 text-right">0</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#e8e6e3] rounded-2xl p-8 text-center">
        <p className="text-[13px] text-[#a3a6af]">
          Reviews you leave after stays will show up here.
        </p>
      </div>
    </div>
  );
}