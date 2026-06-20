import type { TokenValue } from "../tokens/generated/motion.generated";
import type { MotionBrand } from "../data/books";

const CARD_TOKENS = [
  { key: "card-enter", label: "Card enter" },
  { key: "card-hover", label: "Card hover" },
] as const;

function getCardToken(
  set: { components?: Record<string, { value: TokenValue }>; patterns?: Record<string, { value: TokenValue }> },
  key: string,
) {
  if (set.components?.[key]) {
    return { value: set.components[key].value, path: `components.${key}` };
  }
  if (set.patterns?.[key]) {
    return { value: set.patterns[key].value, path: `patterns.${key}` };
  }
  return null;
}

function summarizeMotion(value: TokenValue) {
  const parts = [
    value.duration,
    value.easing.replace(/^cubic-bezier\(/, "bezier("),
    `scale ${value.scaleFrom} → ${value.scaleTo}`,
  ];

  if (value.rotateFrom !== value.rotateTo) {
    parts.push(`rotate ${value.rotateFrom} → ${value.rotateTo}`);
  }

  if (value.translateFrom !== value.translateTo) {
    parts.push(`y ${value.translateFrom} → ${value.translateTo}`);
  }

  return parts;
}

interface MotionTokenReadoutProps {
  brandName: string;
  currentSet: MotionBrand;
  tokenSet: {
    components?: Record<string, { value: TokenValue }>;
    patterns?: Record<string, { value: TokenValue }>;
  };
}

export function MotionTokenReadout({
  brandName,
  currentSet,
  tokenSet,
}: MotionTokenReadoutProps) {
  return (
    <aside className="motion-token-readout" aria-label={`Motion tokens for ${brandName}`}>
      <p className="motion-token-readout__label">Active tokens</p>
      <p className="motion-token-readout__imprint">{brandName}</p>

      {CARD_TOKENS.map(({ key, label }) => {
        const token = getCardToken(tokenSet, key);
        if (!token) return null;

        const summary = summarizeMotion(token.value);

        return (
          <div key={key} className="motion-token-readout__block">
            <div className="motion-token-readout__head">
              <span className="motion-token-readout__name">{label}</span>
              <code className="motion-token-readout__path">{token.path}</code>
            </div>
            <ul className="motion-token-readout__values">
              {summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        );
      })}

      <p className="motion-token-readout__hint">
        Switch imprint to compare {currentSet === "aeroglobal" ? "Nocturne" : "Folio"} values.
      </p>
    </aside>
  );
}
