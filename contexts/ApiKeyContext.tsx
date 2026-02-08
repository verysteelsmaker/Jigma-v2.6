import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ApiKeyContextType = {
  apiKey: string;
  setApiKey: (key: string) => void;
  dontShowAgain: boolean;
  setDontShowAgain: (value: boolean) => void;
};

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('jigma_api_key') || '';
  });

  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    return localStorage.getItem('jigma_api_dont_show') === 'true';
  });

  useEffect(() => {
    if (apiKey) {
        localStorage.setItem('jigma_api_key', apiKey);
    } else {
        localStorage.removeItem('jigma_api_key');
    }
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('jigma_api_dont_show', dontShowAgain.toString());
  }, [dontShowAgain]);

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, dontShowAgain, setDontShowAgain }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};