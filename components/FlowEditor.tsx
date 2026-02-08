import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Node,
  Edge,
  ReactFlowInstance,
  NodeTypes,
  EdgeTypes,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { CustomNode } from './nodes/CustomNode';
import { GroupNode } from './nodes/GroupNode';
import { CustomEdge } from './edges/CustomEdge';
import ResultModal from './ResultModal';
import Button from './ui/Button';
import { NodeType, NodeData, DraggedItem } from '../types';
import { Database, Plus, Minus, Maximize, Download, Loader2, Undo, Redo, FolderPlus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useHistory } from '../contexts/HistoryContext';

const nodeTypes: NodeTypes = {
  [NodeType.PERSON]: CustomNode,
  [NodeType.EMAIL]: CustomNode,
  [NodeType.WEBSITE]: CustomNode,
  [NodeType.CUSTOM]: CustomNode,
  [NodeType.GROUP]: GroupNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

let id = 0;
const getId = () => `node_${id++}_${Date.now()}`; // Unique ID generation

// Custom Controls Component
const CustomControls: React.FC = () => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const { t } = useLanguage();
    const { undo, redo, canUndo, canRedo } = useHistory();

    return (
        <div className="absolute bottom-6 left-6 flex flex-col rounded-lg shadow-lg border overflow-hidden z-20 transition-all bg-neutral-800 border-neutral-700">
            <ControlBtn onClick={undo} icon={<Undo size={18} />} label="Undo (Ctrl+Z)" disabled={!canUndo} />
            <div className="h-px w-full bg-neutral-700"></div>
            <ControlBtn onClick={redo} icon={<Redo size={18} />} label="Redo (Ctrl+Y)" disabled={!canRedo} />
            <div className="h-px w-full bg-neutral-700"></div>
            <ControlBtn onClick={() => zoomIn()} icon={<Plus size={20} />} label={t.editor.zoomIn} />
            <div className="h-px w-full bg-neutral-700"></div>
            <ControlBtn onClick={() => zoomOut()} icon={<Minus size={20} />} label={t.editor.zoomOut} />
            <div className="h-px w-full bg-neutral-700"></div>
            <ControlBtn onClick={() => fitView({ duration: 800 })} icon={<Maximize size={18} />} label={t.editor.fit} />
        </div>
    );
};

const ControlBtn: React.FC<{ onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean }> = ({ onClick, icon, label, disabled }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`p-3 flex items-center justify-center transition-colors relative group 
            ${disabled ? 'text-neutral-600 cursor-not-allowed' : 'hover:bg-neutral-700 text-neutral-300'}`}
        title={label}
    >
        {icon}
        {/* Tooltip */}
        <span className="absolute left-full ml-3 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md font-medium z-50 bg-neutral-900 text-white border border-neutral-700">
            {label}
        </span>
    </button>
);

