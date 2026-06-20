import { createContext, useContext, useState, ReactNode } from "react";
import { motionTokens } from "../tokens/generated/motion.generated";
import type { MotionTokens } from "../types/motion";

type MotionContextType = {
  tokens: MotionTokens;
  toggleTokens: () => void;
  currentSet: string;
  shouldAnimate: number;
};

const MotionContext = createContext<MotionContextType | null>(null);

export const MotionProvider = ({ children }: { children: ReactNode }) => {
  // Get available variants (excluding 'core')
  const variants = Object.keys(motionTokens).filter((key) => key !== "core");
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(0);

  const toggleTokens = () => {
    setCurrentVariantIndex((current) => (current + 1) % variants.length);
    setShouldAnimate((prev) => prev + 1);
  };

  const value: MotionContextType = {
    tokens: motionTokens as unknown as MotionTokens,
    toggleTokens,
    currentSet: variants[currentVariantIndex],
    shouldAnimate,
  };

  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
};

export const useMotionTokens = () => {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error("useMotionTokens must be used within a MotionProvider");
  }
  return context;
};
