import styles from './icon.module.css';

export type IconName = 
  | 'chevronRight'
  | 'chevronDown'
  | 'checkmark'
  | 'intermediate'
  | 'save'
  | 'coffee'
  | 'connection'
  | 'grid'
  | 'list'
  | 'chat'
  | 'download'
  | 'git';

interface IconProps {
  name: IconName;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, className }) => {
  return <span className={`icon ${styles[name]} ${className || ''}`} />;
};
