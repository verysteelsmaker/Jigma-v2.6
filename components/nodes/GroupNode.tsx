import React, { useCallback } from 'react';
import { NodeProps, Node, Handle, Position, useReactFlow } from '@xyflow/react';
import { NodeData } from '../../types';
import { Lock, Unlock } from 'lucide-react';

export const GroupNode: React.FC<NodeProps<Node<NodeData>>> = ({ id, data, selected }) => {
  const { setNodes } = useReactFlow();
  const isFrozen = !!data.frozen;

  const onLabelChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, label: evt.target.value },
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const onDoubleClick = useCallback((evt: React.MouseEvent) => {
    evt.stopPropagation();
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
            return {
                ...node,
                data: { ...node.data, frozen: !node.data.frozen },
                // Update z-index directly on node object for React Flow sorting
                zIndex: !node.data.frozen ? -10 : 0
            };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  return (
    <div 
        onDoubleClick={onDoubleClick}
        className={`rounded-xl border-2 transition-all duration-300 relative group animate-in zoom-in-95 fade-in ease-out
            ${selected ? 'border-neutral-500' : 'border-neutral-300 dark:border-neutral-700'}
            ${isFrozen 
                ? 'bg-neutral-100 dark:bg-neutral-800 shadow-lg border-solid' 
                : 'bg-neutral-100/30 dark:bg-neutral-900/20 border-dashed hover:border-neutral-400 dark:hover:border-neutral-600'
            }
        `}
        style={{ 
            width: data.width || 200, 
            height: data.height || 200,
            zIndex: isFrozen ? 0 : -10 
        }}
    >
      {/* Header / Name Input */}
      <div className="absolute -top-8 left-0 flex items-center gap-2 z-50">
         <div className={`
            p-1 rounded text-neutral-500 transition-colors
            ${isFrozen ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200' : 'bg-transparent'}
         `}>
            {isFrozen ? <Lock size={12} /> : <Unlock size={12} />}
         </div>
         <input 
            value={data.label}
            onChange={onLabelChange}
            className="nodrag bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider outline-none border border-transparent focus:border-neutral-400 focus:text-neutral-900 dark:focus:text-white transition-all min-w-[60px] max-w-[200px] text-center shadow-sm"
            placeholder="GROUP NAME"
         />
      </div>

      {/* Handles - Visible only when frozen. Fixed z-index and pointer-events. */}
      <div className={`absolute inset-0 ${isFrozen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <Handle 
            type="target" 
            position={Position.Top} 
            id="top"
            className={`!w-3 !h-3 !bg-neutral-400 !border-2 !border-neutral-800 !z-50 transition-opacity duration-200 ${isFrozen ? 'opacity-100' : 'opacity-0'}`}
            style={{ top: -7 }}
          />
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="bottom"
            className={`!w-3 !h-3 !bg-neutral-400 !border-2 !border-neutral-800 !z-50 transition-opacity duration-200 ${isFrozen ? 'opacity-100' : 'opacity-0'}`}
            style={{ bottom: -7 }}
          />
          <Handle 
            type="target" 
            position={Position.Left} 
            id="left"
            className={`!w-3 !h-3 !bg-neutral-400 !border-2 !border-neutral-800 !z-50 transition-opacity duration-200 ${isFrozen ? 'opacity-100' : 'opacity-0'}`}
            style={{ left: -7 }}
          />
          <Handle 
            type="source" 
            position={Position.Right} 
            id="right"
            className={`!w-3 !h-3 !bg-neutral-400 !border-2 !border-neutral-800 !z-50 transition-opacity duration-200 ${isFrozen ? 'opacity-100' : 'opacity-0'}`}
            style={{ right: -7 }}
          />
      </div>
      
      {/* Visual hint for unfrozen state */}
      {!isFrozen && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400/50 font-bold select-none">
                  Double Click to Freeze
              </span>
          </div>
      )}
    </div>
  );
};