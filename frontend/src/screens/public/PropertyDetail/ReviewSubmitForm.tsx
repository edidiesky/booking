// import { useState } from "react";
// import { Star } from "lucide-react";
// import { useCreateReviewMutation } from "@/redux/services/reviewApi";
// import toast from "react-hot-toast";

// interface ReviewSubmitFormProps {
//   productId: string;
// }

// function EditableStarRating({
//   value,
//   onChange,
// }: {
//   value: number;
//   onChange: (v: number) => void;
// }) {
//   return (
//     <div className="flex items-center gap-1">
//       {Array.from({ length: 5 }).map((_, i) => (
//         <button key={i} type="button" onClick={() => onChange(i + 1)}>
//           <Star
//             size={16}
//             className={i < value ? "text-amber-400 fill-amber-400" : "text-[#ddd]"}
//           />
//         </button>
//       ))}
//     </div>
//   );
// }

// export default function ReviewSubmitForm({ productId }: ReviewSubmitFormProps) {
//   const [rating, setRating] = useState(5);
//   const [comment, setComment] = useState("");
//   const [createReview, { isLoading: submitting }] = useCreateReviewMutation();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!comment.trim()) return;
//     try {
//       await createReview({ productId, rating, comment }).unwrap();
//       toast.success("Review submitted!");
//       setComment("");
//       setRating(5);
//     } catch (err: unknown) {
//       const error = err as { data?: { error?: string[] }; error?: string };
//       (error?.data?.error ?? [error?.error ?? "Unknown error"]).forEach((m) =>
//         toast.error(m)
//       );
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
//       <h4 className="text-xs lg:text-smtext-[#171717]">Write a review</h4>
//       <div className="flex flex-col gap-1.5">
//         <span className="text-xs lg:text-smtext-[#171717]">Your rating</span>
//         <EditableStarRating value={rating} onChange={setRating} />
//       </div>
//       <div className="flex flex-col gap-1.5">
//         <span className="text-xs lg:text-smtext-[#171717]">Your review</span>
//         <textarea
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//           rows={4}
//           placeholder="Share your experience with this product..."
//           className="border border-black/10 px-4 py-3 text-xs lg:text-smtext-[#171717] outline-none focus:border-[#171717] transition-colors resize-none"
//         />
//       </div>
//       <button
//         type="submit"
//         disabled={submitting || !comment.trim()}
//         className="h-11 bg-[#171717] text-white text-xs lg:text-smhover:opacity-90 transition-opacity disabled:opacity-50 w-fit px-6"
//       >
//         {submitting ? "Submitting..." : "Submit review"}
//       </button>
//     </form>
//   );
// }

import { useState } from "react";
import { Star } from "lucide-react";
import { useCreateReviewMutation } from "@/redux/services/reviewApi";
import { showToast } from "@/components/common/Toast";

interface Props {
  /** A completed booking for this stay. Reviews are tied to a specific
      booking (createReviewSchema requires bookingId), not a room type or
      property directly, so this form only makes sense somewhere a real
      completed booking is in scope, e.g. the guest's booking detail page
      after checkout, not the public property page (a browsing guest has
      no booking yet). */
  bookingId: string;
  onSubmitted?: () => void;
}

function EditableStarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)}>
          <Star size={16} className={i < value ? "text-amber-400 fill-amber-400" : "text-[#ddd]"} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSubmitForm({ bookingId, onSubmitted }: Props) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [createReview, { isLoading: submitting }] = useCreateReviewMutation();

  const titleTooShort = title.length > 0 && title.trim().length < 10;
  const commentTooShort = comment.length > 0 && comment.trim().length < 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 10 || comment.trim().length < 20) return;
    try {
      await createReview({ bookingId, rating, title: title.trim(), comment: comment.trim() }).unwrap();
      showToast("Review submitted!", "success");
      setTitle("");
      setComment("");
      setRating(5);
      onSubmitted?.();
    } catch { /* errorMiddleware */ }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
      <h4 className="text-xs lg:text-smtext-[#171717]">Write a review</h4>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs lg:text-smtext-[#171717]">Your rating</span>
        <EditableStarRating value={rating} onChange={setRating} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs lg:text-smtext-[#171717]">Title (10-150 characters)</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your stay in one line"
          className="border border-black/10 px-4 py-3 text-xs lg:text-smtext-[#171717] outline-none focus:border-[#171717] transition-colors"
        />
        {titleTooShort && <span className="text-xs lg:text-smtext-red-600">At least 10 characters.</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs lg:text-smtext-[#171717]">Your review (20-2000 characters)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Share your experience with this stay..."
          className="border border-black/10 px-4 py-3 text-xs lg:text-smtext-[#171717] outline-none focus:border-[#171717] transition-colors resize-none"
        />
        {commentTooShort && <span className="text-xs lg:text-smtext-red-600">At least 20 characters.</span>}
      </div>

      <button
        type="submit"
        disabled={submitting || title.trim().length < 10 || comment.trim().length < 20}
        className="h-11 bg-[#171717] text-white text-xs lg:text-smhover:opacity-90 transition-opacity disabled:opacity-50 w-fit px-6"
      >
        {submitting ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}