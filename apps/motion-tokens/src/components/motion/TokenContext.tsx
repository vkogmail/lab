import { createContext } from "react";
import { motionTokens as initialMotionTokens } from "../../tokens/generated/motion.generated";

// Define theme names as they appear in $themes.json
export const THEME_NAMES = {
  AeroGlobal: 'AeroGlobal',
  AEROGLOBAL: 'AeroGlobal'
} as const;

// Remove or comment out the unused ThemeName if it exists
// type ThemeName = "light" | "dark";  // <-- removed because it is unused

// Update the interface to reflect that currentSet is either "aeroglobal" or "branda"
export interface TokenContextType {
  currentSet: "aeroglobal" | "branda";
  setCurrentSet: React.Dispatch<React.SetStateAction<"aeroglobal" | "branda">>; // Updated setter type
  shouldAnimate: boolean;
  setShouldAnimate: (shouldAnimate: boolean) => void;
  tokens: typeof initialMotionTokens;
  updateTokens: (newTokens: typeof initialMotionTokens) => void;
  toggleTokens: () => void;
  sequence: number;
}

// Create and export the context
export const TokenContext = createContext<TokenContextType>({
  currentSet: "aeroglobal",
  setCurrentSet: () => {},
  shouldAnimate: true,
  setShouldAnimate: () => {},
  tokens: initialMotionTokens,
  updateTokens: () => {},
  toggleTokens: () => {},
  sequence: 0
});
