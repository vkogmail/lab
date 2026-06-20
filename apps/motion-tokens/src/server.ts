import express, { Request, Response, NextFunction } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import net from 'net';
// ... existing imports ...

const execAsync = promisify(exec);

// Fix __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root directory (2 levels up from dist/server.js)
const PROJECT_ROOT = path.resolve(__dirname, '..');
console.log('Project root:', PROJECT_ROOT);
console.log('Current working directory:', process.cwd());

// Constants for token paths
const TOKEN_BASE_PATH = path.join('src', 'tokens', 'Origin', 'Source');

// CORS configuration
const corsOptions = {
  origin: [
    'https://afaeroglobal.vercel.app',
    'http://localhost:5173', // Vite dev server
    'http://localhost:4173'  // Vite preview
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Function to find an available port
async function findAvailablePort(startPort: number): Promise<number> {
  const isPortAvailable = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port);
    });
  };

  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
  }
  return port;
}

interface ExecRequest {
  command: string;
}

interface ExecResponse {
  success: boolean;
  output?: string;
  error?: string | null;
}

interface SaveTokenRequest {
  tokenSet: 'aeroglobal' | 'branda';
  tokenPath: string;
  value: any;
  type: string;
  shouldBuild: boolean;
}

// List of allowed commands for security
const ALLOWED_COMMANDS = [
  'npm run build',
  /^echo '.+' > src\/tokens\/Origin\/Source\/(Aeroglobal|Branda)\.json$/
];

