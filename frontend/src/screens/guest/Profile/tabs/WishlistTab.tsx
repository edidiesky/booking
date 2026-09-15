import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useListFavoritesQuery } from "@/redux/services/favoriteApi";
import PropertyCard from "@/components/common/PropertyCard";

export default function WishlistTab() {
  const navigate = useNavigate();
  const { data, isLoading } = useListFavoritesQuery();
  const favorites = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl animate-pulse" style={{ aspectRatio: "4/5", backgroundColor: "#f2f0ed" }} />
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="bg-white border border-[#e8e6e3] rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
        <Heart size={24} className="text-[#d1d1d1]" />
        <p className="text-[13px] text-[#a3a6af]">
          Nothing saved yet. Tap the heart on any property to keep track of it here.
        </p>
        <button onClick={() => navigate("/properties")} className="text-xs underline text-[#17191c]">
          Browse properties
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6">
      {favorites.map((f, idx) => (
        <PropertyCard key={f.id} index={idx} property={f} isFavorited />
      ))}
    </div>
  );
}