import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
    ReactFlowProvider, 
    useNodesState, 
    useEdgesState, 
    addEdge, 
    Connection, 
    Edge, 
    Node, 
    MarkerType,
    OnNodesChange,
    OnEdgesChange
} from '@xyflow/react';
import FlowEditor from './components/FlowEditor';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import QuickAddModal from './components/QuickAddModal';
import WelcomeScreen from './components/WelcomeScreen';
import ApiKeyModal from './components/ApiKeyModal';
import { CustomNodeTypeDefinition, NodeType, NodeData, DraggedItem } from './types';
import { Settings, Save, FolderOpen, PanelLeft, Box, PlusCircle } from 'lucide-react';
import Button from './components/ui/Button';
import { LanguageProvider } from './contexts/LanguageContext';
import { ApiKeyProvider } from './contexts/ApiKeyContext';
import { HistoryContext } from './contexts/HistoryContext';
import { useLanguage } from './contexts/LanguageContext';

// Default types
const initialCustomTypes: CustomNodeTypeDefinition[] = [
  { id: 't1', label: 'Person', color: '#262626', type: NodeType.PERSON, fieldCount: 1 }, 
  { id: 't2', label: 'Email', color: '#525252', type: NodeType.EMAIL, fieldCount: 1 },   
  { id: 't3', label: 'Website', color: '#737373', type: NodeType.WEBSITE, fieldCount: 1 }, 
];

interface HistoryState {
    nodes: Node<NodeData>[];
    edges: Edge[];
}

