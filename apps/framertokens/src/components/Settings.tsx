import React, { useState, useEffect } from 'react';
import { GitHubService, GitHubConfig } from '../services/github';
import { StorageService } from '../services/storage';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const parseRepoUrl = (url: string) => {
  // Remove any GitHub URL prefix if present
  const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '');
  const parts = cleanUrl.split('/');
  
  if (parts.length >= 2) {
    return {
      owner: parts[0],
      repo: parts[1],
    };
  }
  return null;
};

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [githubToken, setGithubToken] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [tokenPath, setTokenPath] = useState('tokens/');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedSettings = StorageService.getGitHubSettings();
      if (savedSettings) {
        setGithubToken(savedSettings.token);
        setRepoUrl(savedSettings.repoUrl);
        setBranch(savedSettings.branch);
        setTokenPath(savedSettings.tokenPath);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTestStatus('testing');
    setErrorMessage(null);

    const repoInfo = parseRepoUrl(repoUrl);
    if (!repoInfo) {
      setErrorMessage('Invalid repository URL format');
      setTestStatus('error');
      return;
    }

    try {
      const github = new GitHubService({
        token: githubToken,
        ...repoInfo,
        branch,
        path: tokenPath,
      });
      
      const isConnected = await github.testConnection();
      setTestStatus(isConnected ? 'success' : 'error');
      setErrorMessage(isConnected 
        ? '✅ Connection successful! Repository access verified.'
        : '❌ Connection failed. Please check your credentials.');
    } catch (error) {
      setTestStatus('error');
      setErrorMessage(`❌ ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const handleSave = () => {
    StorageService.saveGitHubSettings({
      token: githubToken,
      repoUrl,
      branch,
      tokenPath,
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>GitHub Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="githubToken">Personal Access Token</label>
            <input
              type="password"
              id="githubToken"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
            />
          </div>
          <div className="form-group">
            <label htmlFor="repoUrl">Repository URL</label>
            <input
              type="text"
              id="repoUrl"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="owner/repository"
            />
          </div>
          <div className="form-group">
            <label htmlFor="branch">Branch</label>
            <input
              type="text"
              id="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
            />
          </div>
          <div className="form-group">
            <label htmlFor="tokenPath">Tokens Path</label>
            <input
              type="text"
              id="tokenPath"
              value={tokenPath}
              onChange={(e) => setTokenPath(e.target.value)}
              placeholder="tokens/"
            />
          </div>
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
          <div className="button-group">
            <button 
              className={`test-button ${testStatus === 'success' ? 'success' : ''}`}
              onClick={handleTest}
              disabled={testStatus === 'testing'}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2.5V13.5M8 13.5L13 8.5M8 13.5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Test Connection
            </button>
            <button 
              className="save-button" 
              onClick={handleSave}
              disabled={testStatus !== 'success'}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.3333 7.33333V11.3333C13.3333 12.8061 12.139 14 10.6667 14H4.66667C3.19391 14 2 12.8061 2 11.3333V5.33333C2 3.86057 3.19391 2.66667 4.66667 2.66667H8.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 7.33333L8 9.33333L14 3.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
