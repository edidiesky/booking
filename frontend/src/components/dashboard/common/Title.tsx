interface Props {
  title:        string;
  description?: string;
  action?:      React.ReactNode;
}

export default function Title({ title, description, action }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h4 className="text-2xl lg:text-[24px] font-semibold tracking-tight">
          {title}
        </h4>
        {description && (
          <p className="text-sm lg:text-sm medium mt-1 max-w-[520px]" style={{ color: "#64645f" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}