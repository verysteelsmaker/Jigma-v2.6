import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

export const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  animated
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isDeleting = data?.isDeleting;

  // Base styles including color/width from App.tsx defaults
  const edgeStyle: React.CSSProperties = {
    ...style,
    strokeWidth: 2,
    stroke: '#a3a3a3', // neutral-400
  };

  if (isDeleting) {
    // Delete Animation: Transform to solid line and retreat
    edgeStyle.strokeDasharray = 3000; // Large value to simulate solid line
    edgeStyle.strokeDashoffset = 3000; // Offset to push line out of view
    edgeStyle.opacity = 0;
    edgeStyle.transition = 'stroke-dashoffset 0.5s ease-in-out, opacity 0.4s ease-in-out 0.1s';
    edgeStyle.animation = 'none'; // Stop any flow animation
  } else if (animated) {
    // Flow Animation: Standard marching ants
    edgeStyle.strokeDasharray = 5;
    edgeStyle.animation = 'dashdraw 0.5s linear infinite';
    edgeStyle.transition = 'none'; // No transition for flow state
  } else {
    // Static State: Solid line
    edgeStyle.strokeDasharray = 'none';
    edgeStyle.animation = 'none';
    edgeStyle.strokeDashoffset = 0;
  }

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={edgeStyle}
    />
  );
};