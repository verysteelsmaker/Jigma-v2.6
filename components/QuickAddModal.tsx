import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Upload } from 'lucide-react';
import Button from './ui/Button';
import { useLanguage } from '../contexts/LanguageContext';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (label: string, color: string, fieldCount: number, image?: string) => void;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [label, setLabel] = useState('');
  const [fieldCount, setFieldCount] = useState(1);
  const [color, setColor] = useState('#262626'); // Default to dark grey
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setLabel('');
      setFieldCount(1);
      setImagePreview(null);
      // Give a small delay to ensure rendering before focusing
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (label.trim()) {
      onAdd(label.trim(), color, fieldCount, imagePreview || undefined);
      onClose();
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md p-6 rounded-xl shadow-2xl transform transition-all animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 border bg-neutral-900 border-neutral-700 text-neutral-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t.quickAdd.title}</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border bg-neutral-800 border-neutral-700 text-neutral-400">
                {t.quickAdd.esc}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase mb-1.5 text-neutral-400">{t.quickAdd.compName}</label>
            <input 
              ref={inputRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. User Profile"
              className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all bg-neutral-950 border-neutral-700 focus:border-neutral-500 placeholder-neutral-600"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block text-xs font-semibold uppercase mb-1.5 text-neutral-400">{t.sidebar.fields}</label>
                <input 
                  type="number"
                  min="1"
                  max="10"
                  value={fieldCount}
                  onChange={(e) => setFieldCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all bg-neutral-950 border-neutral-700 focus:border-neutral-500"
                />
             </div>
             <div>
                <label className="block text-xs font-semibold uppercase mb-1.5 text-neutral-400">{t.sidebar.color}</label>
                <div className="h-[42px] w-[60px] rounded-lg border overflow-hidden relative border-neutral-700">
                    <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute -top-2 -left-2 w-[200%] h-[200%] cursor-pointer p-0 m-0"
                    />
                </div>
             </div>
          </div>
          
          <div>
                <label className="block text-xs font-semibold uppercase mb-1.5 text-neutral-400">{t.sidebar.photo}</label>
                {imagePreview ? (
                    <div className="relative w-full h-24 bg-neutral-800 rounded-lg overflow-hidden border border-neutral-600">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                            <button 
                            type="button"
                            onClick={() => setImagePreview(null)}
                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                            >
                            <X size={14} />
                            </button>
                    </div>
                ) : (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800"
                    >
                        <Upload size={18} className="text-neutral-500" />
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

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-neutral-400 hover:text-neutral-200">{t.sidebar.cancel}</Button>
            <Button type="submit" disabled={!label.trim()} className="min-w-[100px]">
                {t.quickAdd.create} <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddModal;