import React from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div>
      <h2>Settings</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}; 