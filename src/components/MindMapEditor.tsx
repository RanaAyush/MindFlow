import React, { useRef, useState, useEffect } from 'react';
import MindMapNode from './MindMapNode';
import Connection from './Connection';
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import { useMindMap } from '../contexts/MindMapContext';
import { Position } from '../contexts/MindMapContext';

const MindMapEditor: React.FC = () => {
  const { 
    mindMap, 
    selectedNodeId,
    setSelectedNodeId,
    createNode
  } = useMindMap();
  
  const [viewportOffset, setViewportOffset] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate the center of the viewport on initial load
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setViewportOffset({
        x: width / 2,
        y: height / 2
      });
    }
  }, []);
  
  // Custom zoom handler for both wheel and toolbar buttons
  const handleZoomChange = (newZoom: number, center?: { x: number, y: number }) => {
    if (!containerRef.current) return;
    
    // Get the dimensions of the container
    const rect = containerRef.current.getBoundingClientRect();
    
    // Use provided center point or default to center of viewport
    const zoomCenter = center || {
      x: rect.width / 2,
      y: rect.height / 2
    };
    
    // Calculate canvas coordinates under the center point
    const canvasX = (zoomCenter.x - viewportOffset.x) / zoom;
    const canvasY = (zoomCenter.y - viewportOffset.y) / zoom;
    
    // Apply new zoom with adjusted offset to maintain the center point
    setViewportOffset({
      x: zoomCenter.x - canvasX * newZoom,
      y: zoomCenter.y - canvasY * newZoom
    });
    
    setZoom(newZoom);
  };
  
  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    // Get cursor position relative to container
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    
    // Adjust zoom with mouse wheel - reduced scale for smoother zooming
    const zoomDelta = e.deltaY * 0.001;
    const zoomFactor = Math.max(0.95, Math.min(1.05, 1 - zoomDelta));
    const newZoom = Math.max(0.2, Math.min(2, zoom * zoomFactor));
    
    // Apply zoom centered on cursor position
    handleZoomChange(newZoom, { x: cursorX, y: cursorY });
  };
  
  // Custom setZoom handler for toolbar buttons
  const setZoomFromToolbar = (newZoom: number) => {
    // When zooming from toolbar, zoom around the center of the viewport
    handleZoomChange(newZoom);
  };
  
  // Handle canvas drag for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if it's a middle mouse button or space key is held
    if (e.button === 1 || e.button === 0) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setViewportOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDragStart(null);
  };
  
  // Handle double click to create a new node
  const handleDoubleClick = (e: React.MouseEvent) => {
    // Don't create node if we're dragging or if it's a zoom operation
    if (isDraggingCanvas || e.ctrlKey || e.metaKey) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Get click position in the transformed canvas coordinates
    const x = (e.clientX - rect.left - viewportOffset.x) / zoom;
    const y = (e.clientY - rect.top - viewportOffset.y) / zoom;
    
    // Create a new node at this position (no coordinate system offset)
    createNode('New Node', { x, y });
  };
  
  // Handle background click to deselect
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the background (not a node)
    if (e.target === containerRef.current || e.target === canvasRef.current) {
      setSelectedNodeId(null);
    }
  };
  
  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleBackgroundClick}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: isDraggingCanvas ? 'grabbing' : 'default' }}
    >
      {/* Mind Map Canvas */}
      <div 
        ref={canvasRef}
        className="absolute transform-gpu"
        style={{ 
          transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '4000px',  // Increased canvas size
          height: '4000px', // Increased canvas size
          left: '-2000px',  // Center the coordinate system
          top: '-2000px',   // Center the coordinate system
          position: 'absolute'
        }}
      >
        {/* Grid (optional) */}
        <div className="absolute inset-0 w-full h-full" style={{ 
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          opacity: 0.3,
          width: '4000px',  // Match canvas size
          height: '4000px', // Match canvas size
        }}></div>
        
        {/* Connections */}
        <svg 
          className="absolute top-0 left-0 w-full h-full pointer-events-none" 
          style={{ 
            width: '4000px',  // Match canvas size
            height: '4000px', // Match canvas size
            position: 'absolute',
            top: 0,
            left: 0,
            overflow: 'visible',
            zIndex: 0
          }}
        >
          {mindMap.connections.map(connection => {
            const sourceNode = mindMap.nodes.find(node => node.id === connection.sourceId);
            const targetNode = mindMap.nodes.find(node => node.id === connection.targetId);
            
            if (!sourceNode || !targetNode) return null;
            
            // Use actual node positions with the canvas center offset
            const sourcePos = {
              x: sourceNode.position.x + 2000, // Add offset to center in the 4000x4000 canvas
              y: sourceNode.position.y + 2000
            };
            
            const targetPos = {
              x: targetNode.position.x + 2000,
              y: targetNode.position.y + 2000
            };
            
            return (
              <Connection
                key={connection.id}
                connection={connection}
                sourcePosition={sourcePos}
                targetPosition={targetPos}
                sourceNode={sourceNode}
                targetNode={targetNode}
              />
            );
          })}
        </svg>
        
        {/* Nodes */}
        <div 
          className="relative z-10" 
          style={{ 
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0
          }}
        >
          {mindMap.nodes.map(node => (
            <MindMapNode
              key={node.id}
              node={{
                ...node,
                position: {
                  x: node.position.x + 2000, // Add offset to center in the 4000x4000 canvas
                  y: node.position.y + 2000
                }
              }}
              isSelected={selectedNodeId === node.id}
              zoom={zoom}
            />
          ))}
        </div>
      </div>
      
      {/* Toolbar */}
      <Toolbar zoom={zoom} setZoom={setZoomFromToolbar} />
      
      {/* Sidebar */}
      <Sidebar zoom={zoom} viewportOffset={viewportOffset} />
    </div>
  );
};

export default MindMapEditor;