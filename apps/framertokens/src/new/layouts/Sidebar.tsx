import React from 'react';
import { TokenSetList } from '../components/TokenSetList/TokenSetList';
import styles from './sidebar.module.css';

interface SidebarProps {
  tokenSetOrder: string[];
  tokenSetState: Record<string, boolean>;
  onToggleTokenSet: (setName: string) => void;
  onSelectTokenSet: (setName: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tokenSetOrder,
  tokenSetState,
  onToggleTokenSet,
  onSelectTokenSet
}) => {
  return (
    <div className={styles.sidebar}>
      <h3>Token Sets</h3>
      <TokenSetList 
        tokenSetOrder={tokenSetOrder}
        tokenSetState={tokenSetState}
        onToggleTokenSet={onToggleTokenSet}
        onSelectTokenSet={onSelectTokenSet}
      />
    </div>
  );
}; 