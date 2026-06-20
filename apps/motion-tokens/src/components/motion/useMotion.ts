import { motionTokens } from '../../tokens/generated/motion.generated';
import { useTokens } from './useTokens';

function parseBezierString(value: string | undefined): [number, number, number, number] {
  if (!value || typeof value !== 'string') {
    return [0.4, 0, 0.2, 1]; // Default bezier curve
  }

  const matches = value.match(/cubic-bezier\(([\d.-]+),\s*([\d.-]+),\s*([\d.-]+),\s*([\d.-]+)\)/);
  if (matches) {
    return [
      parseFloat(matches[1]),
      parseFloat(matches[2]),
      parseFloat(matches[3]),
      parseFloat(matches[4])
    ];
  }
  return [0.4, 0, 0.2, 1]; // Default bezier curve if no match
}

export interface MotionConfig {
  entrance?: boolean
  hover?: boolean
  stagger?: boolean
  variant?: string
  scale?: {
    from: number
    to: number
  }
  rotate?: {
    from: number
    to: number
  }
  opacity?: {
    from: number
    to: number
  }
  translate?: {
    from: { x: number, y: number }
    to: { x: number, y: number }
  }
  duration?: number
  delay?: number
  ease?: [number, number, number, number] | {
    type: 'spring'
    stiffness?: number
    damping?: number
    mass?: number
    velocity?: number
  }
}

interface MotionProps {
  initial?: Record<string, any>
  animate?: Record<string, any>
  transition?: Record<string, any>
  whileHover?: Record<string, any>
  style?: Record<string, any>
}

interface SpringConfig {
  type: 'time' | 'physics';
  // Time-based spring
  duration?: string;
  bounce?: number;
  // Physics-based spring
  stiffness?: number;
  damping?: number;
  mass?: number;
}

interface TokenFormat {
  type: 'bezier' | 'spring';
  duration: string;
  delay: string;
  // Bezier properties
  easing?: string;
  // Spring properties
  spring?: SpringConfig;
  // Transform properties
  opacityFrom?: string;
  opacityTo?: string;
  scaleFrom?: string;
  scaleTo?: string;
  rotateFrom?: string;
  rotateTo?: string;
  translateFrom?: string;
  translateTo?: string;
}

interface TransformValue {
  from: string;
  to: string;
}

interface EntranceValue {
  type: 'bezier' | 'spring';
  duration: string;
  delay: string;
  easing: string;
  opacity?: TransformValue;
  scale?: TransformValue;
  translate?: TransformValue;
  rotate?: TransformValue;
}

interface BaseTokenValue {
  type: string;
  description: string;
}

interface PatternTokenValue extends BaseTokenValue {
  value: TokenFormat;
}

interface StringTokenValue extends BaseTokenValue {
  value: string;
}

type TokenValue = PatternTokenValue | StringTokenValue;

interface TokenComponents {
  'card-enter': TokenValue
  'card-hover': TokenValue
  [key: string]: TokenValue
}

interface TokenVariant {
  patterns: Record<string, PatternTokenValue>
  components: TokenComponents
}

interface CoreTokenValue {
  duration?: string;
  delay?: string;
  easing?: string;
  opacityFrom?: string;
  opacityTo?: string;
  scaleFrom?: string;
  scaleTo?: string;
  translateFrom?: string;
  translateTo?: string;
  rotateFrom?: string;
  rotateTo?: string;
}

interface CoreTokens {
  'stagger-delay': {
    value: string | CoreTokenValue;
    type: string;
    description: string;
  }
  [key: string]: {
    value: string | CoreTokenValue;
    type: string;
    description: string;
  }
}

interface MotionTokenSet {
  core: CoreTokens
  teacher: TokenVariant
  pupil: TokenVariant
}

type VariantKey = Exclude<keyof MotionTokenSet, 'core'>;

const tokens = motionTokens as unknown as MotionTokenSet;

const defaultEntranceValue: EntranceValue = {
  type: 'bezier',
  duration: '300ms',
  delay: '0ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: { from: '0', to: '1' },
  scale: { from: '1', to: '1' },
  translate: { from: '0px', to: '0px' },
  rotate: { from: '0deg', to: '0deg' }
};

function isPatternTokenValue(token: TokenValue): token is PatternTokenValue {
  return typeof token.value === 'object' && token.value !== null && !Array.isArray(token.value);
}

