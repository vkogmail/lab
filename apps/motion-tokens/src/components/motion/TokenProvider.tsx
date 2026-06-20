import { useState, useCallback, ReactNode } from "react";
import { motionTokens as initialMotionTokens } from "../../tokens/generated/motion.generated";
import { TokenContext } from "./TokenContext";
import { useTokens } from "./useTokens";

export function TokenProvider({ children }: { children: ReactNode }) {
  const [currentSet, setCurrentSet] = useState<"aeroglobal" | "branda">("aeroglobal");
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [tokens, setTokens] = useState(initialMotionTokens);
  const [sequence, setSequence] = useState(0);

  const updateTokens = useCallback((newTokens: typeof initialMotionTokens) => {
    setTokens(prevTokens => ({
      ...prevTokens,
      [currentSet]: {
        ...prevTokens[currentSet],
        ...newTokens[currentSet]
      }
    }));
  }, [currentSet]);

  const toggleTokens = useCallback(() => {
    setShouldAnimate(false);
    requestAnimationFrame(() => {
      setCurrentSet((prev) => (prev === "aeroglobal" ? "branda" : "aeroglobal"));
      setSequence(s => s + 1);
      setShouldAnimate(true);
    });
  }, []);

  return (
    <TokenContext.Provider
      value={{
        currentSet,
        setCurrentSet,
        shouldAnimate,
        setShouldAnimate,
        tokens,
        updateTokens,
        toggleTokens,
        sequence,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

export function ProductTheme({ children }: { children: ReactNode }) {
  const { currentSet } = useTokens();
  const themeClass = currentSet === "branda" ? "theme-branda" : "theme-aeroglobal";

  return <div className={`product-demo ${themeClass}`}>{children}</div>;
}
