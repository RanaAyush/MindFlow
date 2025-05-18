import React, { useState, useEffect } from 'react';
import { Sidebar as SidebarIcon, Palette, Type, Circle, Layout, Plus, X, Square, Triangle, Diamond } from 'lucide-react';
import { useMindMap } from '../contexts/MindMapContext';

interface SidebarProps {
  zoom: number;
  viewportOffset: { x: number; y: number };
}

const Sidebar: React.FC<SidebarProps> = ({ zoom, viewportOffset }) => {
  const {
    mindMap,
    selectedNodeId,
    updateNode,
    createNode,
  } = useMindMap();

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [bgColor, setBgColor] = useState<string>('#8B5CF6');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [fontFamily, setFontFamily] = useState<string>('Comic Sans MS');
  const [shape, setShape] = useState<string>('rectangle');

  // Available font families
  const fontFamilies = [
    'Comic Sans MS',
    'Inter',
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana'
  ];

  // Preset colors for quick selection
  const colorPresets = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#6B7280', // Gray
    '#FFFFFF', // White
  ];

  // Find selected node
  const selectedNode = mindMap.nodes.find(node => node.id === selectedNodeId);

  // Update color states when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setBgColor(selectedNode.color || '#8B5CF6');
      setTextColor(selectedNode.textColor || '#FFFFFF');
      setFontFamily(selectedNode.fontFamily || 'Comic Sans MS');
      setShape(selectedNode.shape || 'rectangle');
    }
  }, [selectedNodeId, selectedNode]);

  // Handle background color change
  const handleBgColorChange = (color: string) => {
    if (selectedNodeId) {
      setBgColor(color);
      updateNode(selectedNodeId, { color });
    }
  };

  // Handle text color change
  const handleTextColorChange = (color: string) => {
    if (selectedNodeId) {
      setTextColor(color);
      updateNode(selectedNodeId, { textColor: color });
    }
  };

  // Handle font family change for selected node
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFont = e.target.value;
    setFontFamily(newFont);

    if (selectedNodeId) {
      updateNode(selectedNodeId, { fontFamily: newFont });
    }
  };

  // Apply font to all nodes
  const handleApplyFontToAll = () => {
    mindMap.nodes.forEach(node => {
      updateNode(node.id, { fontFamily });
    });
  };

  // Create node in center of viewport
  const handleCreateCenterNode = () => {
    // Get the container dimensions
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    // Calculate the center of the current viewport
    // First, get the center point in screen coordinates
    const screenCenterX = containerWidth / 2;
    const screenCenterY = containerHeight / 2;

    // Convert screen coordinates to canvas coordinates
    // This accounts for the viewport offset and zoom level
    const canvasX = (screenCenterX - viewportOffset.x) / zoom;
    const canvasY = (screenCenterY - viewportOffset.y) / zoom;

    // Create the node at the calculated position
    createNode('New Node', { x: canvasX + 100, y: canvasY + 10 });
  };

  // Prevent wheel events in sidebar from propagating to the editor
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  // Handle shape change
  const handleShapeChange = (newShape: string) => {
    if (selectedNodeId) {
      setShape(newShape as "rectangle" | "circle" | "triangle" | "diamond");
      updateNode(selectedNodeId, { shape: newShape as "rectangle" | "circle" | "triangle" | "diamond" });
    }
  };

  return (
    <div
      className={`absolute left-0 top-0 h-full bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 z-30 
                 ${isOpen ? 'w-64' : 'w-12'} flex flex-col border-r border-gray-200 dark:border-gray-700`}
      onWheel={handleWheel}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-10 top-4 bg-white dark:bg-gray-800 p-2 rounded-r-md shadow-md border border-gray-200 dark:border-gray-700"
      >
        <SidebarIcon size={20} className="text-gray-600 dark:text-gray-300" />
      </button>

      {/* Sidebar Content */}
      {isOpen ? (
        <>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Style Editor</h2>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto" onWheel={handleWheel}>
            {/* Create Node in Center */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Layout size={16} className="mr-2" />  Create Node
              </h3>
              <button
                className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition-colors flex items-center justify-center"
                onClick={handleCreateCenterNode}
              >
                <Plus size={18} className="mr-2" />Add Node in Center
              </button>
            </div>

            {/* Selected Node Info */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Node</h3>
              {selectedNode ? (
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <p className="text-gray-800 dark:text-gray-200 text-sm truncate">
                    "{selectedNode.text}"
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                  No node selected
                </p>
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Palette size={16} className="mr-2" /> Font Family
                </h3>
                <button
                  onClick={handleApplyFontToAll}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded"
                  disabled={!selectedNodeId}
                >
                  Apply to All
                </button>
              </div>

              <select
                value={fontFamily}
                onChange={handleFontFamilyChange}
                className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                disabled={!selectedNodeId}
              >
                {fontFamilies.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Node Shape */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Layout size={16} className="mr-2" /> Node Shape
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleShapeChange('rectangle')}
                  className={`p-2 rounded-md flex items-center justify-center ${shape === 'rectangle'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  disabled={!selectedNodeId}
                >
                  <Square size={20} className="mr-2" />
                  Rectangle
                </button>

                <button
                  onClick={() => handleShapeChange('circle')}
                  className={`p-2 rounded-md flex items-center justify-center ${shape === 'circle'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  disabled={!selectedNodeId}
                >
                  <Circle size={20} className="mr-2" />
                  Circle
                </button>

                <button
                  onClick={() => handleShapeChange('triangle')}
                  className={`p-2 rounded-md flex items-center justify-center ${shape === 'triangle'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  disabled={!selectedNodeId}
                >
                  <Triangle size={20} className="mr-2" />
                  Triangle
                </button>

                <button
                  onClick={() => handleShapeChange('diamond')}
                  className={`p-2 rounded-md flex items-center justify-center ${shape === 'diamond'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  disabled={!selectedNodeId}
                >
                  <Diamond size={20} className="mr-2" />
                  Diamond
                </button>
              </div>
            </div>

            {/* Node Background Color */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Circle size={16} className="mr-2" /> Background Color
              </h3>

              {/* Color picker */}
              <input
                type="color"
                value={bgColor}
                onChange={(e) => handleBgColorChange(e.target.value)}
                className="w-full h-10 p-1 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                disabled={!selectedNodeId}
              />

              {/* Color presets */}
              <div className="flex flex-wrap gap-2 mt-3">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleBgColorChange(color)}
                    className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    disabled={!selectedNodeId}
                  >
                    {bgColor === color && (
                      <div className="w-2 h-2 rounded-full bg-gray-800 dark:bg-gray-200"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Node Text Color */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Type size={16} className="mr-2" /> Text Color
              </h3>

              {/* Text color picker */}
              <input
                type="color"
                value={textColor}
                onChange={(e) => handleTextColorChange(e.target.value)}
                className="w-full h-10 p-1 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                disabled={!selectedNodeId}
              />

              {/* Color presets */}
              <div className="flex flex-wrap gap-2 mt-3">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleTextColorChange(color)}
                    className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    disabled={!selectedNodeId}
                  >
                    {textColor === color && (
                      <div className="w-2 h-2 rounded-full bg-gray-800 dark:bg-gray-200"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center pt-16 space-y-6">
          <button
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            onClick={() => setIsOpen(true)}
            title="Edit Styles"
          >
            <Palette size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;