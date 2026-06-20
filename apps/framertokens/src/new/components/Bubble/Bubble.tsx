import React from 'react';
import styles from './bubble.module.css';
import typography from '../../styles/typography.module.css';

type BubbleVariant = 'danger' | 'success' | 'info';

export interface BubbleProps {
  variant?: BubbleVariant;
  className?: string;
}

export const Bubble: React.FC<BubbleProps> = ({
  variant = 'info',
  className,
}) => {
  return (
    <span 
      className={`
        ${styles.bubble} 
        ${styles[variant]} 
        ${typography.textHeading1}
        ${className || ''}
      `}
    />
  );
};

export default Bubble; 