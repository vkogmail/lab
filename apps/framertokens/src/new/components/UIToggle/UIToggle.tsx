import React from 'react';
import styles from './uitoggle.module.css';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';

interface UIToggleProps {
  value: 'classic' | 'new';
  onChange: (value: 'classic' | 'new') => void;
  className?: string;
}

export const UIToggle: React.FC<UIToggleProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <SegmentedControl
      options={['classic', 'new']}
      value={value}
      onChange={(newValue) => onChange(newValue as 'classic' | 'new')}
      className={`${styles.uitoggle} ${className || ''}`}
    />
  );
};

export default UIToggle; 