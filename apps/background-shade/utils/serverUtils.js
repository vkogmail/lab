/**
 * Server Utilities
 * 
 * This module provides utility functions for server-side operations,
 * particularly focused on token management, file system operations,
 * and fallback CSS generation.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Get the current hue value from tokens
 * Asynchronously reads the token file and extracts the dynamic hue value.
 * 
 * @returns {Promise<number>} Current hue value or default fallback
 */
export async function getCurrentHue() {
    try {
        const tokenPath = path.join(ROOT_DIR, 'public', 'tokens', 'Foundation', 'Color.json');
        try {
            await fs.promises.access(tokenPath);
            const tokenContent = await fs.promises.readFile(tokenPath, 'utf8');
            const tokens = JSON.parse(tokenContent);
            return tokens?.OKLCH?.Hue?.Dynamic?.value || 36.86;
        } catch (error) {
            console.error('Error accessing token file:', error);
            return 36.86; // Default fallback
        }
    } catch (error) {
        console.error('Error reading tokens for hue value:', error);
        return 36.86; // Default fallback
    }
}

/**
 * Synchronous version of getCurrentHue
 * Used when async operations aren't possible
 * 
 * @returns {number} Current hue value or default fallback
 */
export function getCurrentHueSync() {
    try {
        const tokenPath = path.join(ROOT_DIR, 'public', 'tokens', 'Foundation', 'Color.json');
        if (fs.existsSync(tokenPath)) {
            const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
            return tokens?.OKLCH?.Hue?.Dynamic?.value || 36.86;
        }
    } catch (error) {
        console.error('Error reading tokens for hue value:', error);
    }
    return 36.86; // Default fallback
}

/**
 * Deep merge objects
 * Used to merge token updates with existing token objects
 * Preserves nested structure and only updates specified values
 * 
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object') {
            target[key] = target[key] || {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

/**
 * Generate fallback CSS content with provided hue
 * Creates CSS variables for all dynamic colors when Style Dictionary build fails
 * 
 * @param {number} hue - The hue value to use
 * @returns {string} CSS content with all necessary variables
 */
export function generateFallbackCSS(hue) {
    return `/**
 * Generated as fallback on ${new Date().toISOString()}
 */

:root {
  --oklch-hue-dynamic: ${hue};
  --color-dynamic-10: oklch(20.80% 0.0774 ${hue});
  --color-dynamic-20: oklch(32.40% 0.1125 ${hue});
  --color-dynamic-30: oklch(42.50% 0.1430 ${hue});
  --color-dynamic-40: oklch(55.00% 0.1700 ${hue});
  --color-dynamic-50: oklch(63.00% 0.1700 ${hue});
  --color-dynamic-60: oklch(74.80% 0.1477 ${hue});
  --color-dynamic-70: oklch(89.50% 0.0515 ${hue});
  --color-dynamic-80: oklch(94.80% 0.0292 ${hue});
  --color-dynamic-base: oklch(55.00% 0.1700 ${hue});
  --color-roles-folio-main-surface: oklch(89.50% 0.0515 ${hue});
  --color-roles-folio-main-surface-low: oklch(94.80% 0.0292 ${hue});
  --color-roles-folio-main-surface-high: oklch(55.00% 0.1700 ${hue});
  --color-roles-folio-main-on-surface: oklch(55.00% 0.1700 ${hue});
  --color-roles-folio-main-on-surface-inverse: #fff;
  --color-roles-folio-main-border: oklch(74.80% 0.1477 ${hue});
  --color-roles-folio-main-border-low: oklch(63.00% 0.1700 ${hue});
}
`;
}

/**
 * Ensure a directory exists
 * Asynchronously creates directory if it doesn't exist
 * 
 * @param {string} dir - Directory path
 * @returns {Promise<void>} 
 */
export async function ensureDirectoryExists(dir) {
    try {
        await fs.promises.access(dir);
    } catch (error) {
        // Directory doesn't exist
        await fs.promises.mkdir(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

/**
 * Ensure a directory exists (synchronous version)
 * Used when async operations aren't possible
 * 
 * @param {string} dir - Directory path
 */
export function ensureDirectoryExistsSync(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
} 