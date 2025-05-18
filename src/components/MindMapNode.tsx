import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Brain, Trash2, Edit, Plus } from 'lucide-react';
import { useMindMap, MindMapNode as IMindMapNode } from '../contexts/MindMapContext';
import { createPortal } from 'react-dom';

interface MindMapNodeProps {
  node: IMindMapNode;
  isSelected: boolean;
  zoom: number;
}

const MindMapNode: React.FC<MindMapNodeProps> = ({ node, isSelected, zoom }) => {
  const { 
    setSelectedNodeId, 
    updateNode, 
    deleteNode,
    expandNode,
    createNode,
    mindMap
  } = useMindMap();
  
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>(node.text);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showNodeMenu, setShowNodeMenu] = useState<boolean>(false);
  const [nodeSize, setNodeSize] = useState({ width: 0, height: 0 });
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  const nodeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Get font family from node or use default
  const nodeFontFamily = node.fontFamily || 'Comic Sans MS';
  
  // Calculate node dimensions based on text content
  const calculateNodeDimensions = (text: string, shape: string | undefined) => {
    const minWidth = 130;
    const minHeight = 50;
    const padding = 35; // Total horizontal padding
    const lineHeight = 1.5;
    const fontSize = 14; // Base font size

    // Create a temporary div to measure text
    const tempDiv = document.createElement('div');
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    tempDiv.style.width = `${minWidth - padding}px`;
    tempDiv.style.fontSize = `${fontSize}px`;
    tempDiv.style.lineHeight = `${lineHeight}`;
    tempDiv.style.fontFamily = nodeFontFamily;
    tempDiv.style.whiteSpace = 'pre-wrap';
    tempDiv.style.wordBreak = 'break-word';
    tempDiv.innerText = text;
    document.body.appendChild(tempDiv);

    // Get the measured dimensions
    const textWidth = tempDiv.offsetWidth;
    const textHeight = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);

    // Calculate base dimensions
    let width = Math.max(minWidth, textWidth + padding);
    let height = Math.max(minHeight, textHeight + padding);

    // Adjust dimensions based on shape
    switch (shape) {
      case 'circle':
        // For circle, use the larger dimension to maintain shape
        const circleSize = Math.max(width, height);
        return { width: circleSize, height: circleSize };
      
      case 'triangle':
        // For triangle, maintain aspect ratio but allow height to grow more
        return { 
          width: Math.max(width, 130),
          height: Math.max(height, 130)
        };
      
      case 'diamond':
        // For diamond, maintain aspect ratio
        const diamondSize = Math.max(width, height);
        return { width: diamondSize, height: diamondSize };
      
      default:
        // For rectangle, allow independent width/height
        return { 
          width: Math.min(width, 250), // Max width for rectangle
          height: height
        };
    }
  };

  // Update node dimensions when text changes
  useEffect(() => {
    if (nodeRef.current) {
      const dimensions = calculateNodeDimensions(node.text, node.shape);
      setNodeSize(dimensions);
      updateNode(node.id, { 
        width: dimensions.width / zoom, 
        height: dimensions.height / zoom 
      });
    }
  }, [node.text, node.shape, zoom, updateNode, node.id, nodeFontFamily]);
  
  // Focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // Update edit text when node text changes
  useEffect(() => {
    setEditText(node.text);
  }, [node.text]);
  
  // Update menu position when node position changes
  useEffect(() => {
    if (nodeRef.current && (showNodeMenu || isSelected)) {
      const rect = nodeRef.current.getBoundingClientRect();
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 10
      });
    }
  }, [node.position, showNodeMenu, isSelected]);
  
  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
  };
  
  const handleNodeDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  const handleEditSubmit = () => {
    if (editText.trim()) {
      updateNode(node.id, { text: editText });
    }
    setIsEditing(false);
  };
  
  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    
    // Calculate the offset from the click position to the node top-left
    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
  };
  
  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    
    // Get the parent container
    const parentRect = nodeRef.current?.parentElement?.getBoundingClientRect();
    if (!parentRect) return;
    
    // Calculate new position based on mouse position and offset
    // Subtract the 2000px canvas offset that was added in MindMapEditor
    const newX = (e.clientX - parentRect.left - dragOffset.x) / zoom - 2000;
    const newY = (e.clientY - parentRect.top - dragOffset.y) / zoom - 2000;
    
    updateNode(node.id, { position: { x: newX, y: newY } });
  };
  
  const handleDragEnd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    document.body.style.userSelect = '';
  };
  
  // Call drag move and end on parent to ensure smooth dragging
  useEffect(() => {
    if (isDragging) {
      const mouseMoveHandler = (e: MouseEvent) => {
        handleDragMove(e as unknown as React.MouseEvent);
      };
      
      const mouseUpHandler = (e: MouseEvent) => {
        handleDragEnd(e as unknown as React.MouseEvent);
      };
      
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
      
      return () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };
    }
  }, [isDragging]);
  
  const handleExpandNode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await expandNode(node.id);
  };
  
  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(node.id);
  };
  
  const handleAddChildNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Calculate position for new node - to the right of current node
    // Use a smaller offset and account for the canvas offset (2000px)
    const newX = node.position.x + 130;
    const newY = node.position.y + 60;
    
    // Create the node with adjusted position
    createNode('New Child', { 
      x: newX - 2000, // Subtract canvas offset to get correct position
      y: newY - 2000  // Subtract canvas offset to get correct position
    }, node.id);
  };
  
  // Determine if this is the root node
  const isRootNode = node.id === mindMap.rootNodeId;
  
  // Determine node color and styles
  const nodeColor = node.color || (isRootNode ? '#3B82F6' : '#8B5CF6');
  const nodeBgColor = isSelected 
    ? `${nodeColor}` 
    : isRootNode 
      ? `${nodeColor}` 
      : node.color || 'white dark:bg-gray-800';
  
  // Use the node's textColor if available
  const nodeTextColor = node.textColor || (isSelected || isRootNode ? 'white' : 'black');
  
  const nodeBorderColor = isSelected 
    ? 'transparent' 
    : nodeColor;
  
  return (
    <>
      <div
        ref={nodeRef}
        className={`absolute select-none transition-shadow duration-200 
                  ${isSelected ? 'shadow-lg ring-2 ring-blue-500 ring-opacity-50' : 'shadow-md'}
                  ${isDragging ? 'cursor-grabbing shadow-lg z-10' : 'cursor-grab'}
                  ${isRootNode ? 'font-semibold' : ''}
                `}
        style={{
          left: `${node.position.x}px`,
          top: `${node.position.y}px`,
          backgroundColor: nodeBgColor,
          color: nodeTextColor,
          borderColor: nodeBorderColor,
          borderWidth: '2px',
          borderStyle: 'solid',
          zIndex: isSelected ? 10 : 1,
          fontFamily: nodeFontFamily,
          transform: `translate(-70%, -50%) ${isSelected ? 'scale(1.02)' : 'scale(1)'}`,
          transformOrigin: 'center',
          boxShadow: isSelected ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : '',
          ...(node.shape === 'circle' ? {
            width: `${nodeSize.width}px`,
            height: `${nodeSize.height}px`,
            borderRadius: '50%',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          } : node.shape === 'triangle' ? {
            width: `${nodeSize.width}px`,
            height: `${nodeSize.height}px`,
            borderRadius: '5px',
            padding: '30px 20px 30px',
            clipPath: 'polygon(49% 9%, -2% 100%, 103% 102%, 53% 16%, 54% 19%, 20% 90%, 90% 100%, 51% 11%)',
            display: 'flex',
            alignItems: 'self-end',
            justifyContent: 'center'
          } : node.shape === 'diamond' ? {
            width: `${nodeSize.width}px`,
            height: `${nodeSize.height}px`,
            borderRadius: '0',
            padding: '1px',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%, 50% 0%, 50% 10%, 90% 50%, 50% 90%, 10% 50%, 50% 10%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          } : {
            width: `${nodeSize.width}px`,
            height: `${nodeSize.height}px`,
            minWidth: '120px',
            maxWidth: '250px',
            borderRadius: '0.375rem',
            padding: '2px 2px',
            display: 'flex',
            alignItems:'center',
            justifyContent:'center'

          })
        }}
        onClick={handleNodeClick}
        onDoubleClick={handleNodeDoubleClick}
        onMouseDown={handleDragStart}
        onMouseEnter={() => setShowNodeMenu(true)}
        onMouseLeave={() => setShowNodeMenu(false)}
      >
        {isEditing ? (
          <div className="p-2">
            <textarea
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEditSubmit();
                }
              }}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              style={{ 
                resize: 'none', 
                fontFamily: nodeFontFamily,
                textAlign: 'center'
              }}
              rows={2}
            />
          </div>
        ) : (
          <>
            <div className="break-words whitespace-pre-wrap" style={{
              textAlign: 'center',
            }}>
              {node.text}
            </div>
            
            {/* Expansion indicator */}
            {node.expanded && node.childrenIds && node.childrenIds.length > 0 && (node.shape!='triangle') && (node.shape != 'diamond') && (
              <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                <ChevronRight size={12} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Node menu rendered through portal */}
      {(showNodeMenu || isSelected) && createPortal(
        <div 
          className="fixed flex bg-white dark:bg-gray-800 rounded-full shadow-md p-1 z-50"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: 'translateX(-50%)',
            pointerEvents: 'auto'
          }}
        >
          <button
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleAddChildNode}
            title="Add child"
          >
            <Plus size={14} />
          </button>
          
          <button
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleExpandNode}
            title="Expand with AI"
          >
            <Brain size={14} />
          </button>
          
          <button
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleNodeDoubleClick}
            title="Edit"
          >
            <Edit size={14} />
          </button>
          
          {!isRootNode && (
            <button
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handleDeleteNode}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default MindMapNode;