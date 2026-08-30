
export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1 px-4 py-1 text-xs text-muted-foreground">
      <span>{name} is typing</span>
      <span className="flex gap-0.5">
        <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="size-1 animate-bounce rounded-full bg-muted-foreground" />
      </span>
    </div>
  );
}