// Helper to parse numeric values safely
function parseNumericValue(value: string | number | undefined, defaultValue: number): number {
  // If it's already a number, just validate it
  if (typeof value === 'number') {
    return isFinite(value) ? value : defaultValue;
  }
  
  // If it's undefined or null, return default
  if (value == null) {
    return defaultValue;
  }

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    // Remove any non-numeric characters except dots and minus signs
    const cleanValue = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleanValue);
    return isFinite(parsed) ? parsed : defaultValue;
  }

  // For any other type, return default
  return defaultValue;
}

// Helper to resolve pattern references
function resolvePattern(value: string, variant: TokenVariant): EntranceValue | undefined {
  if (!value || typeof value !== 'string') {
    console.warn('Invalid pattern reference:', value);
    return undefined;
  }

  // Handle pattern references
  if (value.startsWith('{patterns.')) {
    const patternName = value.slice(10, -1);
    const pattern = variant.patterns?.[patternName];
    
    if (!pattern) {
      console.warn(`Pattern not found: ${patternName}`);
      return undefined;
    }

    // If the pattern value is a string (another reference), resolve it recursively
    if (typeof pattern.value === 'string') {
      return resolvePattern(pattern.value, variant);
    }

    // Convert pattern value to EntranceValue format
    return {
      type: 'bezier',
      duration: pattern.value.duration || '300ms',
      delay: pattern.value.delay || '0ms',
      easing: pattern.value.easing || 'cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: {
        from: pattern.value.opacityFrom || '0',
        to: pattern.value.opacityTo || '1'
      },
      scale: {
        from: pattern.value.scaleFrom || '1',
        to: pattern.value.scaleTo || '1'
      },
      translate: {
        from: pattern.value.translateFrom || '0px',
        to: pattern.value.translateTo || '0px'
      },
      rotate: {
        from: pattern.value.rotateFrom || '0deg',
        to: pattern.value.rotateTo || '0deg'
      }
    };
  }

  // Handle core token references
  if (value.startsWith('{') && value.endsWith('}')) {
    const tokenName = value.slice(1, -1);
    const coreToken = tokens.core[tokenName];
    
    if (coreToken?.value && typeof coreToken.value === 'object') {
      const coreValue = coreToken.value as CoreTokenValue;
      return {
        type: 'bezier',
        duration: coreValue.duration || '300ms',
        delay: coreValue.delay || '0ms',
        easing: coreValue.easing || 'cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: {
          from: coreValue.opacityFrom || '0',
          to: coreValue.opacityTo || '1'
        },
        scale: {
          from: coreValue.scaleFrom || '1',
          to: coreValue.scaleTo || '1'
        },
        translate: {
          from: coreValue.translateFrom || '0px',
          to: coreValue.translateTo || '0px'
        },
        rotate: {
          from: coreValue.rotateFrom || '0deg',
          to: coreValue.rotateTo || '0deg'
        }
      };
    }
  }

  return undefined;
}

function getSpringEasing(value: TokenFormat): string {
  if (value.type !== 'spring' || !value.spring) {
    return 'cubic-bezier(0.4, 0, 0.2, 1)';
  }

  if (value.spring.type === 'time') {
    const duration = parseInt(value.spring.duration || '400ms');
    const bounce = value.spring.bounce || 0.2;
    return `spring(${duration}, ${bounce * 100})`;
  } else {
    const stiffness = value.spring.stiffness || 400;
    const damping = value.spring.damping || 30;
    const mass = value.spring.mass || 1;
    return `spring(${stiffness}, ${damping}, ${mass})`;
  }
}

