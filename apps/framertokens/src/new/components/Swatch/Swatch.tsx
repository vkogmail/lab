import React from 'react';
import styles from './swatch.module.css';
import typography from '../../styles/typography.module.css';

type SwatchType = 'color' | 'label';

export interface SwatchProps {
  type: SwatchType;
  value: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Swatch: React.FC<SwatchProps> = ({
  type,
  value,
  selected = false,
  onClick,
  className,
}) => {
  return (
    <div 
      className={`
        ${styles.swatch} 
        ${styles[type]} 
        ${selected ? styles.selected : ''} 
        ${type === 'label' ? typography.textSwatchLabel : ''}
        ${className || ''}
      `}
      onClick={onClick}
      style={type === 'color' ? { backgroundColor: value } : undefined}
    >
      {type === 'label' && value}
    </div>
  );
};

export default Swatch; 