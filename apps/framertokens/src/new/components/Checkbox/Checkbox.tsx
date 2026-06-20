import React from 'react';
import styles from './checkbox.module.css';

export interface CheckboxProps {
  checked?: boolean;
  intermediate?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'purple';
  inverted?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  intermediate = false,
  disabled = false,
  variant = 'primary',
  inverted = false,
  onChange,
  className,
}) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.checked)}
      className={`
        ${styles.checkbox}
        ${variant === 'purple' ? styles.purple : ''}
        ${inverted ? styles.inverted : ''}
        ${intermediate ? styles.intermediate : ''}
        ${className || ''}
      `}
    />
  );
};

export default Checkbox; 