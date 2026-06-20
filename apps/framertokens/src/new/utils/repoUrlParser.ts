interface RepoInfo {
  owner: string;
  repo: string;
}

export function parseRepoUrl(url: string): RepoInfo | null {
  try {
    let match;
    
    // Handle shorthand format (owner/repo)
    if (!url.includes('github.com') && !url.startsWith('git@')) {
      match = url.match(/^([\w.-]+)\/([\w.-]+)$/);
      if (match) {
        const [, owner, repo] = match;
        return { owner, repo: repo.replace('.git', '') };
      }
    }
    
    // Handle HTTPS format: https://github.com/owner/repo.git
    if (url.includes('github.com')) {
      match = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+)(?:\.git)?/);
    } 
    // Handle SSH format: git@github.com:owner/repo.git
    else if (url.startsWith('git@')) {
      match = url.match(/git@github\.com:([\w.-]+)\/([\w.-]+)(?:\.git)?/);
    }

    if (!match) {
      console.error('Invalid GitHub URL format:', url);
      return null;
    }

    const [, owner, repo] = match;
    return { owner, repo: repo.replace('.git', '') };
  } catch (error) {
    console.error('Error parsing GitHub URL:', error);
    return null;
  }
}
