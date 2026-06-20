import React from 'react';
import styles from './input.module.css';
import typography from '../../styles/typography.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  className,
  ...props
}) => {
  return (
    <div className={styles['form-field']}>
      {label && (
        <label className={`${styles.label} ${typography.textInput}`}>
          {label}
        </label>
      )}
      <input
        type="text"
        className={`
          ${styles.input} 
          ${typography.textInput}
          ${error ? styles.error : ''} 
          ${className || ''}
        `}
        {...props}
      />
      {helper && !error && (
        <span className={`${styles.helper} ${typography.textLabel}`}>
          {helper}
        </span>
      )}
      {error && (
        <span className={`${styles['error-message']} ${typography.textLabel}`}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input; 