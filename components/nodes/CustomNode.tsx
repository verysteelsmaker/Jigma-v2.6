import React, { useCallback, useState, useRef } from 'react';
import { Handle, Position, NodeProps, useReactFlow, Node } from '@xyflow/react';
import { NodeData } from '../../types';
import { Sparkles, Image as ImageIcon, Loader2, MessageSquarePlus, MessageSquare, X, Plus, Trash2, Upload, Paperclip, FileText, Download } from 'lucide-react';
import { generateNodeComment, generateNodeImage } from '../../utils/genai';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApiKey } from '../../contexts/ApiKeyContext';
import { useHistory } from '../../contexts/HistoryContext';

// NodeProps in @xyflow/react v12+ expects the Node Type as the generic, not just the data
export const CustomNode: React.FC<NodeProps<Node<NodeData>>> = ({ id, data, selected }) => {
  const { setNodes, deleteElements } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { apiKey } = useApiKey();
  const { takeSnapshot } = useHistory();

  // Helper to update specific node data immutably
  const updateNodeData = useCallback((updates: Partial<NodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...updates },
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const addField = useCallback((indexToInsertAfter: number) => {
    takeSnapshot();
    const currentAdditional = data.additionalValues ? [...data.additionalValues] : [];
    
    // Insert empty string at index
    currentAdditional.splice(indexToInsertAfter, 0, '');
    
    updateNodeData({ additionalValues: currentAdditional });
  }, [data.additionalValues, updateNodeData, takeSnapshot]);

  const removeField = useCallback((indexToRemove: number) => {
    takeSnapshot();
    const currentAdditional = data.additionalValues ? [...data.additionalValues] : [];
    currentAdditional.splice(indexToRemove, 1);
    updateNodeData({ additionalValues: currentAdditional });
  }, [data.additionalValues, updateNodeData, takeSnapshot]);

  const onPrimaryChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData({ value: evt.target.value });
  }, [updateNodeData]);

  const onAdditionalChange = useCallback((index: number, val: string) => {
    const currentAdditional = data.additionalValues ? [...data.additionalValues] : [];
    currentAdditional.splice(index, 1, val); // Correctly replace value
    updateNodeData({ additionalValues: currentAdditional });
  }, [data.additionalValues, updateNodeData]);

  const onUserCommentChange = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData({ userComment: evt.target.value });
  }, [updateNodeData]);

  // Handle KeyDown for Shift+Enter (New Field) or Enter (Next Field Focus)
  const onKeyDown = useCallback((evt: React.KeyboardEvent, index: number | 'primary') => {
    evt.stopPropagation(); // Prevent React Flow from catching backspace/etc
    
    if (evt.key === 'Enter') {
        if (evt.shiftKey) {
            evt.preventDefault();
            // If primary (index -1 effectively), insert at 0. If index 0, insert at 1.
            const insertIndex = index === 'primary' ? 0 : index + 1;
            addField(insertIndex);
        } else {
            // Standard Enter - Move focus to next input
            evt.preventDefault();
            let nextId = '';
            
            if (index === 'primary') {
                // Try to go to first additional field
                 if (data.additionalValues && data.additionalValues.length > 0) {
                     nextId = `input-${id}-0`;
                 }
            } else if (typeof index === 'number') {
                // Try to go to next additional field
                 if (data.additionalValues && index < data.additionalValues.length - 1) {
                     nextId = `input-${id}-${index + 1}`;
                 }
            }
            
            if (nextId) {
                const el = document.getElementById(nextId);
                el?.focus();
            }
        }
    }
  }, [addField, id, data.additionalValues]);

  const handleGenerateText = async () => {
    if (!data.value || !apiKey) return;
    takeSnapshot();
    setLoading(true);
    const comment = await generateNodeComment(data.label, data.value, apiKey);
    updateNodeData({ aiComment: comment });
    setLoading(false);
  };

  const handleGenerateImage = async () => {
    if (!data.value || !apiKey) return;
    takeSnapshot();
    setLoading(true);
    const imageUrl = await generateNodeImage(data.value, apiKey);
    if (imageUrl) {
       updateNodeData({ aiImage: imageUrl });
    }
    setLoading(false);
  };

  const handleUploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        takeSnapshot();
        const reader = new FileReader();
        reader.onloadend = () => {
             updateNodeData({ userImage: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAttachFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Limit file size to 5MB to avoid browser crashing on save
      if (file.size > 5 * 1024 * 1024) {
          alert("File is too large. Please select a file under 5MB.");
          return;
      }
      takeSnapshot();

      const reader = new FileReader();
      reader.onloadend = () => {
        updateNodeData({
          attachedFile: {
            name: file.name,
            type: file.type,
            size: file.size,
            url: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    takeSnapshot();
    updateNodeData({ attachedFile: undefined });
  };

  const handleRemoveImage = () => {
      takeSnapshot();
      updateNodeData({ userImage: undefined, aiImage: undefined });
  }

  const handleDeleteNode = useCallback((evt: React.MouseEvent) => {
    evt.stopPropagation();
    // No explicit takeSnapshot here because deleting triggers onNodesChangeWrapped which handles it
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  const color = data.color || '#6366f1';
  const fieldLabels = data.fieldLabels || [t.editor.primaryVal];

  const displayImage = data.userImage || data.aiImage;

  return (
    <div 
        className={`shadow-xl rounded-xl overflow-hidden border transition-all duration-300 ease-out bg-white relative group min-w-[280px] animate-in zoom-in-95 fade-in
            ${selected ? 'ring-2 ring-neutral-400' : 'border-neutral-200'}
            dark:bg-neutral-800 dark:border-neutral-700
            ${data.isDeleting ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}
        `}
        style={{ borderColor: selected ? color : undefined }} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Node Handles - Moved to Top/Bottom for better hierarchy */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="main-target" 
        className="w-4 h-4 !bg-neutral-500 dark:!bg-neutral-400 !border-2 !border-white dark:!border-neutral-900 transition-all hover:!w-5 hover:!h-5 hover:!bg-neutral-500" 
        style={{ top: -8 }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="main-source" 
        className="w-4 h-4 !bg-neutral-500 dark:!bg-neutral-400 !border-2 !border-white dark:!border-neutral-900 transition-all hover:!w-5 hover:!h-5 hover:!bg-neutral-500" 
        style={{ bottom: -8 }}
      />

      {/* Header */}
      <div 
        className="px-4 py-2.5 text-white flex items-center justify-between"
        style={{ backgroundColor: color }}
      >
        <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide">{data.label}</span>
        </div>
        
        {/* Actions */}
        <div className={`flex items-center gap-1.5 transition-opacity ${isHovered || data.value ? 'opacity-100' : 'opacity-0'}`}>
            {loading ? (
                <Loader2 size={16} className="animate-spin text-white/80" />
            ) : (
                <>
                     <button onClick={() => fileInputRef.current?.click()} className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors" title={t.sidebar.upload}>
                        <Upload size={14} />
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleUploadImage} 
                        />
                    </button>
                    <button 
                        onClick={() => attachmentInputRef.current?.click()}
                        className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                        title={t.editor.attach}
                    >
                        <Paperclip size={14} />
                        <input 
                            type="file" 
                            ref={attachmentInputRef} 
                            className="hidden" 
                            onChange={handleAttachFile} 
                        />
                    </button>
                    <button 
                        onClick={handleGenerateText} 
                        disabled={!apiKey}
                        className={`p-1 rounded transition-colors ${!apiKey ? 'opacity-40 cursor-not-allowed text-white' : 'hover:bg-white/20 text-white/80 hover:text-white'}`}
                        title={apiKey ? "AI Generate Info" : "AI features require API Key (Settings)"}
                    >
                        <Sparkles size={14} />
                    </button>
                    <button 
                        onClick={handleGenerateImage} 
                        disabled={!apiKey}
                        className={`p-1 rounded transition-colors ${!apiKey ? 'opacity-40 cursor-not-allowed text-white' : 'hover:bg-white/20 text-white/80 hover:text-white'}`}
                        title={apiKey ? "AI Generate Icon" : "AI features require API Key (Settings)"}
                    >
                        <ImageIcon size={14} />
                    </button>
                    <button 
                        onClick={() => setShowCommentInput(!showCommentInput)} 
                        className={`p-1 rounded hover:bg-white/20 transition-colors ${data.userComment ? 'text-white' : 'text-white/80 hover:text-white'}`} 
                        title={t.editor.note}
                    >
                        {data.userComment ? <MessageSquare size={14} className="fill-white/20" /> : <MessageSquarePlus size={14} />}
                    </button>

                    <div className="w-px h-4 bg-white/30 mx-0.5"></div>

                    <button 
                        onClick={handleDeleteNode} 
                        className="p-1 rounded hover:bg-red-500/20 text-white/80 hover:text-white transition-colors" 
                        title={t.sidebar.del}
                    >
                        <Trash2 size={14} />
                    </button>
                </>
            )}
        </div>
      </div>
      
      <div className="p-4 bg-white dark:bg-neutral-800 space-y-3">
        
        {/* Primary Input */}
        <div className="group/input">
            <label className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-1 block tracking-wider flex justify-between">
                {fieldLabels[0] || t.editor.primaryVal}
            </label>
            <div className="relative">
                <input 
                    id={`input-${id}-primary`}
                    className="nodrag w-full text-sm px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-900/50 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 transition-all duration-300 ease-in-out"
                    value={data.value}
                    onChange={onPrimaryChange}
                    onFocus={() => takeSnapshot()}
                    onKeyDown={(e) => onKeyDown(e, 'primary')} 
                    placeholder={`${t.editor.enter} ${data.label.toLowerCase()}...`}
                    title="Shift + Enter to add new field"
                />
                 <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity z-10">
                     <button onClick={() => addField(0)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 bg-white dark:bg-neutral-800 rounded-full p-0.5 shadow-sm border border-neutral-200 dark:border-neutral-600 flex items-center justify-center">
                        <Plus size={12} />
                     </button>
                </div>
                {/* Primary Field Handles - ALWAYS VISIBLE (opacity-50) */}
                <Handle 
                    type="target" 
                    position={Position.Left} 
                    id="field-primary-target" 
                    className="!w-2.5 !h-2.5 !bg-neutral-300 dark:!bg-neutral-500 !border-none !-left-2 opacity-50 hover:opacity-100 transition-opacity" 
                />
                <Handle 
                    type="source" 
                    position={Position.Right} 
                    id="field-primary-source" 
                    className="!w-2.5 !h-2.5 !bg-neutral-300 dark:!bg-neutral-500 !border-none !-right-2 opacity-50 hover:opacity-100 transition-opacity" 
                />
            </div>
        </div>

        {/* Additional Inputs */}
        {data.additionalValues && data.additionalValues.map((val, idx) => (
            <div key={idx} className="group/input animate-in fade-in slide-in-from-top-1 duration-300 ease-out">
                <label className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-1 block tracking-wider flex justify-between">
                    {fieldLabels[idx + 1] || `${t.editor.value} ${idx + 2}`}
                    <button 
                        onClick={() => removeField(idx)}
                        className="text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover/input:opacity-100"
                    >
                        <X size={12} />
                    </button>
                </label>
                <div className="relative">
                    <input 
                        id={`input-${id}-${idx}`}
                        className="nodrag w-full text-sm px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-900/50 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 transition-all duration-300 ease-in-out"
                        value={val}
                        onChange={(e) => onAdditionalChange(idx, e.target.value)}
                        onFocus={() => takeSnapshot()}
                        onKeyDown={(e) => onKeyDown(e, idx)} 
                        title="Shift + Enter to add new field"
                    />
                    {/* Specific Field Handles - ALWAYS VISIBLE */}
                    <Handle 
                        type="target" 
                        position={Position.Left} 
                        id={`field-${idx}-target`} 
                        className="!w-2.5 !h-2.5 !bg-neutral-300 dark:!bg-neutral-500 !border-none !-left-2 opacity-50 hover:opacity-100 transition-opacity" 
                    />
                    <Handle 
                        type="source" 
                        position={Position.Right} 
                        id={`field-${idx}-source`} 
                        className="!w-2.5 !h-2.5 !bg-neutral-300 dark:!bg-neutral-500 !border-none !-right-2 opacity-50 hover:opacity-100 transition-opacity" 
                    />
                </div>
            </div>
        ))}

        {/* Attached File Display */}
        {data.attachedFile && (
            <div className="mt-2 p-2 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between group/file">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-1.5 bg-neutral-200 dark:bg-neutral-800 rounded">
                        <FileText size={14} className="text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate max-w-[140px]" title={data.attachedFile.name}>
                        {data.attachedFile.name}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <a 
                        href={data.attachedFile.url} 
                        download={data.attachedFile.name}
                        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                        title={t.editor.download}
                    >
                        <Download size={12} />
                    </a>
                    <button 
                        onClick={handleRemoveFile}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Remove file"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>
        )}

        {/* User Comment Input */}
        {(showCommentInput || data.userComment) && (
             <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-1 flex items-center gap-1">
                    <MessageSquare size={10} /> {t.editor.note}
                </label>
                <textarea
                    className="nodrag w-full text-xs px-3 py-2 border border-yellow-200 dark:border-yellow-900/30 rounded-md bg-yellow-50 dark:bg-yellow-900/10 focus:outline-none focus:border-yellow-400 text-neutral-700 dark:text-yellow-100 placeholder:text-yellow-400/50 resize-none min-h-[60px]"
                    value={data.userComment || ''}
                    onChange={onUserCommentChange}
                    onFocus={() => takeSnapshot()}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder={t.editor.addNote}
                />
            </div>
        )}

        {/* Image Display (AI or User Upload) */}
        {displayImage && (
            <div className="mt-2 rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 relative group/image">
                <img src={displayImage} alt="Node Visual" className="w-full h-32 object-contain p-2" />
                <button 
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-red-500 z-10"
                >
                    <X size={12} />
                </button>
                 {/* Image Handles - ALWAYS VISIBLE */}
                <Handle 
                    type="target" 
                    position={Position.Left} 
                    id="image-target" 
                    className="!w-2.5 !h-2.5 !bg-neutral-300 dark:!bg-neutral-500 !border-none !-left-2 opacity-50 hover:opacity-100 transition-opacity" 
                />
                <Handle 
                    type="source" 
                    position={Position.Right} 
                    id="image-source" 
                    className="!w-2.5 !h-2.5 !bg-neutral-300 dark:!bg-neutral-500 !border-none !-right-2 opacity-50 hover:opacity-100 transition-opacity" 
                />
            </div>
        )}

        {data.aiComment && (
            <div className="mt-2 text-xs italic text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 p-2.5 rounded-md border border-neutral-200 dark:border-neutral-700 flex gap-2 items-start">
                <Sparkles size={12} className="mt-0.5 text-neutral-400 shrink-0" />
                <span>{data.aiComment}</span>
            </div>
        )}

      </div>
    </div>
  );
};