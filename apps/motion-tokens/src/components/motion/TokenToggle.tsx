import { useTokens } from "./useTokens";
import { Toggle } from "./Toggle";

export function TokenToggle() {
  const { currentSet, toggleTokens } = useTokens();

  return (
    <Toggle
      label="Imprint"
      value={currentSet}
      onToggle={toggleTokens}
      option1="Folio"
      option2="Nocturne"
    />
  );
}
