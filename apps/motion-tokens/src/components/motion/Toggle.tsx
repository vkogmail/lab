interface ToggleProps {
  label: string;
  value: string;
  onToggle: () => void;
  option1: string;
  option2: string;
}

export function Toggle({ label, value, onToggle }: ToggleProps) {
  return (
    <div className="motion-theme-toggle">
      <span className="motion-theme-toggle__label">{label}</span>
      <button type="button" className="btn ghost motion-theme-toggle__value" onClick={onToggle}>
        {value === "aeroglobal" ? "Folio" : "Nocturne"}
      </button>
    </div>
  );
}
