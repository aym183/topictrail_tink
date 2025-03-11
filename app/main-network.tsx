'use client'

import React, { useRef, forwardRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSelection } from 'reagraph';

// Remove direct import of reagraph
const GraphCanvas = dynamic(() => import('reagraph').then(mod => mod.GraphCanvas), { 
  ssr: false,
  loading: () => <div>Loading graph...</div>
});

// const nodes = [
//   { id: '1', label: 'Semiconductor Chips' },
//   { id: '2', label: 'History' },
//   { id: '3', label: 'Future Outlook' },
//   { id: '4', label: 'Applications' }
// ];

// const edges = [
//   { source: '1', target: '2', id: '1-2', label: '1-2' },
//   { source: '1', target: '3', id: '1-3', label: '1-3' },
//   { source: '1', target: '4', id: '1-4', label: '1-4' }
// ];

const customTheme = {
  canvas: { background: '#000000' },
  node: {
    fill: '#7CA0AB',
    activeFill: '#E0E0E0',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.2,
    label: {
      color: '#2A6475',
      stroke: '#E0E0E0',
      activeColor: '#2A6475'
    },
    subLabel: {
      color: '#ddd',
      stroke: 'transparent',
      activeColor: '#E0E0E0'
    }
  },
  lasso: {
    border: '1px solid #55aaff',
    background: 'rgba(75, 160, 255, 0.1)'
  },
  ring: {
    fill: '#D8E6EA',
    activeFill: '#D8E6EA'
  },
  edge: {
    fill: '#D8E6EA',
    activeFill: '#D8E6EA',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.1,
    label: {
      stroke: '#E0E0E0',
      color: '#2A6475',
      activeColor: '#1DE9AC',
      fontSize: 6
    }
  },
  arrow: {
    fill: '#D8E6EA',
    activeFill: '#D8E6EA'
  },
  cluster: {
    stroke: '#D8E6EA',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.1,
    label: {
      stroke: '#fff',
      color: '#2A6475'
    }
  }
};

interface MainGraphProps {
  nodes: any[];
  edges: any[];
  onNodeClick: (node: any) => void;
  onCanvasClick: () => void;
}

export const MainGraph = forwardRef<any, MainGraphProps>(
  ({ nodes, edges, onNodeClick, onCanvasClick }, ref) => {
    const [mounted, setMounted] = useState(false);
    const graphRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    
    // Move useSelection before any conditional returns
    const { selections = [] } = useSelection({
      ref: graphRef,
      type: 'single'
    });

    React.useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return <div>Loading graph...</div>;
    }
    
    const handleNodeClick = (node: any) => {
      setSelectedNode(node.id);
      onNodeClick(node);
    };

    const handleCanvasClick = () => {
      setSelectedNode(null);
      onCanvasClick();
    };

    const getNodeFill = (nodeId: string) => {
      return nodeId === selectedNode ? '#E0E0E0' : customTheme.node.fill;
    };

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <GraphCanvas
          ref={ref}
          nodes={nodes.map(node => ({
            ...node,
            fill: getNodeFill(node.id)
          }))}
          edges={edges}
          layoutType={"forceDirected2d"}
          animated={true}
          theme={customTheme}
          selections={selections}
          onCanvasClick={handleCanvasClick}
          sizingType="centrality"
          onNodeClick={handleNodeClick}
        />
      </div>
    );
  }
);

MainGraph.displayName = 'MainGraph';