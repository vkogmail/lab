// Import the consolidated ColorManager class
import { ColorManager } from '../lib/colorManager.js';

// Initialize global variables
let colorManager;
let processor;
let tokenUpdater;

/**
 * Initialize the application
 */
async function initApp() {
    console.log('App initializing...');
    
    try {
        // Create processor first
        processor = {
            processImage: async (img) => {
                if (!colorManager) {
                    throw new Error('ColorManager not initialized');
                }
                return colorManager.extractColor(img);
            }
        };

        // Initialize ColorManager
        colorManager = new ColorManager(window.location.origin);
        await colorManager.initPromise;
        
        // Create token updater after ColorManager is ready
        tokenUpdater = {
            updateTokens: (color) => colorManager.updateTokens(color),
            queueTokenUpdate: (hue) => colorManager.queueTokenUpdate(hue)
        };

        // Make them available globally
        window.processor = processor;
        window.tokenUpdater = tokenUpdater;

        // Set up event listeners
        initColorPicker();
        initHexInput();
        
        // Initialize book cover and swatches
        initBookCover();
        initSwatches();
        
        // Display color scale with current hue
        const currentHue = colorManager.getCurrentHue() || 250;
        displayPredefinedColorScale(currentHue);
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('App initialization failed:', error);
        // Show error to user
        const scaleContainer = document.querySelector('.scale-steps-container');
        if (scaleContainer) {
            scaleContainer.innerHTML = `<div class="error-message">Failed to initialize: ${error.message}</div>`;
        }
    }
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Initialize color picker
function initColorPicker() {
    const colorPicker = document.getElementById('color-picker');
    if (!colorPicker) return;
    
    colorPicker.addEventListener('input', (e) => {
        const oklchColor = e.target.value;
        console.log('Color picker value:', oklchColor);
        
        try {
            const { h: hue } = colorManager.parseOklch(oklchColor);
            
            // Apply color directly for instant feedback
            // and queue a background token update with debouncing
            colorManager.queueTokenUpdate(hue);
            
            // Update hex input field
            updateHexInputField(oklchColor);
            
            // Update display with the predefined color scale
            displayPredefinedColorScale(hue);
            
        } catch (error) {
            console.error('Error processing color picker value:', error);
        }
    });
}

// Initialize hex input field
function initHexInput() {
    const hexInput = document.getElementById('hex-input');
    if (!hexInput) return;
    
    hexInput.addEventListener('input', (e) => {
        let hexValue = e.target.value;
        if (!hexValue.startsWith('#')) {
            hexValue = '#' + hexValue;
            e.target.value = hexValue;
        }
        
        // Only process valid hex colors
        if (/^#([0-9A-F]{3}){1,2}$/i.test(hexValue)) {
            console.log('Valid hex color entered:', hexValue);
            
            // Convert hex to RGBA
            const rgba = colorManager.hexToRGBA(hexValue);
            
            // Get current hue from the color manager
            const currentHue = colorManager.getCurrentHue() || 250;
            
            // Apply the new color and queue a token update
            colorManager.queueTokenUpdate(currentHue);
            
            // Update display with the predefined color scale
            displayPredefinedColorScale(currentHue);
        }
    });
}

// Initialize book cover with shadows
function initBookCover() {
    const book = document.querySelector('.book');
    if (!book) return;
    
    // Get current hue from CSS variables or use a default
    const currentHue = colorManager.getCurrentHue() || 250;
    
    console.log('Book cover initialized with hue:', currentHue);
}

function initBookTouch() {
    const book = document.querySelector('.book');
    if (!book) return;
    book.addEventListener('click', () => {
        book.classList.toggle('is-open');
    });
}

// Initialize color swatches
function initSwatches() {
    const swatchContainer = document.querySelector('.swatches');
    if (!swatchContainer) return;
    
    // Predefined hues for quick selection
    const predefinedHues = [
        { name: 'Blue', hue: 250 },
        { name: 'Purple', hue: 300 },
        { name: 'Pink', hue: 330 },
        { name: 'Red', hue: 15 },
        { name: 'Orange', hue: 30 },
        { name: 'Yellow', hue: 80 },
        { name: 'Green', hue: 140 },
        { name: 'Teal', hue: 180 }
    ];
    
    // Clear any existing swatches
    swatchContainer.innerHTML = '';
    
    // Add all swatches at once using innerHTML for maximum performance
    let swatchesHtml = '';
    
    predefinedHues.forEach(colorData => {
        swatchesHtml += `
            <div class="swatch-item">
                <button 
                    class="swatch color-hue-${colorData.hue}-step-50" 
                    data-hue="${colorData.hue}"
                    title="${colorData.name} (${colorData.hue}°)"
                ></button>
                <span class="swatch-name">${colorData.name}</span>
            </div>
        `;
    });
    
    swatchContainer.innerHTML = swatchesHtml;
    
    // Add click event listeners after DOM is updated
    const swatches = swatchContainer.querySelectorAll('.swatch');
    swatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
            const hue = parseInt(e.target.dataset.hue);
            console.log('Swatch clicked with hue:', hue);
            
            // Apply color directly and queue token update
            colorManager.queueTokenUpdate(hue);
            
            // Update display
            displayPredefinedColorScale(hue);
            
            // Update color picker if present
            const colorPicker = document.getElementById('color-picker');
            if (colorPicker) {
                // Create an OKLCH color string using the color manager
                colorPicker.value = colorManager.oklchToString(0.63, 0.17, hue);
            }
        });
    });
    
    console.log('Swatches initialized with', predefinedHues.length, 'colors');
}

