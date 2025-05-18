import React from 'react';
import { NodeConnection, MindMapNode, Position } from '../contexts/MindMapContext';

interface ConnectionProps {
  connection: NodeConnection;
  sourcePosition: Position;
  targetPosition: Position;
  sourceNode: MindMapNode;
  targetNode: MindMapNode;
}

const Connection: React.FC<ConnectionProps> = ({
  connection,
  sourcePosition,
  targetPosition,
  sourceNode,
  targetNode
}) => {
  // Calculate actual source and target points based on node dimensions
  const calculateEndpoints = () => {
    // Use default values if not provided
    const sourceWidth = sourceNode.width || 120;
    const sourceHeight = sourceNode.height || 40;
    const targetWidth = targetNode.width || 120;
    const targetHeight = targetNode.height || 40;
    
    // Calculate vector from source to target
    const dx = targetPosition.x - sourcePosition.x;
    const dy = targetPosition.y - sourcePosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Prevent division by zero
    if (distance === 0) {
      return {
        sourceX: sourcePosition.x,
        sourceY: sourcePosition.y,
        targetX: targetPosition.x,
        targetY: targetPosition.y
      };
    }
    
    // Normalize vectors
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Find intersection points with node boundaries
    const sourceX = sourcePosition.x + nx * (sourceWidth / 2);
    const sourceY = sourcePosition.y + ny * (sourceHeight / 2);
    const targetX = targetPosition.x - nx * (targetWidth / 2);
    const targetY = targetPosition.y - ny * (targetHeight / 2);
    
    return { sourceX, sourceY, targetX, targetY };
  };
  
  const { sourceX, sourceY, targetX, targetY } = calculateEndpoints();
  
  // Generate the SVG path based on connection type
  const generatePath = () => {
    switch (connection.type) {
      case 'straight':
        return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
      
      case 'curved':
        // Calculate control points for bezier curve
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        
        // Calculate perpendicular vector for control points
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Prevent division by zero or very small distances
        if (distance < 1) {
          return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
        }
        
        // Apply curvature based on distance
        const curvature = Math.min(distance * 0.2, 50);
        
        // Perpendicular vector (rotated 90 degrees)
        const perpX = -dy / distance;
        const perpY = dx / distance;
        
        // Control point
        const ctrlX = midX + perpX * curvature;
        const ctrlY = midY + perpY * curvature;
        
        return `M ${sourceX} ${sourceY} Q ${ctrlX} ${ctrlY}, ${targetX} ${targetY}`;
      
      case 'angled':
        // Create an angled (orthogonal) connection
        const cornerX = sourceX;
        const cornerY = targetY;
        
        return `M ${sourceX} ${sourceY} L ${cornerX} ${cornerY} L ${targetX} ${targetY}`;
      
      default:
        return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    }
  };
  
  const path = generatePath();
  const connectionColor = connection.color || '#8B5CF6';
  
  return (
    <g>
      {/* Glow effect */}
      <path
        d={path}
        fill="none"
        stroke={connectionColor}
        strokeWidth={4}
        className="transition-all duration-300"
        style={{ 
          filter: 'blur(3px)',
          opacity: 0.3
        }}
      />
      
      {/* Main connection line */}
      <path
        d={path}
        fill="none"
        stroke={connectionColor}
        strokeWidth={2}
        className="transition-all duration-300"
        style={{ 
          strokeDasharray: '6,6',
          animation: 'flowLine 20s linear infinite'
        }}
      />
      
      {/* Add animation keyframes */}
      <style>
        {`
          @keyframes flowLine {
            from {
              stroke-dashoffset: 100;
            }
            to {
              stroke-dashoffset: 0;
            }
          }
        `}
      </style>
    </g>
  );
};

export default Connection;