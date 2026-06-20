import { useEffect, useState, useRef } from "react";
import { BezierPreview } from "./BezierPreview";
import { SpringPreview } from "./SpringPreview";
import { useTokens } from "./motion/useTokens";
import { TokenValue, AnimationPattern } from '../tokens/generated/motion.generated';
import { resolveTokenReference } from "../utils/resolveTokenReference";
import { BookCard } from "./BookCard";

// Import all cover images
import aeroglobalCover1 from "../assets/aeroglobal/Cover_1.jpeg";
import brandaCover1 from "../assets/branda/Cover_1.jpeg";

// Create cover maps
const aeroglobalCover = aeroglobalCover1;
const brandaCover = brandaCover1;

interface TokenOption {
  name: string;
  path: string;
  value: {
    value: TokenValue;
    type: string;
    description: string;
  };
  type: "core" | "variant";
  category?: TokenCategory;
  description?: string;
}

type TokenCategory = "entrance" | "hover" | "click" | "focus" | "spring" | "bezier";

// Add API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function TokenGenerator({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { tokens, updateTokens, currentSet, shouldAnimate } = useTokens();
  const [currentBezier, setCurrentBezier] = useState<
    [number, number, number, number]
  >([0.4, 0, 0.2, 1]);
  const [selectedToken, setSelectedToken] = useState<TokenOption | null>(null);
  const [bezierOptions, setBezierOptions] = useState<TokenOption[]>([]);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "building" | "success" | "error"
  >("idle");
  const initialTokenPathRef = useRef<string | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const buildTimeoutRef = useRef<NodeJS.Timeout>();
  const [animationType, setAnimationType] = useState<"ease" | "spring">("ease");
  const [springType, setSpringType] = useState<"time" | "physics">("time");
  const [springValues, setSpringValues] = useState({
    duration: 0.4,
    bounce: 0.2,
    stiffness: 400,
    damping: 30,
    mass: 1,
    delay: 0,
  });

  const [scaleValues, setScaleValues] = useState({
    from: "1",
    to: "1"
  });

  const [rotateValues, setRotateValues] = useState({
    from: "0deg",
    to: "0deg"
  });

  const [translateValues, setTranslateValues] = useState({
    from: "0px",
    to: "0px"
  });

  const [previewKey, setPreviewKey] = useState(0);
  const [shouldPlayAnimation, setShouldPlayAnimation] = useState(false);

  // Add state for original values
  const [originalValues, setOriginalValues] = useState<{
    scale: typeof scaleValues;
    rotate: typeof rotateValues;
    translate: typeof translateValues;
    animationType: "ease" | "spring";
    springValues: typeof springValues;
    bezier: [number, number, number, number];
  } | null>(null);

  // Handle closing the editor
  const handleClose = () => {
    // Clean up URL parameters and trigger the onClose callback
    window.history.replaceState({}, "", window.location.pathname);
    onClose();
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    // On first mount, load state from URL or localStorage
    const params = new URLSearchParams(window.location.search);
    const tokenSet = params.get("tokenSet");
    const tokenPath = params.get("token");
    const savedPath = localStorage.getItem('selectedTokenPath');

    if (tokenSet) {
      initialTokenPathRef.current = tokenPath;
    }
    if (tokenPath) {
      initialTokenPathRef.current = tokenPath;
      localStorage.setItem('selectedTokenPath', tokenPath);
    } else if (savedPath) {
      initialTokenPathRef.current = savedPath;
    }
  }, []); // Only run on mount

  useEffect(() => {
    // Add effect to save selected token path
    if (selectedToken?.path) {
      localStorage.setItem('selectedTokenPath', selectedToken.path);
    }
  }, [selectedToken?.path]);

  useEffect(() => {
    // When token set changes, find available types first
    const types = new Set<TokenCategory>();
    const currentTokens = tokens[currentSet];

    // Process patterns
    if (currentTokens.patterns) {
      Object.entries(currentTokens.patterns).forEach(([key]) => {
        if (key.toLowerCase().includes("hover")) types.add("hover");
        else if (key.toLowerCase().includes("click")) types.add("click");
        else if (key.toLowerCase().includes("focus")) types.add("focus");
        else types.add("entrance");
      });
    }

    // Process components
    if (currentTokens.components) {
      Object.entries(currentTokens.components).forEach(([key]) => {
        if (key.toLowerCase().includes("hover")) types.add("hover");
        else if (key.toLowerCase().includes("click")) types.add("click");
        else if (key.toLowerCase().includes("focus")) types.add("focus");
        else types.add("entrance");
      });
    }

    // If current selected type isn't available, we don't need to do anything
    // since the theme is controlled by the toolbar now
  }, [currentSet, tokens]);

  // Separate effect for loading tokens based on selection
  useEffect(() => {
    if (tokens && tokens[currentSet]) {
      loadTokens();
    }
  }, [currentSet, tokens]);

  useEffect(() => {
    if (selectedToken && typeof selectedToken.value === "object") {
      const tokenValue = selectedToken.value.value;
      
      // Set animation type based on token type
      setAnimationType(tokenValue.type === "spring" ? "spring" : "ease");
      
      // Load bezier values if present
      if (tokenValue.easing) {
        setCurrentBezier(parseBezierString(tokenValue.easing));
      }
      
      // Load spring values if it's a spring animation
      if (tokenValue.type === "spring") {
        setSpringValues({
          duration: tokenValue.duration ? parseFloat(tokenValue.duration) / 1000 : 0.4,
          bounce: 0.2, // Default bounce value since it's not in the token
          stiffness: tokenValue.stiffness || 400,
          damping: tokenValue.damping || 30,
          mass: tokenValue.mass || 1,
          delay: tokenValue.delay ? parseFloat(tokenValue.delay) / 1000 : 0,
        });
      }
      
      // Load transform values with proper unit handling
      setScaleValues({
        from: tokenValue.scaleFrom || "1",
        to: tokenValue.scaleTo || "1"
      });
      
      setRotateValues({
        from: tokenValue.rotateFrom || "0deg",
        to: tokenValue.rotateTo || "0deg"
      });
      
      setTranslateValues({
        from: tokenValue.translateFrom || "0px",
        to: tokenValue.translateTo || "0px"
      });
    }
  }, [selectedToken]);

  // Add effect to handle theme changes
  useEffect(() => {
    if (selectedToken) {
      // Re-trigger the token loading when theme changes
      const tokenValue = selectedToken.value.value;
      setScaleValues({
        from: tokenValue.scaleFrom || "1",
        to: tokenValue.scaleTo || "1"
      });
      setRotateValues({
        from: tokenValue.rotateFrom || "0deg",
        to: tokenValue.rotateTo || "0deg"
      });
      setTranslateValues({
        from: tokenValue.translateFrom || "0px",
        to: tokenValue.translateTo || "0px"
      });
    }
  }, [currentSet]);

  const parseBezierString = (
    value: string | undefined,
  ): [number, number, number, number] => {
    if (!value || typeof value !== "string") {
      return [0.4, 0, 0.2, 1]; // Default bezier curve
    }

    const matches = value.match(
      /cubic-bezier\(([\d.-]+),\s*([\d.-]+),\s*([\d.-]+),\s*([\d.-]+)\)/,
    );
    if (matches) {
      return [
        parseFloat(matches[1]),
        parseFloat(matches[2]),
        parseFloat(matches[3]),
        parseFloat(matches[4]),
      ];
    }
    return [0.4, 0, 0.2, 1]; // Default bezier curve if no match
  };

  const loadTokens = () => {
    const options: TokenOption[] = [];
    const currentTokens = tokens[currentSet];
    console.log('Loading tokens for set:', currentSet, currentTokens);
    
    // Try to get the path from localStorage first, then fallback to ref
    const savedPath = localStorage.getItem('selectedTokenPath');
    const pathToRestore = savedPath || initialTokenPathRef.current || selectedToken?.path;

    // Helper function to process tokens
    const processTokens = (section: 'patterns' | 'components', tokens: Record<string, AnimationPattern>) => {
      if (!tokens) {
        console.warn(`No tokens found for section: ${section}`);
        return;
      }
      Object.entries(tokens).forEach(([key, value]) => {
        console.log(`Processing token: ${section}.${key}`, value);
        const category = key.toLowerCase().includes("hover")
          ? "hover"
          : key.toLowerCase().includes("click")
            ? "click"
            : key.toLowerCase().includes("focus")
              ? "focus"
              : "entrance";

        options.push({
          name: key,
          path: `${section}.${key}`,
          value: value,
          type: "variant",
          category,
        });
      });
    };

    // Handle patterns and components
    if (currentTokens?.patterns) {
      processTokens('patterns', currentTokens.patterns);
    }
    if (currentTokens?.components) {
      processTokens('components', currentTokens.components);
    }

    console.log('Final token options:', options);
    setBezierOptions(options);

    if (pathToRestore) {
      console.log('Attempting to restore path:', pathToRestore);
      const tokenToRestore = options.find(token => token.path === pathToRestore);
      if (tokenToRestore) {
        console.log('Found token to restore:', tokenToRestore);
        setSelectedToken(tokenToRestore);
        handleTokenSelect(tokenToRestore);
        return;
      }
    }

    // Only select first token if no token is currently selected AND no path to restore
    if (!selectedToken && !pathToRestore && options.length > 0) {
      setSelectedToken(options[0]);
      handleTokenSelect(options[0]);
      localStorage.setItem('selectedTokenPath', options[0].path);
    }
  };

  const handleTokenSelect = (token: TokenOption) => {
    setSelectedToken(token);
    
    if (!token.value || !token.value.value) {
      console.warn('Token value is undefined:', token);
      // Set default values
      const defaultValues = {
        scale: { from: "1", to: "1" },
        rotate: { from: "0deg", to: "0deg" },
        translate: { from: "0px", to: "0px" },
        animationType: "ease" as const,
        springValues: {
          duration: 0.4,
          bounce: 0.2,
          stiffness: 400,
          damping: 30,
          mass: 1,
          delay: 0,
        },
        bezier: [0.4, 0, 0.2, 1] as [number, number, number, number]
      };
      
      setOriginalValues(defaultValues);
      setScaleValues(defaultValues.scale);
      setRotateValues(defaultValues.rotate);
      setTranslateValues(defaultValues.translate);
      setAnimationType(defaultValues.animationType);
      setSpringValues(defaultValues.springValues);
      setCurrentBezier(defaultValues.bezier);
      setPreviewKey(Date.now());
      return;
    }
    
    const tokenValue = token.value.value;
    console.log('Selected token:', token.name, tokenValue);
    
    // Parse numeric values and handle units
    const parseValue = (value: string | undefined, defaultValue: string, unit: string = '') => {
      console.log('Parsing value:', value, 'default:', defaultValue);
      const resolved = resolveTokenReference(value);
      console.log('Resolved value:', resolved);
      
      if (!resolved) return defaultValue;
      
      // Extract numeric value, preserving decimals and handling negative values
      const numericMatch = resolved.match(/^-?\d*\.?\d+/);
      const numeric = numericMatch ? numericMatch[0] : defaultValue;
      console.log('Final numeric value:', numeric);
      return numeric + unit;
    };
    
    // Store original values when selecting a new token
    const originalVals = {
      scale: {
        from: parseValue(tokenValue.scaleFrom, "1"),
        to: parseValue(tokenValue.scaleTo, "1")
      },
      rotate: {
        from: parseValue(tokenValue.rotateFrom, "0", "deg"),
        to: parseValue(tokenValue.rotateTo, "0", "deg")
      },
      translate: {
        from: parseValue(tokenValue.translateFrom, "0", "px"),
        to: parseValue(tokenValue.translateTo, "0", "px")
      },
      animationType: tokenValue.type === "spring" ? "spring" as const : "ease" as const,
      springValues: {
        duration: parseFloat(parseValue(tokenValue.duration, "300")) / 1000,
        bounce: 0.2,
        stiffness: tokenValue.stiffness || 400,
        damping: tokenValue.damping || 30,
        mass: tokenValue.mass || 1,
        delay: parseFloat(parseValue(tokenValue.delay, "0")) / 1000,
      },
      bezier: tokenValue.easing ? parseBezierString(resolveTokenReference(tokenValue.easing)) : [0.4, 0, 0.2, 1] as [number, number, number, number]
    };
    
    console.log('Original values:', originalVals);
    setOriginalValues(originalVals);
    
    // Set current values
    setScaleValues(originalVals.scale);
    setRotateValues(originalVals.rotate);
    setTranslateValues(originalVals.translate);
    setAnimationType(originalVals.animationType);
    
    if (originalVals.animationType === "spring") {
      setSpringValues(originalVals.springValues);
    } else {
      setCurrentBezier(originalVals.bezier);
    }
    
    // Force preview update
    setPreviewKey(Date.now());
  };

  const mapToTokenOrRaw = (value: string, type: 'scale' | 'rotate' | 'translate') => {
    // If it's already a token reference (e.g. "{up-medium}"), return it as is
    if (value.startsWith('{') && value.endsWith('}')) {
      return value;
    }

    // Remove units and parse to number
    const numericValue = parseFloat(value.replace(/px|deg/g, ''));
    
    // If parsing failed or resulted in NaN, use default values
    if (isNaN(numericValue)) {
      switch (type) {
        case 'scale':
          return "1";
        case 'rotate':
          return "0deg";
        case 'translate':
          return "0px";
      }
    }

    // Only map to tokens if there's an EXACT match
    switch (type) {
      case 'scale': {
        // Exact matches for scale values from Core.json
        switch (numericValue) {
          case 1: return "{base}";
          case 0.8: return "{down-large}";
          case 0.9: return "{down-medium}";
          case 0.95: return "{down-small}";
          case 1.05: return "{up-small}";
          case 1.1: return "{up-medium}";
          case 1.2: return "{up-large}";
          case 1.5: return "{up-huge}";
          default: return numericValue.toString(); // Keep exact value if no match
        }
      }
      case 'rotate': {
        // Exact matches for rotation values from Core.json
        switch (numericValue) {
          case 0: return "{rotate-none}";
          case 5: return "{rotate-small}";
          case 10: return "{rotate-medium}";
          default: return `${numericValue}deg`; // Keep exact value if no match
        }
      }
      case 'translate': {
        // Exact matches for translation values from Core.json
        switch (numericValue) {
          case 0: return "{none}";
          case 4: return "{tiny}";
          case 8: return "{small}";
          case 16: return "{medium}";
          case 32: return "{large}";
          default: return `${numericValue}px`; // Keep exact value if no match
        }
      }
    }
  };

  const handleSave = async () => {
    if (!selectedToken) return;

    try {
      setSaveStatus("saving");
      if (saveButtonRef.current) {
        saveButtonRef.current.textContent = "Saving...";
        saveButtonRef.current.disabled = true;
      }

      // Store the current token path
      const pathToRestore = selectedToken.path;
      const [section, name] = pathToRestore.split('.');
      localStorage.setItem('selectedTokenPath', pathToRestore);

      // Create token value with exact values from inputs
      const tokenValue: TokenValue = {
        type: animationType === "ease" ? "bezier" : "spring",
        duration: "{moderate}",
        delay: "{none}",
        easing: "{standard}",
        opacityFrom: selectedToken.value.value.opacityFrom || "1",
        opacityTo: selectedToken.value.value.opacityTo || "1",
        scaleFrom: mapToTokenOrRaw(scaleValues.from, 'scale'),
        scaleTo: mapToTokenOrRaw(scaleValues.to, 'scale'),
        rotateFrom: mapToTokenOrRaw(rotateValues.from, 'rotate'),
        rotateTo: mapToTokenOrRaw(rotateValues.to, 'rotate'),
        translateFrom: mapToTokenOrRaw(translateValues.from, 'translate'),
        translateTo: mapToTokenOrRaw(translateValues.to, 'translate'),
        ...(animationType === "spring" && {
          stiffness: springValues.stiffness,
          damping: springValues.damping,
          mass: springValues.mass,
          velocity: 0
        })
      };

      // Save token using the existing endpoint
      const response = await fetch(`${API_URL}/save-token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          tokenSet: currentSet,
          tokenPath: selectedToken.path,
          value: tokenValue,
          type: selectedToken.type
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to save token');
      }

      // Update the in-memory tokens immediately
      if (result.tokens) {
        // Create updated tokens structure
        const updatedTokens = {
          ...tokens,
          [currentSet]: {
            ...tokens[currentSet],
            [section]: {
              ...tokens[currentSet][section as keyof typeof tokens[typeof currentSet]],
              [name]: {
                value: tokenValue,
                type: selectedToken.type
              }
            }
          }
        };

        // Update context with new tokens
        await updateTokens(updatedTokens);

        // Update the bezierOptions list with the new token
        const updatedOptions = bezierOptions.map(option => {
          if (option.path === pathToRestore) {
            return {
              ...option,
              value: {
                value: tokenValue,
                type: selectedToken.type,
                description: selectedToken.value.description
              }
            };
          }
          return option;
        });

        setBezierOptions(updatedOptions);
      }

      setSaveStatus("success");
      if (saveButtonRef.current) {
        saveButtonRef.current.textContent = "Saved!";
        saveButtonRef.current.disabled = false;
      }

      // Reset status after a delay
      setTimeout(() => {
        setSaveStatus("idle");
        if (saveButtonRef.current) {
          saveButtonRef.current.textContent = "Save Token";
        }
      }, 2000);
      
    } catch (error: any) {
      console.error("Error saving token:", error);
      setSaveStatus("error");
      if (saveButtonRef.current) {
        saveButtonRef.current.textContent = "Save Failed";
        saveButtonRef.current.disabled = false;
      }
      // Show error in UI
      alert(`Failed to save token: ${error.message}`);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (buildTimeoutRef.current) {
        clearTimeout(buildTimeoutRef.current);
      }
    };
  }, []);


  const handleBezierChange = (newBezier: [number, number, number, number]) => {
    if (!selectedToken) return;
    
    const tokenValue: TokenOption['value'] = {
      value: {
        ...selectedToken.value.value,  // Spread existing values
        easing: `cubic-bezier(${newBezier.join(", ")})`,
      },
      type: selectedToken.value.type,
      description: selectedToken.value.description
    };

    setSelectedToken({ ...selectedToken, value: tokenValue });
    setCurrentBezier(newBezier);
  };

  const handleSpringChange = (values: {
    duration: number;
    bounce: number;
    stiffness: number;
    damping: number;
    mass: number;
    delay: number;
  }) => {
    setSpringValues(values);
  };

  useEffect(() => {
    console.log('Preview values updated:', {
      scale: scaleValues,
      rotate: rotateValues,
      translate: translateValues,
      previewKey
    });
  }, [scaleValues, rotateValues, translateValues, previewKey]);

  if (!isOpen) return null;

  return (
    <div className="token-generator">
      <div className="token-editor" style={{
        background: "var(--color-bg-secondary)",
        borderRadius: "var(--border-radius-default)",
        border: "1px solid var(--color-border)",
        padding: "clamp(16px, 3vw, 2rem)",
      }}>
        <div style={{ display: "flex", gap: "2rem" }}>
          {/* First column: Token list */}
          <div
            style={{
              width: "300px",
              background: "var(--color-bg-secondary)",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              padding: "1rem",
            }}
          >
            <h4
              style={{
                fontSize: "14px",
                color: "var(--color-Neutral)",
                marginBottom: "12px",
              }}
            >
              Existing Tokens
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {bezierOptions.map((token) => (
                <button
                  key={token.path}
                  onClick={() => handleTokenSelect(token)}
                  className={`token-item ${selectedToken?.path === token.path ? 'active' : ''}`}
                  style={{
                    padding: "12px",
                    background: "var(--color-bg-secondary)",
                    borderRadius: "var(--border-radius-default)",
                    cursor: "pointer",
                    border: `1px solid ${selectedToken?.path === token.path ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    transition: "all 0.2s ease",
                    textAlign: "left",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    position: "relative",
                    minHeight: "64px",
                  }}
                >
                  <div
                    style={{ 
                      fontSize: "14px", 
                      color: "var(--color-Neutral)",
                      fontWeight: selectedToken?.path === token.path ? "500" : "normal"
                    }}
                  >
                    {token.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontFamily: "monospace",
                      color: "var(--color-primary)",
                    }}
                  >
                    {typeof token.value === "string"
                      ? token.value
                      : token.value?.value?.easing || "cubic-bezier(0.4, 0, 0.2, 1)"}
                  </div>
                  {selectedToken?.path === token.path && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "3px",
                        background: "var(--color-primary)",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Second column: Bezier/Spring editor */}
          <div
            style={{
              flex: 1,
              background: "var(--color-bg-secondary)",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--color-Neutral)",
                }}
              >
                Transition Editor
              </h3>
              <button
                ref={saveButtonRef}
                onClick={handleSave}
                style={{
                  padding: "6px 12px",
                  background:
                    saveStatus === "error"
                      ? "#dc3545"
                      : saveStatus === "success"
                        ? "#28a745"
                        : saveStatus === "building"
                          ? "#ffc107"
                          : "var(--color-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--border-radius-default)",
                  fontSize: "14px",
                  cursor:
                    saveStatus === "saving" || saveStatus === "building"
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    saveStatus === "saving" || saveStatus === "building"
                      ? 0.7
                      : 1,
                  transition: "all 0.2s ease",
                }}
                disabled={saveStatus === "saving" || saveStatus === "building"}
              >
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "building"
                    ? "Building..."
                    : saveStatus === "error"
                      ? "Save Failed"
                      : "Save Token"}
              </button>
            </div>

            {/* Animation type buttons */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <button
                  onClick={() => setAnimationType("ease")}
                  style={{
                    padding: "8px 16px",
                    background: animationType === "ease" 
                      ? "var(--color-primary)" 
                      : "var(--color-bg-secondary)",
                    color: animationType === "ease" 
                      ? "white" 
                      : "var(--color-primary)",
                    border: animationType === "ease"
                      ? "none"
                      : "1px solid var(--color-border)",
                    borderRadius: "var(--border-radius-default)",
                    fontSize: "14px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px var(--color-shadow)",
                  }}
                >
                  Ease
                </button>
                <button
                  onClick={() => setAnimationType("spring")}
                  style={{
                    padding: "8px 16px",
                    background: animationType === "spring" 
                      ? "var(--color-primary)" 
                      : "var(--color-bg-secondary)",
                    color: animationType === "spring" 
                      ? "white" 
                      : "var(--color-primary)",
                    border: animationType === "spring"
                      ? "none"
                      : "1px solid var(--color-border)",
                    borderRadius: "var(--border-radius-default)",
                    fontSize: "14px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px var(--color-shadow)",
                  }}
                >
                  Spring
                </button>
              </div>

              {animationType === "spring" && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <button
                    onClick={() => setSpringType("time")}
                    style={{
                      padding: "8px 16px",
                      background: springType === "time" 
                        ? "var(--color-primary)" 
                        : "var(--color-bg-secondary)",
                      color: springType === "time" 
                        ? "white" 
                        : "var(--color-primary)",
                      border: springType === "time"
                        ? "none"
                        : "1px solid var(--color-border)",
                      borderRadius: "var(--border-radius-default)",
                      fontSize: "14px",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px var(--color-shadow)",
                    }}
                  >
                    Time
                  </button>
                  <button
                    onClick={() => setSpringType("physics")}
                    style={{
                      padding: "8px 16px",
                      background: springType === "physics" 
                        ? "var(--color-primary)" 
                        : "var(--color-bg-secondary)",
                      color: springType === "physics" 
                        ? "white" 
                        : "var(--color-primary)",
                      border: springType === "physics"
                        ? "none"
                        : "1px solid var(--color-border)",
                      borderRadius: "var(--border-radius-default)",
                      fontSize: "14px",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px var(--color-shadow)",
                    }}
                  >
                    Physics
                  </button>
                </div>
              )}
            </div>

            {/* Bezier/Spring preview */}
            {animationType === "ease" ? (
              <BezierPreview
                coordinates={currentBezier}
                onChange={handleBezierChange}
              />
            ) : (
              <SpringPreview
                type={springType}
                duration={springValues.duration}
                bounce={springValues.bounce}
                stiffness={springValues.stiffness}
                damping={springValues.damping}
                mass={springValues.mass}
                delay={springValues.delay}
                onChange={handleSpringChange}
              />
            )}
          </div>

          {/* Third column: Transform properties and preview */}
          <div
            style={{
              width: "400px",
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
            }}
          >
            {/* Transform Properties */}
            <div
              style={{
                background: "var(--color-bg-secondary)",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                padding: "24px",
              }}
            >
              <h4 style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--color-Neutral)",
                marginBottom: "16px"
              }}>
                Transform Properties
              </h4>
              
              {/* Scale Controls */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  fontSize: "12px",
                  color: "var(--color-primary)",
                  display: "block",
                  marginBottom: "8px"
                }}>
                  Scale
                </label>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={parseFloat(resolveTokenReference(scaleValues.from) || "1")}
                      onChange={(e) => {
                        const value = e.target.value || "1";
                        console.log('Scale From changed:', value);
                        setScaleValues(prev => ({
                          ...prev,
                          from: value
                        }));
                        setPreviewKey(Date.now());
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid var(--color-primary)",
                        borderRadius: "var(--border-radius-default)",
                        background: "var(--color-bg-secondary)",
                        color: "var(--color-primary)",
                      }}
                      placeholder="Scale From"
                      step="0.1"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={parseFloat(resolveTokenReference(scaleValues.to) || "1")}
                      onChange={(e) => {
                        const value = e.target.value || "1";
                        setScaleValues(prev => ({
                          ...prev,
                          to: value
                        }));
                        setPreviewKey(Date.now());
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid var(--color-primary)",
                        borderRadius: "var(--border-radius-default)",
                        background: "var(--color-bg-secondary)",
                        color: "var(--color-primary)",
                      }}
                      placeholder="Scale To"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Rotation Controls */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  fontSize: "12px",
                  color: "var(--color-primary)",
                  display: "block",
                  marginBottom: "8px"
                }}>
                  Rotation (degrees)
                </label>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={parseInt(rotateValues.from) || 0}
                      onChange={(e) => {
                        const value = `${e.target.value || "0"}deg`;
                        setRotateValues(prev => ({
                          ...prev,
                          from: value
                        }));
                        setPreviewKey(Date.now());
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid var(--color-primary)",
                        borderRadius: "var(--border-radius-default)",
                        background: "var(--color-bg-secondary)",
                        color: "var(--color-primary)",
                      }}
                      placeholder="Rotate From"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={parseInt(rotateValues.to) || 0}
                      onChange={(e) => {
                        const value = `${e.target.value || "0"}deg`;
                        setRotateValues(prev => ({
                          ...prev,
                          to: value
                        }));
                        setPreviewKey(Date.now());
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid var(--color-primary)",
                        borderRadius: "var(--border-radius-default)",
                        background: "var(--color-bg-secondary)",
                        color: "var(--color-primary)",
                      }}
                      placeholder="Rotate To"
                    />
                  </div>
                </div>
              </div>

              {/* Translation Controls */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  fontSize: "12px",
                  color: "var(--color-primary)",
                  display: "block",
                  marginBottom: "8px"
                }}>
                  Translation (px)
                </label>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={parseInt(translateValues.from) || 0}
                      onChange={(e) => {
                        const value = `${e.target.value || "0"}px`;
                        setTranslateValues(prev => ({
                          ...prev,
                          from: value
                        }));
                        setPreviewKey(Date.now());
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid var(--color-primary)",
                        borderRadius: "var(--border-radius-default)",
                        background: "var(--color-bg-secondary)",
                        color: "var(--color-primary)",
                      }}
                      placeholder="Translate From"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={parseInt(translateValues.to) || 0}
                      onChange={(e) => {
                        const value = `${e.target.value || "0"}px`;
                        setTranslateValues(prev => ({
                          ...prev,
                          to: value
                        }));
                        setPreviewKey(Date.now());
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid var(--color-primary)",
                        borderRadius: "var(--border-radius-default)",
                        background: "var(--color-bg-secondary)",
                        color: "var(--color-primary)",
                      }}
                      placeholder="Translate To"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div
              style={{
                background: "var(--color-bg-secondary)",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                padding: "24px",
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}>
                <h4 style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--color-Neutral)",
                }}>
                  Preview
                </h4>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setShouldPlayAnimation(prev => !prev);
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "var(--color-primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "var(--border-radius-default)",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    Play Animation
                  </button>
                  <button
                    onClick={() => {
                      if (originalValues) {
                        // Restore all original values
                        setScaleValues(originalValues.scale);
                        setRotateValues(originalValues.rotate);
                        setTranslateValues(originalValues.translate);
                        setAnimationType(originalValues.animationType);
                        setSpringValues(originalValues.springValues);
                        setCurrentBezier(originalValues.bezier);
                        setPreviewKey(Date.now());
                      }
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      color: "var(--color-primary)",
                      border: "1px solid var(--color-primary)",
                      borderRadius: "var(--border-radius-default)",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    Reset to Original
                  </button>
                </div>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "center",
                padding: "2rem",
                background: "var(--color-bg-primary)",
                borderRadius: "var(--border-radius-default)",
              }}>
                <BookCard
                  key={previewKey}
                  cover={currentSet === "aeroglobal" 
                    ? aeroglobalCover
                    : brandaCover
                  }
                  title={currentSet === "aeroglobal" ? "AeroGlobal Royal Dutch Airlines" : "BrandA"}
                  description={currentSet === "aeroglobal" 
                    ? "Book your next journey with AeroGlobal" 
                    : "Discover BrandA destinations"
                  }
                  variant={currentSet}
                  index={0}
                  shouldAnimate={shouldAnimate}
                  previewToken={selectedToken?.path}
                  motion={{
                    animate: {
                      scale: Number(scaleValues.to),
                      rotate: Number(rotateValues.to.replace('deg', '')),
                      y: Number(translateValues.to.replace('px', '')),
                      transition: {
                        duration: animationType === "spring" ? springValues.duration : 0.3,
                        ease: animationType === "spring" 
                          ? `cubic-bezier(${[0.4, 0, 0.2, 1].join(", ")})`
                          : `cubic-bezier(${currentBezier.join(", ")})`,
                        ...(animationType === "spring" && {
                          type: "spring",
                          stiffness: springValues.stiffness,
                          damping: springValues.damping,
                          mass: springValues.mass
                        })
                      }
                    },
                    initial: {
                      scale: Number(scaleValues.from),
                      rotate: Number(rotateValues.from.replace('deg', '')),
                      y: Number(translateValues.from.replace('px', ''))
                    },
                    entrance: shouldPlayAnimation
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
