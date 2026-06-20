import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div>
      <div>Loading...</div>
      {message && <div>{message}</div>}
    </div>
  );
}; 