import { useState, useRef, type KeyboardEvent } from "react";
import { Paperclip, SendHorizontal, Smile } from "lucide-react";

interface MessageComposerProps {
  onSend: (body: string) => void;
  onTyping?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export function MessageComposer({
  onSend,
  onTyping,
  onTypingChange,
}: MessageComposerProps) {
  const [value, setValue] = useState("");
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onTyping?.();
    onTypingChange?.(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTypingChange?.(false), 2000);
  };

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
    onTypingChange?.(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-[#ebebeb] bg-white px-4 py-3 lg:px-5">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[#e8e6e3] bg-[#fafaf9] px-3 py-2 focus-within:border-[#c4c6ce] focus-within:bg-white">
        <button
          type="button"
          className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#777b86] hover:bg-[#f0f0ee]"
          aria-label="Attach"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows={1}
          className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-[14px] text-[#17191c] outline-none placeholder:text-[#a3a6af]"
        />

        <button
          type="button"
          className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#777b86] hover:bg-[#f0f0ee]"
          aria-label="Emoji"
        >
          <Smile size={18} />
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim()}
          aria-label="Send message"
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#17191c] text-white transition-opacity hover:bg-black disabled:opacity-40"
        >
          <SendHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}