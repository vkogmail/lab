/**
 * Color Manager Module
 * 
 * This module consolidates all color-related functionality into a single, cohesive API.
 * It handles color extraction, processing, scale generation, and token updating.
 * 
 * REQUIREMENTS:
 * This module requires a modern browser with support for:
 * - CSS Variables (document.documentElement.style.setProperty)
 * - OKLCH color format (oklch() color function)
 * - color-mix() function
 */

/**
 * Main ColorManager class that combines functionality from multiple previous modules
 * 
 * This class consolidates functionality that was previously spread across:
 * - ColorExtractor: For extracting colors from images
 * - ColorScale: For generating color scales
 * - TokenUpdater: For updating design tokens
 * - ColorUtils: For color format conversions and utilities
 * 
 * By unifying these operations into a single class, we reduce complexity,
 * eliminate duplicate code, and provide a more cohesive API for color operations.
 * 
 * Key features:
 * - Extract dominant colors from images with intelligent filtering
 * - Generate complete color scales from a base hue
 * - Update CSS variables in real-time for responsive UI
 * - Persist color changes through token files
 * - Handle color format conversions (OKLCH, HEX, RGB)
 */
export class ColorManager {
    /**
     * Initialize the ColorManager
     * @param {string} serverOrigin - Server origin for API calls (defaults to window.location.origin)
     */
    constructor(serverOrigin = '') {
        this.serverOrigin = serverOrigin || window.location.origin;
        this.cssLoadTime = 300;
        this.updateInProgress = false;
        this.currentHue = null;
        this.debounceTimeout = null;
        this.debounceDelay = 800;
        
        // Initialize empty values
        this.scaleSteps = {};
        this.baseValues = {};
        this.thresholds = {};
        this.initialized = false;
        
        // Initialize FastAverageColor
        if (typeof FastAverageColor !== 'undefined') {
            this.fac = new FastAverageColor();
            console.log('FastAverageColor initialized successfully');
        } else {
            throw new Error('FastAverageColor not available - required for color extraction');
        }
        
        // Start async initialization
        this.initPromise = this.initializeFromTokens().then(() => {
            this.initialized = true;
            console.log('ColorManager initialization complete');
        }).catch(error => {
            console.error('ColorManager initialization failed:', error);
            throw error;
        });
    }