interface FlowEditorProps {
    nodes: Node<NodeData>[];
    edges: Edge[];
    onNodesChange: OnNodesChange<Node<NodeData>>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: React.Dispatch<React.SetStateAction<Node<NodeData>[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    animationsEnabled: boolean;
    draggedItem: DraggedItem | null;
    onGroupSelection: () => void;
}

const FlowEditor: React.FC<FlowEditorProps> = ({ 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    setNodes, 
    setEdges,
    animationsEnabled,
    draggedItem,
    onGroupSelection
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedData, setGeneratedData] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const { t } = useLanguage();
  const { takeSnapshot } = useHistory();
  
  // Update edges when animationsEnabled changes
  useEffect(() => {
    setEdges((eds) => 
        eds.map((e) => ({
            ...e,
            animated: animationsEnabled
        }))
    );
  }, [animationsEnabled, setEdges]);

  // Clean up ghost node when drag ends (draggedItem becomes null)
  useEffect(() => {
      if (!draggedItem) {
          setNodes((nds) => nds.filter((n) => n.id !== 'jigma-ghost-node'));
      }
  }, [draggedItem, setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (draggedItem && reactFlowInstance) {
        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        // Center cursor roughly on the node header
        const centeredPosition = {
            x: position.x - 140, // Half of min-width 280
            y: position.y - 20   // Approximate header half height
        };

        setNodes((nds) => {
            const ghostExists = nds.some(n => n.id === 'jigma-ghost-node');
            
            if (ghostExists) {
                // Update position of existing ghost
                return nds.map(n => n.id === 'jigma-ghost-node' ? { ...n, position: centeredPosition } : n);
            } else {
                // Create ghost node
                const additionalValues = Array(Math.max(0, draggedItem.fieldCount - 1)).fill('');
                const fieldLabels = Array.from({ length: draggedItem.fieldCount }, (_, i) => `${t.editor.value} ${i + 1}`);

                const ghostNode: Node<NodeData> = {
                    id: 'jigma-ghost-node',
                    type: draggedItem.type,
                    position: centeredPosition,
                    data: {
                        label: draggedItem.label,
                        value: '',
                        additionalValues,
                        fieldLabels,
                        type: draggedItem.type,
                        color: draggedItem.color,
                        userImage: draggedItem.image,
                    },
                    style: { opacity: 0.7, pointerEvents: 'none', zIndex: 1000 },
                };
                return nds.concat(ghostNode);
            }
        });
    }
  }, [draggedItem, reactFlowInstance, setNodes, t]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Snapshot before adding the new node
      takeSnapshot();

      // Remove ghost immediately
      setNodes((nds) => nds.filter((n) => n.id !== 'jigma-ghost-node'));

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      // Determine info from draggedItem (preferred) or dataTransfer (fallback)
      let type: NodeType;
      let label: string;
      let color: string;
      let fieldCount: number;
      let image: string | undefined;

      if (draggedItem) {
          type = draggedItem.type;
          label = draggedItem.label;
          color = draggedItem.color;
          fieldCount = draggedItem.fieldCount;
          image = draggedItem.image;
      } else {
          // Fallback for standard drag if state failed (unlikely)
          type = event.dataTransfer.getData('application/reactflow/type') as NodeType;
          label = event.dataTransfer.getData('application/reactflow/label');
          color = event.dataTransfer.getData('application/reactflow/color');
          const fieldCountStr = event.dataTransfer.getData('application/reactflow/fieldCount');
          fieldCount = fieldCountStr ? parseInt(fieldCountStr) : 1;
      }

      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Center the new node same as ghost
      const centeredPosition = {
          x: position.x - 140,
          y: position.y - 20
      };

      // Prepare fields
      const additionalValues = Array(Math.max(0, fieldCount - 1)).fill('');
      const fieldLabels = Array.from({ length: fieldCount }, (_, i) => `${t.editor.value} ${i + 1}`);

      const newNode: Node<NodeData> = {
        id: getId(),
        type, 
        position: centeredPosition,
        data: { 
            label, 
            value: '', 
            additionalValues,
            fieldLabels,
            type, 
            color,
            userImage: image
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, t.editor.value, draggedItem, takeSnapshot],
  );

  const generateDatabase = useCallback(() => {
    const validNodes = nodes.filter(n => n.id !== 'jigma-ghost-node' && n.type !== NodeType.GROUP);

    if (validNodes.length === 0) {
        setGeneratedData([]);
        setIsModalOpen(true);
        return;
    }

    const adjacencyList: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    const nodeValues: Record<string, string> = {};

    validNodes.forEach(node => {
        adjacencyList[node.id] = [];
        inDegree[node.id] = 0;
        
        // Construct string representation of node including all fields
        const mainVal = node.data.value;
        const extras = node.data.additionalValues?.filter(v => v).join(', ');
        const displayVal = mainVal || `[${node.data.label}]`;
        
        nodeValues[node.id] = extras ? `${displayVal} (${extras})` : displayVal;
    });

    edges.forEach(edge => {
        // Ensure connected nodes exist (in case of ghost node edges if any, though unlikely)
        if (adjacencyList[edge.source] && adjacencyList[edge.target]) {
            adjacencyList[edge.source].push(edge.target);
            inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
        }
    });

    const roots = validNodes.filter(node => inDegree[node.id] === 0);
    const startNodes = roots.length > 0 ? roots : validNodes;
    const paths: string[] = [];

    const traverse = (currentId: string, currentPath: string[]) => {
        const nextNodes = adjacencyList[currentId];
        if (!nextNodes || nextNodes.length === 0) {
            if (currentPath.length > 1) { 
                paths.push(currentPath.join(' --- '));
            }
            return;
        }
        nextNodes.forEach(nextId => {
            traverse(nextId, [...currentPath, nodeValues[nextId]]);
        });
    };

    startNodes.forEach(root => {
        traverse(root.id, [nodeValues[root.id]]);
    });

    const uniquePaths = Array.from(new Set(paths));
    setGeneratedData(uniquePaths);
    setIsModalOpen(true);

  }, [nodes, edges]);

  const handleExportPng = async () => {
    // Filter out ghost node for export
    const exportNodes = nodes.filter(n => n.id !== 'jigma-ghost-node');

    if (exportNodes.length === 0 || !reactFlowWrapper.current) return;
    setIsExporting(true);

    try {
        // Calculate bounds of all nodes
        const nodesBounds = getNodesBounds(exportNodes);
        // Calculate viewport to fit all nodes with some padding
        const viewport = getViewportForBounds(
            nodesBounds,
            nodesBounds.width,
            nodesBounds.height,
            0.5,
            100, // padding
            2 // max zoom (high res)
        );

        // We use html-to-image with specific styling to ensure high quality and full content capture
        const dataUrl = await toPng(reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement, {
            backgroundColor: '#171717', // match neutral-900
            width: nodesBounds.width + 200, // padding
            height: nodesBounds.height + 200,
            style: {
                width: `${nodesBounds.width + 200}px`,
                height: `${nodesBounds.height + 200}px`,
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
            },
            pixelRatio: 2, // High DPI
            fontEmbedCSS: '', // Fixes "trim" undefined error by disabling font embedding
            filter: (node) => {
                // Filter out any potential problematic nodes if needed, or specific controls
                // Filter out transform handles if any
                if (node.classList && node.classList.contains('react-flow__minimap')) return false;
                if (node.classList && node.classList.contains('react-flow__controls')) return false;
                // Double check for ghost node DOM element if needed, though we filtered data
                return true;
            },
            cacheBust: true, // Force reload of images
        });

        const link = document.createElement('a');
        link.download = `jigma-export-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error("Export failed", err);
        alert("Failed to export PNG. Please try again.");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 h-full relative bg-neutral-900" ref={reactFlowWrapper}>
      <ReactFlow<Node<NodeData>, Edge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStart={() => takeSnapshot()} // Capture state before dragging
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-neutral-900"
        deleteKeyCode={["Backspace", "Delete"]} 
        multiSelectionKeyCode={["Control", "Meta", "Shift"]}
      >
        <Background 
            color="#525252" 
            gap={16} 
            size={1} 
        />
        
        {/* Custom Controls Replacement */}
        <CustomControls />
      </ReactFlow>

      {/* Increased z-index from z-10 to z-50 to ensure clickability over React Flow canvas elements */}
      <div className="absolute top-4 right-4 flex gap-3 z-50">
          <Button
              variant="primary"
              size="sm"
              onClick={onGroupSelection}
              className="shadow-md border-none"
              title={t.editor.group}
          >
              <FolderPlus size={16} className="mr-2" /> {t.editor.group}
          </Button>

          <Button 
              variant="primary" 
              size="sm" 
              onClick={handleExportPng}
              className={`shadow-md border-none ${isExporting ? 'opacity-70 cursor-wait' : ''}`}
              disabled={isExporting}
          >
              {isExporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
              {t.editor.export}
          </Button>

          <Button 
              variant="primary" 
              size="sm" 
              onClick={generateDatabase}
              className="shadow-md border-none"
          >
              <Database size={16} className="mr-2" /> {t.editor.generate}
          </Button>
      </div>
      
      <ResultModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={generatedData} 
      />
    </div>
  );
};

export default FlowEditor;