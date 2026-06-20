import { useTokens } from "./motion/useTokens";
import { useEffect, useRef, useState } from "react";
import { animate, AnimationControls } from "motion";
import { motionTokens } from '../tokens/generated/motion.generated';
import { resolveTokenReference } from "../utils/resolveTokenReference";

interface BookCardProps {
  cover: string;
  title: string;
  description: string;
  index: number;
  motion?: {
    animate?: {
      scale?: number;
      rotate?: number;
      y?: number;
      transition?: {
        duration?: number;
        ease?: string;
        type?: "spring";
        bounce?: number;
        stiffness?: number;
        damping?: number;
        mass?: number;
      };
    };
    initial?: {
      scale?: number;
      rotate?: number;
      y?: number;
    };
    entrance?: boolean;
  };
  style?: React.CSSProperties;
  variant?: 'aeroglobal' | 'branda';
  shouldAnimate?: boolean;
  previewToken?: string;
  autoHighlight?: boolean;
}

const getVariantStyles = (variant: 'aeroglobal' | 'branda') => {
  switch (variant) {
    case 'aeroglobal':
      return {
        title: {
          color: 'var(--color-primary)',
          fontSize: '1.2em',
          fontWeight: '600',
          letterSpacing: '-0.01em',
          position: 'relative' as const,
        },
        description: {
          color: 'var(--color-Neutral)',
          fontWeight: '500',
          position: 'relative' as const,
        },
        image: {
          borderRadius: 'var(--border-radius-default)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)',
          position: 'relative' as const,
        }
      };

    case 'branda':
      return {
        title: {
          color: 'var(--color-text)',
          fontSize: '1.2em',
          fontWeight: '600',
          letterSpacing: '-0.01em',
          position: 'relative' as const,
        },
        description: {
          color: 'var(--color-text-secondary)',
          fontWeight: '500',
          position: 'relative' as const,
        },
        image: {
          borderRadius: 'var(--border-radius-default)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)',
          position: 'relative' as const,
        }
      };
  }
};

// Helper function to parse numeric values from token strings with NaN handling
const parseValue = (value?: string | number, defaultValue: number = 1): number => {
  if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
  if (!value) return defaultValue;
  
  const resolvedValue = resolveTokenReference(value);
  if (!resolvedValue) return defaultValue;
  
  const numericMatch = resolvedValue.match(/-?\d*\.?\d+/);
  const parsedValue = numericMatch ? parseFloat(numericMatch[0]) : defaultValue;
  return isNaN(parsedValue) ? defaultValue : parsedValue;
};

// Helper function to create easing function from cubic bezier values
const createEasing = (_x1: number, y1: number, _x2: number, y2: number) => {
  return (t: number) => {
    // Cubic Bezier curve calculation for y-coordinate only
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    const t3 = t * t * t;
    const t2 = t * t;

    return ay * t3 + by * t2 + cy * t;
  };
};

// Default easing function
const defaultEasing = createEasing(0.4, 0, 0.2, 1);

const MOBILE_MOTION_QUERY = "(max-width: 640px), (hover: none) and (pointer: coarse)";
const MOBILE_SCALE_DAMPING = 0.28;
const MOBILE_ROTATE_DAMPING = 0.35;

function useMobileTouchMotion() {
  const [isMobileTouch, setIsMobileTouch] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MOBILE_MOTION_QUERY).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MOTION_QUERY);
    const sync = () => setIsMobileTouch(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isMobileTouch;
}

function dampenScale(scale: number, isMobileTouch: boolean) {
  if (!isMobileTouch || scale <= 1) return scale;
  return 1 + (scale - 1) * MOBILE_SCALE_DAMPING;
}

function dampenRotate(rotate: number, isMobileTouch: boolean) {
  if (!isMobileTouch || rotate === 0) return rotate;
  return rotate * MOBILE_ROTATE_DAMPING;
}

function getEntranceStart(
  tokenMotion: {
    scaleFrom?: string;
    opacityFrom?: string;
    translateFrom?: string;
    rotateFrom?: string;
    rotateTo?: string;
  },
  isMobileTouch: boolean
) {
  const scaleFrom = parseValue(tokenMotion.scaleFrom, 1);
  const opacityFrom = parseValue(tokenMotion.opacityFrom, 1);
  const translateFrom = parseValue(tokenMotion.translateFrom, 0);
  const rotateFrom = parseValue(tokenMotion.rotateFrom, 0);
  const rotateTo = parseValue(tokenMotion.rotateTo, 0);

  const needsDerivedStart =
    opacityFrom >= 0.999 &&
    scaleFrom >= 0.999 &&
    Math.abs(translateFrom) < 0.5 &&
    Math.abs(rotateFrom) < 0.5;

  if (needsDerivedStart) {
    return {
      scale: 0.92,
      opacity: 0,
      y: isMobileTouch ? 12 : 16,
      rotate: dampenRotate(-rotateTo * 0.35, isMobileTouch),
    };
  }

  return {
    scale: scaleFrom,
    opacity: opacityFrom,
    y: translateFrom,
    rotate: rotateFrom,
  };
}

