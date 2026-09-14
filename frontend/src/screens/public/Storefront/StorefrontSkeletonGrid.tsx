function pulse(width: string, height: string) {
  return (
    <div
      className="rounded-md animate-pulse"
      style={{ width, height, backgroundColor: "#e9e9ec" }}
    />
  );
}

function StorefrontCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="w-full rounded-2xl animate-pulse"
        style={{ aspectRatio: "1 / 1", backgroundColor: "#e9e9ec" }}
      />

      <div className="flex items-center gap-2">
        {pulse("70%", "14px")}
        {pulse("20%", "14px")}
      </div>

      {pulse("45%", "12px")}

      <div className="flex items-center gap-2">
        {pulse("25%", "12px")}
        {pulse("25%", "12px")}
        {pulse("25%", "12px")}
      </div>

      <div className="flex items-center gap-2">
        {pulse("35%", "14px")}
        {pulse("18%", "14px")}
      </div>
    </div>
  );
}

interface Props {
  count?: number;
}

export default function StorefrontSkeletonGrid({ count = 12 }: Props) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-8">
      {Array.from({ length: count }).map((_, i) => (
        <StorefrontCardSkeleton key={i} />
      ))}
    </div>
  );
}
