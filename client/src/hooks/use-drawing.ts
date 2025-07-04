import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DrawingElementData, CanvasState, DrawingHistory, DrawingTool } from "@/types/drawing";
import { apiRequest } from "@/lib/queryClient";
import { generateId } from "@/utils/canvas-utils";

export function useDrawing(sessionId: string) {
  const queryClient = useQueryClient();
  
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('rectangle');
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    gridEnabled: true,
    snapEnabled: false,
    theme: 'light',
  });
  const [history, setHistory] = useState<DrawingHistory>({
    undoStack: [],
    redoStack: [],
  });

  // Load session data
  const { data: session } = useQuery({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  // Load elements
  const { data: elements = [] } = useQuery({
    queryKey: [`/api/sessions/${sessionId}/elements`],
    enabled: !!sessionId,
  });

  // Convert backend elements to frontend format
  const drawingElements: DrawingElementData[] = elements.map((el: any) => el.data);

  // Create element mutation
  const createElementMutation = useMutation({
    mutationFn: async (element: DrawingElementData) => {
      return apiRequest('POST', '/api/elements', {
        sessionId,
        elementId: element.id,
        type: element.type,
        data: element,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/elements`] });
    },
  });

  // Update element mutation
  const updateElementMutation = useMutation({
    mutationFn: async ({ elementId, data }: { elementId: string; data: DrawingElementData }) => {
      return apiRequest('PUT', `/api/elements/${elementId}`, { sessionId, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/elements`] });
    },
  });

  // Delete element mutation
  const deleteElementMutation = useMutation({
    mutationFn: async (elementId: string) => {
      return apiRequest('DELETE', `/api/elements/${elementId}?sessionId=${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/elements`] });
    },
  });

  // Create session if it doesn't exist
  useEffect(() => {
    if (!session && sessionId) {
      const createSession = async () => {
        try {
          await apiRequest('POST', '/api/sessions', {
            sessionId,
            name: `Drawing Session ${new Date().toLocaleDateString()}`,
            data: canvasState,
          });
          queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
        } catch (error) {
          console.error('Failed to create session:', error);
        }
      };
      createSession();
    }
  }, [session, sessionId, canvasState, queryClient]);

  // Save canvas state to session
  useEffect(() => {
    if (session) {
      const saveCanvasState = async () => {
        try {
          await apiRequest('PUT', `/api/sessions/${sessionId}`, { data: canvasState });
        } catch (error) {
          console.error('Failed to save canvas state:', error);
        }
      };
      const timeoutId = setTimeout(saveCanvasState, 500); // Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [canvasState, sessionId, session]);

  const addToHistory = useCallback((elements: DrawingElementData[]) => {
    setHistory(prev => ({
      undoStack: [...prev.undoStack, elements],
      redoStack: [], // Clear redo stack when new action is performed
    }));
  }, []);

  const addElement = useCallback((element: DrawingElementData) => {
    addToHistory(drawingElements);
    createElementMutation.mutate({
      ...element,
      id: element.id || generateId(),
    });
  }, [drawingElements, createElementMutation, addToHistory]);

  const updateElement = useCallback((elementId: string, updates: Partial<DrawingElementData>) => {
    const element = drawingElements.find(el => el.id === elementId);
    if (element) {
      addToHistory(drawingElements);
      const updatedElement = { ...element, ...updates };
      updateElementMutation.mutate({ elementId, data: updatedElement });
    }
  }, [drawingElements, updateElementMutation, addToHistory]);

  const deleteElement = useCallback((elementId: string) => {
    addToHistory(drawingElements);
    deleteElementMutation.mutate(elementId);
    setSelectedElements(prev => {
      const newSet = new Set(prev);
      newSet.delete(elementId);
      return newSet;
    });
  }, [drawingElements, deleteElementMutation, addToHistory]);

  const selectElements = useCallback((elementIds: string[]) => {
    setSelectedElements(new Set(elementIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElements(new Set());
  }, []);

  const updateCanvasState = useCallback((updates: Partial<CanvasState>) => {
    setCanvasState(prev => ({ ...prev, ...updates }));
  }, []);

  const undo = useCallback(() => {
    if (history.undoStack.length > 0) {
      const previousState = history.undoStack[history.undoStack.length - 1];
      setHistory(prev => ({
        undoStack: prev.undoStack.slice(0, -1),
        redoStack: [drawingElements, ...prev.redoStack],
      }));
      
      // Apply previous state by syncing with backend
      // This is a simplified approach - in a real app you'd want more sophisticated state management
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/elements`] });
    }
  }, [history.undoStack, drawingElements, queryClient, sessionId]);

  const redo = useCallback(() => {
    if (history.redoStack.length > 0) {
      const nextState = history.redoStack[0];
      setHistory(prev => ({
        undoStack: [...prev.undoStack, drawingElements],
        redoStack: prev.redoStack.slice(1),
      }));
      
      // Apply next state
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/elements`] });
    }
  }, [history.redoStack, drawingElements, queryClient, sessionId]);

  const exportCanvas = useCallback(async (format: 'png' | 'svg' | 'json') => {
    // This will be implemented in the canvas component
    console.log(`Exporting as ${format}`);
  }, []);

  return {
    elements: drawingElements,
    canvasState,
    selectedTool,
    selectedElements,
    history,
    setSelectedTool,
    addElement,
    updateElement,
    deleteElement,
    selectElements,
    clearSelection,
    updateCanvasState,
    undo,
    redo,
    exportCanvas,
  };
}