// Create function shortcuts for compatibility with existing code
window.parseOklch = (color) => colorManager.parseOklch(color);
window.hexToRGBA = (hex, alpha) => colorManager.hexToRGBA(hex, alpha);
window.checkCssVariables = (hue, tolerance) => colorManager.checkCssVariables(hue, tolerance);
window.getCurrentHue = () => colorManager.getCurrentHue();
window.oklchToString = (l, c, h) => colorManager.oklchToString(l, c, h);

let testImages = [];

async function loadCoverManifest() {
    const res = await fetch('/assets/covers/manifest.json');
    if (!res.ok) {
        throw new Error(`Cover manifest not found (${res.status})`);
    }
    const data = await res.json();
    testImages = (data.covers || []).map((cover) => cover.file);
    if (!testImages.length) {
        throw new Error('Cover manifest is empty');
    }
    console.log(`Loaded ${testImages.length} cover images`);
}

// Keep track of recently used images to avoid repetition
let recentlyUsed = [];
const MAX_RECENT = 10; // Don't repeat until we've used at least 3 other images

function clearColors() {
    const extractedSwatch = document.getElementById('extracted-swatch');
    const extractedInfo = document.getElementById('extracted-info');
    const scaleContainer = document.getElementById('color-scale');
    const reloadBtn = document.getElementById('reload-btn');

    extractedSwatch.style.backgroundColor = '';
    extractedInfo.innerHTML = '';
    
    // Keep existing scale steps visible during reload — avoids white loading flash.
    // displayPredefinedColorScale updates swatches in place once the new hue is ready.
    const stepsContainer = scaleContainer.querySelector('.scale-steps-container');
    if (stepsContainer && !stepsContainer.querySelector('.scale-step')) {
        stepsContainer.replaceChildren();
    }
    
    reloadBtn.className = 'btn btn-ghost refresh-btn';
}

// Find the closest predefined hue value
function getClosestPredefinedHue(hue) {
    // Define our 12 pre-defined hue increments
    const predefinedHues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    
    // Handle edge cases and normalization
    const normalizedHue = ((hue % 360) + 360) % 360;
    
    // Find the closest predefined hue
    let closestHue = predefinedHues[0];
    let smallestDifference = Math.abs(normalizedHue - predefinedHues[0]);
    
    for (let i = 1; i < predefinedHues.length; i++) {
        const difference = Math.abs(normalizedHue - predefinedHues[i]);
        if (difference < smallestDifference) {
            smallestDifference = difference;
            closestHue = predefinedHues[i];
        }
    }
    
    return closestHue;
}

