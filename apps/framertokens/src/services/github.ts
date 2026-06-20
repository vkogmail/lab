import { Octokit } from '@octokit/rest';
import { logger } from '../config/logging';

export interface GitHubConfig {
  token: string;
  repo: string;
  owner: string;
  branch: string;
  path: string;
}

export class GitHubService {
  private baseUrl: string;
  private headers: Headers;
  private owner: string;
  private repo: string;
  private path: string;
  private token: string;

  constructor(config: GitHubConfig) {
    logger.debug('sync', 'Initializing GitHub service with:', {
      ...config,
      hasToken: !!config.token
    });
    this.owner = config.owner;
    this.repo = config.repo;
    this.token = config.token;
    
    // Remove trailing slash if present in path
    this.path = config.path.endsWith('/') ? config.path.slice(0, -1) : config.path;
    
    this.baseUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${this.path}`;
    
    this.headers = new Headers({
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json'
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}`, {
        headers: this.headers
      });
      return response.ok;
    } catch (error) {
      logger.error('sync', 'Connection test failed:', error);
      return false;
    }
  }

  async fetchTokens(): Promise<any> {
    try {
      logger.group('sync', 'Fetching Tokens');
      logger.debug('sync', 'Fetching from:', this.baseUrl);
      
      const allFiles = await this.getAllFiles();
      logger.debug('sync', 'All found files:', allFiles.map(f => f.path));

      const tokens: Record<string, any> = {};

      for (const file of allFiles) {
        if (file.name.endsWith('.json')) {
          logger.debug('sync', `Fetching ${file.path}...`);
          try {
            const response = await fetch(file.url, {
              headers: this.headers
            });
            
            if (!response.ok) {
              logger.error('sync', `Failed to fetch ${file.path}: ${response.status}`);
              continue;
            }
            
            const data = await response.json();
            const content = JSON.parse(atob(data.content));
            const name = file.path.replace(`${this.path}/`, '');
            tokens[name] = content;
          } catch (error) {
            logger.error('sync', `Error processing ${file.path}:`, error);
          }
        }
      }

      logger.groupEnd('sync');
      return tokens;
    } catch (error) {
      logger.error('sync', 'Error in fetchTokens:', error);
      throw error;
    }
  }

  private async getAllFiles(path = ''): Promise<any[]> {
    const url = path ? `${this.baseUrl}${path}` : this.baseUrl;
    const response = await fetch(url, {
      headers: this.headers
    });

    if (!response.ok) {
      logger.error('sync', `Failed to fetch directory: ${response.status}, ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const items = await response.json();
    let files: any[] = [];

    for (const item of items) {
      if (item.type === 'file') {
        files.push(item);
      } else if (item.type === 'dir') {
        const subFiles = await this.getAllFiles(`/${item.name}`);
        files = files.concat(subFiles);
      }
    }

    return files;
  }

  async fetchFile(filename: string): Promise<any> {
    const response = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.path}/${filename}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}`);
    }

    return response.json();
  }
}
