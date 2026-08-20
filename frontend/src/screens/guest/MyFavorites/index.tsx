import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useListFavoritesQuery } from "@/redux/services/favoriteApi";
import PropertyCard from "@/components/common/PropertyCard";

export default function MyFavorites() {
  const navigate = useNavigate();
  const { data, isLoading } = useListFavoritesQuery();
  const favorites = data?.data ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-0 py-10">
        <h1
          className="text-xl lg:text-2xl bold mb-6"
          style={{ color: "#17191c" }}
        >
          My Favorites
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl animate-pulse"
                style={{ aspectRatio: "4/5", backgroundColor: "#f2f0ed" }}
              />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <Heart size={28} style={{ color: "#d1d1d1" }} />
            <p className="text-xs" style={{ color: "#777b86" }}>
              Nothing saved yet. Tap the heart on any property to keep track of
              it here.
            </p>
            <button
              onClick={() => navigate("/properties")}
              className="text-xs lg:text-[13px]  underline"
              style={{ color: "#17191c" }}
            >
              Browse properties
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {favorites.map((f, idx) => {
              return <PropertyCard index={idx} property={f} />;
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