async function displayResults(colors) {
    try {
        // Validate input
        if (!colors?.original?.hex || !colors?.processed?.hex) {
            throw new Error('Invalid color data structure');
        }

        // Extract the hue value from the processed color
        const { h: extractedHue } = colorManager.parseOklch(colors.processed.oklch);
        
        // Elements we're working with
        const extractedSwatch = document.getElementById('extracted-swatch');
        const extractedInfo = document.getElementById('extracted-info');
        const reloadBtn = document.getElementById('reload-btn');
        
        // For original color, use direct styling since it's not part of our system
        extractedSwatch.style.backgroundColor = colors.original.hex;
        extractedInfo.innerHTML = `
            HEX: ${colors.original.hex}<br>
            RGB: rgb(${colors.original.rgb.join(', ')})<br>
            OKLCH: ${colors.original.oklch}
        `;
        
        // Update button using only the class
        reloadBtn.className = 'btn btn-ghost refresh-btn';
        
        // Apply instant color scale using CSS variables
        displayPredefinedColorScale(extractedHue);
        
        // Queue the token update
        colorManager.queueTokenUpdate(extractedHue);
        
        console.log(`✓ Applied color with hue: ${extractedHue.toFixed(2)}`);
    } catch (error) {
        console.error('Error displaying results:', error);
        clearColors();
    }
}

// Display a color scale using our predefined classes for instant rendering
function displayPredefinedColorScale(hue) {
    // Get or create the scale container
    const scaleContainer = document.getElementById('color-scale');
    if (!scaleContainer) return;
    
    // Get or create the steps container
    let stepsContainer = scaleContainer.querySelector('.scale-steps-container');
    if (!stepsContainer) {
        stepsContainer = document.createElement('div');
        stepsContainer.className = 'scale-steps-container';
        scaleContainer.appendChild(stepsContainer);
    }

    // Define our steps
    const steps = [
        { id: '10', l: 20.8, c: 0.0774 },
        { id: '20', l: 32.4, c: 0.1125 },
        { id: '30', l: 42.5, c: 0.1430 },
        { id: '40', l: 55.0, c: 0.1700 },
        { id: '50', l: 63.0, c: 0.1700 },
        { id: '60', l: 74.8, c: 0.1477 },
        { id: '70', l: 89.5, c: 0.0515 },
        { id: '80', l: 94.8, c: 0.0292 }
    ];

    // Only create steps if they don't exist
    if (!stepsContainer.querySelector('.scale-step')) {
        let html = '';
        steps.forEach(step => {
            html += `
                <div class="scale-step" data-step="${step.id}">
                    <div class="swatch dynamic-color-${step.id}"></div>
                    <div class="step-info">
                        <div class="step-name">Step ${step.id}</div>
                        <div class="css-var">--color-dynamic-${step.id}</div>
                        <div class="oklch-value">oklch(${step.l}% ${step.c} ${hue})</div>
                    </div>
                </div>
            `;
        });
        stepsContainer.innerHTML = html;
    }

    // Update the hue CSS variable
    document.documentElement.style.setProperty('--oklch-hue-dynamic', hue);
    
    // Update the display text for each step
    const stepElements = document.querySelectorAll('.scale-step');
    stepElements.forEach(step => {
        const stepNumber = step.getAttribute('data-step');
        const infoElement = step.querySelector('.step-info');
        if (infoElement) {
            const lightness = getComputedStyle(document.documentElement).getPropertyValue(`--oklch-lightness-${stepNumber}`).trim();
            const saturation = getComputedStyle(document.documentElement).getPropertyValue(`--oklch-saturation-${stepNumber}`).trim();
            infoElement.innerHTML = `
                <div class="step-name">Step ${stepNumber}</div>
                <div class="css-var">--color-dynamic-${stepNumber}</div>
                <div class="oklch-value">oklch(${lightness} ${saturation} ${hue})</div>
            `;
        }
    });
}

async function processImage(img) {
    try {
        clearColors();

        if (!img.complete) {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('Failed to load image'));
            });
        }

        const colors = await processor.processImage(img);
        if (!colors) throw new Error('No colors returned from processor');
        
        displayResults(colors);
    } catch (error) {
        console.error('Error processing image:', error);
        clearColors();
    }
}