    /**
     * Ensure initialization is complete before performing operations
     */
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initPromise;
        }
    }

    /**
     * Initialize values from tokens
     */
    async initializeFromTokens() {
        try {
            // Load both token files
            const [themeResponse, foundationResponse] = await Promise.all([
                fetch('/tokens/Theme/Default.json'),
                fetch('/tokens/Foundation/Color.json')
            ]);

            if (!themeResponse.ok || !foundationResponse.ok) {
                throw new Error('Failed to load color tokens');
            }
            
            const [themeTokens, foundationTokens] = await Promise.all([
                themeResponse.json(),
                foundationResponse.json()
            ]);

            const dynamicSteps = themeTokens?.Color?.Dynamic;
            const oklchValues = foundationTokens?.OKLCH;
            
            if (!dynamicSteps || !oklchValues) {
                throw new Error('Required color tokens not found');
            }

            // Initialize scale steps
            this.scaleSteps = {};
            Object.entries(dynamicSteps).forEach(([step, values]) => {
                // Get the actual values from Foundation/Color.json
                const lightness = parseFloat(oklchValues.Lightness[step].value) / 100; // Remove % and convert to decimal
                const saturation = parseFloat(oklchValues.Saturation[step].value); // Already in decimal
                
                this.scaleSteps[step] = {
                    l: lightness,
                    cMult: saturation
                };
            });

            // Set base values from step 40
            const baseStep = '40';
            const baseLightness = parseFloat(oklchValues.Lightness[baseStep].value) / 100;
            const baseSaturation = parseFloat(oklchValues.Saturation[baseStep].value);

            this.baseValues = {
                lightness: baseLightness,
                chroma: baseSaturation
            };

            // Set thresholds
            this.thresholds = {
                lightness: 0.95,  // 95%
                darkness: 0.15,   // 15%
                gray: 0.10,      // 10%
                tint: 0.90       // 90%
            };

            console.log('ColorManager initialized from tokens');
        } catch (error) {
            console.error('Failed to initialize from tokens:', error);
            throw error;
        }
    }

    /**
     * Extract color from an image and process it for UI use
     * @param {HTMLImageElement} img - The image to analyze
     * @returns {Promise<Object>} The extracted and processed color information
     */
    async extractColor(img) {
        await this.ensureInitialized();
        try {
            if (!img.complete) {
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('Failed to load image'));
                    setTimeout(() => reject(new Error('Image load timeout')), 5000);
                });
            }

            // Get colors from different algorithms for comparison
            const dominantColor = await this.fac.getColor(img, {
                algorithm: 'dominant',
                mode: 'precision',
                step: 1,
                ignoredColor: [
                    [255, 255, 255, 255],    // Pure white
                    [0, 0, 0, 255],          // Pure black
                    [128, 128, 128, 255],    // Pure gray
                    [245, 245, 245, 255],    // Near white
                    [10, 10, 10, 255],       // Near black
                    [220, 220, 220, 255],    // Light gray
                    [200, 200, 200, 255]     // Medium light gray
                ]
            });

            const simpleColor = await this.fac.getColor(img, {
                algorithm: 'simple',
                mode: 'precision'
            });

            // Analyze both colors
            const candidates = [dominantColor, simpleColor];
            let bestResult = null;
            let bestScore = 0;

            for (const result of candidates) {
                const rgb = result.value.slice(0, 3);
                const { ignored, reasons } = this.shouldIgnoreColor(rgb);
                
                if (!ignored) {
                    const color = chroma(rgb);
                    const [l, c, h] = color.oklch();
                    
                    // Boost chroma weight in scoring
                    const saturationScore = c * 3.0;  // Increased from 2.0
                    const contrastScore = await this.getContrastScore(rgb, img);
                    
                    const score = saturationScore + (contrastScore * 1.5);

                    if (score > bestScore) {
                        bestScore = score;
                        bestResult = result;
                    }
                }
            }

            // If no good color found, use simple algorithm as fallback
            if (!bestResult) {
                bestResult = simpleColor;
            }

            // Process final color
            const rgb = bestResult.value.slice(0, 3);
            const originalColor = chroma(rgb);
            const [l, c, h] = originalColor.oklch();
            
            // Set the extracted color CSS variable using the exact OKLCH values
            const root = document.documentElement;
            root.style.setProperty('--extracted-color', `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${h.toFixed(2)})`);
            
            // Return the exact values we extracted
            return {
                original: {
                    rgb: rgb,
                    hex: bestResult.hex,
                    oklch: `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${h.toFixed(2)})`
                },
                processed: {
                    hex: bestResult.hex,
                    oklch: `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${h.toFixed(2)})`
                },
                scale: this.generateScale(h, c)
            };
        } catch (error) {
            console.error('Color extraction failed:', error);
            return this.createColorResult([70, 130, 230], '#4682E6', 250, 0.17);
        }
    }

    /**
     * Creates a standardized color result object
     * @param {number[]} rgb - RGB values array
     * @param {string} hex - Hex color string
     * @param {number} hue - Hue value
     * @param {number} baseChroma - Base chroma value to use
     * @returns {Object} Standardized color result
     */
    createColorResult(rgb, hex, hue, baseChroma) {
        // Use token values directly
        const baseStep = '50'; // Use step 50 as our base
        const tokenLightness = this.scaleSteps[baseStep].l;
        const tokenChroma = this.baseValues.chroma;
        
        // Generate processed color with our token values
        const processedColor = chroma.oklch(tokenLightness, tokenChroma, hue);
        
        return {
            original: {
                rgb: rgb,
                hex: hex,
                oklch: `oklch(${(tokenLightness * 100).toFixed(2)}% ${tokenChroma.toFixed(4)} ${hue.toFixed(2)})`
            },
            processed: {
                hex: processedColor.hex(),
                oklch: `oklch(${(tokenLightness * 100).toFixed(2)}% ${tokenChroma.toFixed(4)} ${hue.toFixed(2)})`
            },
            scale: this.generateScale(hue, tokenChroma)
        };
    }

    /**
     * Calculate contrast score based on local pixel neighborhood
     * @param {Array} rgb - RGB values of the color
     * @param {HTMLImageElement} img - Source image
     * @returns {number} Contrast score (0-1)
     */
    async getContrastScore(rgb, img) {
        // If FastAverageColor is not available, return a moderate contrast score
        if (!this.fac) {
            return 0.5; // Return middle-of-the-road score
        }

        // Sample points across the image
        const samplePoints = [];
        const stepX = img.width / 4;
        const stepY = img.height / 4;

        // Create a grid of sample points
        for (let x = 0; x <= img.width; x += stepX) {
            for (let y = 0; y <= img.height; y += stepY) {
                samplePoints.push({ x, y });
            }
        }

        try {
            const sampleColors = await Promise.all(samplePoints.map(point => 
                this.fac.getColor(img, {
                    algorithm: 'simple',
                    mode: 'precision',
                    left: Math.max(0, point.x - 5),
                    top: Math.max(0, point.y - 5),
                    width: 10,
                    height: 10
                })
            ));

            // Calculate contrast with surrounding colors
            const contrasts = sampleColors.map(sample => 
                chroma.contrast(chroma(rgb), chroma(sample.value.slice(0, 3)))
            );

            // Use the 75th percentile contrast for scoring
            contrasts.sort((a, b) => b - a);
            const contrastScore = contrasts[Math.floor(contrasts.length * 0.25)] / 21;
            return Math.min(contrastScore, 1);
        } catch (error) {
            console.warn('Error calculating contrast score:', error);
            return 0.5; // Return middle-of-the-road score if calculation fails
        }
    }

    /**
     * Checks if a color should be ignored based on our thresholds
     * @param {Array} rgb - RGB values [r, g, b]
     * @returns {Object} Result with ignored status and reasons
     */
    shouldIgnoreColor(rgb) {
        try {
            // Check if chroma.js is available
            if (typeof chroma === 'undefined') {
                console.warn('chroma.js not available for color analysis');
                return { ignored: false }; // Don't ignore by default if we can't analyze
            }
            
            const color = chroma(rgb);
            const [l, c, h] = color.oklch();
            
            const reasons = [];
            
            // Very light colors
            if (l > this.thresholds.lightness) {
                reasons.push('too light');
                return { ignored: true, reasons };
            }
            
            // Handle high lightness colors with low saturation
            if (l > 0.85) { // HIGH_LIGHTNESS_THRESHOLD
                if (c < 0.15) { // MIN_CHROMA_FOR_LIGHT
                    reasons.push('too light with low saturation');
                    return { ignored: true, reasons };
                }
            }
            
            // Light tints with low saturation
            if (l > this.thresholds.tint && c < 0.2) {
                reasons.push('light tint');
                return { ignored: true, reasons };
            }
            
            // Very dark colors
            if (l < this.thresholds.darkness) {
                reasons.push('too dark');
                return { ignored: true, reasons };
            }
            
            // Near-gray colors
            if (c < this.thresholds.gray) {
                reasons.push('too gray');
                return { ignored: true, reasons };
            }
            
            return { ignored: false };
        } catch (error) {
            console.warn('Error analyzing color:', error);
            return { ignored: false }; // Don't ignore colors we can't analyze
        }
    }

    /**
     * Generate a complete color scale based on the hue
     * @param {number} hue - The hue value to create a scale for
     * @param {number} baseChroma - Base chroma value to use
     * @returns {Object} Complete color scale with hex values and OKLCH representations
     */
    async generateScale(hue, baseChroma) {
        await this.ensureInitialized();
        const scale = {};
        
        try {
            // Check if chroma.js is available
            if (typeof chroma === 'undefined') {
                console.warn('chroma.js not available for scale generation');
                return this.generateFallbackScale(hue);
            }

            // Use provided baseChroma or fall back to default
            const chromaToUse = baseChroma || this.baseValues.chroma;

            // Generate each step
            for (const [step, constants] of Object.entries(this.scaleSteps)) {
                const oklch = {
                    l: constants.l,
                    c: chromaToUse * constants.cMult * 1.2, // Boost chroma slightly
                    h: hue
                };

                // Convert to RGB for hex value
                const color = chroma.oklch(oklch.l, oklch.c, oklch.h);
                const hex = color.hex();

                scale[step] = {
                    hex: hex,
                    oklch: `oklch(${(oklch.l * 100).toFixed(2)}% ${oklch.c.toFixed(4)} ${oklch.h.toFixed(2)})`
                };
            }

            return scale;
        } catch (error) {
            console.warn('Error generating color scale:', error);
            return this.generateFallbackScale(hue);
        }
    }

    /**
     * Generate a fallback scale when color processing fails
     * @param {number} hue - The hue value
     * @returns {Object} Basic color scale
     */
    generateFallbackScale(hue) {
        const scale = {};
        Object.keys(this.scaleSteps).forEach(step => {
            scale[step] = {
                hex: '#808080',
                oklch: `oklch(55.00% 0.1700 ${hue.toFixed(2)})`
            };
        });
        return scale;
    }

    /**
     * Parse an OKLCH color string and extract components
     * @param {string} oklchStr - OKLCH color string
     * @returns {Object} Object with l, c, h properties
     */
    parseOklch(oklchStr) {
        try {
            // Handle both formats: oklch(55% 0.17 220.5) and oklch(0.55 0.17 220.5)
            const match = oklchStr.match(/oklch\(\s*([0-9.]+)%?\s+([0-9.]+)\s+([0-9.]+)\s*\)/i);
            
            if (!match) {
                console.warn('Invalid OKLCH string format:', oklchStr);
                return { l: 0.55, c: 0.17, h: 0 };
            }
            
            let [, l, c, h] = match;
            
            // Convert percentage lightness to decimal if needed
            if (oklchStr.includes('%')) {
                l = parseFloat(l) / 100;
            } else {
                l = parseFloat(l);
            }
            
            return {
                l: l,
                c: parseFloat(c),
                h: parseFloat(h)
            };
        } catch (error) {
            console.error('Error parsing OKLCH color:', error);
            return { l: 0.55, c: 0.17, h: 0 };
        }
    }

    /**
     * Convert OKLCH color to string representation
     * @param {number} l - Lightness (0-1)
     * @param {number} c - Chroma (saturation)
     * @param {number} h - Hue (0-360)
     * @returns {string} OKLCH color string
     */
    oklchToString(l, c, h) {
        return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${h.toFixed(2)})`;
    }

    /**
     * Get the current hue from CSS variables
     * @returns {number|null} Current hue or null if not available
     */
    getCurrentHue() {
        try {
            const root = document.documentElement;
            const computedStyle = getComputedStyle(root);
            const cssHue = computedStyle.getPropertyValue('--oklch-hue-dynamic').trim();
            
            return cssHue ? parseFloat(cssHue) : null;
        } catch (error) {
            console.error('Error getting current hue:', error);
            return null;
        }
    }

    /**
     * Inject CSS classes directly for immediate color update
     * @param {number} hue - The hue to create classes for
     */
    injectColorClasses(hue) {
        try {
            // Round the hue to match class naming
            const roundedHue = Math.round(hue);
            
            // Create or update the style element
            let styleEl = document.getElementById('dynamic-color-classes');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'dynamic-color-classes';
                document.head.appendChild(styleEl);
            }
            
            // Generate class definitions for all steps
            let cssRules = Object.keys(this.scaleSteps).map(step => {
                const { l, cMult } = this.scaleSteps[step];
                const lightness = l * 100;
                const chroma = this.baseValues.chroma * cMult;
                
                return `
                /* Dynamic color class that uses CSS variable */
                .dynamic-color-${step} {
                    background-color: var(--color-dynamic-${step}) !important;
                }
                
                /* Legacy hue-specific class */
                .color-hue-${roundedHue}-step-${step} {
                    background-color: oklch(${lightness.toFixed(1)}% ${chroma.toFixed(4)} ${hue}) !important;
                }
                
                /* Scale step targeting */
                .scale-step[data-step="${step}"] .swatch {
                    background-color: var(--color-dynamic-${step}) !important;
                }`;
            }).join('\n');
            
            // Get the current color values for the extracted swatch
            const root = document.documentElement;
            const computedStyle = getComputedStyle(root);
            const currentColor = computedStyle.getPropertyValue('--extracted-color').trim();
            
            // Direct styling for the extracted color swatch using the actual extracted color
            cssRules += `
            /* Direct styling for the extracted color swatch */
            .extracted-color-swatch, 
            #extracted-swatch,
            [data-section="extracted-color"] .swatch {
                background-color: var(--extracted-color, ${currentColor || `oklch(55% 0.17 ${hue})`}) !important;
            }`;
            
            // Set the CSS content
            styleEl.textContent = cssRules;
            
            // Immediately apply the colors to existing swatches in the color scale
            const scaleSteps = document.querySelectorAll('.scale-step');
            if (scaleSteps.length > 0) {
                scaleSteps.forEach(step => {
                    const stepNum = step.getAttribute('data-step');
                    const swatch = step.querySelector('.swatch');
                    if (swatch && stepNum) {
                        swatch.classList.add(`dynamic-color-${stepNum}`);
                        swatch.style.backgroundColor = '';
                    }
                });
            }
        } catch (error) {
            console.warn('Error injecting color classes:', error);
        }
    }

    /**
     * Update tokens based on a color in any format
     * @param {string} color - The color to extract hue from
     * @returns {Promise<Object>} Result object with status info
     */
    async updateTokens(color) {
        await this.ensureInitialized();
        try {
            // Don't allow concurrent updates to prevent race conditions
            if (this.updateInProgress) {
                console.log('Color update already in progress, skipping');
                return { success: false, message: 'Update already in progress' };
            }
            
            this.updateInProgress = true;
            
            // Extract the hue from OKLCH color
            const { h: extractedHue } = this.parseOklch(color);
            console.log(`Updating colors with hue: ${extractedHue}`);
            
            // Apply the color immediately using direct CSS variables - no token update needed
            const success = await this.applyColorDirectly(extractedHue);
            
            // Release the lock
            this.updateInProgress = false;
            
            if (success) {
                return {
                    success: true,
                    hue: extractedHue,
                    message: 'CSS variables applied successfully'
                };
            } else {
                throw new Error('Failed to apply CSS variables');
            }
        } catch (error) {
            console.error('Color update failed:', error);
            this.updateInProgress = false;
            return { success: false, message: error.message };
        }
    }

    /**
     * Queue a token update with debouncing
     * @param {number} hue - The hue value to update to
     */
    queueTokenUpdate(hue) {
        // Always apply the color directly first for immediate feedback
        this.applyColorDirectly(hue);
        
        // Store the current hue
        this.currentHue = hue;
        
        // Clear any existing timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        
        // Only queue a token update if explicitly requested
        // For now, we'll just use CSS variables for immediate updates
        console.log('Applying color directly via CSS variables');
    }

    /**
     * Update the actual design tokens in the system
     * This should only be called when design tokens themselves need to be updated,
     * not for regular color extraction
     * @param {Object} tokenData - Complete token data to update
     * @returns {Promise<Object>} Success status and messages
     */
    async updateDesignTokens(tokenData) {
        try {
            console.log('Updating design tokens (not just hue)');
            
            // Create token payload in the format expected by the server
            const updateResponse = await fetch(`${this.serverOrigin}/api/updateTokens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tokenData)
            });
            
            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Server returned ${updateResponse.status}: ${errorText}`);
            }
            
            const result = await updateResponse.json();
            
            // After updating tokens, trigger a build
            const buildResult = await this.triggerStyleDictionaryBuild();
            
            if (buildResult.success) {
                // Reload the CSS to reflect the new token values
                this.reloadCssWithTimestamp();
                
                return {
                    success: true,
                    message: 'Design tokens updated and built successfully'
                };
            } else {
                throw new Error('Token build failed: ' + buildResult.message);
            }
        } catch (error) {
            console.error('Error updating design tokens:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Trigger Style Dictionary build on the server
     * This should only be called when design tokens change
     * @returns {Promise<Object>} Build result
     */
    async triggerStyleDictionaryBuild() {
        try {
            console.log('Triggering Style Dictionary build...');
            const response = await fetch(`${this.serverOrigin}/api/buildTokens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success) {
                console.log('Style Dictionary build completed successfully');
                return result;
            } else {
                throw new Error(result.message || 'Build failed without details');
            }
        } catch (error) {
            console.warn('Error triggering Style Dictionary build:', error);
            throw error;
        }
    }

    /**
     * Check if CSS variables match the expected hue
     * @param {number} expectedHue - Expected hue value to check for
     * @param {number} tolerance - Tolerance for hue difference (default: 0.5)
     * @returns {boolean} Whether CSS variables match expectations
     */
    checkCssVariables(expectedHue, tolerance = 0.5) {
        try {
            const root = document.documentElement;
            const computedStyle = getComputedStyle(root);
            const cssHue = computedStyle.getPropertyValue('--oklch-hue-dynamic').trim();
            
            if (!cssHue) {
                return false;
            }
            
            const expectedNum = parseFloat(expectedHue);
            const actualNum = parseFloat(cssHue);
            const difference = Math.abs(expectedNum - actualNum);
            
            return difference <= tolerance;
        } catch (error) {
            console.error('Error checking CSS variables:', error);
            return false;
        }
    }

    /**
     * Reload the CSS file with a cache-busting timestamp
     * This should only be called when design tokens change
     */
    reloadCssWithTimestamp() {
        try {
            const timestamp = Date.now();
            
            console.log(`CSS reload initiated with timestamp: ${timestamp}`);
            
            // Find all existing token CSS links
            const existingLinks = document.querySelectorAll('link[href*="tokens.css"]');
            if (existingLinks.length === 0) {
                console.warn('No tokens.css link found to reload');
                return;
            }
            
            // Create a new link element
            const newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = `${this.serverOrigin}/styles/tokens.css?t=${timestamp}`;
            
            // When the new stylesheet loads, remove the old one
            newLink.onload = () => {
                console.log('CSS reloaded successfully - new stylesheet applied');
                // Remove the old link elements after a short delay
                setTimeout(() => {
                    existingLinks.forEach(link => {
                        if (link.parentNode) {
                            link.parentNode.removeChild(link);
                        }
                    });
                }, 100);
            };
            
            // Handle load errors
            newLink.onerror = () => {
                console.warn('Failed to load new CSS');
                // Keep the old stylesheets
                document.head.removeChild(newLink);
            };
            
            // Add the new link to the head
            document.head.appendChild(newLink);
            
        } catch (error) {
            console.warn('Error during CSS reload:', error);
        }
    }

    /**
     * Convert hex color to RGBA
     * @param {string} hex - Hex color string (e.g. "#ff0000" or "#f00")
     * @param {number} alpha - Alpha value (0-1)
     * @returns {string} RGBA color string
     */
    hexToRGBA(hex, alpha = 1) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse hex values
        let r, g, b;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        
        // Return rgba value
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Apply a color directly via CSS variables
     * @param {number} hue - The hue value to apply
     */
    async applyColorDirectly(hue) {
        // Ensure initialization is complete
        await this.ensureInitialized();
        
        // Round the hue for consistency
        const roundedHue = parseFloat(hue.toFixed(2));
        
        // Set the hue CSS variable
        document.documentElement.style.setProperty('--oklch-hue-dynamic', roundedHue);
        
        // Store the current hue
        this.currentHue = roundedHue;
        
        console.log('Applying color directly via CSS variables');
    }
} 