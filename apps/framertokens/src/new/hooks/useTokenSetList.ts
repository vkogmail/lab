import { useState } from 'react';

export const useTokenSetList = () => {
  const [expandedThemes, setExpandedThemes] = useState<Record<string, boolean>>({});
  
  const toggleThemeExpanded = (theme: string) => {
    setExpandedThemes(prev => ({
      ...prev,
      [theme]: !prev[theme]
    }));
  };

  return {
    expandedThemes,
    toggleThemeExpanded
  };
}; 