function shuffleArray(array) {
    // Fisher-Yates shuffle with additional randomization
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        // Use multiple random numbers to increase entropy
        const r1 = Math.random();
        const r2 = Math.random();
        const j = Math.floor((r1 * r2) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

let imageQueue = [];
let usedImages = new Set();
let usedImagesCount = 0;
let totalCycles = 0;

function getRandomImage() {
    // If queue is empty, refill it with shuffled images
    if (imageQueue.length === 0) {
        // Check if we've used all images
        if (usedImages.size >= testImages.length) {
            totalCycles++;
            console.log(`Completed cycle ${totalCycles}. All ${testImages.length} images were used.`);
            usedImages.clear(); // Reset for next cycle
        }
        
        // Get unused images
        const unusedImages = testImages.filter(img => !usedImages.has(img));
        if (unusedImages.length === 0) {
            // If somehow all are used (shouldn't happen), reset
            usedImages.clear();
            imageQueue = shuffleArray([...testImages]);
        } else {
            // Shuffle only unused images
            imageQueue = shuffleArray(unusedImages);
        }
        console.log(`Refilled queue with ${imageQueue.length} unused images.`);
    }
    
    // Get next image from queue
    const selectedImage = imageQueue.pop();
    usedImages.add(selectedImage);
    usedImagesCount++;
    
    // Log statistics
    console.log(`Selected image: ${selectedImage}`);
    console.log(`Unique images used this cycle: ${usedImages.size}/${testImages.length}`);
    console.log(`Total images used this session: ${usedImagesCount}`);
    console.log(`Images remaining in current queue: ${imageQueue.length}`);
    
    return selectedImage;
}

async function loadRandomImage() {
    const img = document.getElementById('current-image');
    img.src = getRandomImage();
    await processImage(img);
}

async function initialize() {
    const reloadBtn = document.getElementById('reload-btn');
    reloadBtn.addEventListener('click', loadRandomImage);
    initBookTouch();
    try {
        await loadCoverManifest();
        await loadRandomImage();
    } catch (error) {
        console.error('Failed to load covers:', error);
        updateStatusDisplay('Failed to load cover images', 'error');
    }
}

document.addEventListener('DOMContentLoaded', initialize);

function displayColorScale(scale, forceCssVars) {
    const scaleContainer = document.getElementById('color-scale');
    if (!scaleContainer) return;
    
    // Clear previous content
    if (!scaleContainer.querySelector('h3')) {
        scaleContainer.innerHTML = '<h3>Color System</h3>';
    }
    
    // Create or reuse the steps container
    let stepsContainer = scaleContainer.querySelector('.scale-steps-container');
    if (!stepsContainer) {
        stepsContainer = document.createElement('div');
        stepsContainer.className = 'scale-steps-container';
        scaleContainer.appendChild(stepsContainer);
    } else {
        // Just update existing swatches instead of recreating them
        const existingSteps = stepsContainer.querySelectorAll('.scale-step');
        if (existingSteps.length > 0) {
            updateExistingSwatches(existingSteps, scale, forceCssVars);
            return;
        }
    }

    // Check if CSS variables are available first
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const cssHue = computedStyle.getPropertyValue('--oklch-hue-dynamic').trim();
    
    // If forceCssVars is explicitly set to false, don't use CSS variables
    // Otherwise, use CSS variables if they're available
    const useCssVariables = forceCssVars === false ? false : (cssHue !== '');
    
    // Pre-render the swatches in memory first
    const fragment = document.createDocumentFragment();
    
    Object.entries(scale)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([step, color]) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'scale-step';
            stepDiv.dataset.step = step;
            
            const swatch = document.createElement('div');
            swatch.className = 'swatch';
            
            // Use CSS variables when available and allowed
            if (useCssVariables) {
                // Map scale steps to our dynamic color variable names
                const mappedStep = mapScaleStepToDynamicVar(step);
                swatch.style.backgroundColor = `var(${mappedStep})`;
                swatch.classList.add('uses-css-variables');
                swatch.dataset.cssVar = mappedStep;
                // Add for the hover effect
                swatch.setAttribute('data-css-var', mappedStep);
            } else {
                swatch.style.backgroundColor = color.hex;
                swatch.classList.remove('uses-css-variables');
            }

            const stepInfo = document.createElement('div');
            stepInfo.className = 'step-info';
            
            stepInfo.innerHTML = `
                <div class="step-name">Step ${step}</div>
                ${useCssVariables 
                    ? `<div class="css-var">${mapScaleStepToDynamicVar(step)}</div>`
                    : `<div class="css-var">${color.hex}</div>`
                }
                <div class="oklch-value">${color.oklch}</div>
            `;

            stepDiv.appendChild(swatch);
            stepDiv.appendChild(stepInfo);
            fragment.appendChild(stepDiv);
        });

    // Append the pre-rendered fragment all at once (just one reflow)
    stepsContainer.appendChild(fragment);
}

