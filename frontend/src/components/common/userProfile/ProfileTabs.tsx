export type ProfileTab = "activity";

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "activity", label: "Activity" },
];

interface Props {
  active:   ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

export default function ProfileTabs({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 px-5 border-b" style={{ borderColor: "#e8e6e3" }}>
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="px-3 py-2.5 text-xs lg:text-sm border-b-2 transition-colors"
          style={{
            borderColor: active === tab.key ? "var(--color-ink)" : "transparent",
            color: active === tab.key ? "#17191c" : "#a3a6af",
            fontWeight: active === tab.key ? 600 : 400,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}