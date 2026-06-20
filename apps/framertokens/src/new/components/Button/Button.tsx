import React from 'react';
import styles from './button.module.css';
import typography from '../../styles/typography.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    color?: 'default' | 'danger' | 'success';
    size?: 'compact' | 'default';
    raised?: boolean;
    faded?: boolean;
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    color = 'default',
    size = 'default',
    raised = false,
    faded = false,
    className,
    children,
    ...props
}) => {
    return (
        <button 
            className={`
                ${styles.button}
                ${styles[variant]}
                ${color !== 'default' ? styles[color] : ''}
                ${raised ? styles.raised : ''}
                ${faded ? styles.faded : ''}
                ${size === 'compact' ? styles.compact : ''}
                ${typography.textButton}
                ${className || ''}
            `}
            {...props}
        >
            <span className={typography.textButton}>{children}</span>
        </button>
    );
};

export default Button; 