import { createContext } from 'react';
import { motionTokens } from '../../tokens/generated/motion.generated';

interface TokenContextType {
  currentSet: 'aeroglobal' | 'branda';
  shouldAnimate: boolean;
  sequence: number;
  toggleTokens: () => void;
  tokens: typeof motionTokens;
  updateTokens: (newTokens: any) => void;
}

export const TokenContext = createContext<TokenContextType | null>(null); 