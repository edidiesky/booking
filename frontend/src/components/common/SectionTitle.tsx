interface Props {
  title:        string;
  description?: string;
  action?:      React.ReactNode;
}

export default function SectionTitle({ title, description, action }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg lg:text-xl bold" style={{ color: "var(--color-ink)", letterSpacing: "-0.3px" }}>
          {title}
        </h2>
        {description && (
          <p className="text-xs lg:text-smleading-relaxed max-w-[520px]" style={{ color: "var(--color-light-steel)" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}