// Helper function to update existing swatches instead of recreating them
function updateExistingSwatches(existingSteps, scale, forceCssVars) {
    // Check if CSS variables are available
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const cssHue = computedStyle.getPropertyValue('--oklch-hue-dynamic').trim();
    
    // If forceCssVars is explicitly set to false, don't use CSS variables
    // Otherwise, use CSS variables if they're available
    const useCssVariables = forceCssVars === false ? false : (cssHue !== '');
    
    // Get all scale entries as an array
    const scaleEntries = Object.entries(scale)
        .sort(([a], [b]) => parseInt(a) - parseInt(b));
        
    // Only update the colors, not the structural elements
    for (let i = 0; i < Math.min(existingSteps.length, scaleEntries.length); i++) {
        const stepDiv = existingSteps[i];
        const [step, color] = scaleEntries[i];
        
        // Update step data attribute
        stepDiv.dataset.step = step;
        
        // Update swatch color
        const swatch = stepDiv.querySelector('.swatch');
        if (swatch) {
            if (useCssVariables) {
                const mappedStep = mapScaleStepToDynamicVar(step);
                swatch.style.backgroundColor = `var(${mappedStep})`;
                swatch.classList.add('uses-css-variables');
                swatch.dataset.cssVar = mappedStep;
                // Add for the hover effect
                swatch.setAttribute('data-css-var', mappedStep);
            } else {
                swatch.style.backgroundColor = color.hex;
                swatch.classList.remove('uses-css-variables');
                delete swatch.dataset.cssVar;
                swatch.removeAttribute('data-css-var');
            }
        }
        
        // Update step info text
        const stepInfo = stepDiv.querySelector('.step-info');
        if (stepInfo) {
            stepInfo.innerHTML = `
                <div class="step-name">Step ${step}</div>
                ${useCssVariables 
                    ? `<div class="css-var">${mapScaleStepToDynamicVar(step)}</div>`
                    : `<div class="css-var">${color.hex}</div>`
                }
                <div class="oklch-value">${color.oklch}</div>
            `;
        }
    }
}

// Map scale steps to our dynamic CSS variable names
function mapScaleStepToDynamicVar(step) {
    // Map scale numbers to our CSS variable scheme
    const stepToVarMap = {
        '50': '--color-dynamic-10',
        '75': '--color-dynamic-20',
        '100': '--color-dynamic-30',
        '200': '--color-dynamic-40',
        '300': '--color-dynamic-50',
        '400': '--color-dynamic-60',
        '500': '--color-dynamic-70',
        '600': '--color-dynamic-80'
    };
    
    return stepToVarMap[step] || '--color-dynamic-40'; // Default if not found
}

