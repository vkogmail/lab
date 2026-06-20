import React from 'react';
import styles from './segmented-control.module.css';
import typography from '../../styles/typography.module.css';

interface SegmentedControlProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
    options,
    value,
    onChange,
    className,
}) => {
    return (
        <div className={`${styles['segmented-control']} ${className || ''}`}>
            {options.map((option, index) => (
                <React.Fragment key={option}>
                    <input
                        type="radio"
                        id={`option-${index}`}
                        name="segmented"
                        value={option}
                        checked={value === option}
                        onChange={(e) => onChange(e.target.value)}
                    />
                    <label 
                        htmlFor={`option-${index}`}
                        className={typography.textButton}
                    >
                        {option}
                    </label>
                </React.Fragment>
            ))}
        </div>
    );
};

export default SegmentedControl; 