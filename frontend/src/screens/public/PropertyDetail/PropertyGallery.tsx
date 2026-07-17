import { useState } from "react";
import { MapPin } from "lucide-react";
import LazyImage from "@/components/common/LazyImage";

interface Props {
  images: string[];
  name: string;
}

const GALLERY_HEIGHT = 420;

export default function PropertyGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div
        className={`w-full h-[${GALLERY_HEIGHT}px] rounded-xl flex items-center justify-center bg-[#f2f0ed]`}
      >
        <MapPin size={32} className="text-[#a3a6af]" />
      </div>
    );
  }

  const count = images.length;
  const rightSideImages = images.slice(1, 3);
  const rightRowCount = Math.min(count, 4);

  return (
    <>
      {/* desktop */}
      <div className="w-full hidden lg:block">
        {count === 1 && (
          <div
            className={`w-full h-[${GALLERY_HEIGHT}px] overflow-hidden rounded-xl`}
          >
            <LazyImage src={images[0]} alt={name} />
          </div>
        )}

        {count >= 2 && (
          <div className="w-full grid grid-cols-2 gap-2">
            <div
              className={`w-full h-[${GALLERY_HEIGHT}px] overflow-hidden rounded-xl`}
            >
              <LazyImage src={images[0]} alt={name} />
            </div>

            <div
              className="grid gap-2 h-[210px]"
              style={{ gridTemplateRows: `repeat(${rightRowCount}, 1fr)` }}
            >
              {rightSideImages.map((src, i) => (
                <div
                  key={i}
                  className={`w-full h-[${210}px] overflow-hidden rounded-xl`}
                >
                  <LazyImage src={src} alt={`${name} ${i + 2}`} />
                  {i === 3 && count > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs ">
                      +{count - 5} more
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* mobile: active image + thumbnail strip, unchanged */}
      <div className="flex flex-col gap-2 lg:hidden">
        <div className="w-full h-[300px] overflow-hidden rounded-xl">
          <LazyImage src={images[active]} alt={name} />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  active === i ? "border-[#17191c]" : "border-transparent"
                }`}
              >
                <LazyImage src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