const JigmaApp: React.FC = () => {
    // Persistence Logic
    const [animationsEnabled, setAnimationsEnabled] = useState(() => localStorage.getItem('jigma_animations') !== 'false');
    const [currentFont, setCurrentFont] = useState(() => localStorage.getItem('jigma_font') || "'Inter', sans-serif");
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [hasActiveProject, setHasActiveProject] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    // Modals
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    
    // Lifted Sidebar State for manual add if needed
    const [isAddingNode, setIsAddingNode] = useState(false);

    const [customTypes, setCustomTypes] = useState<CustomNodeTypeDefinition[]>(initialCustomTypes);
    const [projectName, setProjectName] = useState('Untitled Jigma Project');
    
    // Dragged Item State for Ghost Node
    const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
    
    // React Flow State lifted to App
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // History State
    const [past, setPast] = useState<HistoryState[]>([]);
    const [future, setFuture] = useState<HistoryState[]>([]);

    const { t } = useLanguage();

    useEffect(() => {
        localStorage.setItem('jigma_animations', animationsEnabled.toString());
    }, [animationsEnabled]);

    useEffect(() => {
        localStorage.setItem('jigma_font', currentFont);
        
        // Basic check to see if it's a URL to a font stylesheet
        if (currentFont.startsWith('http')) {
            const linkId = 'custom-font-link';
            let link = document.getElementById(linkId) as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.id = linkId;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }
            link.href = currentFont;
        }
    }, [currentFont]);

    // History Functions
    const takeSnapshot = useCallback(() => {
        setPast(prev => {
            // Limit history depth to 50
            const newPast = [...prev, { 
                nodes: JSON.parse(JSON.stringify(nodes)), 
                edges: JSON.parse(JSON.stringify(edges)) 
            }];
            if (newPast.length > 50) newPast.shift();
            return newPast;
        });
        setFuture([]);
    }, [nodes, edges]);

    const undo = useCallback(() => {
        if (past.length === 0) return;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, -1);

        setFuture(prev => [{ 
            nodes: JSON.parse(JSON.stringify(nodes)), 
            edges: JSON.parse(JSON.stringify(edges)) 
        }, ...prev]);
        
        setPast(newPast);
        setNodes(previous.nodes);
        setEdges(previous.edges);
    }, [past, nodes, edges, setNodes, setEdges]);

    const redo = useCallback(() => {
        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        setPast(prev => [...prev, { 
            nodes: JSON.parse(JSON.stringify(nodes)), 
            edges: JSON.parse(JSON.stringify(edges)) 
        }]);

        setFuture(newFuture);
        setNodes(next.nodes);
        setEdges(next.edges);
    }, [future, nodes, edges, setNodes, setEdges]);

    // Grouping Logic
    const groupSelectedNodes = useCallback(() => {
        const selectedNodes = nodes.filter(n => n.selected && n.type !== NodeType.GROUP);
        if (selectedNodes.length < 2) return;

        takeSnapshot();

        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selectedNodes.forEach(n => {
            if (n.position.x < minX) minX = n.position.x;
            if (n.position.y < minY) minY = n.position.y;
            // Assuming default width if not set, approx 280
            const width = n.measured?.width || 280; 
            const height = n.measured?.height || 200;
            if (n.position.x + width > maxX) maxX = n.position.x + width;
            if (n.position.y + height > maxY) maxY = n.position.y + height;
        });

        const padding = 50;
        const groupX = minX - padding;
        const groupY = minY - padding;
        const groupWidth = (maxX - minX) + padding * 2;
        const groupHeight = (maxY - minY) + padding * 2;

        const groupId = `group_${Date.now()}`;
        const groupNode: Node<NodeData> = {
            id: groupId,
            type: NodeType.GROUP,
            position: { x: groupX, y: groupY },
            style: { width: groupWidth, height: groupHeight },
            data: {
                label: 'Group',
                type: NodeType.GROUP,
                width: groupWidth,
                height: groupHeight,
                value: '',
                frozen: false // Default to unfrozen (background)
            },
            zIndex: -10 // Initial z-index
        };

        const updatedNodes = nodes.map(n => {
            if (n.selected && n.type !== NodeType.GROUP) {
                return {
                    ...n,
                    parentId: groupId,
                    extent: 'parent' as const,
                    position: {
                        x: n.position.x - groupX,
                        y: n.position.y - groupY
                    },
                    selected: false,
                    zIndex: 10 // Ensure children are above group
                };
            }
            return n;
        });

        // Insert group node at the BEGINNING to ensure it renders behind children in standard flow
        setNodes([groupNode, ...updatedNodes]);
    }, [nodes, setNodes, takeSnapshot]);


    const toggleAnimations = () => setAnimationsEnabled(!animationsEnabled);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Global Hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Escape to close modal
            if (e.key === 'Escape') {
                 if (isQuickAddOpen) setIsQuickAddOpen(false);
                 return;
            }

            // Undo / Redo
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    e.preventDefault();
                    redo();
                } else {
                    e.preventDefault();
                    undo();
                }
                return;
            }
            // Redo alternative (Ctrl+Y)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
                return;
            }

            // Ignore subsequent hotkeys if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Delete All Objects (Ctrl + Shift + Backspace/Delete)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'Backspace' || e.key === 'Delete')) {
                e.preventDefault();
                if (nodes.length > 0 && window.confirm("Clear entire canvas? This action cannot be undone.")) {
                    takeSnapshot();
                    setNodes([]);
                    setEdges([]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes.length, setNodes, setEdges, isQuickAddOpen, undo, redo, takeSnapshot]);

    const addCustomType = (label: string, color: string, fieldCount: number) => {
        setCustomTypes([
        ...customTypes,
        {
            id: `c_${Date.now()}`,
            label,
            color,
            type: NodeType.CUSTOM,
            fieldCount
        }
        ]);
    };

    const deleteCustomType = (typeId: string) => {
        setCustomTypes(types => types.filter(t => t.id !== typeId));
    };
    
    // Add Node directly from Quick Add Modal
    const handleQuickAdd = (label: string, color: string, fieldCount: number, image?: string) => {
        takeSnapshot();
        const id = `node_${Date.now()}`;
        
        // Center position approximation or random offset
        const position = { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 };

        const additionalValues = Array(Math.max(0, fieldCount - 1)).fill('');
        const fieldLabels = Array.from({ length: fieldCount }, (_, i) => `${t.editor.value} ${i + 1}`);

        const newNode: Node<NodeData> = {
            id,
            type: NodeType.CUSTOM,
            position,
            data: {
                label,
                value: '',
                additionalValues,
                fieldLabels,
                type: NodeType.CUSTOM,
                color,
                userImage: image
            }
        };
        
        setNodes((nds) => nds.concat(newNode));
    };

    // WRAPPED Handlers for Delete Animations
    const onNodesChangeWrapped: OnNodesChange<Node<NodeData>> = useCallback(
        (changes) => {
            const removes = changes.filter(c => c.type === 'remove');
            const others = changes.filter(c => c.type !== 'remove');
            
            // Snapshot before deletion logic
            if (removes.length > 0) {
                takeSnapshot();
            }

            // Apply non-remove changes immediately (drag, select, etc)
            if (others.length > 0) onNodesChange(others);
            
            if (removes.length > 0) {
                const removedIds = new Set(removes.map(c => (c as any).id));
                
                // 1. Mark nodes as deleting to trigger animation
                setNodes(nds => nds.map(n => removedIds.has(n.id) ? { ...n, data: { ...n.data, isDeleting: true } } : n));
                
                // 2. Mark connected edges as deleting too, so they retreat smoothly
                setEdges(eds => eds.map(e => 
                    (removedIds.has(e.source) || removedIds.has(e.target)) 
                    ? { ...e, data: { ...e.data, isDeleting: true } } 
                    : e
                ));

                // 3. Wait for animation then remove
                setTimeout(() => {
                    setNodes(nds => nds.filter(n => !removedIds.has(n.id)));
                    setEdges(eds => eds.filter(e => !removedIds.has(e.source) && !removedIds.has(e.target)));
                }, 400); 
            }
        },
        [onNodesChange, setNodes, setEdges, takeSnapshot]
    );

    const onEdgesChangeWrapped: OnEdgesChange = useCallback(
        (changes) => {
            const removes = changes.filter(c => c.type === 'remove');
            const others = changes.filter(c => c.type !== 'remove');

            if (removes.length > 0) {
                takeSnapshot();
            }

            if (others.length > 0) onEdgesChange(others);

            if (removes.length > 0) {
                const removedIds = new Set(removes.map(c => (c as any).id));
                
                // Mark edges as deleting
                setEdges(eds => eds.map(e => removedIds.has(e.id) ? { ...e, data: { ...e.data, isDeleting: true } } : e));
                
                setTimeout(() => {
                    setEdges(eds => eds.filter(e => !removedIds.has(e.id)));
                }, 400);
            }
        },
        [onEdgesChange, setEdges, takeSnapshot]
    );

    const onConnect = useCallback(
        (params: Connection) => {
            takeSnapshot();
            setEdges((eds) => addEdge({ 
                ...params, 
                type: 'custom', // Use custom edge for animation support
                animated: animationsEnabled, 
                style: { stroke: '#a3a3a3', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#a3a3a3' }
            }, eds));
        },
        [setEdges, animationsEnabled, takeSnapshot],
    );

    // Save Logic
    const handleSaveProject = () => {
        const projectData = {
            version: '2.6',
            timestamp: Date.now(),
            projectName,
            nodes: nodes.filter(n => n.id !== 'jigma-ghost-node'), // Ensure ghost node is not saved
            edges,
            customTypes
        };

        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // Use .jigma extension for the custom file format
        link.download = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jigma`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Shared load logic
    const loadProjectFromFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                // Basic validation
                if (data.nodes && Array.isArray(data.nodes)) {
                    // When loading, ensure edges have type 'custom' if missing
                    const loadedEdges = (data.edges || []).map((e: Edge) => ({
                        ...e,
                        type: 'custom'
                    }));

                    setNodes(data.nodes);
                    setEdges(loadedEdges);
                    if (data.customTypes) setCustomTypes(data.customTypes);
                    if (data.projectName) setProjectName(data.projectName);
                    
                    setHasActiveProject(true);
                    
                    // Reset history on load
                    setPast([]);
                    setFuture([]);
                    
                    // Reset input value to allow reloading same file in header
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } else {
                    alert('Invalid project file format.');
                }
            } catch (error) {
                console.error('Error parsing project file:', error);
                alert('Failed to load project. Ensure the file is a valid Jigma project.');
            }
        };
        reader.readAsText(file);
    };

    // Handler for Header input
    const handleLoadProjectInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) loadProjectFromFile(file);
    };

    const handleCreateProject = (name: string) => {
        setProjectName(name);
        setNodes([]);
        setEdges([]);
        setCustomTypes(initialCustomTypes);
        setHasActiveProject(true);
        setPast([]);
        setFuture([]);
    };

    const handleNewProjectClick = () => {
        if (nodes.length > 0) {
            if (!window.confirm("Are you sure? Unsaved changes will be lost.")) {
                return;
            }
        }
        
        // Critical Fix: Before clearing, ensure we detach nodes to prevent "child node exists without parent" error during re-render
        // This is necessary if groups exist with 'extent: parent'
        setNodes((currentNodes) => currentNodes.map(n => ({ ...n, parentId: undefined, extent: undefined })));
        
        // Force a tiny delay to allow React to detach parents before wiping
        setTimeout(() => {
            setHasActiveProject(false);
            setProjectName('Untitled Jigma Project');
            setNodes([]);
            setEdges([]);
            setCustomTypes(initialCustomTypes);
            setPast([]);
            setFuture([]);
        }, 10);
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <HistoryContext.Provider value={{ takeSnapshot, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 }}>
        <div 
            className="w-full h-screen flex flex-col transition-colors duration-300 dark bg-neutral-900 text-neutral-100"
            style={{ fontFamily: !currentFont.startsWith('http') ? currentFont : undefined }}
        >
        
        <ApiKeyModal />

        {!hasActiveProject ? (
            <>
                <div className="absolute top-4 right-4 z-50">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-neutral-300 hover:bg-neutral-800"
                        title={t.settings.title}
                    >
                        <Settings size={20} />
                    </Button>
                </div>
                <WelcomeScreen 
                    onCreate={handleCreateProject} 
                    onLoad={loadProjectFromFile} 
                />
            </>
        ) : (
            <>
                <header className="h-16 border-b flex items-center justify-between px-6 shadow-sm z-30 relative transition-colors bg-neutral-900 border-neutral-700">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={toggleSidebar}
                            className="mr-1 text-neutral-300 hover:bg-neutral-800"
                            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                        >
                            <PanelLeft size={20} />
                        </Button>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg bg-white">
                                <Box className="w-5 h-5 text-black" />
                            </div>
                            <span className="font-bold text-xl tracking-tight hidden md:block text-neutral-100">
                            {t.welcome.title}
                            </span>
                        </div>
                        
                        <div className="h-6 w-px bg-neutral-700 mx-2 hidden md:block"></div>

                        <div className="group relative">
                            <input 
                                type="text" 
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="bg-transparent text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-400 rounded px-2 py-1 w-48 md:w-64 transition-all text-neutral-200 hover:bg-neutral-800"
                                title="Edit Project Name"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleLoadProjectInput}
                            accept=".json,.jigma"
                            className="hidden" 
                        />
                        
                        <div className="flex items-center bg-neutral-800 rounded-md p-1 border border-neutral-700 mr-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleNewProjectClick}
                                className="text-neutral-300 hover:bg-neutral-700"
                                title="New Project"
                            >
                                <PlusCircle size={18} className="mr-2" /> {t.editor.newProject}
                            </Button>
                            <div className="w-px h-4 bg-neutral-600 mx-1"></div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={triggerFileInput}
                                className="text-neutral-300 hover:bg-neutral-700"
                                title="Open Project"
                            >
                                <FolderOpen size={18} className="mr-2" /> Open
                            </Button>
                            <div className="w-px h-4 bg-neutral-600 mx-1"></div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleSaveProject}
                                className="text-neutral-300 hover:bg-neutral-700"
                                title="Save Project"
                            >
                                <Save size={18} className="mr-2" /> Save
                            </Button>
                        </div>

                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setIsSettingsOpen(true)}
                            className="text-neutral-300 hover:bg-neutral-800"
                            title="Settings"
                        >
                            <Settings size={20} />
                        </Button>
                    </div>
                </header>
                
                <main className="flex-1 w-full h-full relative overflow-hidden flex">
                    <Sidebar 
                        customTypes={customTypes} 
                        onAddType={addCustomType}
                        onAddNodeInstance={handleQuickAdd}
                        onDeleteType={deleteCustomType}
                        isAdding={isAddingNode}
                        setIsAdding={setIsAddingNode}
                        isOpen={isSidebarOpen}
                        onNodeDragStart={setDraggedItem}
                        onNodeDragEnd={() => setDraggedItem(null)}
                    />
                    <div className="flex-1 h-full relative">
                        <FlowEditor 
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChangeWrapped}
                            onEdgesChange={onEdgesChangeWrapped}
                            onConnect={onConnect}
                            setNodes={setNodes}
                            setEdges={setEdges}
                            animationsEnabled={animationsEnabled} 
                            draggedItem={draggedItem}
                            onGroupSelection={groupSelectedNodes}
                        />
                    </div>
                </main>
            </>
        )}

        <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            animationsEnabled={animationsEnabled}
            toggleAnimations={toggleAnimations}
            currentFont={currentFont}
            setFont={setCurrentFont}
        />
        <QuickAddModal 
            isOpen={isQuickAddOpen}
            onClose={() => setIsQuickAddOpen(false)}
            onAdd={handleQuickAdd}
        />
        </div>
        </HistoryContext.Provider>
    );
};

// Wrapper ensuring ReactFlowProvider covers the app for state management consistency if needed later
const App: React.FC = () => {
    return (
        <ApiKeyProvider>
            <LanguageProvider>
                <ReactFlowProvider>
                    <JigmaApp />
                </ReactFlowProvider>
            </LanguageProvider>
        </ApiKeyProvider>
    );
};

export default App;