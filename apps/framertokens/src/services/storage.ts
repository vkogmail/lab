import { TokenNodeRelationship } from './tokenNodeManager';

export interface GitHubSettings {
  token: string;
  repoUrl: string;
  branch: string;
  tokenPath: string;
}

export interface NodeTokenMapping {
  tokenPath: string;
  tokenSet: string;
  lastApplied: number;
  property: string;
}

export interface PluginState {
  selectedTheme: string | null;
  enabledTokenSets: Record<string, boolean>;
  expandedThemes: Record<string, boolean>;
  lastSyncTimestamp: number;
  tokenSetState: Record<string, boolean>;
  selectedSet: string | null;
  viewMode: 'theme' | 'set';
  nodeTokenMappings: Record<string, NodeTokenMapping>;
  enabledThemes: string[];
  tokenRelationships: TokenNodeRelationship[];
}

export interface TokenNodeState {
  relationships: TokenNodeRelationship[];
  timestamp: number;
}

export class StorageService {
  private static GITHUB_SETTINGS_KEY = 'github_settings';
  private static PLUGIN_STATE_KEY = 'plugin_state';

  static saveGitHubSettings(settings: GitHubSettings): void {
    localStorage.setItem(
      this.GITHUB_SETTINGS_KEY, 
      JSON.stringify(settings)
    );
  }

  static getGitHubSettings(): GitHubSettings | null {
    const settings = localStorage.getItem(this.GITHUB_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : null;
  }

  static async savePluginState(state: Partial<PluginState>): Promise<void> {
    const currentState = await this.getPluginState() || {
      nodeTokenMappings: {}
    };
    
    const newState = { 
      ...currentState, 
      ...state,
      nodeTokenMappings: {
        ...currentState.nodeTokenMappings,
        ...(state.nodeTokenMappings || {})
      }
    };
    
    try {
      localStorage.setItem(this.PLUGIN_STATE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to save plugin state:', error);
    }
  }

  static async getPluginState(): Promise<PluginState | null> {
    try {
      const data = localStorage.getItem(this.PLUGIN_STATE_KEY);
      if (!data) return null;
      
      const state = JSON.parse(data);
      // Ensure nodeTokenMappings exists
      state.nodeTokenMappings = state.nodeTokenMappings || {};
      return state;
    } catch (error) {
      console.error('Failed to get plugin state:', error);
      return null;
    }
  }

  static async saveNodeTokenMapping(
    nodeId: string, 
    tokenPath: string, 
    tokenSet: string,
    property: string
  ): Promise<void> {
    const state = await this.getPluginState() || { nodeTokenMappings: {} };
    
    state.nodeTokenMappings[nodeId] = {
      tokenPath,
      tokenSet,
      property,
      lastApplied: Date.now()
    };

    await this.savePluginState({ nodeTokenMappings: state.nodeTokenMappings });
  }

  static async removeNodeTokenMapping(nodeId: string): Promise<void> {
    const state = await this.getPluginState();
    if (!state?.nodeTokenMappings) return;

    delete state.nodeTokenMappings[nodeId];
    await this.savePluginState({ nodeTokenMappings: state.nodeTokenMappings });
  }

  static async getNodeTokenMapping(nodeId: string): Promise<NodeTokenMapping | null> {
    const state = await this.getPluginState();
    return state?.nodeTokenMappings?.[nodeId] || null;
  }

  static async getAllNodeTokenMappings(): Promise<Record<string, NodeTokenMapping>> {
    const state = await this.getPluginState();
    return state?.nodeTokenMappings || {};
  }

  static async saveTokenNodeState(state: TokenNodeState): Promise<void> {
    try {
      localStorage.setItem('token_node_state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save token node state:', error);
    }
  }

  static async getTokenNodeState(): Promise<TokenNodeState | null> {
    try {
      const data = localStorage.getItem('token_node_state');
      if (!data) return null;
      
      const state = JSON.parse(data);
      return state;
    } catch (error) {
      console.error('Failed to get token node state:', error);
      return null;
    }
  }
}