function displayBasicColorScale(hue, forceCssVars) {
    const scaleContainer = document.getElementById('color-scale');
    if (!scaleContainer) return;
    
    // Only update the heading if it doesn't exist
    if (!scaleContainer.querySelector('h3')) {
        scaleContainer.innerHTML = '<h3>Color System (Using CSS Variables)</h3>';
    }

    // Create or reuse steps container
    let stepsContainer = scaleContainer.querySelector('.scale-steps-container');
    if (!stepsContainer) {
        stepsContainer = document.createElement('div');
        stepsContainer.className = 'scale-steps-container';
        scaleContainer.appendChild(stepsContainer);
    } else {
        // Just update existing swatches instead of recreating them
        const existingSteps = stepsContainer.querySelectorAll('.scale-step');
        if (existingSteps.length > 0) {
            updateExistingBasicSwatches(existingSteps, hue, forceCssVars);
            return;
        }
    }

    // Check if CSS variables are available
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const cssHue = computedStyle.getPropertyValue('--oklch-hue-dynamic').trim();
    
    // If forceCssVars is explicitly set to false, don't use CSS variables
    // Otherwise, use CSS variables if they're available
    const useCssVariables = forceCssVars === false ? false : (cssHue !== '');

    // Define steps that match our CSS variables
    const steps = [
        { id: '10', varName: '--color-dynamic-10', l: 0.208, c: 0.0774 },
        { id: '20', varName: '--color-dynamic-20', l: 0.324, c: 0.1125 },
        { id: '30', varName: '--color-dynamic-30', l: 0.425, c: 0.1430 },
        { id: '40', varName: '--color-dynamic-40', l: 0.550, c: 0.1700 },
        { id: '50', varName: '--color-dynamic-50', l: 0.630, c: 0.1700 },
        { id: '60', varName: '--color-dynamic-60', l: 0.748, c: 0.1477 },
        { id: '70', varName: '--color-dynamic-70', l: 0.895, c: 0.0515 },
        { id: '80', varName: '--color-dynamic-80', l: 0.948, c: 0.0292 }
    ];

    // Pre-render in memory
    const fragment = document.createDocumentFragment();

    steps.forEach(step => {
        const oklchValue = `oklch(${(step.l * 100).toFixed(2)}% ${step.c.toFixed(4)} ${hue.toFixed(2)})`;
        
        const stepDiv = document.createElement('div');
        stepDiv.className = 'scale-step';
        stepDiv.dataset.step = step.id;
        
        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        
        if (useCssVariables) {
            swatch.style.backgroundColor = `var(${step.varName})`;
            swatch.classList.add('uses-css-variables');
            swatch.dataset.cssVar = step.varName;
            // Add for the hover effect
            swatch.setAttribute('data-css-var', step.varName);
        } else {
            // For browsers that don't support OKLCH, calculate an approximate hex
            const approximateHex = processor.colorScale.approximateOklchToHex(step.l, step.c, hue);
            swatch.style.backgroundColor = approximateHex;
            swatch.style.backgroundColor = oklchValue;
            swatch.classList.remove('uses-css-variables');
            swatch.removeAttribute('data-css-var');
        }

        const stepInfo = document.createElement('div');
        stepInfo.className = 'step-info';
        
        stepInfo.innerHTML = `
            <div class="step-name">Step ${step.id}</div>
            <div class="css-var">${useCssVariables ? step.varName : oklchValue}</div>
            <div class="oklch-value">${oklchValue}</div>
        `;

        stepDiv.appendChild(swatch);
        stepDiv.appendChild(stepInfo);
        fragment.appendChild(stepDiv);
    });

    // Add all swatches at once
    stepsContainer.appendChild(fragment);
}

// Helper function to update existing basic swatches
function updateExistingBasicSwatches(existingSteps, hue, forceCssVars) {
    // Check if CSS variables are available
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const cssHue = computedStyle.getPropertyValue('--oklch-hue-dynamic').trim();
    
    // If forceCssVars is explicitly set to false, don't use CSS variables
    // Otherwise, use CSS variables if they're available
    const useCssVariables = forceCssVars === false ? false : (cssHue !== '');

    // Define steps that match our CSS variables
    const steps = [
        { id: '10', varName: '--color-dynamic-10', l: 0.208, c: 0.0774 },
        { id: '20', varName: '--color-dynamic-20', l: 0.324, c: 0.1125 },
        { id: '30', varName: '--color-dynamic-30', l: 0.425, c: 0.1430 },
        { id: '40', varName: '--color-dynamic-40', l: 0.550, c: 0.1700 },
        { id: '50', varName: '--color-dynamic-50', l: 0.630, c: 0.1700 },
        { id: '60', varName: '--color-dynamic-60', l: 0.748, c: 0.1477 },
        { id: '70', varName: '--color-dynamic-70', l: 0.895, c: 0.0515 },
        { id: '80', varName: '--color-dynamic-80', l: 0.948, c: 0.0292 }
    ];

    // Only update the swatches we have elements for
    for (let i = 0; i < Math.min(existingSteps.length, steps.length); i++) {
        const stepDiv = existingSteps[i];
        const step = steps[i];
        
        // Update step ID
        stepDiv.dataset.step = step.id;
        
        const oklchValue = `oklch(${(step.l * 100).toFixed(2)}% ${step.c.toFixed(4)} ${hue.toFixed(2)})`;
        
        // Update swatch color
        const swatch = stepDiv.querySelector('.swatch');
        if (swatch) {
            if (useCssVariables) {
                swatch.style.backgroundColor = `var(${step.varName})`;
                swatch.classList.add('uses-css-variables');
                swatch.dataset.cssVar = step.varName;
                // Add for the hover effect
                swatch.setAttribute('data-css-var', step.varName);
            } else {
                // For browsers that don't support OKLCH, calculate an approximate hex
                const approximateHex = processor.colorScale.approximateOklchToHex(step.l, step.c, hue);
                swatch.style.backgroundColor = approximateHex;
                swatch.style.backgroundColor = oklchValue;
                swatch.classList.remove('uses-css-variables');
                swatch.removeAttribute('data-css-var');
            }
        }
        
        // Update step info text
        const stepInfo = stepDiv.querySelector('.step-info');
        if (stepInfo) {
            stepInfo.innerHTML = `
                <div class="step-name">Step ${step.id}</div>
                <div class="css-var">${useCssVariables ? step.varName : oklchValue}</div>
                <div class="oklch-value">${oklchValue}</div>
            `;
        }
    }
}

/**
 * Use CSS variables for all dynamic colors
 * @param {HTMLElement} element - The element to style
 * @param {string} color - The color to apply (in OKLCH format)
 */
function applyColorToElement(element, color) {
    // Always prefer CSS variables if they exist
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const cssHue = computedStyle.getPropertyValue('--oklch-hue-dynamic').trim();
    
    if (cssHue) {
        // CSS variables exist, use them for styling
        element.style.backgroundColor = `var(--color-dynamic-40)`;
        element.style.color = 'white';
        
        // Update status display
        updateStatusDisplay('CSS variables active', 'success');
        
        console.log('CSS variables check:', {
            '--color-dynamic-40': computedStyle.getPropertyValue('--color-dynamic-40').trim(),
            '--oklch-hue-dynamic': cssHue
        });
        
        // Extract the hue from the color parameter for display purposes
        const { h } = parseOklch(color);
        console.log(`✅ Using CSS variables from tokens with extracted hue: ${h.toFixed(2)}`);
        
        // Also add classes that use CSS variables
        element.classList.add('uses-css-variables');
    } else {
        // Fallback - directly apply the color
        element.style.backgroundColor = color;
        element.style.color = 'white';
        
        // Update status display
        updateStatusDisplay('Using direct colors (CSS variables unavailable)', 'warning');
        console.warn('CSS variables not found, using direct color application');
    }
}

/**
 * Update the status display with a message
 * @param {string} message - The status message
 * @param {string} type - The status type (success, error, warning, info)
 */
function updateStatusDisplay(message, type = 'info') {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'status';
        statusElement.classList.add(type);
        statusElement.hidden = false;
    }
}

/**
 * Check if CSS variables are being applied correctly
 * @param {number} expectedHue - The expected hue value
 * @returns {boolean} Whether CSS variables are correct
 */
function verifyCssVariables(expectedHue) {
    return colorManager.checkCssVariables(expectedHue, 0.1);
}

/**
 * Process the extracted color
 * @param {string} color - The extracted color in any format
 */
async function processExtractedColor(color) {
    try {
        const { h: extractedHue } = colorManager.parseOklch(color);
        const roundedHue = parseFloat(extractedHue.toFixed(2));
        
        console.log(`Processing extracted color with hue: ${roundedHue}°`);
        
        // Apply direct CSS variables for immediate visual feedback
        colorManager.applyColorDirectly(roundedHue);
        
        // Display basic color scale for immediate feedback
        displayBasicColorScale(roundedHue, true);
        
        // Create a status element for token update status
        const statusElem = document.createElement('div');
        statusElem.className = 'status-message';
        statusElem.textContent = 'Updating tokens...';
        
        const container = document.querySelector('.content-area') || document.body;
        container.appendChild(statusElem);
        
        setTimeout(() => {
            statusElem.classList.add('visible');
        }, 10);
        
        try {
            // Start the token update process
            const result = await colorManager.updateTokens(color);
            
            if (result.success) {
                statusElem.textContent = 'Tokens updated successfully!';
                statusElem.className = 'status-message success visible';
                
                setTimeout(() => {
                    statusElem.classList.remove('visible');
                    setTimeout(() => {
                        if (statusElem.parentNode) {
                            statusElem.parentNode.removeChild(statusElem);
                        }
                    }, 300);
                }, 2000);
                
                return true;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            statusElem.textContent = `Error: ${error.message}`;
            statusElem.className = 'status-message error visible';
            
            setTimeout(() => {
                statusElem.classList.remove('visible');
                setTimeout(() => {
                    if (statusElem.parentNode) {
                        statusElem.parentNode.removeChild(statusElem);
                    }
                }, 300);
            }, 3000);
            
            console.error('Token update failed:', error);
            return false;
        }
    } catch (error) {
        console.error('Processing extracted color failed:', error);
        return false;
    }
} 