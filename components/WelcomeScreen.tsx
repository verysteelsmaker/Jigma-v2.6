import React, { useState, useRef } from 'react';
import { FolderOpen, Plus, Box } from 'lucide-react';
import Button from './ui/Button';
import { useLanguage } from '../contexts/LanguageContext';

interface WelcomeScreenProps {
  onCreate: (name: string) => void;
  onLoad: (file: File) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreate, onLoad }) => {
  const [projectName, setProjectName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleCreate = () => {
    if (projectName.trim()) {
      onCreate(projectName.trim());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoad(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 transition-colors duration-500 bg-neutral-900 text-neutral-100">
      <div className="max-w-md w-full p-8 rounded-2xl shadow-xl border animate-in zoom-in-95 duration-500 bg-neutral-800 border-neutral-700">
        
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-4 bg-white">
                <Box className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t.welcome.title}</h1>
            <p className="text-sm mt-2 text-center text-neutral-400">
                {t.welcome.subtitle}
            </p>
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-neutral-400">
                    {t.welcome.createNew}
                </label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder={t.welcome.enterName}
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        autoFocus
                        className="flex-1 px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-all bg-neutral-900 border-neutral-600 text-neutral-100 placeholder-neutral-600"
                    />
                    <Button onClick={handleCreate} disabled={!projectName.trim()} variant="primary">
                        <Plus size={18} className="mr-2" /> {t.welcome.create}
                    </Button>
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="px-2 bg-neutral-800 text-neutral-500">
                        {t.welcome.or}
                    </span>
                </div>
            </div>

            <div>
                 <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-neutral-400">
                    {t.welcome.openExisting}
                </label>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json,.jigma"
                    className="hidden" 
                />
                <Button 
                    variant="outline" 
                    className="w-full justify-center hover:bg-neutral-700 border-neutral-600 text-neutral-200"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FolderOpen size={18} className="mr-2" /> {t.welcome.openFile}
                </Button>
            </div>
        </div>

      </div>
       <div className="mt-8 text-xs text-neutral-600">
        {t.welcome.version}
      </div>
    </div>
  );
};

export default WelcomeScreen;