export function useMotion(config: MotionConfig = {}, index: number = 0): MotionProps {
  const { currentSet } = useTokens();
  const result: MotionProps = {
    style: {},
  };

  const variantKey = (config.variant || currentSet || 'core').toLowerCase() as VariantKey;
  const variant = tokens[variantKey];

  if (config.entrance && variant?.components?.['card-enter']) {
    const cardEnterToken = variant.components['card-enter'];
    let entrance: EntranceValue = defaultEntranceValue;

    if (isPatternTokenValue(cardEnterToken)) {
      if (typeof cardEnterToken.value === 'string') {
        const resolvedPattern = resolvePattern(cardEnterToken.value, variant);
        if (resolvedPattern) {
          entrance = resolvedPattern;
        }
      } else {
        entrance = {
          type: cardEnterToken.value.type || 'bezier',
          duration: cardEnterToken.value.duration || '300ms',
          delay: cardEnterToken.value.delay || '0ms',
          easing: cardEnterToken.value.type === 'spring' 
            ? getSpringEasing(cardEnterToken.value)
            : cardEnterToken.value.easing || 'cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: {
            from: cardEnterToken.value.opacityFrom || '0',
            to: cardEnterToken.value.opacityTo || '1'
          },
          scale: {
            from: cardEnterToken.value.scaleFrom || '1',
            to: cardEnterToken.value.scaleTo || '1'
          },
          translate: {
            from: cardEnterToken.value.translateFrom || '0px',
            to: cardEnterToken.value.translateTo || '0px'
          },
          rotate: {
            from: cardEnterToken.value.rotateFrom || '0deg',
            to: cardEnterToken.value.rotateTo || '0deg'
          }
        };
      }
    }

    // Transform the entrance values into the format React expects
    const initial: Record<string, any> = {};
    const animate: Record<string, any> = {};
    const transition: Record<string, any> = {};

    // Handle opacity
    initial.opacity = parseNumericValue(entrance.opacity?.from || '0', 0);
    animate.opacity = parseNumericValue(entrance.opacity?.to || '1', 1);

    // Handle scale
    initial.scale = parseNumericValue(entrance.scale?.from || '1', 1);
    animate.scale = parseNumericValue(entrance.scale?.to || '1', 1);

    // Handle translate
    const translateFrom = entrance.translate?.from.split(' ') || ['0px', '0px'];
    const translateTo = entrance.translate?.to.split(' ') || ['0px', '0px'];
    initial.x = parseNumericValue(translateFrom[0], 0);
    initial.y = parseNumericValue(translateFrom[1] || '0px', 0);
    animate.x = parseNumericValue(translateTo[0], 0);
    animate.y = parseNumericValue(translateTo[1] || '0px', 0);

    // Handle rotate
    initial.rotate = parseNumericValue(entrance.rotate?.from || '0deg', 0);
    animate.rotate = parseNumericValue(entrance.rotate?.to || '0deg', 0);

    // Set up transition
    transition.duration = parseNumericValue(entrance.duration, 300) / 1000;
    transition.ease = entrance.easing;
    const staggerDelay = typeof tokens.core['stagger-delay']?.value === 'string' 
      ? tokens.core['stagger-delay']?.value 
      : '50ms';
    transition.delay = parseNumericValue(entrance.delay, 0) / 1000 + 
      (config.stagger ? index * parseNumericValue(staggerDelay, 50) / 1000 : 0);

    result.initial = initial;
    result.animate = animate;
    result.transition = transition;
  }

  if (config.hover && variant?.components?.['card-hover']) {
    const hoverToken = variant.components['card-hover'];
    let hoverValue: EntranceValue = defaultEntranceValue;

    if (isPatternTokenValue(hoverToken)) {
      if (typeof hoverToken.value === 'string') {
        const resolvedPattern = resolvePattern(hoverToken.value, variant);
        if (resolvedPattern) {
          hoverValue = resolvedPattern;
        }
      } else {
        hoverValue = {
          type: 'bezier',
          duration: hoverToken.value.duration || '300ms',
          delay: hoverToken.value.delay || '0ms',
          easing: hoverToken.value.easing || 'cubic-bezier(0.4, 0, 0.2, 1)',
          scale: {
            from: hoverToken.value.scaleFrom || '1',
            to: hoverToken.value.scaleTo || '1'
          },
          rotate: {
            from: hoverToken.value.rotateFrom || '0deg',
            to: hoverToken.value.rotateTo || '0deg'
          }
        };
      }
    }

    const whileHover: Record<string, any> = {};

    if (hoverValue.scale) {
      whileHover.scale = parseNumericValue(hoverValue.scale.to, 1);
    }

    if (hoverValue.rotate) {
      whileHover.rotate = parseNumericValue(hoverValue.rotate.to, 0);
    }

    result.whileHover = {
      ...whileHover,
      transition: {
        duration: parseNumericValue(hoverValue.duration, 300) / 1000,
        ease: parseBezierString(hoverValue.easing)
      }
    };
  }

  return result;
} 