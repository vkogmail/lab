import { framer, CanvasNode } from "framer-plugin";

export interface TokenMetadata {
  tokenName: string;
  tokenSet: string;
  nodeId: string;
}

export interface TokenNodeManagerInterface {
  setTokenMetadata(node: CanvasNode, tokenName: string, tokenSet: string): Promise<void>;
  getTokenMetadata(node: CanvasNode): Promise<TokenMetadata | null>;
  removeTokenMetadata(node: CanvasNode): Promise<void>;
  updateNodesWithToken(tokenName: string, newStyle: any): Promise<void>;
  clearTokens(): void;
  getNodesForToken(tokenName: string): Promise<CanvasNode[]>;
  getAllNodes(): Promise<{ node: CanvasNode; metadata: TokenMetadata }[]>;
}

class TokenNodeManager implements TokenNodeManagerInterface {
  private tokenStore: Map<string, TokenMetadata> = new Map();
  private nodeIndex: Map<string, Set<string>> = new Map(); // Token name to node IDs

  async setTokenMetadata(node: CanvasNode, tokenName: string, tokenSet: string) {
    const metadata: TokenMetadata = {
      tokenName,
      tokenSet,
      nodeId: node.id
    };
    
    this.tokenStore.set(node.id, metadata);
    
    // Update index
    if (!this.nodeIndex.has(tokenName)) {
      this.nodeIndex.set(tokenName, new Set());
    }
    this.nodeIndex.get(tokenName)?.add(node.id);

    // Store metadata on node for persistence
    await node.setPluginData('tokenMetadata', JSON.stringify(metadata));
  }

  async getTokenMetadata(node: CanvasNode): Promise<TokenMetadata | null> {
    // Try to get from store first
    const metadata = this.tokenStore.get(node.id);
    if (metadata) return metadata;

    // Try to recover from node plugin data
    try {
      const storedData = await node.getPluginData('tokenMetadata');
      if (storedData) {
        const metadata = JSON.parse(storedData) as TokenMetadata;
        this.tokenStore.set(node.id, metadata);
        return metadata;
      }
    } catch (error) {
      console.warn('Failed to parse stored token metadata:', error);
    }

    return null;
  }

  async removeTokenMetadata(node: CanvasNode) {
    const metadata = this.tokenStore.get(node.id);
    if (metadata) {
      this.nodeIndex.get(metadata.tokenName)?.delete(node.id);
      this.tokenStore.delete(node.id);
    }
    await node.setPluginData('tokenMetadata', '');
  }

  async updateNodesWithToken(tokenName: string, newStyle: any) {
    const nodeIds = this.nodeIndex.get(tokenName);
    if (!nodeIds) return;

    for (const nodeId of nodeIds) {
      try {
        const node = await this.getNodeById(nodeId);
        if (node) {
          await node.setAttributes(newStyle);
        } else {
          // Clean up index if node no longer exists
          nodeIds.delete(nodeId);
          this.tokenStore.delete(nodeId);
        }
      } catch (error) {
        console.warn(`Failed to update node ${nodeId} with token ${tokenName}:`, error);
      }
    }
  }

  clearTokens() {
    // Only clear the in-memory stores
    this.tokenStore.clear();
    this.nodeIndex.clear();
  }

  async getNodesForToken(tokenName: string): Promise<CanvasNode[]> {
    const nodeIds = this.nodeIndex.get(tokenName);
    if (!nodeIds) return [];

    const nodes: CanvasNode[] = [];
    for (const id of nodeIds) {
      const node = await this.getNodeById(id);
      if (node) nodes.push(node);
    }
    return nodes;
  }

  async getAllNodes(): Promise<{ node: CanvasNode; metadata: TokenMetadata }[]> {
    const result: { node: CanvasNode; metadata: TokenMetadata }[] = [];
    
    for (const [nodeId, metadata] of this.tokenStore.entries()) {
      try {
        const node = await this.getNodeById(nodeId);
        if (node) {
          result.push({ node, metadata });
        } else {
          // Clean up if node no longer exists
          this.tokenStore.delete(nodeId);
          this.nodeIndex.get(metadata.tokenName)?.delete(nodeId);
        }
      } catch (error) {
        console.warn(`Failed to get node ${nodeId}:`, error);
      }
    }
    
    return result;
  }

  private async getNodeById(id: string): Promise<CanvasNode | null> {
    try {
      return await framer.getNode(id);
    } catch (error) {
      console.warn(`Failed to get node by ID ${id}:`, error);
      return null;
    }
  }
}

export const tokenNodeManager = new TokenNodeManager(); 