import React from 'react';
import { ZoomIn, ZoomOut, Undo2, Redo2, Trash, Download, Upload } from 'lucide-react';
import { useMindMap } from '../contexts/MindMapContext';

interface ToolbarProps {
  zoom: number;
  setZoom: (zoom: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ zoom, setZoom }) => {
  const { 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    clearMindMap,
    exportMindMap,
    importMindMap
  } = useMindMap();
  
  // Helper for smoother zooming from toolbar buttons
  const handleZoom = (direction: 'in' | 'out') => {
    // Use smaller zoom factor for smoother transitions
    const zoomFactor = direction === 'in' ? 1.1 : 0.9;
    
    // Apply zoom with the same limits as the mouse wheel handler
    const newZoom = Math.max(0.2, Math.min(2, zoom * zoomFactor));
    
    // Apply the new zoom - the center position will be maintained by MindMapEditor
    setZoom(newZoom);
  };
  
  // Reset zoom to 100%
  const resetZoom = () => {
    setZoom(1);
  };
  
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg px-2.5 py-1.5 z-20 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-1 mr-1.5">
        <button
          className={`p-1.5 rounded-full ${canUndo ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}
          onClick={undo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          className={`p-1.5 rounded-full ${canRedo ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}
          onClick={redo}
          disabled={!canRedo}
          title="Redo"
        >
          <Redo2 size={16} />
        </button>
      </div>
      
      <div className="h-5 w-px bg-gray-300 dark:bg-gray-600"></div>
      
      <div className="flex items-center gap-1 ml-1.5">
        <button
          className="p-1.5 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => handleZoom('out')}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        
        <button
          className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          onClick={resetZoom}
          title="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        
        <button
          className="p-1.5 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => handleZoom('in')}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
      </div>
      
      <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 ml-1.5 mr-1.5"></div>
      
      <div className="flex items-center gap-1">
        <button
          className="p-1.5 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={importMindMap}
          title="Import Mind Map"
        >
          <Upload size={16} />
        </button>
        <button
          className="p-1.5 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={exportMindMap}
          title="Export Mind Map"
        >
          <Download size={16} />
        </button>
        <button
          className="p-1.5 rounded-full text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400"
          onClick={clearMindMap}
          title="Clear Mind Map"
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;