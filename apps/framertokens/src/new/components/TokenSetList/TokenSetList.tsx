import React from 'react';
import { MenuItem } from '../MenuItem/MenuItem';
import { useTokenSetList } from '../../hooks/useTokenSetList';
import styles from './tokensetlist.module.css';

interface TokenSetListProps {
  tokenSetOrder: string[];
  tokenSetState: Record<string, boolean>;
  onToggleTokenSet: (setName: string) => void;
  onSelectTokenSet: (setName: string) => void;
}

export const TokenSetList: React.FC<TokenSetListProps> = ({
  tokenSetOrder,
  tokenSetState,
  onToggleTokenSet,
  onSelectTokenSet
}) => {
  const { expandedThemes, toggleThemeExpanded } = useTokenSetList();

  const groupTokenSets = (tokenSetOrder: string[]) => {
    const groups: Record<string, string[]> = {};
    
    tokenSetOrder.forEach(setName => {
      if (setName.includes('/')) {
        const [parent] = setName.split('/');
        if (!groups[parent]) {
          groups[parent] = [];
        }
        groups[parent].push(setName);
      } else {
        groups[setName] = [];
      }
    });
    
    return groups;
  };

  return (
    <div className={styles.container}>
      {Object.entries(groupTokenSets(tokenSetOrder)).map(([theme, children]) => (
        <React.Fragment key={theme}>
          <MenuItem
            parent={true}
            expanded={expandedThemes[theme]}
            selected={children.length > 0 
              ? children.every(childPath => tokenSetState[childPath])
              : tokenSetState[theme]
            }
            onClick={() => onSelectTokenSet(theme)}
            onCheckboxChange={() => onToggleTokenSet(theme)}
          >
            {theme}
          </MenuItem>

          {expandedThemes[theme] && children.map(childPath => {
            const childName = childPath.split('/').pop() || '';
            return (
              <MenuItem
                key={childPath}
                child={true}
                selected={tokenSetState[childPath]}
                onClick={() => onSelectTokenSet(childPath)}
                onCheckboxChange={() => onToggleTokenSet(childPath)}
              >
                {childName}
              </MenuItem>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}; 