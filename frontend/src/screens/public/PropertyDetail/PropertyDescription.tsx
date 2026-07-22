import type { Property } from "@/types/api";

interface Props { property: Property; }

export default function PropertyDescription({ property }: Props) {
  return (
    <div className="w-full pb-8 border-b border-[#e8e6e3] flex flex-col gap-4">
      <h3 className="text-xl md:text-xl bold text-[#17191c]">
        Description
      </h3>
      <p className="text-xs leading-[1.8] text-[#4c4c4c] font-normal">
        {property.description || "No description provided."}
      </p>
    </div>
  );
}