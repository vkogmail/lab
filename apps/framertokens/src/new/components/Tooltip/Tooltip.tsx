import React from 'react';
import styles from './tooltip.module.css';
import typography from '../../styles/typography.module.css';

interface TooltipProps {
    children: React.ReactNode;
    value?: string;
    variant?: 'primary' | 'purple';
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
    children,
    value,
    variant = 'primary',
    className,
}) => {
    return (
        <div 
            className={`
                ${styles.tooltip}
                ${styles[variant]} 
                ${typography.textTooltip}
                ${className || ''}
            `}
        >
            {children}
            {value && (
                <span className={`${styles.tooltipValue} ${typography.textTooltipValue}`}>
                    {value}
                </span>
            )}
        </div>
    );
};

export default Tooltip; 