import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { fetchAINodeSuggestions } from '../services/aiService';

export interface Position {
  x: number;
  y: number;
}

export interface NodeConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'straight' | 'curved' | 'angled';
  color?: string;
}

export interface MindMapNode {
  id: string;
  text: string;
  position: Position;
  color?: string;
  textColor?: string;
  fontFamily?: string;
  width?: number;
  height?: number;
  expanded?: boolean;
  parentId?: string;
  childrenIds?: string[];
  shape?: 'rectangle' | 'circle' | 'triangle' | 'diamond';
}

export interface MindMap {
  id: string;
  name: string;
  nodes: MindMapNode[];
  connections: NodeConnection[];
  rootNodeId?: string;
}

interface MindMapState {
  mindMap: MindMap;
  selectedNodeId: string | null;
  history: MindMap[];
  historyIndex: number;
}

interface MindMapContextType {
  mindMap: MindMap;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  createNode: (text: string, position: Position, parentId?: string) => void;
  updateNode: (id: string, updates: Partial<MindMapNode>) => void;
  deleteNode: (id: string) => void;
  expandNode: (id: string) => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  exportMindMap: () => void;
  importMindMap: () => void;
  clearMindMap: () => void;
}

const MindMapContext = createContext<MindMapContextType | undefined>(undefined);

export const useMindMap = (): MindMapContextType => {
  const context = useContext(MindMapContext);
  if (!context) {
    throw new Error('useMindMap must be used within a MindMapProvider');
  }
  return context;
};

// Initial empty mind map
const createEmptyMindMap = (): MindMap => {
  const id = uuidv4();
  const rootNodeId = uuidv4();
  
  return {
    id,
    name: 'New Mind Map',
    nodes: [
      {
        id: rootNodeId,
        text: 'Central Idea',
        position: { x: 0, y: 0 },
        color: '#3B82F6',
        expanded: false,
        childrenIds: []
      }
    ],
    connections: [],
    rootNodeId
  };
};

interface MindMapProviderProps {
  children: ReactNode;
}

