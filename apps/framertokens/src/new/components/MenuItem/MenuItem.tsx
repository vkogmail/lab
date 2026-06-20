import React from 'react';
import styles from './menuitem.module.css';
import typography from '../../styles/typography.module.css';
import { Checkbox } from '../Checkbox/Checkbox';

interface MenuItemProps {
    children: React.ReactNode;
    selected?: boolean;
    parent?: boolean;
    expanded?: boolean;
    child?: boolean;
    variant?: 'primary' | 'purple';
    mode?: 'navigation' | 'select';
    className?: string;
    onClick?: () => void;
    onCheckboxChange?: (checked: boolean) => void;
    intermediate?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({
    children,
    selected = false,
    parent = false,
    expanded = false,
    child = false,
    variant = 'purple',
    mode = 'navigation',
    className,
    onClick,
    onCheckboxChange,
    intermediate = false,
}) => {
    return (
        <div 
            className={`
                ${styles.menuItem}
                ${selected ? styles.selected : ''}
                ${parent ? styles.parent : ''}
                ${child ? styles.child : ''}
                ${variant === 'primary' ? styles.primary : ''}
                ${typography.textBody}
                ${className || ''}
            `}
            aria-expanded={parent ? expanded : undefined}
            onClick={onClick}
        >
            {(parent && mode === 'select') && (
                <div className={`${styles.chevron} ${expanded ? styles.expanded : ''}`} />
            )}
            <span className={styles.label}>{children}</span>
            <Checkbox 
                checked={selected}
                intermediate={intermediate}
                variant={variant}
                inverted={selected}
                onChange={onCheckboxChange}
            />
        </div>
    );
};

export default MenuItem; 