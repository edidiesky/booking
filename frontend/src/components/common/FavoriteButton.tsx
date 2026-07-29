import { Heart } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectAccessToken } from "@/redux/slices/authSlice";
import { useAddFavoriteMutation, useRemoveFavoriteMutation } from "@/redux/services/favoriteApi";
import { showToast } from "@/components/common/Toast";

interface Props {
  propertyId:  string;
  isFavorited: boolean;
  size?:       number;
  className?:  string;
}

export default function FavoriteButton({ propertyId, isFavorited, size = 18, className = "" }: Props) {
  const token = useSelector(selectAccessToken);
  const navigate = useNavigate();
  const [addFavorite, { isLoading: adding }] = useAddFavoriteMutation();
  const [removeFavorite, { isLoading: removing }] = useRemoveFavoriteMutation();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      navigate("/onboarding");
      return;
    }

    try {
      if (isFavorited) {
        await removeFavorite(propertyId).unwrap();
      } else {
        await addFavorite(propertyId).unwrap();
        showToast("Saved to favorites.", "success");
      }
    } catch {
      showToast("Something went wrong, try again. o can reach out to the Platform engineers", "error");
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={adding || removing}
      className={`flex items-center justify-center rounded-full transition-transform hover:scale-110 disabled:opacity-50 ${className}`}
      title={isFavorited ? "Remove from favorites" : "Save to favorites"}
    >
      <Heart
        size={size}
        className={isFavorited ? "fill-red-500 text-red-500" : "fill-transparent text-[#17191c]"}
        strokeWidth={1.5}
      />
    </button>
  );
}