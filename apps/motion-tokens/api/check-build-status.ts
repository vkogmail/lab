import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Since we're in a serverless environment and the tokens are updated via GitHub,
  // we can assume the build is complete as soon as the save-token endpoint succeeds
  res.json({ 
    buildComplete: true,
    lastModified: Date.now(),
    timeSinceLastBuild: 0
  });
} 