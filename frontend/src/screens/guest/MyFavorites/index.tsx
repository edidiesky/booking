import { useNavigate } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import FavoriteButton from "@/components/common/FavoriteButton";
import { useListFavoritesQuery } from "@/redux/services/favoriteApi";
import { formatCurrency } from "@/utils/formatCurrency";

export default function MyFavorites() {
const navigate = useNavigate();
  const { data, isLoading } = useListFavoritesQuery();
  const favorites = data?.data ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-0 py-10">
        <h1 className="text-xl lg:text-2xl bold mb-6" style={{ color: "#17191c" }}>My Favorites</h1>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl animate-pulse" style={{ aspectRatio: "4/5", backgroundColor: "#f2f0ed" }} />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <Heart size={28} style={{ color: "#d1d1d1" }} />
            <p className="text-xs" style={{ color: "#777b86" }}>
              Nothing saved yet. Tap the heart on any property to keep track of it here.
            </p>
            <button
              onClick={() => navigate("/properties")}
              className="text-xs bold underline"
              style={{ color: "#17191c" }}
            >
              Browse properties
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {favorites.map((f) => (
              <div
                key={f.id}
                onClick={() => navigate(`/properties/${f.id}`)}
                className="flex flex-col rounded-xl overflow-hidden border cursor-pointer group"
                style={{ borderColor: "#e8e6e3" }}
              >
                <div className="w-full aspect-[4/5] relative overflow-hidden">
                  {f.images?.[0] ? (
                    <img src={f.images[0]} alt={f.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#f2f0ed" }}>
                      <MapPin size={20} style={{ color: "#a3a6af" }} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <FavoriteButton
                      propertyId={f.id}
                      isFavorited
                      className="w-8 h-8 bg-white/90 backdrop-blur-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1 px-3 py-3">
                  <p className="text-xs bold line-clamp-1" style={{ color: "#17191c" }}>{f.name}</p>
                  <p className="text-xs flex items-center gap-1" style={{ color: "#777b86" }}>
                    <MapPin size={12} />
                    {f.city}
                  </p>
                  {f.from_price !== null && (
                    <p className="text-xs bold" style={{ color: "#17191c" }}>
                      {formatCurrency(f.from_price)}<span className="font-normal" style={{ color: "#777b86" }}>/night</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}