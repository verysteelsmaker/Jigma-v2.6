import React, { createContext, useContext } from 'react';
import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../types';

interface HistoryContextType {
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const HistoryContext = createContext<HistoryContextType>({
  takeSnapshot: () => {},
  undo: () => {},
  redo: () => {},
  canUndo: false,
  canRedo: false,
});

export const useHistory = () => {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error('useHistory must be used within a HistoryProvider (provided by App)');
    }
    return context;
};
