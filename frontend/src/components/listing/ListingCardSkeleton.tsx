/** Same box model as ListingCard so the swap causes zero layout shift. */
export default function ListingCardSkeleton() {
  const bar = "animate-pulse rounded-full bg-black/[0.06] motion-reduce:animate-none";
  return (
    <div className="mkt flex flex-col gap-3.5" aria-hidden="true">
      <div className="rounded-[20px] bg-[var(--mk-surface)] p-1.5 shadow-[var(--mk-shadow-border)]">
        <div className="aspect-square w-full animate-pulse rounded-[14px] bg-black/[0.05] motion-reduce:animate-none" />
      </div>
      <div className="flex flex-col gap-2.5 px-0.5">
        <div>
          <div className={`h-[1.3rem] w-3/4 ${bar}`} />
          <div className={`mt-1.5 h-4 w-1/2 ${bar}`} />
        </div>
        <div className="flex gap-2">
          <div className={`h-9 w-28 ${bar}`} />
          <div className={`h-9 w-24 ${bar}`} />
        </div>
        <div className={`h-6 w-36 ${bar}`} />
      </div>
    </div>
  );
}
