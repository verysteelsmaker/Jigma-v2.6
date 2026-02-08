import React from 'react';
import Button from './ui/Button';
import { X, Copy, Check, Database, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: string[];
}

const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, data }) => {
  const [copied, setCopied] = React.useState(false);
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(data.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportDB = () => {
    const textData = data.join('\n');
    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `database_export_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] border border-neutral-200 dark:border-neutral-700">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <Database size={20} className="text-neutral-600 dark:text-neutral-300" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{t.result.title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.result.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-neutral-50 dark:bg-neutral-950/50">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-500">
              <Database size={48} className="mb-4 opacity-20" />
              <p className="font-medium">{t.result.empty}</p>
              <p className="text-sm mt-1 text-center max-w-xs">{t.result.hint}</p>
            </div>
          ) : (
            <div className="space-y-3">
                {data.map((line, index) => (
                    <div key={index} className="group relative bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 rounded-lg font-mono text-sm text-neutral-700 dark:text-neutral-300 shadow-sm flex items-start hover:border-neutral-400 dark:hover:border-neutral-500 transition-all">
                        <span className="shrink-0 w-8 h-6 flex items-center justify-center bg-neutral-100 dark:bg-neutral-700/50 rounded text-neutral-400 dark:text-neutral-500 text-xs font-semibold mr-3 select-none">
                            {index + 1}
                        </span>
                        <span className="break-all leading-relaxed">{line}</span>
                    </div>
                ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="dark:text-neutral-300 dark:hover:bg-neutral-800">{t.result.close}</Button>
          
          <Button 
            onClick={handleExportDB} 
            disabled={data.length === 0} 
            variant="outline" 
            className="border-neutral-300 dark:border-neutral-600 dark:text-neutral-300"
          >
            <Download size={16} className="mr-2" /> Export DB
          </Button>

          <Button onClick={handleCopy} disabled={data.length === 0} variant="primary" className="min-w-[140px]">
            {copied ? (
                <>
                    <Check size={16} className="mr-2" /> {t.result.copied}
                </>
            ) : (
                <>
                    <Copy size={16} className="mr-2" /> {t.result.copy}
                </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;