/**
 * Style Dictionary Configuration
 *
 * Configures the build process for design tokens, transforming JSON token files
 * into CSS custom properties. The configuration processes all token files from
 * the public/tokens directory and outputs a single CSS file with variables.
 *
 * The token system is structured as follows:
 * Foundation/ - Contains base values like OKLCH color definitions
 * Theme/ - Contains theme-specific tokens that reference foundation values
 * Mode/ - Reserved for future dark/light theme mode overrides
 *
 * The build process:
 * 1. Reads all JSON files from public/tokens/
 * 2. Transforms tokens using the built-in CSS transformer
 * 3. Maintains token references in the output
 * 4. Generates public/styles/tokens.css
 * 5. Verifies the output file exists and has content
 */
import StyleDictionary from 'style-dictionary';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Loading Style Dictionary config...');

// Register custom verification action
StyleDictionary.registerAction({
  name: 'verify_output',
  do: async function(dictionary, platform) {
    const filePath = path.resolve(platform.buildPath, 'tokens.css');
    console.log(`Verifying output at: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('CSS file not created after build');
    }
    
    const stats = fs.statSync(filePath);
    console.log(`✅ File created successfully - size: ${stats.size} bytes`);
  },
  undo: async function() {}
});

// Export the Style Dictionary configuration
export default {
  source: [
    'public/tokens/**/*.json'  // Process all JSON files in tokens directory
  ],
  platforms: {
    css: {
      transformGroup: 'css',   // Use built-in CSS transformer
      buildPath: 'public/styles/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables',
        options: {
          formatting: {
            fileHeaderTimestamp: true
          },
          outputReferences: true  // Maintain token references in output
        }
      }],
      actions: ['verify_output'] // Run verification after build
    }
  }
}; 