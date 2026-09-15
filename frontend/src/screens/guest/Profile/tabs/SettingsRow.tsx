import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  label: string;
  value: string | null;
  placeholder: string;
  description?: string;
  editable: boolean;
  isActive: boolean;
  isSaving: boolean;
  onActivate: () => void;
  onCancel: () => void;
  onSave: (newValue: string) => void;
}

export default function SettingsRow({
  label, value, placeholder, description,
  editable, isActive, isSaving,
  onActivate, onCancel, onSave,
}: Props) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    if (isActive) setDraft(value ?? "");
  }, [isActive, value]);

  return (
    <div className="py-5 border-b last:border-0" style={{ borderColor: "#f2f0ed" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[15px] ${isActive ? "font-semibold" : "font-normal"} text-[#17191c]`}>
            {label}
          </p>
          {!isActive && (
            <p className="text-[14px] text-[#4c4c4c] mt-0.5">
              {value || <span className="text-[#a3a6af]">{placeholder}</span>}
            </p>
          )}
        </div>
        {editable && (
          <button
            type="button"
            onClick={isActive ? onCancel : onActivate}
            className="text-sm underline text-[#17191c] shrink-0"
          >
            {isActive ? "Cancel" : value ? "Edit" : "Add"}
          </button>
        )}
      </div>

      {isActive && (
        <div className="mt-3 flex flex-col gap-3">
          {description && <p className="text-[13px] text-[#777b86]">{description}</p>}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="w-full h-12 px-4 rounded-xl border text-[15px] outline-none"
            style={{ borderColor: "#c4c6ce" }}
            autoFocus
          />
          <button
            type="button"
            onClick={() => onSave(draft)}
            disabled={isSaving}
            className="h-11 px-6 rounded-lg text-[14px] font-medium text-white self-start disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: "#17191c" }}
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>
      )}
    </div>
  );
}