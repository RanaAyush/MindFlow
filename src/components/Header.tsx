import React from 'react';
import { Sun, Moon, Download, Upload, Undo2, Redo2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMindMap } from '../contexts/MindMapContext';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    exportMindMap, 
    importMindMap 
  } = useMindMap();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 shadow-sm z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-lg font-semibold text-blue-600 dark:text-blue-400">
            <div className="w-9 h-9 rounded-full flex items-center justify-center">
              <img src='/logo.png' alt="logo" className='rounded-md' />
            </div>
            <span>MindFlow</span>
          </div>
          
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
          
          <div className="flex items-center gap-1">
            <button 
              className={`p-1.5 rounded-md ${canUndo ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo2 size={18} />
            </button>
            <button 
              className={`p-1.5 rounded-md ${canRedo ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
            >
              <Redo2 size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button 
            className="p-1.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={importMindMap}
            title="Import Mind Map"
          >
            <Upload size={18} />
          </button>
          <button 
            className="p-1.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={exportMindMap}
            title="Export Mind Map"
          >
            <Download size={18} />
          </button>
          
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
          
          <button 
            className="p-1.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;