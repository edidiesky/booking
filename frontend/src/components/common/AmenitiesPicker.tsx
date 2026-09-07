import { AMENITY_OPTIONS, AMENITY_GROUPS } from "@/constants/amenities";

function AmenitiesPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="text-xs lg:text-[13px] text-[#17191c]">Amenities</span>
        <p className="text-[12px] text-[#777b86] mt-0.5">
          Select all that apply for this room type.
        </p>
      </div>
      {AMENITY_GROUPS.map((g) => (
        <div key={g.key} className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a3a6af]">
            {g.title}
          </p>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.filter((a) => a.group === g.key).map((a) => {
              const on = selected.includes(a.id) || selected.includes(a.label);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    onChange(
                      on
                        ? selected.filter((x) => x !== a.id && x !== a.label)
                        : [...selected, a.id],
                    )
                  }
                  className={`h-9 rounded-full border px-3.5 text-[12px] transition-colors ${
                    on
                      ? "border-[#17191c] bg-[#f7f7f5] font-medium text-[#17191c]"
                      : "border-[#e8e6e3] text-[#444] hover:border-[#c4c6ce]"
                  }`}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AmenitiesPicker