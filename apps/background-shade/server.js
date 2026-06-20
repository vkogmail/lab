/**
 * BackgroundShade Server
 * 
 * This Express server provides APIs for running Style Dictionary builds
 * when tokens are updated through the Figma plugin.
 */
import express from 'express';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { ensureDirectoryExists } from './utils/serverUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for cross-origin requests (important for development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// API Routes
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Add a lock for Style Dictionary builds to prevent concurrent builds
let buildLock = false;
let buildQueue = 0;

/**
 * Build Tokens Endpoint
 * 
 * This endpoint runs the Style Dictionary build process to generate CSS from tokens.
 * It should be called when tokens are updated through the Figma plugin.
 */
app.post('/api/buildTokens', async (req, res) => {
    try {
        // Check if a build is already in progress and handle queuing
        if (buildLock) {
            console.log('Build already in progress, queueing this request');
            buildQueue++;
            
            // If too many builds are queued, just return success with current timestamp
            if (buildQueue > 2) {
                console.log('Too many builds queued, returning current status');
                buildQueue--;
                return res.json({ 
                    success: true, 
                    message: 'Build already in progress, using current CSS',
                    timestamp: Date.now()
                });
            }
            
            // Wait for current build to finish before proceeding
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (!buildLock) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }
        
        console.log('Acquiring build lock...');
        buildLock = true;
        buildQueue = Math.max(0, buildQueue - 1);
        
        try {
            console.log('Running Style Dictionary build...');
            
            // Run Style Dictionary build
            execSync('node_modules/.bin/style-dictionary build --config sd.config.mjs', { 
                cwd: __dirname,
                encoding: 'utf8'
            });
            
            console.log('Style Dictionary build completed');
            buildLock = false;
            
            return res.json({
                success: true,
                message: 'Tokens built successfully',
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error during Style Dictionary build:', error);
            buildLock = false;
            return res.status(500).json({
                success: false,
                message: 'Error during Style Dictionary build: ' + error.message
            });
        }
    } catch (error) {
        buildLock = false;
        console.error('Unexpected error:', error);
        return res.status(500).json({
            success: false,
            message: 'Unexpected error: ' + error.message
        });
    }
});

// Mount API routes
app.use('/api', apiRouter);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Server startup
const PORT = process.env.PORT || 3000;

// Initialize server with port finding capability
const startServer = async (port) => {
  return new Promise((resolve, reject) => {
    // Try to start the server on the specified port
    const server = app.listen(port)
      .on('listening', () => {
        console.log(`✅ Server is running on http://localhost:${port}`);
        console.log(`💡 API endpoints available at http://localhost:${port}/api`);
        resolve(server);
      })
      .on('error', (err) => {
        // If port is in use, try the next port
        if (err.code === 'EADDRINUSE') {
          console.log(`⚠️ Port ${port} is already in use, trying ${port + 1}...`);
          server.close();
          startServer(port + 1).then(resolve).catch(reject);
        } else {
          console.error('Failed to start server:', err);
          reject(err);
        }
      });
  });
};

// Start the server
let server;
startServer(PORT)
  .then(serverInstance => {
    server = serverInstance;
  })
  .catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}); 