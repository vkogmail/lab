/**
 * Color Management Library
 * 
 * This is the main entry point for the color management library.
 * It exports a unified API for color extraction, processing, and token management.
 * 
 * Usage:
 * ```js
 * import { ColorManager } from './lib/index.js';
 * 
 * const colorManager = new ColorManager();
 * 
 * // Extract colors from an image
 * const colors = await colorManager.extractColor(imageElement);
 * 
 * // Apply a color directly
 * colorManager.updateTokens('oklch(55% 0.17 250)');
 * ```
 */

export { ColorManager } from './colorManager.js';

// Re-export useful utility functions for direct access
export function getCurrentHue() {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const cssHue = computedStyle.getPropertyValue('--oklch-hue-dynamic').trim();
    
    return cssHue ? parseFloat(cssHue) : null;
}

/**
 * Parses an OKLCH color string into its components
 * @param {string} oklchStr - OKLCH color string
 * @returns {Object} Object with l, c, h properties
 */
export function parseOklch(oklchStr) {
    try {
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
 * Converts hex color to RGBA
 * @param {string} hex - Hex color string
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
export function hexToRGBA(hex, alpha = 1) {
    hex = hex.replace('#', '');
    
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
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
} 