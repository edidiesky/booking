import sanitizeHtml from "sanitize-html";
import type { Property } from "@/types/api";

const SANITIZE_CONFIG = {
  allowedTags: ["p", "b", "i", "u", "strong", "em", "s", "a", "ul", "ol", "li", "h1", "h2", "br", "blockquote"],
  allowedAttributes: { a: ["href"] },
  disallowedTagsMode: "discard" as const,
};

interface Props {
  property: Property;
}


export default function PropertyDescription({ property }: Props) {
  const sanitized = property.description
    ? sanitizeHtml(property.description, SANITIZE_CONFIG)
    : "";

  return (
    <div className="w-full pb-8 border-b border-[#e8e6e3] flex flex-col gap-4">
      <h3 className="text-xl md:text-xl bold text-[#17191c]">
        Description
      </h3>
      {sanitized ? (
        <div
          className="max-w-[700px] leading-[1.8] text-[#4c4c4c] font-normal prose prose-sm whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      ) : (
        <p className="max-w-[700px] leading-[1.8] text-[#4c4c4c] font-normal">
          No description provided.
        </p>
      )}
    </div>
  );
}