export function createServer() {
  const app = express();
  
  // Add middleware
  app.use(cors(corsOptions));
  app.use(express.json());

  // Log all requests
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });

  // Add save-token endpoint
  app.post('/save-token', (req: Request<{}, any, SaveTokenRequest>, res: Response) => {
    (async () => {
      try {
        // Log the full request details
        console.log('Save token request details:', {
          body: req.body,
          headers: req.headers,
          currentDir: process.cwd(),
          projectRoot: PROJECT_ROOT
        });

        const { tokenSet, tokenPath, value, type, shouldBuild } = req.body;
        
        // Validate request body
        if (!tokenSet || !tokenPath || !value || !type) {
          const validationError = {
            success: false,
            error: 'Missing required fields',
            details: { tokenSet, tokenPath, value, type }
          };
          console.error('Validation error:', validationError);
          return res.status(400).json(validationError);
        }

        // Validate the token set
        if (!['aeroglobal', 'branda'].includes(tokenSet)) {
          const invalidSetError = {
            success: false,
            error: 'Invalid token set',
            details: { providedSet: tokenSet }
          };
          console.error('Invalid token set:', invalidSetError);
          return res.status(400).json(invalidSetError);
        }

        // Get the absolute path to the tokens directory
        const fileName = `${tokenSet === 'aeroglobal' ? 'Aeroglobal' : 'Branda'}.json`;
        const tokenFilePath = path.join(PROJECT_ROOT, TOKEN_BASE_PATH, fileName);

        // Log file path details and attempt to read
        console.log('Token file details:', {
          tokenFilePath,
          fileName,
          projectRoot: PROJECT_ROOT,
          absolutePath: path.resolve(tokenFilePath),
          exists: await fs.access(tokenFilePath).then(() => true).catch(() => false),
          dirContents: await fs.readdir(path.join(PROJECT_ROOT, TOKEN_BASE_PATH)).catch(err => ({ error: err.message }))
        });

        let fileContent;
        try {
          fileContent = await fs.readFile(tokenFilePath, 'utf-8');
          console.log('Successfully read token file, length:', fileContent.length);
        } catch (err: any) {
          const readError = {
            success: false,
            error: `Failed to read token file: ${err.message}`,
            details: {
              path: tokenFilePath,
              code: err.code,
              errno: err.errno,
              syscall: err.syscall
            }
          };
          console.error('File read error:', readError);
          return res.status(500).json(readError);
        }

        let tokens;
        try {
          tokens = JSON.parse(fileContent);
          console.log('Successfully parsed token file, keys:', Object.keys(tokens));
        } catch (err: any) {
          const parseError = {
            success: false,
            error: `Failed to parse token file: ${err.message}`,
            details: {
              fileContent: fileContent.substring(0, 100) + '...',
              error: err.message
            }
          };
          console.error('JSON parse error:', parseError);
          return res.status(500).json(parseError);
        }

        // Update the token at the specified path
        const pathParts = tokenPath.split('.');
        let current = tokens;
        
        // Navigate to the correct nested location
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) {
            current[pathParts[i]] = {};
          }
          current = current[pathParts[i]];
        }

        // Update the token
        current[pathParts[pathParts.length - 1]] = {
          value,
          type,
        };

        // Log the update details
        console.log('Token update details:', {
          path: tokenFilePath,
          tokenPath,
          pathParts,
          updatedValue: current[pathParts[pathParts.length - 1]]
        });
        
        try {
          await fs.writeFile(tokenFilePath, JSON.stringify(tokens, null, 2), 'utf-8');
          console.log('Successfully wrote token file');
        } catch (err: any) {
          const writeError = {
            success: false,
            error: `Failed to write token file: ${err.message}`,
            details: {
              path: tokenFilePath,
              code: err.code,
              errno: err.errno,
              syscall: err.syscall
            }
          };
          console.error('File write error:', writeError);
          return res.status(500).json(writeError);
        }

        // Run build if requested
        if (shouldBuild) {
          console.log('Running build...');
          try {
            // Change to the project root directory before running build
            const buildCommand = `cd "${PROJECT_ROOT}" && npm run build`;
            console.log('Executing build command:', buildCommand);
            const { stdout, stderr } = await execAsync(buildCommand);
            console.log('Build output:', { stdout, stderr });
          } catch (buildError: any) {
            const buildFailError = {
              success: false,
              error: 'Build failed: ' + buildError.message,
              details: {
                stdout: buildError.stdout,
                stderr: buildError.stderr,
                command: buildError.cmd,
                code: buildError.code
              },
              tokens
            };
            console.error('Build error:', buildFailError);
            return res.status(500).json(buildFailError);
          }
        }

        res.json({
          success: true,
          tokens
        });
      } catch (error: any) {
        const unexpectedError = {
          success: false,
          error: 'Unexpected error: ' + error.message,
          details: {
            stack: error.stack,
            code: error.code,
            errno: error.errno,
            syscall: error.syscall
          }
        };
        console.error('Unexpected error:', unexpectedError);
        res.status(500).json(unexpectedError);
      }
    })();
  });

  // Add command execution endpoint
  app.post('/api/exec', (req: Request<{}, any, ExecRequest>, res: Response) => {
    (async () => {
      const { command } = req.body;

      // Security check: Only allow specific commands
      const isAllowed = ALLOWED_COMMANDS.some(allowed => 
        typeof allowed === 'string' 
          ? command === allowed 
          : allowed.test(command)
      );

      if (!isAllowed) {
        res.status(403).json({ error: 'Command not allowed' } as ExecResponse);
        return;
      }

      try {
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr) {
          console.error('Command stderr:', stderr);
        }

        res.json({ 
          success: true, 
          output: stdout,
          error: stderr || null
        } as ExecResponse);
      } catch (error: any) {
        console.error('Command execution error:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        } as ExecResponse);
      }
    })();
  });

  // Error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error'
    });
  });

  // Start the server
  const startServer = async () => {
    let currentPort = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    let maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const port = await findAvailablePort(currentPort);
        console.log(`Attempting to start server on port ${port}...`);
        
        const server = app.listen(port, () => {
          console.log(`Server successfully running on port ${port}`);
          console.log('Server initialized with:');
          console.log('- Project root:', PROJECT_ROOT);
          console.log('- Current working directory:', process.cwd());
        });

        // Handle server errors
        server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use`);
            currentPort = port + 1;
            attempts++;
          } else {
            console.error('Server error:', error);
            process.exit(1);
          }
        });

        // If we get here, server started successfully
        return;
      } catch (err) {
        console.error(`Attempt ${attempts + 1} failed:`, err);
        currentPort++;
        attempts++;
      }
    }

    // If we get here, we failed to start after max attempts
    console.error(`Failed to start server after ${maxAttempts} attempts`);
    process.exit(1);
  };

  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

  return app;
} 

// Create and start the server
createServer(); 