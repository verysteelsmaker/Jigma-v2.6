import React, { useState, useRef } from 'react';
import { NodeType, CustomNodeTypeDefinition, DraggedItem } from '../types';
import { GripVertical, Plus, List, Upload, X, Trash2 } from 'lucide-react';
import Button from './ui/Button';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  customTypes: CustomNodeTypeDefinition[];
  onAddType: (label: string, color: string, fieldCount: number) => void;
  onAddNodeInstance: (label: string, color: string, fieldCount: number, image?: string) => void;
  onDeleteType?: (id: string) => void;
  isAdding: boolean;
  setIsAdding: (adding: boolean) => void;
  isOpen: boolean;
  onNodeDragStart: (item: DraggedItem) => void;
  onNodeDragEnd: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    customTypes, 
    onAddType, 
    onAddNodeInstance, 
    onDeleteType, 
    isAdding, 
    setIsAdding, 
    isOpen,
    onNodeDragStart,
    onNodeDragEnd
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#404040');
  const [fieldCount, setFieldCount] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const onDragStart = (event: React.DragEvent, nodeType: NodeType, label: string, color: string, fieldCount: number) => {
    // Hide default drag image
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    event.dataTransfer.setDragImage(img, 0, 0);

    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.setData('application/reactflow/color', color);
    event.dataTransfer.setData('application/reactflow/fieldCount', fieldCount.toString());
    event.dataTransfer.effectAllowed = 'move';

    onNodeDragStart({ type: nodeType, label, color, fieldCount });
  };

  const onDragEnd = () => {
      onNodeDragEnd();
  };

  const handleCreate = () => {
    if (newLabel.trim()) {
      if (imagePreview) {
          onAddNodeInstance(newLabel, newColor, Math.max(1, Math.min(10, fieldCount)), imagePreview);
      } else {
          onAddType(newLabel, newColor, Math.max(1, Math.min(10, fieldCount)));
      }
      
      setNewLabel('');
      setFieldCount(1);
      setImagePreview(null);
      setIsAdding(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <aside 
        className={`border-r h-full flex flex-col shadow-sm z-20 transition-all duration-300 ease-in-out overflow-hidden bg-neutral-800 border-neutral-700
            ${isOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'}
        `}
    >
      <div className="p-5 border-b shrink-0 border-neutral-700">
        <div className="flex justify-between items-center mb-1">
          <h2 className="font-bold text-lg text-neutral-200">{t.sidebar.title}</h2>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="p-1.5 rounded-md transition-colors border hover:bg-neutral-700 text-neutral-300 bg-neutral-900 border-neutral-700"
            title={t.sidebar.createTooltip}
          >
            <Plus size={18} />
          </button>
        </div>
        <p className="text-xs text-neutral-400">{t.sidebar.drag}</p>
      </div>

      {isAdding && (
        <div className="p-4 border-b shrink-0 bg-neutral-700/50 border-neutral-600 animate-in slide-in-from-top-2">
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-semibold mb-1 block text-neutral-300">{t.sidebar.name}</label>
                    <input 
                        autoFocus
                        placeholder="e.g. Product"
                        className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-all bg-neutral-900 border-neutral-600 text-neutral-100"
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                </div>
                
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-xs font-semibold mb-1 block text-neutral-300">{t.sidebar.fields}</label>
                        <input 
                            type="number"
                            min="1"
                            max="10"
                            className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-all bg-neutral-900 border-neutral-600 text-neutral-100"
                            value={fieldCount}
                            onChange={e => setFieldCount(parseInt(e.target.value) || 1)}
                        />
                    </div>
                    <div>
                         <label className="text-xs font-semibold mb-1 block text-neutral-300">{t.sidebar.color}</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="color" 
                                value={newColor}
                                onChange={e => setNewColor(e.target.value)}
                                className="h-9 w-12 cursor-pointer border-0 rounded overflow-hidden p-0"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold mb-1 block text-neutral-300">{t.sidebar.photo}</label>
                    {imagePreview ? (
                        <div className="relative w-full h-20 bg-neutral-800 rounded-md overflow-hidden border border-neutral-600">
                             <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                             <button 
                                onClick={() => setImagePreview(null)}
                                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                             >
                                <X size={12} />
                             </button>
                        </div>
                    ) : (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-20 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors border-neutral-600 hover:border-neutral-500 hover:bg-neutral-700/50"
                        >
                            <Upload size={16} className="text-neutral-500" />
                            <span className="text-[10px] mt-1 text-neutral-500">{t.sidebar.upload}</span>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-2 justify-end pt-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="text-neutral-300 hover:bg-neutral-700">{t.sidebar.cancel}</Button>
                    <Button size="sm" onClick={handleCreate} variant="primary">
                        {imagePreview ? t.sidebar.addNode : t.sidebar.createType}
                    </Button>
                </div>
            </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-w-[18rem]">
        {customTypes.map((type) => (
             <div 
                key={type.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-grab transition-all active:cursor-grabbing group select-none border-neutral-600 bg-neutral-700/50 hover:border-neutral-500 hover:bg-neutral-700 relative"
                onDragStart={(event) => onDragStart(event, type.type, type.label, type.color, type.fieldCount)}
                onDragEnd={onDragEnd}
                draggable
                style={{ borderLeftColor: type.color, borderLeftWidth: '4px' }}
            >
                <GripVertical size={18} className="text-neutral-500 group-hover:text-neutral-100 transition-colors" />
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                         <span className="text-sm font-semibold text-neutral-200">{type.label}</span>
                         {type.fieldCount > 1 && (
                             <span className="text-[10px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-600 flex items-center gap-1">
                                 <List size={8} /> {type.fieldCount}
                             </span>
                         )}
                    </div>
                </div>
                {onDeleteType && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteType(type.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-neutral-500 opacity-0 group-hover:opacity-100 hover:bg-neutral-800 hover:text-red-400 transition-all"
                    title={t.sidebar.del}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
            </div>
        ))}
        
        <div className="p-4 mt-4 border-t border-neutral-700">
            <h3 className="text-xs font-bold uppercase mb-2 text-neutral-500">{t.sidebar.shortcuts}</h3>
            <ul className="text-xs space-y-2 text-neutral-400">
                <li className="flex justify-between"><span>{t.sidebar.del}</span> <span className="font-mono bg-neutral-800 px-1 rounded">Del</span></li>
            </ul>
        </div>
      </div>
      
      <div className="p-4 border-t text-xs text-center shrink-0 bg-neutral-900 border-neutral-700 text-neutral-500">
        {t.welcome.version}
      </div>
    </aside>
  );
};

export default Sidebar;