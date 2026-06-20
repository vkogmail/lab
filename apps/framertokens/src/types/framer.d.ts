declare module "framer-plugin" {
  export interface CanvasNode {
    id: string;
    name: string;
    getAttribute(name: string): string | null;
    setAttributes(attributes: Record<string, any>): void;
    setPluginData(key: string, value: string): void;
    getPluginData(key: string): Promise<string | null>;
  }

  export interface Framer {
    showUI(options: { position: string; width: number; height: number }): void;
    notify(message: string): void;
    subscribeToSelection(callback: (selection: CanvasNode[]) => void): () => void;
    getNode(id: string): Promise<CanvasNode | null>;
    getSelection(): Promise<CanvasNode[]>;
    getNodesWithType(type: string): Promise<CanvasNode[]>;
    getNodesWithAttribute(attribute: string): Promise<CanvasNode[]>;
  }

  export const framer: Framer;
  export class LinearGradient {
    constructor(options: { angle: number; stops: Array<{ position: number; color: string }> });
  }
} 