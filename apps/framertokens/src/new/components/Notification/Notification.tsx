import React from 'react';
import styles from './notification.module.css';
import typography from '../../styles/typography.module.css';

type NotificationVariant = 'positive' | 'negative' | 'primary' | 'neutral' | 'secondary' | 'informative';

export interface NotificationProps {
  variant?: NotificationVariant;
  bullet?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Notification: React.FC<NotificationProps> = ({
  variant = 'primary',
  bullet = false,
  children,
  className,
}) => {
  return (
    <span 
      className={`
        ${styles.notification} 
        ${styles[variant]} 
        ${bullet ? styles.bullet : ''}
        ${bullet ? typography.textHeading1 : typography.textNotification}
        ${className || ''}
      `}
    >
      {children}
    </span>
  );
};

export default Notification; 