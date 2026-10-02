import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { selectAccessToken } from "@/redux/slices/authSlice";
import { useAddFavoriteMutation, useRemoveFavoriteMutation } from "@/redux/services/favoriteApi";
import { showToast } from "@/components/common/Toast";
import { ICON_SWAP } from "@/design/motion";

interface Props {
  propertyId: string;
  propertyName: string;
  isSaved: boolean;
}

/**
 * Heart over the photo. Outline by default, filled when saved (one SVG,
 * recoloured per state). 44px hit area around a 20px glyph.
 */
export default function SaveButton({ propertyId, propertyName, isSaved }: Props) {
  const token = useSelector(selectAccessToken);
  const navigate = useNavigate();
  const [add, { isLoading: adding }] = useAddFavoriteMutation();
  const [remove, { isLoading: removing }] = useRemoveFavoriteMutation();
  const busy = adding || removing;

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      if (isSaved) await remove(propertyId).unwrap();
      else {
        await add(propertyId).unwrap();
        showToast("Saved to your stays.", "success");
      }
    } catch {
      showToast("Could not update saved stays. Check your connection and try again.", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${propertyName} from saved stays` : `Save ${propertyName}`}
      className="grid h-11 w-11 place-items-center rounded-full transition-[scale] duration-150 ease-out active:scale-[0.96] disabled:opacity-60"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={isSaved ? "on" : "off"} {...ICON_SWAP} className="grid place-items-center">
          <Heart
            size={22}
            strokeWidth={2}
            className={
              isSaved
                ? "fill-[#e5484d] text-[#e5484d]"
                : "fill-black/20 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
            }
          />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