// Helper function to parse cubic-bezier values
const parseEasing = (easing?: string) => {
  if (!easing) return undefined;
  
  const resolvedEasing = resolveTokenReference(easing);
  if (!resolvedEasing) return undefined;
  
  const match = resolvedEasing.match(/cubic-bezier\(([\d.-]+),\s*([\d.-]+),\s*([\d.-]+),\s*([\d.-]+)\)/);
  if (!match) return undefined;
  
  return createEasing(
    parseFloat(match[1]),
    parseFloat(match[2]),
    parseFloat(match[3]),
    parseFloat(match[4])
  );
};

export const BookCard = ({
  cover,
  title,
  description,
  style,
  variant = 'aeroglobal',
  index = 0,
  shouldAnimate = true,
  previewToken,
  motion: motionProp,
  autoHighlight = false
}: BookCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { shouldAnimate: globalShouldAnimate = true, sequence } = useTokens();
  const styles = getVariantStyles(variant);
  const currentAnimation = useRef<AnimationControls | null>(null);
  const motionTokenSet = motionTokens[variant];
  const [isHovered, setIsHovered] = useState(false);
  const isMobileTouch = useMobileTouchMotion();
  const effectiveHovered = isHovered || autoHighlight;
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const animationTimeoutRef = useRef<NodeJS.Timeout>();
  const hasStartedAnimation = useRef(false);

  // Get the appropriate token based on context
  const getAnimationToken = () => {
    // If we have real-time motion values from the editor, use those
    if (motionProp?.animate) {
      const isEntranceAnimation = isInitialRender && !hasStartedAnimation.current && !motionProp.entrance;
      return {
        type: motionProp.animate.transition?.type === "spring" ? "spring" : "bezier",
        duration: `${(motionProp.animate.transition?.duration || 0.3) * 1000}ms`,
        delay: "0px",
        easing: motionProp.animate.transition?.ease || "cubic-bezier(0.4, 0, 0.2, 1)",
        opacityFrom: isEntranceAnimation ? "0" : "1",
        opacityTo: "1",
        scaleFrom: motionProp.initial?.scale?.toString() || "1",
        scaleTo: motionProp.animate.scale?.toString() || "1",
        rotateFrom: `${motionProp.initial?.rotate || 0}deg`,
        rotateTo: `${motionProp.animate.rotate || 0}deg`,
        translateFrom: `${motionProp.initial?.y || 0}px`,
        translateTo: `${motionProp.animate.y || 0}px`,
        ...(motionProp.animate.transition?.type === "spring" && {
          stiffness: motionProp.animate.transition.stiffness,
          damping: motionProp.animate.transition.damping,
          mass: motionProp.animate.transition.mass,
          velocity: 0
        })
      };
    }
    
    // Otherwise use token-based animation
    if (previewToken) {
      // In token generator preview, use the selected token for both entrance and hover
      const [section, tokenName] = previewToken.split('.');
      const tokenValue = motionTokenSet?.[section as keyof typeof motionTokenSet]?.[tokenName]?.value;
      if (tokenValue) {
        const isEntranceAnimation = isInitialRender && !hasStartedAnimation.current && !motionProp?.entrance;
        return {
          ...tokenValue,
          opacityFrom: isEntranceAnimation ? "0" : "1"
        };
      }
      return tokenValue;
    }

    // During entrance, always use enter tokens — not hover/auto-highlight
    if (!hasEnteredView) {
      const enterToken = motionTokenSet?.components?.['card-enter']?.value
        ?? motionTokenSet?.patterns?.['card-enter']?.value;
      if (enterToken) {
        return {
          ...enterToken,
          opacityFrom: isInitialRender && !hasStartedAnimation.current ? "0" : "1",
        };
      }
    }

    // In normal usage, try to find the token in both patterns and components
    if (effectiveHovered) {
      // First try the components section
      const hoverToken = motionTokenSet?.components?.['card-hover']?.value;
      if (hoverToken) return hoverToken;

      // Then try the patterns section
      const patternToken = motionTokenSet?.patterns?.['card-hover']?.value;
      if (patternToken) return patternToken;
    } else {
      // First try the components section
      const enterToken = motionTokenSet?.components?.['card-enter']?.value;
      if (enterToken) return enterToken;

      // Then try the patterns section
      const patternToken = motionTokenSet?.patterns?.['card-enter']?.value;
      if (patternToken) return patternToken;
    }

    // Return default token if none found
    return {
      type: "bezier",
      duration: "300ms",
      delay: "0px",
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      opacityFrom: "1",
      opacityTo: "1",
      scaleFrom: "1",
      scaleTo: effectiveHovered ? "1.05" : "1",
      rotateFrom: "0deg",
      rotateTo: "0deg",
      translateFrom: "0px",
      translateTo: "0px"
    };
  };

  // Reset animation state when theme changes or entrance prop changes
  useEffect(() => {
    setIsInitialRender(true);
    setHasEnteredView(false);
    hasStartedAnimation.current = false;
    cleanup();
  }, [sequence, motionProp?.entrance]);

  // Use both local and global shouldAnimate
  const isAnimationEnabled = shouldAnimate && globalShouldAnimate;

  // Cleanup function for all timeouts
  const cleanup = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    if (currentAnimation.current) {
      currentAnimation.current.stop();
      currentAnimation.current = null;
    }
  };

  // Animation effect
  useEffect(() => {
    const element = ref.current;
    if (!element || !isAnimationEnabled) return;

    try {
      // Get the appropriate token
      const tokenMotion = getAnimationToken();
      if (!tokenMotion) {
        console.warn(`No animation token found for card ${index}`);
        return;
      }

      // Stop any existing animation
      if (currentAnimation.current) {
        currentAnimation.current.stop();
        currentAnimation.current = null;
      }

      // Parse duration and easing
      const duration = parseValue(tokenMotion.duration, 300);
      const easing = parseEasing(tokenMotion.easing) ?? defaultEasing;

      // Get animation values
      const scaleFrom = dampenScale(parseValue(tokenMotion.scaleFrom, 1), isMobileTouch);
      const scaleTo = dampenScale(parseValue(tokenMotion.scaleTo, 1), isMobileTouch);
      const rotateFrom = dampenRotate(parseValue(tokenMotion.rotateFrom, 0), isMobileTouch);
      const rotateTo = dampenRotate(parseValue(tokenMotion.rotateTo, 0), isMobileTouch);
      const translateFrom = parseValue(tokenMotion.translateFrom, 0);
      const translateTo = parseValue(tokenMotion.translateTo, 0);

      // Set initial state for entrance animation
      if (isInitialRender && !hasStartedAnimation.current) {
        hasStartedAnimation.current = true;

        const start = getEntranceStart(tokenMotion, isMobileTouch);
        const staggerDelay = index * 60;
        animationTimeoutRef.current = setTimeout(() => {
          element.style.transform = `scale(${start.scale}) rotate(${start.rotate}deg) translateY(${start.y}px)`;
          element.style.opacity = String(start.opacity);

          element.offsetHeight;

          currentAnimation.current = animate(
            element,
            {
              scale: 1,
              rotate: 0,
              y: 0,
              opacity: parseValue(tokenMotion.opacityTo, 1),
            },
            {
              duration: duration / 1000,
              easing,
            }
          );

          animationTimeoutRef.current = setTimeout(() => {
            element.style.transform = "scale(1) rotate(0deg) translateY(0px)";
            element.style.opacity = String(parseValue(tokenMotion.opacityTo, 1));
            setHasEnteredView(true);
            setIsInitialRender(false);
          }, duration);
        }, staggerDelay);
      } else if ((hasEnteredView && effectiveHovered) || motionProp?.animate) {
        // Hover animation or real-time preview
        currentAnimation.current = animate(
          element,
          {
            scale: effectiveHovered ? scaleTo : scaleFrom,
            rotate: effectiveHovered ? rotateTo : rotateFrom,
            y: effectiveHovered ? translateTo : translateFrom,
            opacity: effectiveHovered ? tokenMotion.opacityTo : tokenMotion.opacityFrom
          },
          {
            duration: duration / 1000,
            easing
          }
        );
      }
    } catch (error) {
      console.error('Animation error:', error);
    }

    return cleanup;
  }, [effectiveHovered, isAnimationEnabled, hasEnteredView, isInitialRender, motionTokenSet, variant, index, previewToken, motionProp, isMobileTouch]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={() => setIsHovered(true)}
      onPointerUp={() => setIsHovered(false)}
      onPointerCancel={() => setIsHovered(false)}
      style={{
        padding: "0.75rem",
        width: "100%",
        maxWidth: "220px",
        justifySelf: "center",
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--border-radius-default)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 8px var(--color-shadow)',
        willChange: 'transform',
        ...style,
      }}
    >
      <div style={{
        width: "100%",
        aspectRatio: "2 / 3",
        marginBottom: "1rem",
        overflow: "hidden",
        borderRadius: styles.image.borderRadius,
        border: styles.image.border,
        background: styles.image.background,
      }}>
        <img
          src={cover}
          alt={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </div>
      <h3 style={styles.title}>{title}</h3>
      <p style={{ ...styles.description, fontSize: "13px", lineHeight: 1.45 }}>{description}</p>
    </div>
  );
};
