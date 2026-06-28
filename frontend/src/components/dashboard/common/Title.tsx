interface Props {
  title:        string;
  description?: string;
  action?:      React.ReactNode;
}

export default function Title({ title, description, action }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h4 className="text-xl lg:text-2xl font-semibold" style={{ color: "var(--color-ink)", letterSpacing: "-0.3px" }}>
          {title}
        </h4>
        {description && (
          <p className="text-sm mt-1 max-w-[520px] leading-[1.6]" style={{ color: "#64645f" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}