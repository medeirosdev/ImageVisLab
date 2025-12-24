/**
 * ImageVisLab - useHistory Hook
 * 
 * Custom hook for managing undo/redo history of filter states.
 * 
 * @module useHistory
 * @author ImageVisLab Contributors
 * @license MIT
 */

import { useState, useCallback } from 'react';
import type { FilterType, FilterParams } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface HistoryState {
    activeFilter: FilterType;
    filterParams: FilterParams;
}

interface UseHistoryReturn {
    /** Current state from history */
    current: HistoryState | null;
    /** Add a new state to history */
    push: (state: HistoryState) => void;
    /** Undo to previous state */
    undo: () => HistoryState | null;
    /** Redo to next state */
    redo: () => HistoryState | null;
    /** Check if undo is available */
    canUndo: boolean;
    /** Check if redo is available */
    canRedo: boolean;
    /** Clear history */
    clear: () => void;
    /** Number of states in history */
    historyLength: number;
    /** Current position in history */
    currentIndex: number;
}

// =============================================================================
// Hook
// =============================================================================

const MAX_HISTORY_SIZE = 50;

export function useHistory(initialState?: HistoryState): UseHistoryReturn {
    const [history, setHistory] = useState<HistoryState[]>(
        initialState ? [initialState] : []
    );
    const [currentIndex, setCurrentIndex] = useState(initialState ? 0 : -1);

    /** Add a new state to history (clears redo stack) */
    const push = useCallback((state: HistoryState) => {
        setHistory(prev => {
            // Remove any states after current index (clears redo stack)
            const newHistory = prev.slice(0, currentIndex + 1);

            // Add new state
            newHistory.push(state);

            // Limit history size
            if (newHistory.length > MAX_HISTORY_SIZE) {
                newHistory.shift();
                setCurrentIndex(newHistory.length - 1);
            } else {
                setCurrentIndex(newHistory.length - 1);
            }

            return newHistory;
        });
    }, [currentIndex]);

    /** Undo to previous state */
    const undo = useCallback(() => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            return history[newIndex];
        }
        return null;
    }, [currentIndex, history]);

    /** Redo to next state */
    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            return history[newIndex];
        }
        return null;
    }, [currentIndex, history]);

    /** Clear all history */
    const clear = useCallback(() => {
        setHistory([]);
        setCurrentIndex(-1);
    }, []);

    return {
        current: currentIndex >= 0 ? history[currentIndex] : null,
        push,
        undo,
        redo,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
        clear,
        historyLength: history.length,
        currentIndex,
    };
}

export default useHistory;
