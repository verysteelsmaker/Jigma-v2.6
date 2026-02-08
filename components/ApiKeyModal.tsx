import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import { KeyRound } from 'lucide-react';

const ApiKeyModal: React.FC = () => {
  const { apiKey, setApiKey, dontShowAgain, setDontShowAgain } = useApiKey();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [doNotShow, setDoNotShow] = useState(false);

  useEffect(() => {
    // Show modal if no API key is set and the user hasn't opted out
    if (!apiKey && !dontShowAgain) {
      setIsOpen(true);
    }
  }, [apiKey, dontShowAgain]);

  const handleSave = () => {
    if (inputValue.trim()) {
      setApiKey(inputValue.trim());
    }
    if (doNotShow) {
      setDontShowAgain(true);
    }
    setIsOpen(false);
  };

  const handleSkip = () => {
    if (doNotShow) {
      setDontShowAgain(true);
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-modal-fade">
      <div className="bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-modal-scale border border-neutral-700">
        
        <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-800 mb-4 mx-auto border border-neutral-700">
                <KeyRound size={24} className="text-neutral-300" />
            </div>
            
            <h2 className="text-xl font-bold text-center text-neutral-100 mb-2">{t.apiKeyModal.title}</h2>
            <p className="text-center text-sm text-neutral-400 mb-6">
                {t.apiKeyModal.desc}
            </p>

            <div className="space-y-4">
                <input 
                    type="password" 
                    placeholder={t.apiKeyModal.placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border outline-none transition-all bg-neutral-950 border-neutral-700 focus:border-neutral-500 placeholder-neutral-600 text-neutral-100"
                />

                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setDoNotShow(!doNotShow)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${doNotShow ? 'bg-neutral-100 border-neutral-100' : 'border-neutral-600'}`}>
                        {doNotShow && <div className="w-2 h-2 bg-neutral-900 rounded-sm" />}
                    </div>
                    <span className="text-xs text-neutral-400 select-none">{t.apiKeyModal.dontShow}</span>
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-800/30 flex gap-3">
            <Button variant="ghost" onClick={handleSkip} className="flex-1 text-neutral-400 hover:text-neutral-200">
                {t.apiKeyModal.skip}
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={!inputValue.trim() && !doNotShow}>
                {t.apiKeyModal.save}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;