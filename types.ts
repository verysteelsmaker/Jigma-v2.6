export enum NodeType {
  PERSON = 'person',
  EMAIL = 'email',
  WEBSITE = 'website',
  CUSTOM = 'custom',
  GROUP = 'group',
}

export interface NodeData extends Record<string, unknown> {
  label: string;
  value: string; // Primary value
  additionalValues?: string[]; // Extra fields
  fieldLabels?: string[]; // Labels for fields
  type: NodeType | string;
  color?: string; 
  aiComment?: string;
  aiImage?: string;
  userImage?: string; // Manual user image
  userComment?: string; // Manual user comment
  attachedFile?: {
    name: string;
    url: string;
    type: string;
    size?: number;
  };
  isLoading?: boolean;
  isDeleting?: boolean; // For exit animation
  // Group specific
  width?: number;
  height?: number;
  frozen?: boolean; // Toggle state for group interaction
}

export interface CustomNodeTypeDefinition {
  id: string;
  label: string;
  color: string;
  type: NodeType;
  fieldCount: number; // How many inputs
}

export interface GraphPath {
  id: string;
  path: string[];
}

export interface DraggedItem {
    type: NodeType;
    label: string;
    color: string;
    fieldCount: number;
    image?: string;
}

export interface GeneratedGraphData {
  nodes: {
    id: string;
    label: string;
    type: string;
    value: string;
    color: string;
  }[];
  edges: {
    source: string;
    target: string;
    label?: string;
  }[];
}