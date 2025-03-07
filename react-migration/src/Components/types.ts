export type TreeDataset = Object | Object[];

export enum TreeLinkStyle {
    CURVE = "curve",
    STRAIGHT = "straight",
}

export enum Direction {
    VERTICAL = "vertical",
    HORIZONTAL = "horizontal",
}

export interface Config {
    nodeWidth: number;
    nodeHeight: number;
    levelHeight: number;
}

export interface NodeDatum {
    x: number;
    y: number;
    // Add other properties as needed
}

// Define interface for link data
export interface LinkDatum {
    source: NodeDatum;
    target: NodeDatum;
}


// 

export interface RawTreeNode {
    name?: string;
    children?: RawTreeNode[] | null; // Should store raw children before converting to d3 hierarchy
    collapsed?: boolean;
    collapsible?: boolean;
    [key: string]: any; // Allows extra properties
}

export type D3TreeNode = d3.HierarchyNode<RawTreeNode>

