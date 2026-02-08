import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { X, Activity, ShieldCheck, Type, Laptop, Globe, KeyRound } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import { Language } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  animationsEnabled: boolean;
  toggleAnimations: () => void;
  currentFont: string;
  setFont: (font: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    animationsEnabled, 
    toggleAnimations,
    currentFont,
    setFont
}) => {
  const [customFontInput, setCustomFontInput] = useState('');
  const { language, setLanguage, t } = useLanguage();
  const { apiKey, setApiKey } = useApiKey();
  const [tempKey, setTempKey] = useState(apiKey);
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle entry and exit animations logic
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      setTempKey(apiKey);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, apiKey]);

  if (!shouldRender) return null;

  const fonts = [
      { name: 'Inter (Standard)', value: "'Inter', sans-serif" },
      { name: 'Roboto', value: "'Roboto', sans-serif" },
      { name: 'Playfair (Serif)', value: "'Playfair Display', serif" },
      { name: 'Mono (Code)', value: "'JetBrains Mono', monospace" },
  ];

  const languages: { code: Language; label: string }[] = [
      { code: 'en', label: 'English' },
      { code: 'ru', label: 'Русский' },
      { code: 'es', label: 'Español' },
      { code: 'de', label: 'Deutsch' },
      { code: 'fr', label: 'Français' },
      { code: 'zh', label: '中文' },
  ];

  const handleCustomFontApply = () => {
      if(customFontInput.trim()) {
          setFont(customFontInput.trim());
          setCustomFontInput('');
      }
  };

  const handleSaveSettings = () => {
      if (tempKey !== apiKey) {
          setApiKey(tempKey);
      }
      onClose();
  };

  return (
    <div 
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm 
            ${isClosing ? 'animate-modal-fade-out' : 'animate-modal-fade'}
        `}
    >
      <div 
        className={`bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-neutral-700
            ${isClosing ? 'animate-modal-scale-out' : 'animate-modal-scale'}
        `}
      >
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h3 className="text-lg font-bold text-neutral-100">{t.settings.title}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            
            {/* API Configuration */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t.settings.api}</h4>
                <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50 space-y-3">
                    <div className="flex items-start gap-3">
                        <ShieldCheck size={18} className="text-neutral-500 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm text-neutral-200 mb-1">Google Gemini API</p>
                            <p className="text-xs text-neutral-500 leading-relaxed text-yellow-500/80">
                                {t.settings.apiDesc}
                            </p>
                        </div>
                    </div>
                    
                    <div className="pt-2">
                        <label className="text-xs font-semibold text-neutral-400 mb-1.5 block">{t.settings.apiKeyLabel}</label>
                        <div className="relative">
                            <KeyRound size={14} className="absolute left-3 top-3 text-neutral-500" />
                            <input 
                                type="password" 
                                value={tempKey}
                                onChange={(e) => setTempKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border outline-none transition-all duration-200 bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-neutral-500 placeholder-neutral-700 focus:ring-1 focus:ring-neutral-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Language */}
             <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t.settings.language}</h4>
                <div className="p-3 rounded-lg bg-neutral-800/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-neutral-800 rounded text-neutral-300">
                            <Globe size={18} />
                        </div>
                        <p className="font-medium text-sm text-neutral-200">{t.settings.language}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {languages.map((l) => (
                             <button
                                key={l.code}
                                onClick={() => setLanguage(l.code)}
                                className={`text-xs px-2 py-1.5 rounded-md border transition-all duration-200
                                    ${language === l.code 
                                        ? 'bg-neutral-700 border-neutral-500 ring-1 ring-neutral-400 text-neutral-100 font-medium' 
                                        : 'bg-transparent border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                                    }
                                `}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Appearance */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t.settings.appearance}</h4>

                <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-neutral-800 rounded text-neutral-300">
                            <Activity size={18} />
                        </div>
                        <div>
                            <p className="font-medium text-sm text-neutral-200">{t.settings.animations}</p>
                            <p className="text-xs text-neutral-500">{animationsEnabled ? t.settings.enabled : t.settings.disabled}</p>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={toggleAnimations} className="bg-neutral-800 border-neutral-600 text-neutral-300">
                        {t.settings.toggle}
                    </Button>
                </div>
            </div>

            {/* Typography */}
             <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t.settings.typography}</h4>
                <div className="p-3 rounded-lg bg-neutral-800/50">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-neutral-800 rounded text-neutral-300">
                            <Type size={18} />
                        </div>
                        <p className="font-medium text-sm text-neutral-200">{t.settings.appFont}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {fonts.map((f) => (
                            <button
                                key={f.name}
                                onClick={() => setFont(f.value)}
                                className={`text-xs px-3 py-2 rounded-md border transition-all duration-200 text-left
                                    ${currentFont === f.value 
                                        ? 'bg-neutral-700 border-neutral-500 ring-1 ring-neutral-400 text-neutral-100 font-medium' 
                                        : 'bg-transparent border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                                    }
                                `}
                                style={{ fontFamily: f.value }}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Laptop size={14} className="absolute left-2.5 top-2 text-neutral-400" />
                            <input 
                                type="text" 
                                placeholder={t.settings.customFont}
                                value={customFontInput}
                                onChange={(e) => setCustomFontInput(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-neutral-700 bg-neutral-900 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-all duration-200"
                            />
                        </div>
                        <Button size="sm" variant="outline" onClick={handleCustomFontApply} disabled={!customFontInput.trim()}>
                            {t.settings.apply}
                        </Button>
                    </div>
                     <p className="text-[10px] text-neutral-400 mt-1 pl-1">
                         {t.settings.fontHelp}
                     </p>
                </div>
            </div>

        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-800/30 flex justify-end">
          <Button onClick={handleSaveSettings}>{t.settings.done}</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;