import chroma from "chroma-js";
import React, { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { framer, CanvasNode, LinearGradient } from "framer-plugin";
import "./App.css";
import { Settings } from './components/Settings';
import { GitHubService } from './services/github';
import { StorageService } from './services/storage';
import { parseRepoUrl } from './utils/repoUrlParser';
import { LoadingOverlay } from './components/LoadingOverlay';
import { AnimatePresence } from 'framer-motion';
import { tokenNodeManager } from './services/tokenNodeManager';
import { logger } from "./config/logging";
import { debounce } from 'lodash';
import ReactDOM from 'react-dom';

// Add at the top of the file, after imports
declare const process: {
  env: {
    NODE_ENV: string;
  };
};

// Configure the Framer plugin UI
framer.showUI({
  position: "top right",
  width: 600,
  height: 800,
});

// Hook to get the currently selected elements on the canvas
function useSelection() {
  const [selection, setSelection] = useState<CanvasNode[]>([]);

  useEffect(() => {
    return framer.subscribeToSelection((newSelection) => {
      setSelection(newSelection);
    });
  }, []);

  return selection;
}

// Helper function to set metadata and store token on a node
function setTokenMetadata(node: CanvasNode, tokenName: string, tokenSet: string) {
  tokenNodeManager.setTokenMetadata(node, tokenName, tokenSet);
}

// Helper function to remove metadata and unlink the token from a node while preserving styles
function removeTokenMetadata(node: CanvasNode) {
  tokenNodeManager.removeTokenMetadata(node);
}

// log selected node attributes

// Helper function to get token metadata from a node safely
async function getTokenMetadata(node: CanvasNode): Promise<string | null> {
  const metadata = await tokenNodeManager.getTokenMetadata(node);
  return metadata?.tokenName || null;
}

// Function to apply or remove a token based on its type (color, shadow, etc.)
const toggleTokenApplication = async (selection: CanvasNode[], token: any, tokenName: string) => {
  if (selection.length === 0) {
    framer.notify('Please select at least one node');
    return;
  }

  // Check if we're removing or applying the token based on the first selected node
  const firstNode = selection[0];
  const appliedToken = await getTokenMetadata(firstNode);
  const isRemoving = appliedToken === tokenName;

  let processedCount = 0;

  // Process each selected node
  selection.forEach(node => {
    try {
      if (isRemoving) {
        removeTokenMetadata(node);
        processedCount++;
        if (process.env.NODE_ENV === 'development') {
          logger.debug('tokenSetManagement', `Removed token "${tokenName}" from ${node.name}`);
        }
      } else {
        const style = getStyleFromToken(token);
        node.setAttributes(style);
        setTokenMetadata(node, tokenName, getTokenSetFromPath(tokenName));
        processedCount++;
      }
    } catch (error) {
      logger.error('tokenSetManagement', `Failed to ${isRemoving ? 'remove' : 'apply'} token on node "${node.name}":`, error);
    }
  });

  // Notify the user of the result
  const action = isRemoving ? 'Removed from' : 'Applied to';
  framer.notify(`${action} ${processedCount} node${processedCount !== 1 ? 's' : ''}`);
};

// Function to update nodes when the token's value changes


// Add these near the top of the file, after the existing imports
const TOKENS_DIR = '/src/tokens';

// Define the structure of a token set
interface TokenSet {
  [key: string]: any;
}

// Define the structure of a theme
interface Theme {
  id: string;
  name: string;
  selectedTokenSets: {
    [key: string]: string;  // This will hold "enabled", "source", etc.
  };
}

/**
 * Loads metadata from the $metadata.json file
 * @returns A promise that resolves to an object containing the token set order
 */
const loadMetadata = async (): Promise<{ tokenSetOrder: string[] }> => {
  try {
    const response = await fetch(`${TOKENS_DIR}/$metadata.json`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const metadata = await response.json();
    
    if (!Array.isArray(metadata.tokenSetOrder)) {
      logger.warn('tokenResolution', 'tokenSetOrder is not an array, defaulting to empty array');
      return { tokenSetOrder: [] };
    }

    return metadata;
  } catch (error) {
    logger.error('tokenResolution', 'Error loading metadata:', error);
    return { tokenSetOrder: [] };
  }
};

/**
 * Loads a specific token set
 * @param setName The name of the token set to load
 * @returns A promise that resolves to the loaded token set
 */
const loadTokenSet = async (setName: string): Promise<TokenSet> => {
  try {
    const response = await fetch(`${TOKENS_DIR}/${setName}.json`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const tokenSet = await response.json();
    return tokenSet;
  } catch (error) {
    logger.error('tokenResolution', `Error loading token set ${setName}:`, error);
    return {};
  }
};

/**
 * Initializes tokens by loading metadata and token sets
 * @returns A promise that resolves to an object containing the token set order and loaded token sets
 */
const initializeTokens = async () => {
  try {
    const metadata = await loadMetadata();
    const order = metadata.tokenSetOrder;
    const loadedTokenSets: Record<string, TokenSet> = {};
    for (const setName of order) {
      loadedTokenSets[setName] = await loadTokenSet(setName);
    }
    const themeDetails = await loadThemeDetails();
    return { order, loadedTokenSets, themeDetails };
  } catch (error) {
    logger.error('initialization', 'Error in initializeTokens:', error);
    throw error;
  }
};

// Add this function near the other loading functions
const loadThemeDetails = async (): Promise<Theme[]> => {
  const startTime = performance.now();
  try {
    logger.debug('initialization', 'Loading themes...');
    const response = await fetch(`${TOKENS_DIR}/$themes.json`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const themesData = await response.json();
    
    const themesArray = Array.isArray(themesData) ? themesData : Object.values(themesData);
    const endTime = performance.now();
    logger.info('initialization', `Loaded ${themesArray.length} themes in ${Math.round(endTime - startTime)}ms`);
    return themesArray;
  } catch (error) {
    logger.error('initialization', 'Error loading theme details:', error);
    return [];
  }
};

/**
 * Determines the type of a given token.
 * @param token - The token to analyze.
 * @returns The type of the token as a string ('color' or 'other').
 */
const getTokenType = (token: any): string => {
  // Handle token objects with explicit type
  if (typeof token === 'object' && token !== null) {
    if (token.type) {
      // Only return 'color' if it's explicitly a color type
      return token.type === 'color' ? 'color' : 'other';
    }
    
    // If token has a value property, check its type
    if ('value' in token) {
      return getTokenType(token.value);
    }
  }

  // Handle direct string values - only consider as color if it looks like a color
  if (typeof token === 'string') {
    if (token.startsWith('#') || 
        token.startsWith('rgb') || 
        token.startsWith('hsl')) {
      return 'color';
    }
    return 'other';
  }

  return 'other';
};

// Add this function before SwatchPreview
const deepFlattenResolvedValue = (value: any): any => {
  if (typeof value === 'object' && value !== null) {
    if ('value' in value) {
      const flattened = deepFlattenResolvedValue(value.value);
      // Include modification information in the tooltip if present
      if (value.$extensions?.['studio.tokens']?.modify) {
        return `${flattened} (${value.$extensions['studio.tokens'].modify.type}: ${value.$extensions['studio.tokens'].modify.value})`;
      }
      return flattened;
    }
    const flattened: any = {};
    for (const [key, val] of Object.entries(value)) {
      flattened[key] = deepFlattenResolvedValue(val);
    }
    return flattened;
  }
  return value;
};

interface SwatchPreviewProps {
  tokenName: string;
  resolvedValue: any;
  isApplied: Promise<boolean>;
  onClick: () => void;
  path: string;
  allTokenSets: Record<string, TokenSet>;
  tokenSetOrder: string[];
}

// 1. Keep utility function outside of component
const getDisplayColor = (value: any): string | null => {
  // Early return for null/undefined
  if (!value) return null;

  // Handle token objects with value property
  if (typeof value === 'object' && value !== null) {
    if (value.type === 'color') {
      // If the value contains a reference (e.g. {Brand.Neutral.1000})
      if (typeof value.value === 'string' && value.value.includes('{')) {
        return null; // Skip unresolved references
      }

      // Check for alpha modifier
      if (value.$extensions?.['studio.tokens']?.modify?.type === 'alpha') {
        const modifier = value.$extensions['studio.tokens'].modify;
        const baseColor = value.value;
        try {
          const alpha = parseFloat(modifier.value);
          return chroma(baseColor).alpha(alpha).css();
        } catch (e) {
          logger.warn('tokenResolution', 'Invalid color value:', baseColor);
          return null;
        }
      }
      // For regular colors
      return value.value;
    }
  }

  // Handle string values (including gradients)
  if (typeof value === 'string') {
    // Skip unresolved references
    if (value.includes('{')) {
      return null;
    }

    if (value.includes('gradient') || 
        value.startsWith('#') || 
        value.startsWith('rgb') || 
        value.startsWith('hsl')) {
      try {
        // For solid colors, validate with chroma-js
        if (!value.includes('gradient')) {
          chroma(value); // Will throw if invalid
        }
        return value;
      } catch (e) {
        logger.warn('tokenResolution', 'Invalid color value:', value);
        return null;
      }
    }
  }
  return null;
};

// 2. Memoize the SwatchPreview component properly
const SwatchPreview = React.memo<SwatchPreviewProps>(({ 
  tokenName, 
  resolvedValue, 
  onClick, 
  path}) => {
  const selection = useSelection();
  const [isApplied, setIsApplied] = useState(false);
  
  useEffect(() => {
    let mounted = true;
    
    const checkApplied = async () => {
      const applied = await isTokenAppliedToAnySelected(path, selection);
      if (mounted) {
        setIsApplied(applied);
      }
    };
    
    checkApplied();
    return () => { mounted = false; };
  }, [path, selection]);

  const colorValue = getDisplayColor(resolvedValue);
  const isColor = colorValue !== null;
  const isGradient = typeof colorValue === 'string' && colorValue.includes('gradient');
  const label = path.split('.').pop() || tokenName;

  const tooltipValue = typeof colorValue === 'string' ? colorValue : 
    JSON.stringify(deepFlattenResolvedValue(resolvedValue));

  return (
    <div
      className={`swatch ${isColor ? 'swatch-color' : 'swatch-other'} ${isApplied ? 'selected' : ''}`}
      onClick={onClick}
    >
      {isColor && (
        <div 
          className="color-dot"
          style={isGradient ? { backgroundImage: colorValue } : { backgroundColor: colorValue }}
        />
      )}
      <span className="swatch-label">{label}</span>
      <div className="tooltip">
        <span className="tooltip-label">{label}</span>
        <span className="tooltip-value">{tooltipValue}</span>
      </div>
    </div>
  );
});

// 3. Add display name for better debugging
SwatchPreview.displayName = 'SwatchPreview';


const getTokenSetFromPath = (path: string): string => {
  const parts = path.split('.');
  return parts.length > 1 ? parts[0] : 'unknown';
};

const mapTokenToStyle = (token: any): any => {
  // Handle string values
  if (typeof token === 'string') {
    if (token.includes('gradient')) {
      const parsed = parseGradient(token);
      try {
        const gradient = new LinearGradient({
          angle: parsed.angle,
          stops: parsed.stops.map(stop => ({
            position: stop.position ? stop.position / 100 : 0,
            color: stop.color
          }))
        });
        return { backgroundGradient: gradient };
      } catch (error) {
        logger.error('tokenResolution', 'Failed to create gradient:', error);
        return {};
      }
    }
    return { backgroundColor: token };
  }

  // Handle token objects
  if (typeof token === 'object' && token !== null) {
    // If it has a value property
    if ('value' in token) {
      let value = token.value;
      
      // If there are modifications, apply them
      if (token.$extensions?.['studio.tokens']?.modify) {
        value = applyColorModification(value, token.$extensions['studio.tokens'].modify);
      }
      
      // Recursively handle the value
      return mapTokenToStyle(value);
    }

    // For nested objects, return the first valid color/gradient found
    for (const key in token) {
      const result = mapTokenToStyle(token[key]);
      if (Object.keys(result).length > 0) {
        return result;
      }
    }
  }

  logger.warn('tokenResolution', 'Unhandled token type:', token);
  return {};
};

// Add these utility functions near the top of the file, after imports

const applyColorModification = (baseColor: string | object, modifier: any): string => {
  try {
    // If baseColor is an object, try to get its value
    if (typeof baseColor === 'object' && baseColor !== null) {
      baseColor = (baseColor as any).value || '';
    }

    // Handle hex, rgb, rgba, hsl, hsla colors
    const color = chroma(baseColor as string);

    switch (modifier.type) {
      case 'alpha':
        const alpha = parseFloat(modifier.value);
        // For alpha modifications, always return RGBA
        const [r, g, b] = color.rgb();
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      case 'darken':
        return color.darken(parseFloat(modifier.value)).hex();
      case 'lighten':
        return color.brighten(parseFloat(modifier.value)).hex();
      default:
        logger.warn('tokenResolution', 'Unhandled modification type:', modifier.type);
        return baseColor as string;
    }
  } catch (e) {
    logger.error('tokenResolution', 'Error applying color modification:', e);
    return typeof baseColor === 'string' ? baseColor : '';
  }
};

// Update the getColorValue function to handle extensions
const getColorValue = (token: any, allTokens: any): string | null => {
  if (typeof token === 'string') {
    if (/^#([0-9A-F]{3}){1,2}$/i.test(token)) {
      return token;
    }
    if (token.startsWith('{') && token.endsWith('}')) {
      const path = token.slice(1, -1).split('.');
      let result = allTokens;
      for (const key of path) {
        if (result && typeof result === 'object' && key in result) {
          result = result[key];
        } else {
          return null;
        }
      }
      return getColorValue(result, allTokens);
    }
  }
  if (typeof token === 'object' && token !== null) {
    if ('value' in token) {
      let resolvedValue = getColorValue(token.value, allTokens);
      
      // Handle extensions/modifications
      if (resolvedValue && token.$extensions?.['studio.tokens']?.modify) {
        return applyColorModification(resolvedValue, token.$extensions['studio.tokens'].modify);
      }
      return resolvedValue;
    }
    if ('type' in token && token.type === 'color' && 'value' in token) {
      return getColorValue(token.value, allTokens);
    }
  }
  return null;
};



const deepMerge = (target: any, source: any): any => {
  if (typeof source !== 'object' || source === null) {
    return source;
  }
  
  const output = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        output[key] = deepMerge(output[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
  }
  
  return output;
};

const resolveTokenSet = (tokenSet: Record<string, any>, allTokens: Record<string, any>): Record<string, any> => {
  const resolvedSet: Record<string, any> = {};

  for (const [key, value] of Object.entries(tokenSet)) {
    if (typeof value === 'object' && value !== null) {
      if ('value' in value) {
        resolvedSet[key] = {
          ...value,
          value: resolveTokenReference(value.value, allTokens)
        };
      } else {
        resolvedSet[key] = resolveTokenSet(value, allTokens);
      }
    } else {
      resolvedSet[key] = resolveTokenReference(value, allTokens);
    }
  }

  return resolvedSet;
};

const resolveTokenReference = (tokenValue: any, allTokens: Record<string, any>): any => {
  // Handle null/undefined cases
  if (!tokenValue) return tokenValue;

  // Handle token objects with value property
  if (typeof tokenValue === 'object' && tokenValue !== null) {
    if ('value' in tokenValue) {
      const resolvedValue = resolveTokenReference(tokenValue.value, allTokens);
      return {
        ...tokenValue,
        value: resolvedValue
      };
    }
    // Handle other object types
    return tokenValue;
  }

  // Handle string values with references and math
  if (typeof tokenValue === 'string') {
    // First resolve any references like {BorderRadii.Base}
    const resolvedValue = tokenValue.replace(/\{([^}]+)\}/g, (match, path) => {
      const parts = path.split('.');
      let result = allTokens;
      
      for (const part of parts) {
        if (!result || !(part in result)) return match;
        result = result[part];
        // Handle nested token objects
        if (result && typeof result === 'object' && 'value' in result) {
          result = result.value;
        }
      }
      
      return String(result); // Ensure we return a string
    });

    // Then handle multiplication if present
    if (resolvedValue.includes('*')) {
      const parts = resolvedValue.split('*').map(p => p.trim());
      const numbers = parts.map(p => parseFloat(p));
      if (numbers.every(n => !isNaN(n))) {
        return numbers.reduce((a, b) => a * b);
      }
    }

    return resolvedValue;
  }

  return tokenValue;
};

// Add this new helper function
const getStyleFromToken = (token: any): any => {
  // Handle direct string values
  if (typeof token === 'string') {
    if (token.includes('gradient')) {
      const parsedGradient = parseGradient(token);
      return {
        backgroundGradient: new LinearGradient({
          angle: parsedGradient.angle,
          stops: parsedGradient.stops.map(stop => ({
            position: stop.position ? stop.position / 100 : 0,
            color: stop.color
          }))
        })
      };
    }
    return { backgroundColor: token };
  }

  // Handle token objects
  if (typeof token === 'object' && token !== null) {
    if ('value' in token) {
      let resolvedValue = token.value;
      
      // Handle gradient strings
      if (typeof resolvedValue === 'string' && resolvedValue.includes('gradient')) {
        const parsedGradient = parseGradient(resolvedValue);
        return {
          backgroundGradient: new LinearGradient({
            angle: parsedGradient.angle,
            stops: parsedGradient.stops.map(stop => ({
              position: stop.position ? stop.position / 100 : 0,
              color: stop.color
            }))
          })
        };
      }

      // Handle color modifications
      if (token.$extensions?.['studio.tokens']?.modify) {
        resolvedValue = applyColorModification(
          resolvedValue,
          token.$extensions['studio.tokens'].modify
        );
      }
      
      return { backgroundColor: resolvedValue };
    }
  }

  logger.warn('tokenResolution', 'Unhandled token format:', token);
  return {};
};

// 2. Update the gradient reference resolution to cache results

// Add these interfaces near the top with other interfaces
interface GradientStop {
  position?: number;
  color: string;
}

interface GradientInfo {
  angle: number;
  stops: GradientStop[];
}

// Update the parseGradient function to use the new types
const parseGradient = (gradientString: string): GradientInfo => {
  const match = gradientString.match(/linear-gradient\(([^,]+),\s*(.*)\)/);
  if (!match) {
    logger.error('tokenResolution', 'Invalid gradient string:', gradientString);
    return { angle: 0, stops: [] };
  }

  const [, angle, stops] = match;
  const parsedAngle = angle.includes('deg') ? parseFloat(angle) : 0;
  const parsedStops = stops.split(/,(?![^(]*\))/).map(stop => {
    const [color, position] = stop.trim().split(/\s+(?=\d+%)/);
    return {
      color: color.trim(),
      position: position ? parseFloat(position) : undefined
    };
  });

  return {
    angle: parsedAngle,
    stops: parsedStops
  };
};

// Add these helper functions
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
      // Standalone items become their own group
      groups[setName] = [];
    }
  });
  
  return groups;
};

