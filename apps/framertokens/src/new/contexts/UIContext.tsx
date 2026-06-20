import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService } from '../services/storage';

type UIVersion = 'classic' | 'new';

interface UIContextType {
  uiVersion: UIVersion;
  setUIVersion: (version: UIVersion) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiVersion, setUIVersion] = useState<UIVersion>('new');

  useEffect(() => {
    // Load saved preference
    const loadUIPreference = async () => {
      const savedVersion = await StorageService.getUIVersion();
      if (savedVersion) {
        setUIVersion(savedVersion as UIVersion);
      }
    };
    loadUIPreference();
  }, []);

  const handleUIVersionChange = (version: UIVersion) => {
    setUIVersion(version);
    StorageService.saveUIVersion(version);
  };

  return (
    <UIContext.Provider value={{ uiVersion, setUIVersion: handleUIVersionChange }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}; 