export const MindMapProvider: React.FC<MindMapProviderProps> = ({ children }) => {
  const [state, setState] = useState<MindMapState>(() => {
    return {
      mindMap: createEmptyMindMap(),
      selectedNodeId: null,
      history: [createEmptyMindMap()],
      historyIndex: 0
    };
  });

  const { mindMap, selectedNodeId, history, historyIndex } = state;

  // Add to history when mindMap changes
  const addToHistory = useCallback((newMindMap: MindMap) => {
    setState(prevState => {
      // Slice off any future history if we've gone back in time
      const newHistory = prevState.history.slice(0, prevState.historyIndex + 1);
      // Add the new state to history
      newHistory.push(newMindMap);
      return {
        ...prevState,
        mindMap: newMindMap,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  const setSelectedNodeId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedNodeId: id }));
  }, []);

  const createNode = useCallback((text: string, position: Position, parentId?: string) => {
    const newNodeId = uuidv4();
    
    setState(prevState => {
      const newMindMap = { ...prevState.mindMap };
      const newNode: MindMapNode = {
        id: newNodeId,
        text,
        position,
        parentId,
        childrenIds: [],
        expanded: false,
        color: parentId ? '#8B5CF6' : '#3B82F6',
        textColor: parentId ? 'white' : 'white'
      };

      // Add node to mindMap
      newMindMap.nodes = [...newMindMap.nodes, newNode];

      // If there's a parent, create connection and update parent's childrenIds
      if (parentId) {
        // Check if connection already exists
        const connectionExists = newMindMap.connections.some(
          conn => conn.sourceId === parentId && conn.targetId === newNodeId
        );
        
        if (!connectionExists) {
          const newConnection: NodeConnection = {
            id: uuidv4(),
            sourceId: parentId,
            targetId: newNodeId,
            type: 'curved',
            color: '#8B5CF6'
          };
          
          newMindMap.connections = [...newMindMap.connections, newConnection];
        }
        
        // Update parent node's childrenIds
        newMindMap.nodes = newMindMap.nodes.map(node => {
          if (node.id === parentId) {
            return {
              ...node,
              childrenIds: [...(node.childrenIds || []), newNodeId],
              expanded: true
            };
          }
          return node;
        });
      }

      // Add to history
      const newHistory = prevState.history.slice(0, prevState.historyIndex + 1);
      newHistory.push(newMindMap);
      
      return {
        ...prevState,
        mindMap: newMindMap,
        selectedNodeId: newNodeId,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
    
    return newNodeId;
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<MindMapNode>) => {
    setState(prevState => {
      const newMindMap = { ...prevState.mindMap };
      newMindMap.nodes = newMindMap.nodes.map(node => 
        node.id === id ? { ...node, ...updates } : node
      );
      
      // Check if this is a significant change that should be added to history
      const isSignificantChange = (
        'text' in updates || // Text change
        'shape' in updates || // Shape change
        'color' in updates || // Color change
        'expanded' in updates || // Expansion state change
        'childrenIds' in updates // Child nodes change
      );
      
      // Only add to history if it's a significant change
      if (isSignificantChange) {
        const newHistory = prevState.history.slice(0, prevState.historyIndex + 1);
        newHistory.push(newMindMap);
        
        return {
          ...prevState,
          mindMap: newMindMap,
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      }
      
      // For non-significant changes (like position updates), just update the mindMap
      return {
        ...prevState,
        mindMap: newMindMap
      };
    });
  }, []);

  const deleteNode = useCallback((id: string) => {
    setState(prevState => {
      const newMindMap = { ...prevState.mindMap };
      
      // Get the node to delete
      const nodeToDelete = newMindMap.nodes.find(node => node.id === id);
      if (!nodeToDelete) return prevState;
      
      // Can't delete the root node
      if (id === newMindMap.rootNodeId) return prevState;
      
      // Recursively collect all descendant node IDs
      const getDescendantIds = (nodeId: string): string[] => {
        const node = newMindMap.nodes.find(n => n.id === nodeId);
        if (!node || !node.childrenIds || node.childrenIds.length === 0) return [];
        
        const childIds = [...node.childrenIds];
        node.childrenIds.forEach(childId => {
          const descendantIds = getDescendantIds(childId);
          childIds.push(...descendantIds);
        });
        
        return childIds;
      };
      
      const descendantIds = getDescendantIds(id);
      const allIdsToRemove = [id, ...descendantIds];
      
      // Remove nodes
      newMindMap.nodes = newMindMap.nodes.filter(node => !allIdsToRemove.includes(node.id));
      
      // Remove connections
      newMindMap.connections = newMindMap.connections.filter(
        conn => !allIdsToRemove.includes(conn.sourceId) && !allIdsToRemove.includes(conn.targetId)
      );
      
      // Update parent node's childrenIds
      if (nodeToDelete.parentId) {
        newMindMap.nodes = newMindMap.nodes.map(node => {
          if (node.id === nodeToDelete.parentId) {
            return {
              ...node,
              childrenIds: (node.childrenIds || []).filter(cid => cid !== id)
            };
          }
          return node;
        });
      }
      
      // Add to history
      const newHistory = prevState.history.slice(0, prevState.historyIndex + 1);
      newHistory.push(newMindMap);
      
      return {
        ...prevState,
        mindMap: newMindMap,
        selectedNodeId: null,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  const expandNode = useCallback(async (id: string) => {
    try {
      const node = mindMap.nodes.find(n => n.id === id);
      if (!node) return;
      
      // Fetch AI suggestions
      const suggestions = await fetchAINodeSuggestions(node.text);
      
      // Calculate positions for new nodes in a radial pattern
      const radius = 150;
      const numSuggestions = suggestions.length;
      
      // Mark the node as expanded
      updateNode(id, { expanded: true });
      
      // Create node for each suggestion
      suggestions.forEach((suggestion, index) => {
        const angle = (2 * Math.PI * index) / numSuggestions;
        const x = node.position.x + radius * Math.cos(angle);
        const y = node.position.y + radius * Math.sin(angle);
        
        // Create new node and get its ID
        const newNodeId = createNode(suggestion, { x, y }, id);
        
        // Ensure connection is created and set proper color
        setState(prevState => {
          const newMindMap = { ...prevState.mindMap };
          
          // Update the node's color
          newMindMap.nodes = newMindMap.nodes.map(n => 
            n.id === newNodeId ? { ...n, color: '#8B5CF6' } : n
          );
          
          // Check if connection already exists
          const connectionExists = newMindMap.connections.some(
            conn => conn.sourceId === id && conn.targetId === newNodeId
          );
          
          if (!connectionExists) {
            const newConnection: NodeConnection = {
              id: uuidv4(),
              sourceId: id,
              targetId: newNodeId,
              type: 'curved',
              color: '#8B5CF6'
            };
            
            newMindMap.connections = [...newMindMap.connections, newConnection];
          }
          
          return {
            ...prevState,
            mindMap: newMindMap
          };
        });
      });
      
    } catch (error) {
      console.error('Error expanding node:', error);
    }
  }, [mindMap, createNode, updateNode]);

  const undo = useCallback(() => {
    setState(prevState => {
      if (prevState.historyIndex > 0) {
        const newIndex = prevState.historyIndex - 1;
        return {
          ...prevState,
          mindMap: prevState.history[newIndex],
          historyIndex: newIndex,
          selectedNodeId: null
        };
      }
      return prevState;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prevState => {
      if (prevState.historyIndex < prevState.history.length - 1) {
        const newIndex = prevState.historyIndex + 1;
        return {
          ...prevState,
          mindMap: prevState.history[newIndex],
          historyIndex: newIndex,
          selectedNodeId: null
        };
      }
      return prevState;
    });
  }, []);

  const exportMindMap = useCallback(() => {
    const dataStr = JSON.stringify(mindMap, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `${mindMap.name.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [mindMap]);

  const importMindMap = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;
      
      const file = target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          
          // Basic validation
          if (!json.nodes || !Array.isArray(json.nodes) || !json.connections || !Array.isArray(json.connections)) {
            throw new Error('Invalid mind map file format');
          }
          
          setState(prevState => {
            const newState = {
              ...prevState,
              mindMap: json,
              selectedNodeId: null
            };
            
            const newHistory = [...prevState.history.slice(0, prevState.historyIndex + 1), json];
            newState.history = newHistory;
            newState.historyIndex = newHistory.length - 1;
            
            return newState;
          });
          
        } catch (error) {
          console.error('Error importing mind map:', error);
          alert('Could not import mind map. The file may be corrupted or in an incorrect format.');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }, []);

  const clearMindMap = useCallback(() => {
    const newMindMap = createEmptyMindMap();
    
    setState({
      mindMap: newMindMap,
      selectedNodeId: null,
      history: [newMindMap],
      historyIndex: 0
    });
  }, []);

  return (
    <MindMapContext.Provider
      value={{
        mindMap,
        selectedNodeId,
        setSelectedNodeId,
        createNode,
        updateNode,
        deleteNode,
        expandNode,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        undo,
        redo,
        exportMindMap,
        importMindMap,
        clearMindMap
      }}
    >
      {children}
    </MindMapContext.Provider>
  );
};