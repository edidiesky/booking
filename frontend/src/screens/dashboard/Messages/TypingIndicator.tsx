export function TypingIndicator({
  name,
  hidden,
}: {
  name: string;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <div className="flex items-center gap-1.5 px-6 pb-1 text-[12px] text-[#777b86]">
      <span>{name} is typing</span>
      <span className="flex gap-0.5">
        <span className="size-1 animate-bounce rounded-full bg-[#a3a6af] [animation-delay:-0.3s]" />
        <span className="size-1 animate-bounce rounded-full bg-[#a3a6af] [animation-delay:-0.15s]" />
        <span className="size-1 animate-bounce rounded-full bg-[#a3a6af]" />
      </span>
    </div>
  );
}