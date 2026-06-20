import { useState, useRef, useEffect } from 'react';

interface ThemeSelectProps {
  value: string;
  onChange: (value: "aeroglobal" | "branda") => void;
}

export const ThemeSelect = ({ value, onChange }: ThemeSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { value: 'aeroglobal', label: 'AeroGlobal' },
    { value: 'branda', label: 'BrandA' }
  ];

  return (
    <div ref={ref} style={{ position: 'relative', width: '200px' }}>
      <button
        className="toolbar-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          justifyContent: 'space-between',
          padding: '8px 12px',
        }}
      >
        {options.find(opt => opt.value === value)?.label}
        <span style={{ marginLeft: 'auto' }}>▼</span>
      </button>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius-default)',
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              className={`toolbar-button ${value === option.value ? 'active' : ''}`}
              onClick={() => {
                onChange(option.value as "aeroglobal" | "branda");
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                borderRadius: 0,
                border: 'none',
                borderBottom: '1px solid var(--color-border)',
                justifyContent: 'flex-start',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 