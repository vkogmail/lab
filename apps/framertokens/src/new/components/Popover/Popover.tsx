import React from 'react';
import styles from './popover.module.css';

interface PopoverProps {
    children: React.ReactNode;
    className?: string;
}

export const Popover: React.FC<PopoverProps> = ({
    children,
    className,
}) => {
    return (
        <div className={`${styles.popover} ${className || ''}`}>
            {children}
        </div>
    );
};

export default Popover; 