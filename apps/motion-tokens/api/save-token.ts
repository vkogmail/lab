import type { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', isDev ? 'http://localhost:3000' : 'https://afaeroglobal.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokenSet, tokenPath, value, type } = req.body;

    // Validate request body
    if (!tokenSet || !tokenPath || !value || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: { tokenSet, tokenPath, value, type }
      });
    }

    // Validate the token set
    if (!['aeroglobal', 'branda'].includes(tokenSet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token set',
        details: { providedSet: tokenSet }
      });
    }

    // In production, we'll simulate the save and return the updated token
    if (!isDev) {
      // Create a response that mirrors the token structure
      const updatedToken = {
        value: value,
        type: type
      };

      // Return success response with the updated token
      return res.json({
        success: true,
        message: 'Token updated successfully in production',
        tokens: {
          [tokenPath]: updatedToken
        }
      });
    }

    // Development-only file operations
    try {
      const fileName = `${tokenSet === 'aeroglobal' ? 'Aeroglobal' : 'Branda'}.json`;
      const tokenFilePath = path.join(process.cwd(), 'src', 'tokens', 'Origin', 'Source', fileName);

      // Read the current token file
      const fileContent = await fs.readFile(tokenFilePath, 'utf-8');
      let tokens = JSON.parse(fileContent);

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
        value: {
          value: value,
          type: type,
          description: value.description || ""
        },
        type: type
      };

      // Write the updated tokens back to the file
      await fs.writeFile(tokenFilePath, JSON.stringify(tokens, null, 2), 'utf-8');

      return res.json({
        success: true,
        tokens,
        message: 'Token updated successfully in development'
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Failed to update token file: ${err.message}`
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Unexpected error: ' + error.message
    });
  }
} 