// At the top of the file, create a context for token management
const TokenManagerContext = React.createContext<{
  clearTokens?: () => void;
}>({});

// Add this near the top of the file, with the other helper functions
const isTokenAppliedToAnySelected = async (tokenPath: string, selection: CanvasNode[]): Promise<boolean> => {
  for (const node of selection) {
    const appliedToken = await getTokenMetadata(node);
    if (appliedToken === tokenPath) {
      return true;
    }
  }
  return false;
};

// Add this helper function near the top of the file

// Add these interfaces near the top with other interfaces
interface GitHubSettings {
  tokenPath: string;
  token: string;
  repoUrl: string;
}

interface RepoInfo {
  owner: string;
  repo: string;
}

interface TokenMetadata {
  tokenName: string;
  tokenSet: string;
}

// Add this interface at the top
interface IdleDeadline {
  timeRemaining: () => number;
  didTimeout: boolean;
}

export function App() {
  const [isPending, startTransition] = useTransition();

  // Add this with your other state declarations at the top of the component
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('0');
  const selection = useSelection();
  const [tokenValues, setTokenValues] = useState<Record<string, any>>({});
  const [tokenSetOrder, setTokenSetOrder] = useState<string[]>([]);
  const [allTokenSets, setAllTokenSets] = useState<Record<string, TokenSet>>({});
  const [tokenSetState, setTokenSetState] = useState<Record<string, boolean>>({});
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [enabledThemes, setEnabledThemes] = useState<string[]>([]);

  // Add state for dropdown visibility
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  // Initialize tokens and themes
  const [isInitialized, setIsInitialized] = useState(false);

  // Add initialization tracking ref
  const initializationInProgressRef = useRef(false);
  const prevTokenSetStateRef = useRef<Record<string, boolean>>({});

  // Add this state to track what we're currently viewing
  const [viewMode, setViewMode] = useState<'theme' | 'set'>('theme');

  // Add these near the top of your component, after state declarations


  // Memoize the rendered token groups
  const memoizedRenderTokenGroup = useCallback((tokens: any, path: string = '', depth: number = 0) => {
    return renderTokenGroup(tokens, path, depth);
  }, [selection]); // Only re-render when selection changes

  // Add these with your other state declarations at the top
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncProgress, setSyncProgress] = useState<string>(''); // Add this for detailed progress

  // Add this state to track what mode we're in
  const [loadMode, setLoadMode] = useState<'local' | 'github' | null>('local');
  
  // Move handleSync inside the component
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncProgress('Checking GitHub settings...');
      
      logger.group('sync', 'GitHub Sync');
      const startTime = performance.now();

      const settings = await StorageService.getGitHubSettings() as GitHubSettings;
      if (!settings) {
        throw new Error('No GitHub settings found');
      }

      const { tokenPath, token, repoUrl } = settings;
      
      if (!tokenPath || !token || !repoUrl) {
        throw new Error('Missing required GitHub settings');
      }

      const repoInfo = parseRepoUrl(repoUrl) as RepoInfo;
      if (!repoInfo) {
        throw new Error('Invalid repository URL');
      }

      const { owner, repo } = repoInfo;
      const github = new GitHubService({ 
        token, 
        owner, 
        repo, 
        path: tokenPath,
        branch: 'main' // Add required branch parameter
      });

      setSyncProgress('Connecting to GitHub repository...');
      
      // First, get the metadata and themes
      setSyncProgress('Fetching $metadata.json...');
      const metadata = await github.fetchFile('$metadata.json');
      
      setSyncProgress('Fetching $themes.json...');
      const themesData = await github.fetchFile('$themes.json');
      
      // Structure to hold all tokens
      const tokens: Record<string, any> = {
        [`${tokenPath}/$metadata.json`]: metadata,
        [`${tokenPath}/$themes.json`]: themesData
      };
      
      // Get the token files list from metadata
      const tokenFiles = metadata?.tokenSetOrder || [];
      
      // Fetch each token file
      for (const tokenFile of tokenFiles) {
        setSyncProgress(`Fetching ${tokenFile}.json...`);
        const tokenData = await github.fetchFile(`${tokenFile}.json`);
        tokens[`${tokenPath}/${tokenFile}.json`] = tokenData;
      }

      logger.group('tokenSetManagement', 'Token Processing');
      logger.debug('tokenSetManagement', 'Raw tokens from GitHub:', tokens);
      setSyncProgress('Processing metadata and themes...');
      if (!metadata || !themesData) {
        throw new Error('Missing required metadata or themes files');
      }
      // Process the tokens to remove the dynamic path prefix
      setSyncProgress('Processing token files...');
      const processedTokens = Object.entries(tokens).reduce((acc, [key, value]) => {
        const cleanKey = key.replace(`${tokenPath}/`, '').replace('.json', '');
        acc[cleanKey] = value;
        return acc;
      }, {} as Record<string, any>);
      logger.info('tokenSetManagement', 'Processed tokens structure:', Object.keys(processedTokens));

      const order = metadata?.tokenSetOrder || [];
      const themesArray = Array.isArray(themesData) ? themesData : [themesData];
      
      setSyncProgress(`Initializing ${themesArray.length} themes...`);
      
      // Get the first theme and its enabled token sets
      const defaultTheme = themesArray[0];
      if (!defaultTheme) {
        throw new Error('No themes found in the token data');
      }

      logger.group('sync', 'Theme Setup');
      logger.info('sync', 'Default theme:', defaultTheme);

      setSyncProgress('Setting up initial token states...');
      // Create initial token set state based on the first theme
      const initialTokenSetState = order.reduce((acc: Record<string, boolean>, setName: string) => {
        acc[setName] = defaultTheme.selectedTokenSets[setName] === 'enabled' || 
                      defaultTheme.selectedTokenSets[setName] === 'source';
        return acc;
      }, {} as Record<string, boolean>);

      const enabledSets = Object.keys(initialTokenSetState)
        .filter(set => initialTokenSetState[set]);

      logger.info('sync', 'Initial enabled token sets:', enabledSets);
      logger.debug('sync', 'Expanding themes:', enabledSets.map(set => set.split('/')[0]));

      setSyncProgress('Resolving token references...');
      // Resolve tokens with the enabled sets
      const resolvedTokens = resolveCustomTokens(processedTokens, enabledSets, order);
      logger.debug('sync', 'Resolved tokens:', resolvedTokens);

      // Update all states
      setSyncProgress('Updating application state...');
      setTokenSetOrder(order);
      setAllTokenSets(processedTokens);
      setThemes(themesArray);
      setTokenSetState(initialTokenSetState);
      setTokenValues(resolvedTokens);
      setCurrentTheme('0');
      setEnabledThemes(['0']); // Add this line to enable the first theme
      
      // Set initial view state
      if (order.length > 0) {
        const firstSet = enabledSets[0] || order[0];
        logger.info('sync', 'Setting initial selected set to:', firstSet);
        setSelectedSet(firstSet);
        setViewMode('set');
      }

      logger.groupEnd('sync');

      setLastSyncTime(new Date());
      setLoadMode('github');
      setIsInitialized(true);
      framer.notify('✅ Tokens synchronized successfully!');

    } catch (error) {
      logger.error('sync', 'Sync failed:', error);
    } finally {
      setIsSyncing(false);
      setSyncProgress('');
    }
  };

  const init = async () => {
    const startTime = performance.now();
    
    if (isInitialized || initializationInProgressRef.current) {
      logger.debug('initialization', 'Skipping initialization - already in progress');
      return;
    }

    initializationInProgressRef.current = true;

    try {
      logger.group('initialization', 'Plugin Startup');
      const { order, loadedTokenSets, themeDetails } = await initializeTokens();
      
      // Remove automatic selection of default theme
      setTokenSetOrder(order);
      setAllTokenSets(loadedTokenSets);
      setThemes(themeDetails);
      
      // Initialize with empty states instead of defaults
      setEnabledThemes([]);
      setTokenSetState({});
      setCurrentTheme('');
      setSelectedSet(null);
      setViewMode('set');
      
      // Initialize token values with empty enabled sets
      const initialTokenValues = resolveCustomTokens(loadedTokenSets, [], order);
      setTokenValues(initialTokenValues);
      
      setIsInitialized(true);
      
      const endTime = performance.now();
      logger.info('initialization', `Initialization completed in ${Math.round(endTime - startTime)}ms`);
    } catch (error) {
      logger.error('initialization', 'Initialization failed:', error);
      throw error;
    } finally {
      initializationInProgressRef.current = false;
      logger.groupEnd('initialization');
    }
  };

  useEffect(() => {
    if (!isInitialized && loadMode === 'local' && !initializationInProgressRef.current) {
      init();
    }
  }, [isInitialized, loadMode]);

  // Function to create initial token set state

  // Modify the onSelectTokenSet function
  const onSelectTokenSet = useCallback((setName: string) => {
    logger.group('tokenSetManagement', 'Token Set Selection');
    logger.info('tokenSetManagement', `Selected token set: ${setName}`);
    setSelectedSet(setName);
    setViewMode('set');
    logger.groupEnd('tokenSetManagement');
  }, []);

  // Helper function to get enabled token sets


  // Function to check if a specific token is applied to the selected node

  // Update tokens when theme or token sets change
  useEffect(() => {
    const updateNodes = async () => {
      // Break token resolution into chunks
      const processTokensInChunks = async () => {
        const enabledSets = Object.entries(tokenSetState)
          .filter(([_, enabled]) => enabled)
          .map(([name]) => name);

        // Process token resolution in the next frame
        await new Promise(resolve => requestAnimationFrame(resolve));
        const newTokenValues = resolveCustomTokens(allTokenSets, enabledSets, tokenSetOrder);
        
        // Update token values in the next frame
        await new Promise(resolve => requestAnimationFrame(resolve));
        setTokenValues(newTokenValues);

        try {
          const nodes = await tokenNodeManager.getAllNodes();
          if (!nodes.length) return;

          // Process nodes in smaller chunks
          const chunkSize = 10;
          for (let i = 0; i < nodes.length; i += chunkSize) {
            const chunk = nodes.slice(i, i + chunkSize);
            
            // Process each chunk in a new animation frame
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            for (const { node, metadata } of chunk) {
              try {
                let tokenValue = newTokenValues;
                const pathParts = metadata.tokenName.split('.');
                
                for (const part of pathParts) {
                  if (tokenValue && typeof tokenValue === 'object' && part in tokenValue) {
                    tokenValue = tokenValue[part];
                  } else {
                    tokenValue = null;
                    break;
                  }
                }

                if (tokenValue) {
                  const style = mapTokenToStyle(tokenValue);
                  await node.setAttributes(style);
                  logger.debug('tokenResolution', `Updated node "${node.id}" with new style for token "${metadata.tokenName}"`);
                }
              } catch (error) {
                logger.warn('tokenResolution', `Failed to update node ${node.id}:`, error);
              }
            }
          }
        } catch (error) {
          logger.error('tokenResolution', 'Failed to update nodes:', error);
        }
      };

      processTokensInChunks();
    };

    updateNodes();
  }, [tokenSetState, allTokenSets, tokenSetOrder]);

  // Add this near other useCallback declarations
  const debouncedThemeChange = useCallback(
    debounce((themeId: string, selectedTheme: Theme) => {
      if (!isRestoringStateRef.current) {
        logger.group('themeManagement', `Theme Change: ${selectedTheme.name}`);
        
        try {
          const isEnabled = enabledThemes.includes(themeId);
          const themeSets = new Set(
            Object.entries(selectedTheme.selectedTokenSets)
              .filter(([_, state]) => state === 'enabled' || state === 'source')
              .map(([name]) => name)
          );
          
          // Create new states before updating
          const newEnabledThemes = isEnabled 
            ? enabledThemes.filter(id => id !== themeId)
            : [...enabledThemes, themeId];
          
          const newTokenState = { ...tokenSetState };
          
          // Process token sets once
          if (isEnabled) {
            // When disabling a theme
            for (const setName of themeSets) {
              const isUsedByOtherTheme = newEnabledThemes
                .some(otherId => {
                  const otherTheme = themes[parseInt(otherId)];
                  return otherTheme.selectedTokenSets[setName] === 'enabled' || 
                         otherTheme.selectedTokenSets[setName] === 'source';
                });
              
              if (!isUsedByOtherTheme) {
                logger.debug('themeManagement', `Disabling token set: ${setName}`);
                newTokenState[setName] = false;
              }
            }
          } else {
            // When enabling a theme
            for (const setName of themeSets) {
              if (!newTokenState[setName]) {
                logger.debug('themeManagement', `Enabling token set: ${setName}`);
                newTokenState[setName] = true;
              }
            }
          }

          // Use requestAnimationFrame to schedule state updates
          requestAnimationFrame(() => {
            startTransition(() => {
              // First update themes
              setEnabledThemes(newEnabledThemes);
              
              // Then schedule token state update
              requestAnimationFrame(() => {
                setTokenSetState(newTokenState);
              });
            });
          });
        } finally {
          logger.groupEnd('themeManagement');
        }
      }
    }, 300),
    [enabledThemes, tokenSetState, themes]
  );

  // Update handleThemeChange to use the debounced version
  const handleThemeChange = (themeId: string) => {
    const selectedTheme = themes[parseInt(themeId)];
    if (selectedTheme) {
      debouncedThemeChange(themeId, selectedTheme);
    }
  };


  const resolveTokenSet = (tokenSet: Record<string, any>, allTokens: Record<string, any>): Record<string, any> => {
    const resolvedSet: Record<string, any> = {};

    for (const [key, value] of Object.entries(tokenSet)) {
      if (typeof value === 'object' && value !== null) {
        if ('value' in value) {
          resolvedSet[key] = {
            ...value,
            value: resolveTokenReference(value.value, allTokens)
          };
        } else {
          resolvedSet[key] = resolveTokenSet(value, allTokens);
        }
      } else {
        resolvedSet[key] = resolveTokenReference(value, allTokens);
      }
    }

    return resolvedSet;
  };

  const deepMerge = (target: any, source: any): any => {
    if (typeof source !== 'object' || source === null) {
      return source;
    }
    
    const output = { ...target };
    
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (typeof source[key] === 'object' && source[key] !== null) {
          output[key] = deepMerge(output[key] || {}, source[key]);
        } else {
          output[key] = source[key];
        }
      }
    }
    
    return output;
  };

  const resolveCustomTokens = (allTokenSets: any, enabledSets: string[], tokenSetOrder: string[]) => {
    const mergedTokens = tokenSetOrder.reduce((acc, setName) => {
      if (enabledSets.includes(setName) && allTokenSets[setName]) {
        return deepMerge(acc, allTokenSets[setName]);
      }
      return acc;
    }, {});

    const resolveReference = (value: any, context: any, depth = 0): any => {
      if (depth > 10) return value;

      // Handle gradient strings with references
      if (typeof value === 'string' && value.includes('gradient')) {
        return value.replace(/\{([^}]+)\}/g, (match, path) => {
          const resolved = resolveReference(`{${path}}`, context, depth);
          return resolved.startsWith('{') ? match : resolved;
        });
      }

      // Handle regular references
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        const path = value.slice(1, -1).split('.');
        let result = context;
        for (const key of path) {
          if (result && typeof result === 'object' && key in result) {
            result = result[key];
            // If we find a token object with a value, resolve it
            if (typeof result === 'object' && 'value' in result) {
              result = result.value;
            }
          } else {
            return value;
          }
        }
        // Recursively resolve any nested references
        return resolveReference(result, context, depth + 1);
      }

      // Handle mathematical operations after references are resolved
      if (typeof value === 'string' && value.includes('*')) {
        // First resolve any references in the expression
        const resolvedExpression = value.replace(/\{([^}]+)\}/g, (match, path) => {
          const resolved = resolveReference(`{${path}}`, context, depth);
          return resolved.startsWith('{') ? match : resolved;
        });

        // Then evaluate the mathematical expression
        const parts = resolvedExpression.split('*').map(p => p.trim());
        const numbers = parts.map(p => parseFloat(p));
        if (numbers.every(n => !isNaN(n))) {
          return numbers.reduce((a, b) => a * b);
        }
      }

      return value;
    };

    const resolveTokens = (tokens: any, context: any = tokens): any => {
      if (typeof tokens !== 'object' || tokens === null) {
        return tokens;
      }
      const resolved: any = {};
      for (const [key, value] of Object.entries(tokens)) {
        if (typeof value === 'object' && value !== null) {
          if ('value' in value) {
            resolved[key] = {
              ...value,
              value: resolveReference(value.value, context)
            };
          } else {
            resolved[key] = resolveTokens(value, context);
          }
        } else {
          resolved[key] = resolveReference(value, context);
        }
      }
      return resolved;
    };

    return resolveTokens(mergedTokens);
  };

  // Update the toggleTokenSetEnabled function to handle theme sync
  const toggleTokenSetEnabled = useCallback((setName: string) => {
    setTokenSetState(prevState => {
      const newState = { ...prevState, [setName]: !prevState[setName] };
      
      // Get all enabled sets after the toggle

      // Find themes that match the current token set configuration
      const matchingThemes = themes.map((theme, index) => ({
        theme,
        index: index.toString()
      })).filter(({ theme }) => {
        // A theme matches if all its enabled/source token sets are enabled in newState
        const themeEnabledSets = Object.entries(theme.selectedTokenSets)
          .filter(([_, state]) => state === 'enabled' || state === 'source')
          .map(([name]) => name);
        
        return themeEnabledSets.every(set => newState[set]);
      });

      // Update enabled themes
      setEnabledThemes(matchingThemes.map(({ index }) => index));

      // Store the updated state
      StorageService.savePluginState({
        selectedSet,
        viewMode,
        tokenSetState: newState,
        enabledThemes: matchingThemes.map(({ index }) => index)
      });

      return newState;
    });
  }, [themes, selectedSet, viewMode]);

  // Replace the existing getSelectedSetTokens function with this simplified version
  const getSelectedSetTokens = useCallback((): Record<string, any> => {
    if (!selectedSet || !allTokenSets[selectedSet]) {
      return {};
    }

    // Important: Use all enabled token sets for resolution context
    const enabledSets = Object.entries(tokenSetState)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name);

    // Use resolveCustomTokens with all enabled sets for proper cross-referencing
    const resolvedTokens = resolveCustomTokens(
      allTokenSets,  // Use all token sets as context
      enabledSets,   // Include all enabled sets
      tokenSetOrder  // Use the full token set order
    );

    // Filter to only show tokens from the selected set
    return Object.entries(resolvedTokens)
      .filter(([key]) => key in allTokenSets[selectedSet])
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);
  }, [selectedSet, allTokenSets, tokenSetState, tokenSetOrder]);

  useEffect(() => {
    const loadDynamicTokenSets = async () => {
      try {
        const acmeTokens = await import('./tokens/Brand/Acme.json');
        const legacyTokens = await import('./tokens/Brand/Legacy.json');
        setAllTokenSets(prevSets => ({
          ...prevSets,
          'Brand/Acme': acmeTokens,
          'Brand/Legacy': legacyTokens
        }));
      } catch (error) {
        logger.error('initialization', 'Error loading dynamic token sets:', error);
      }
    };

    loadDynamicTokenSets();
  }, []);

  useEffect(() => {
    // Any other necessary initialization code can remain here
  }, []);

  useEffect(() => {
    prevTokenSetStateRef.current = tokenSetState;
  }, []);

  // Update the tokenSetState effect to use `requestIdleCallback`
  useEffect(() => {
    if (isInitialized && tokenSetState) {
      const requestIdleCallback = (window as any).requestIdleCallback || 
        ((cb: (deadline: IdleDeadline) => void) => setTimeout(() => cb({
          timeRemaining: () => 1,
          didTimeout: false
        }), 1));

      requestIdleCallback((deadline: IdleDeadline) => {
        if (deadline.timeRemaining() > 0) {
          const enabledSets = Object.entries(tokenSetState)
            .filter(([_, enabled]) => enabled)
            .map(([name]) => name);
          
          // Only log if there are enabled sets and they've changed
          if (enabledSets.length > 0 && 
              JSON.stringify(enabledSets) !== JSON.stringify(prevTokenSetStateRef.current)) {
            logger.debug('tokenSetManagement', "Current token set state:", enabledSets.join(', '));
          }
          
          // Update the ref after logging
          prevTokenSetStateRef.current = enabledSets.reduce((acc, set) => {
            acc[set] = true;
            return acc;
          }, {} as Record<string, boolean>);
        }
      });
    }
  }, [tokenSetState, isInitialized]);

  // Add this effect to handle stored state for first time use 
  useEffect(() => {
    const initializeState = async () => {
      if (isInitialized && tokenSetOrder.length > 0) {
        const startTime = performance.now();
        logger.group('stateManagement', 'State Initialization');
        isRestoringStateRef.current = true;
        
        try {
          const storedState = await StorageService.getPluginState();
          
          if (storedState) {
            // Use startTransition from useTransition hook
            startTransition(() => {
              ReactDOM.unstable_batchedUpdates(() => {
                if (storedState.tokenSetState) {
                  setTokenSetState(storedState.tokenSetState);
                }
                if (storedState.enabledThemes) {
                  setEnabledThemes(storedState.enabledThemes);
                }
                if (storedState.selectedSet) {
                  setSelectedSet(storedState.selectedSet);
                  setViewMode(storedState.viewMode || 'set');
                }
              });
            });
            logger.info('stateManagement', 'State restored in batch');
          }
          
          const endTime = performance.now();
          logger.info('stateManagement', `State restoration completed in ${Math.round(endTime - startTime)}ms`);
        } finally {
          isRestoringStateRef.current = false;
          logger.groupEnd('stateManagement');
        }
      }
    };
  
    initializeState();
  }, [isInitialized, tokenSetOrder]);

  // Update the debouncedSaveState to be async
  const debouncedSaveState = useCallback(
    debounce(async (state: any) => {
      if (!initializationInProgressRef.current && 
          !isRestoringStateRef.current && 
          isInitialized && 
          initialRestorationRef.current) {
        const startTime = performance.now();
        
        // Only save if state has actually changed
        const storedState = await StorageService.getPluginState();
        if (JSON.stringify(storedState) !== JSON.stringify(state)) {
          logger.group('stateManagement', 'Saving State');
          await new Promise(resolve => requestAnimationFrame(resolve));
          StorageService.savePluginState(state);
          const endTime = performance.now();
          logger.debug('stateManagement', `State saved in ${Math.round(endTime - startTime)}ms`);
          logger.groupEnd('stateManagement');
        }
      }
    }, 3000),
    [isInitialized]
  );

  // Add this ref at the top with other refs
  const isRestoringStateRef = useRef(false);

  // Add a ref to track initial restoration
  const initialRestorationRef = useRef(false);

  // Update the state saving effect
  useEffect(() => {
    if (isInitialized && !isRestoringStateRef.current && initialRestorationRef.current) {
      const stateToSave = {
        selectedSet,
        viewMode,
        tokenSetState,
        enabledThemes
      };
      debouncedSaveState(stateToSave);
    }
  }, [isInitialized, selectedSet, viewMode, tokenSetState, enabledThemes, debouncedSaveState]);

  // Update initializeState to set initialRestorationRef
  const initializeState = async () => {
    if (isInitialized && tokenSetOrder.length > 0) {
      const startTime = performance.now();
      logger.group('stateManagement', 'State Initialization');
      isRestoringStateRef.current = true;
      
      try {
        const storedState = await StorageService.getPluginState();
        
        if (storedState) {
          startTransition(() => {
            ReactDOM.unstable_batchedUpdates(() => {
              if (storedState.tokenSetState) {
                setTokenSetState(storedState.tokenSetState);
              }
              if (storedState.enabledThemes) {
                setEnabledThemes(storedState.enabledThemes);
              }
              if (storedState.selectedSet) {
                setSelectedSet(storedState.selectedSet);
                setViewMode(storedState.viewMode || 'set');
              }
            });
          });
          logger.info('stateManagement', 'State restored in batch');
        }
        
        const endTime = performance.now();
        logger.info('stateManagement', `State restoration completed in ${Math.round(endTime - startTime)}ms`);
      } finally {
        isRestoringStateRef.current = false;
        // Set this after restoration is complete
        setTimeout(() => {
          initialRestorationRef.current = true;
        }, 3000);  // Match the debounce time
        logger.groupEnd('stateManagement');
      }
    }
  };

  // Replace the state saving effect
  useEffect(() => {
    if (isInitialized) {
      const stateToSave = {
        selectedSet,
        viewMode,
        tokenSetState,
        enabledThemes
      };
      debouncedSaveState(stateToSave);
    }
  }, [isInitialized, selectedSet, viewMode, tokenSetState, enabledThemes, debouncedSaveState]);

  const renderTokenGroup = (tokens: any, path: string = '', depth: number = 0) => {
    const groupName = path.split('.').pop() || '';
    
    return (
      <div key={path} className="token-group">
        {groupName && (
          <div className="group-header">
            <h3 className="group-title">{groupName}</h3>
          </div>
        )}
        <div className="token-swatches">
          {Object.entries(tokens).map(([name, value]) => {
            const fullPath = path ? `${path}.${name}` : name;
            
            if (typeof value === 'object' && value !== null && !('value' in value)) {
              return renderTokenGroup(value, fullPath, depth + 1);
            }
            
            return (
              <SwatchPreview
                key={fullPath}
                tokenName={name}
                resolvedValue={value}
                isApplied={isTokenAppliedToAnySelected(fullPath, selection)}
                onClick={() => toggleTokenApplication(selection, value, fullPath)}
                path={fullPath}
                allTokenSets={allTokenSets}
                tokenSetOrder={tokenSetOrder}
              />
            );
          })}
        </div>
      </div>
    );
  };



  // Ensure the initial theme is set correctly
  useEffect(() => {
    if (!isInitialized && themes.length > 0) {
      const initialTheme = themes.find(theme => theme.name.toLowerCase() === 'light');
      if (initialTheme) {
        handleThemeChange(initialTheme.id.toString());
        // The handleThemeChange will now automatically select the first token set
      }
    }
  }, [isInitialized, themes]);

  // Add this near your other state variables

  // Update your initialization effect
  useEffect(() => {
    if (!isInitialized && tokenSetOrder.length > 0 && themes.length > 0 && !initializationInProgressRef.current) {
      initializationInProgressRef.current = true;
      
      // Find the Core theme
      const coreThemeIndex = themes.findIndex(theme => theme.name === 'Core');
      const initialThemeId = coreThemeIndex.toString();
      
      logger.group('initialization', 'Initial Theme Setup');
      logger.info('initialization', 'Setting initial theme:', themes[coreThemeIndex].name);
      logger.info('initialization', 'Initial theme ID:', initialThemeId);
      logger.groupEnd('initialization');
      
      // Set the enabled themes state
      setEnabledThemes([initialThemeId]);
      
      // Create initial token set state
      const initialTokenSetState: Record<string, boolean> = {};
      tokenSetOrder.forEach(setName => {
        initialTokenSetState[setName] = false;
      });

      // Enable token sets from the Core theme
      if (themes[coreThemeIndex].selectedTokenSets) {
        Object.entries(themes[coreThemeIndex].selectedTokenSets).forEach(([setName, state]) => {
          if (state === 'enabled' || state === 'source') {
            initialTokenSetState[setName] = true;
          }
        });
      }

      setTokenSetState(initialTokenSetState);
      setCurrentTheme(initialThemeId);
      
      setIsInitialized(true);
      initializationInProgressRef.current = false;
    }
  }, [isInitialized, tokenSetOrder, themes]);

  // Create the clear function using useCallback to maintain reference
  const clearTokensHandler = useCallback(() => {
    logger.info('initialization', 'Clearing all tokens and state');
    tokenNodeManager.clearTokens();
    // Clear ALL UI state
    setTokenValues({});
    setTokenSetState({});
    setAllTokenSets({});
    setThemes([]);
    setSelectedSet(null);
    setCurrentTheme('0');
    setTokenSetOrder([]); // Clear the token set order
    setExpandedThemes({}); // Clear expanded themes state
    
    // Reset mode and initialization
    setLoadMode(null);
    setIsInitialized(false);
    
    logger.info('initialization', 'Successfully cleared all tokens and state');
    framer.notify('Cleared all tokens and state');
  }, []);

  // Replace the select element with this custom dropdown
  <div className="custom-theme-select">
    <div 
      className="theme-select-header" 
      onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
    >
      <span>Select a theme</span>
      <span className="dropdown-arrow">▼</span>
    </div>
    {isThemeDropdownOpen && (
      <div className="theme-options">
        {Array.isArray(themes) && themes.length > 0 ? (
          themes.map((theme, index) => (
            <div 
              key={theme.id} 
              className={`theme-option ${enabledThemes.includes(index.toString()) ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                const themeId = index.toString();
                handleThemeChange(themeId);
              }}
            >
              <input
                type="checkbox"
                checked={enabledThemes.includes(index.toString())}
                onChange={(e) => {
                  e.stopPropagation();
                  const themeId = index.toString();
                  handleThemeChange(themeId);
                }}
              />
              {theme.name}
            </div>
          ))
        ) : (
          <div className="theme-option" aria-disabled>Loading themes...</div>
        )}
      </div>
    )}
  </div>

  // At the top with other state declarations
  const [expandedThemes, setExpandedThemes] = useState<Record<string, boolean>>({});

  // Add a separate effect to handle expanded themes
  useEffect(() => {
    if (isInitialized && tokenSetState) {
      const enabledSets = Object.entries(tokenSetState)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name);

      const themesToExpand = enabledSets.map(set => set.split('/')[0]);
      
      const newExpandedThemes: Record<string, boolean> = {};
      themesToExpand.forEach(theme => {
        newExpandedThemes[theme] = true;
      });
      
      setExpandedThemes(newExpandedThemes);
    }
  }, [isInitialized, tokenSetState]);

  // Add this helper function if you don't have it already
  const toggleThemeExpanded = (theme: string) => {
    setExpandedThemes(prev => ({
      ...prev,
      [theme]: !prev[theme]
    }));
  };

  return (
    <TokenManagerContext.Provider value={{ clearTokens: clearTokensHandler }}>
      <main>
        <div className="top-bar">
          <div className="top-bar-content">
            <div className="top-bar-left">
              {lastSyncTime && (
                <span className="last-sync">
                  Last synced: {lastSyncTime.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="top-bar-right">
              <button 
                className={`sync-button ${isSyncing ? 'syncing' : ''}`}
                onClick={handleSync}
                disabled={isSyncing}
              >
                <span className="sync-icon">
                  {isSyncing ? '🔄' : '🔄'}
                </span>
                {isSyncing ? 'Syncing...' : 'Sync from GitHub'}
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button 
                  className="debug-button"
                  onClick={clearTokensHandler}
                >
                  🗑️ Clear Tokens
                </button>
              )}
              <button 
                className="settings-button"
                onClick={() => setIsSettingsOpen(true)}
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>

        <div className="app-container">
          <div className="sidebar">
            {/* Theme selector */}
            <div className="custom-theme-select">
              <div 
                className="theme-select-header" 
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              >
                <span>Select themes</span>
                <span className="dropdown-arrow">▼</span>
              </div>
              {isThemeDropdownOpen && (
                <div className="theme-options">
                  {Array.isArray(themes) && themes.length > 0 ? (
                    themes.map((theme, index) => (
                      <div 
                        key={theme.id} 
                        className={`theme-option ${enabledThemes.includes(index.toString()) ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const themeId = index.toString();
                          handleThemeChange(themeId);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={enabledThemes.includes(index.toString())}
                          onChange={(e) => {
                            e.stopPropagation();
                            const themeId = index.toString();
                            handleThemeChange(themeId);
                          }}
                        />
                        {theme.name}
                      </div>
                    ))
                  ) : (
                    <div className="theme-option" aria-disabled>Loading themes...</div>
                  )}
                </div>
              )}
            </div>

            {/* Token Set List */}
            <h3>Token Sets</h3>
            <div className="token-set-list">
              {Object.entries(groupTokenSets(tokenSetOrder)).map(([theme, children]) => (
                <React.Fragment key={theme}>
                  {/* Theme Item */}
                  <div 
                    className={`token-set-item parent ${selectedSet === theme ? 'selected' : ''}`}
                  >
                    <span 
                      className={`toggle ${children.length > 0 ? 'has-children' : ''} ${expandedThemes[theme] ? 'expanded' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleThemeExpanded(theme);
                      }}
                    >
                      {children.length > 0 ? '▶' : ''}
                    </span>
                    <input
                      type="checkbox"
                      ref={inputRef => {
                        if (inputRef && children.length > 0) {
                          const enabledCount = children.filter(child => tokenSetState[child]).length;
                          inputRef.indeterminate = enabledCount > 0 && enabledCount < children.length;
                        }
                      }}
                      checked={children.length > 0 
                        ? children.every(childPath => tokenSetState[childPath])
                        : tokenSetState[theme] || false
                      }
                      onChange={(e) => {
                        e.stopPropagation();
                        // Get the new state from the event target
                        const newState = e.target.checked;
                        logger.debug('tokenSetManagement', `Toggling theme ${theme} to: ${newState}`);
                        
                        if (children.length > 0) {
                          // If it has children, toggle them all
                          children.forEach(childPath => {
                            if (tokenSetState[childPath] !== newState) {
                              toggleTokenSetEnabled(childPath);
                            }
                          });
                        } else {
                          // If it's a leaf node, just toggle itself
                          toggleTokenSetEnabled(theme);
                        }
                      }}
                    />
                    <span 
                      className="token-name"
                      onClick={() => onSelectTokenSet(theme)}
                    >
                      {theme}
                    </span>
                  </div>

                  {/* Child Items */}
                  {expandedThemes[theme] && children.map(childPath => {
                    const childName = childPath.split('/').pop() || '';
                    return (
                      <div 
                        key={childPath} 
                        className={`token-set-item child ${selectedSet === childPath ? 'selected' : ''}`}
                      >
                        <span className="toggle"></span>
                        <input
                          type="checkbox"
                          checked={tokenSetState[childPath] || false}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleTokenSetEnabled(childPath);
                            logger.debug('tokenSetManagement', `Toggling ${childPath}, new state:`, !tokenSetState[childPath]);
                          }}
                        />
                        <span 
                          className="token-name"
                          onClick={() => onSelectTokenSet(childPath)}
                        >
                          {childName}
                        </span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="content">
            {/* Single view section based on viewMode */}
            {viewMode === 'theme' && currentTheme !== "none" && (
              <div>
                <h2>{themes[parseInt(currentTheme)]?.name || ''} Theme Tokens</h2>
                {memoizedRenderTokenGroup(tokenValues, '', 0)}
              </div>
            )}

            {viewMode === 'set' && selectedSet && (
              <div>
                {memoizedRenderTokenGroup(getSelectedSetTokens(), '', 0)}
              </div>
            )}

            {/* Selection count moved to bottom */}
            <div className="selection-count">
              <p>You have {selection.length} {selection.length === 1 ? "layer" : "layers"} selected.</p>
            </div>
          </div>
        </div>

        <Settings 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        <AnimatePresence>
          {isSyncing && <LoadingOverlay message={syncProgress} />}
        </AnimatePresence>
      </main>
    </TokenManagerContext.Provider>
  );
}